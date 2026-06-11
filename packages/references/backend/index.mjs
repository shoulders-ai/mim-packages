import {
  MANAGED_BIB_PATH,
  META_PATH,
  PDF_DIR,
  FULLTEXT_DIR,
  PDF_PROVENANCE_DIR,
  entryFromCsl,
  entryFromInput,
  entryFromReference,
  findDuplicate,
  mergeEntryFields,
  normalizeDoi,
  parseBibtex,
  pdfPathForEntry,
  referenceSummary,
  serializeBibtex,
  sniffDoi,
  withGeneratedKey,
} from './bib.mjs'
import { resolveDoi, searchBibliographic } from './doi.mjs'
import { aiPdfMetadataCandidate, extractPdfCandidate } from './pdf.mjs'
import { parsePastedReferences } from './paste.mjs'

const RECENT_LIMIT = 8

const bibEntrySchema = {
  type: 'object',
  properties: {
    type: { type: 'string' },
    key: { type: 'string' },
    fields: { type: 'object' },
  },
}

function objectSchema(properties, required = []) {
  return { type: 'object', properties, required }
}

export async function readLibraryMode(ctx) {
  const raw = await ctx.data.kv.get('mode')
  if (raw?.kind === 'external' && typeof raw.path === 'string' && raw.path.trim()) {
    return { kind: 'external', path: raw.path.trim() }
  }
  return { kind: 'managed', path: MANAGED_BIB_PATH }
}

export async function setLibraryMode(ctx, input = {}) {
  const kind = input.kind === 'external' ? 'external' : 'managed'
  if (kind === 'external') {
    const path = typeof input.path === 'string' ? input.path.trim() : ''
    if (!path) throw new Error('External mode requires a .bib path')
    const result = await ctx.tools.call('references.setBibliographyPath', { path })
    await ctx.data.kv.set('mode', { kind: 'external', path: result.path || path })
    return { kind: 'external', path: result.path || path }
  }
  await ctx.data.kv.set('mode', { kind: 'managed' })
  return { kind: 'managed', path: MANAGED_BIB_PATH }
}

export async function readLibrary(ctx) {
  const mode = await readLibraryMode(ctx)
  const params = mode.path ? { path: mode.path } : {}
  const result = await ctx.tools.call('references.readBib', params)
  const references = Array.isArray(result?.references) ? result.references : []
  return {
    mode,
    path: result?.path || mode.path,
    exists: result?.exists === true,
    entries: references.map(entryFromReference),
    duplicateKeys: Array.isArray(result?.duplicateKeys) ? result.duplicateKeys : [],
  }
}

export async function searchReferences(ctx, input = {}) {
  const library = await readLibrary(ctx)
  const meta = await readMeta(ctx)
  const query = typeof input.query === 'string' ? input.query.trim() : ''
  const limit = numberInRange(input.limit, 1, 200, 50)
  const rows = library.entries
    .map(entry => {
      const summary = referenceSummary(entry)
      return {
        ...summary,
        needsReview: meta.entries?.[entry.key]?.needsReview === true,
        score: scoreReference(summary, query),
      }
    })
    .filter(row => !query || row.score > 0)
    .sort((a, b) => b.score - a.score || a.key.localeCompare(b.key))
    .slice(0, limit)
  return { items: rows.map(({ score, ...row }) => row), path: library.path, mode: library.mode.kind }
}

export async function getReference(ctx, input = {}) {
  const key = requireKey(input)
  const library = await readLibrary(ctx)
  const entry = library.entries.find(item => item.key === key)
  if (!entry) throw new Error(`Reference not found: ${key}`)
  const meta = await readMeta(ctx)
  const pdfPath = pdfPathForEntry(entry)
  return {
    ...referenceSummary(entry),
    type: entry.type,
    fields: { ...entry.fields },
    pdfPath,
    meta: meta.entries?.[key] || null,
    mode: library.mode.kind,
    path: library.path,
  }
}

export async function addReference(ctx, input = {}) {
  await assertManaged(ctx)
  const library = await readLibrary(ctx)
  let entry = input.doi && !input.entry && !input.csl && !input.fields && !input.title && !input.type
    ? null
    : entryFromInput(input)
  if (!entry && typeof input.doi === 'string') {
    const resolved = await resolveDoi(ctx, input.doi)
    entry = resolved.entry
    input = {
      ...input,
      source: input.source || resolved.source,
      confidence: input.confidence || resolved.confidence,
    }
  }
  if (!entry) throw new Error('references.add requires an entry, CSL object, or DOI')
  entry = withGeneratedKey(entry, library.entries)
  const duplicate = findDuplicate(library.entries, entry)
  if (duplicate) return { key: duplicate.key, added: false, duplicateOf: duplicate.key }

  const entries = [...library.entries, entry]
  await writeManagedEntries(ctx, entries)
  await upsertMeta(ctx, entry.key, {
    addedAt: new Date().toISOString(),
    source: input.source || (input.csl ? 'csl' : 'manual'),
    needsReview: input.needsReview === true,
    confidence: input.confidence || 'verified',
  })
  return { key: entry.key, added: true }
}

export async function captureDoi(ctx, input = {}) {
  const doi = typeof input.doi === 'string' ? input.doi : typeof input.text === 'string' ? input.text : ''
  await ctx.progress?.step?.('Resolving DOI')
  const result = await addReference(ctx, { doi, source: 'doi' })
  await ctx.progress?.done?.(result)
  return result
}

export async function capturePdf(ctx, input = {}) {
  await assertManaged(ctx)
  const path = typeof input.path === 'string' ? input.path.trim() : ''
  if (!path) throw new Error('PDF capture requires a staged workspace path')
  await ctx.progress?.step?.('Extracting PDF text')
  const candidate = await extractPdfCandidate(ctx, path, { max_chars: input.max_chars })
  const analysis = candidate.analysis || {
    extracted: candidate.extracted,
    doiCandidates: candidate.doi ? [{ doi: candidate.doi, source: 'legacy' }] : [],
    titleCandidates: candidate.title ? [{ title: candidate.title, source: 'legacy' }] : [],
    stats: {},
    warnings: [],
  }
  const { addInput, selection } = await selectPdfCapture(ctx, analysis)
  if (!addInput) {
    throw new Error('Could not find a DOI or title in the PDF')
  }
  const added = await addReference(ctx, addInput)
  await attachPdf(ctx, { key: added.key, path, move: input.move === true })
  const pdfPath = `${PDF_DIR}/${added.key}.pdf`
  const artifacts = await writePdfArtifacts(ctx, {
    key: added.key,
    sourcePath: path,
    pdfPath,
    analysis,
    selection,
  })
  await upsertMeta(ctx, added.key, {
    pdfStats: analysis.stats || {},
    pdfWarnings: analysis.warnings || [],
    pdfCapture: selection,
    fulltextPath: artifacts.fulltextPath,
    fulltextError: artifacts.fulltextError,
    pdfProvenancePath: artifacts.pdfProvenancePath,
    pdfProvenanceError: artifacts.pdfProvenanceError,
  })
  const result = {
    ...added,
    pdfPath,
    needsReview: addInput.needsReview === true,
    confidence: addInput.confidence,
    warnings: analysis.warnings || [],
  }
  await ctx.progress?.done?.(result)
  return result
}

async function selectPdfCapture(ctx, analysis) {
  const failures = []
  const doiCandidates = Array.isArray(analysis.doiCandidates) ? analysis.doiCandidates : []
  for (const doiCandidate of doiCandidates) {
    await ctx.progress?.step?.(`Resolving DOI ${doiCandidate.doi}`)
    try {
      const resolved = await resolveDoi(ctx, doiCandidate.doi)
      return {
        addInput: {
          entry: resolved.entry,
          source: 'pdf',
          confidence: resolved.confidence,
          needsReview: false,
        },
        selection: {
          method: 'doi',
          source: resolved.source,
          confidence: resolved.confidence,
          needsReview: false,
          doi: doiCandidate.doi,
          candidate: summarizeDoiCandidate(doiCandidate),
          match: summarizeEntry(resolved.entry),
          failures,
        },
      }
    } catch (err) {
      failures.push({ method: 'doi', doi: doiCandidate.doi, reason: errorMessage(err) })
    }
  }

  const titleSearch = await selectTitleSearch(ctx, analysis, failures)
  if (titleSearch) return titleSearch

  const aiSearch = await selectAiPdfCapture(ctx, analysis, failures)
  if (aiSearch) return aiSearch

  const titleCandidate = firstTitleCandidate(analysis)
  if (titleCandidate) {
    return {
      addInput: {
        entry: { type: 'article', fields: { title: titleCandidate.title } },
        source: 'pdf-title',
        confidence: 'parsed',
        needsReview: true,
      },
      selection: {
        method: 'parsed-title',
        source: titleCandidate.source,
        confidence: 'parsed',
        needsReview: true,
        title: titleCandidate.title,
        candidate: summarizeTitleCandidate(titleCandidate),
        failures,
      },
    }
  }

  return {
    addInput: null,
    selection: { method: 'failed', confidence: 'failed', needsReview: true, failures },
  }
}

async function selectTitleSearch(ctx, analysis, failures) {
  const titleCandidates = Array.isArray(analysis.titleCandidates) ? analysis.titleCandidates : []
  for (const titleCandidate of titleCandidates) {
    await ctx.progress?.step?.(`Searching ${titleCandidate.title}`)
    try {
      const matches = await searchBibliographic(ctx, titleCandidate.title, { rows: 3 })
      if (!matches.length) continue
      const match = matches[0]
      return {
        addInput: {
          entry: match.entry,
          source: 'pdf-title',
          confidence: match.confidence,
          needsReview: true,
        },
        selection: {
          method: 'title-search',
          source: match.source,
          confidence: match.confidence,
          needsReview: true,
          title: titleCandidate.title,
          candidate: summarizeTitleCandidate(titleCandidate),
          match: summarizeEntry(match.entry),
          score: match.score || 0,
          alternatives: matches.slice(1).map(item => ({
            source: item.source,
            confidence: item.confidence,
            score: item.score || 0,
            match: summarizeEntry(item.entry),
          })),
          failures,
        },
      }
    } catch (err) {
      failures.push({ method: 'title-search', title: titleCandidate.title, reason: errorMessage(err) })
    }
  }
  return null
}

async function selectAiPdfCapture(ctx, analysis, failures) {
  let aiCandidate = null
  try {
    await ctx.progress?.step?.('Parsing PDF metadata')
    aiCandidate = await aiPdfMetadataCandidate(ctx, analysis)
  } catch (err) {
    failures.push({ method: 'ai-pdf', reason: errorMessage(err) })
    return null
  }
  if (!aiCandidate) return null

  if (aiCandidate.doi) {
    await ctx.progress?.step?.(`Resolving DOI ${aiCandidate.doi}`)
    try {
      const resolved = await resolveDoi(ctx, aiCandidate.doi)
      return {
        addInput: {
          entry: resolved.entry,
          source: 'pdf-ai-doi',
          confidence: resolved.confidence,
          needsReview: false,
        },
        selection: {
          method: 'ai-doi',
          source: resolved.source,
          confidence: resolved.confidence,
          needsReview: false,
          doi: aiCandidate.doi,
          candidate: summarizeAiCandidate(aiCandidate),
          match: summarizeEntry(resolved.entry),
          failures,
        },
      }
    } catch (err) {
      failures.push({ method: 'ai-doi', doi: aiCandidate.doi, reason: errorMessage(err) })
    }
  }

  if (aiCandidate.title) {
    await ctx.progress?.step?.(`Searching ${aiCandidate.title}`)
    try {
      const matches = await searchBibliographic(ctx, aiCandidate.title, { rows: 3 })
      if (matches.length) {
        const match = matches[0]
        return {
          addInput: {
            entry: match.entry,
            source: 'pdf-ai-title',
            confidence: match.confidence,
            needsReview: true,
          },
          selection: {
            method: 'ai-title-search',
            source: match.source,
            confidence: match.confidence,
            needsReview: true,
            title: aiCandidate.title,
            candidate: summarizeAiCandidate(aiCandidate),
            match: summarizeEntry(match.entry),
            score: match.score || 0,
            failures,
          },
        }
      }
    } catch (err) {
      failures.push({ method: 'ai-title-search', title: aiCandidate.title, reason: errorMessage(err) })
    }
  }

  try {
    const entry = entryFromCsl(aiCandidate.csl)
    if (entry.fields.title || entry.fields.doi) {
      return {
        addInput: {
          entry,
          source: 'pdf-ai',
          confidence: 'parsed',
          needsReview: true,
        },
        selection: {
          method: 'ai-parsed',
          source: 'ai-pdf',
          confidence: 'parsed',
          needsReview: true,
          title: entry.fields.title || '',
          doi: entry.fields.doi || '',
          candidate: summarizeAiCandidate(aiCandidate),
          failures,
        },
      }
    }
  } catch (err) {
    failures.push({ method: 'ai-parsed', reason: errorMessage(err) })
  }
  return null
}

async function writePdfArtifacts(ctx, { key, sourcePath, pdfPath, analysis, selection }) {
  const result = {}
  const text = String(analysis?.extracted?.text || '')
  if (text.trim()) {
    const fulltextPath = `${FULLTEXT_DIR}/${key}.txt`
    try {
      await ctx.tools.call('fs.mkdir', { path: FULLTEXT_DIR })
      await ctx.tools.call('fs.write', { path: fulltextPath, content: text })
      result.fulltextPath = fulltextPath
    } catch (err) {
      result.fulltextError = errorMessage(err)
    }
  }

  const provenancePath = `${PDF_PROVENANCE_DIR}/${key}.json`
  try {
    await ctx.tools.call('fs.mkdir', { path: PDF_PROVENANCE_DIR })
    await ctx.tools.call('fs.write', {
      path: provenancePath,
      content: `${JSON.stringify(pdfProvenance({ key, sourcePath, pdfPath, analysis, selection }), null, 2)}\n`,
    })
    result.pdfProvenancePath = provenancePath
  } catch (err) {
    result.pdfProvenanceError = errorMessage(err)
  }

  return result
}

function pdfProvenance({ key, sourcePath, pdfPath, analysis, selection }) {
  const extracted = analysis?.extracted || {}
  return {
    version: 1,
    key,
    capturedAt: new Date().toISOString(),
    sourcePath,
    pdfPath,
    selected: selection,
    stats: analysis?.stats || {},
    warnings: analysis?.warnings || [],
    extraction: {
      pages: extracted.pages || 0,
      total_chars: extracted.total_chars ?? extracted.totalChars ?? 0,
      truncated: extracted.truncated === true,
      info: extracted.info && typeof extracted.info === 'object' ? extracted.info : {},
    },
    doiCandidates: (analysis?.doiCandidates || []).map(summarizeDoiCandidate),
    titleCandidates: (analysis?.titleCandidates || []).map(summarizeTitleCandidate),
  }
}

function firstTitleCandidate(analysis) {
  return Array.isArray(analysis?.titleCandidates) ? analysis.titleCandidates[0] : null
}

function summarizeDoiCandidate(candidate) {
  if (!candidate) return null
  return {
    doi: candidate.doi || '',
    source: candidate.source || '',
    sources: Array.isArray(candidate.sources) ? candidate.sources : undefined,
    evidence: candidate.evidence || '',
    score: candidate.score || 0,
  }
}

function summarizeTitleCandidate(candidate) {
  if (!candidate) return null
  return {
    title: candidate.title || '',
    source: candidate.source || '',
    score: candidate.score || 0,
  }
}

function summarizeAiCandidate(candidate) {
  if (!candidate) return null
  return {
    doi: candidate.doi || '',
    title: candidate.title || '',
    source: candidate.source || '',
    confidence: candidate.confidence || 'parsed',
    evidence: candidate.evidence || '',
  }
}

function summarizeEntry(entry) {
  const fields = entry?.fields || {}
  return {
    type: entry?.type || 'article',
    key: entry?.key || '',
    title: fields.title || '',
    author: fields.author || '',
    year: fields.year || '',
    venue: fields.journal || fields.booktitle || fields.publisher || '',
    doi: fields.doi || '',
  }
}

function errorMessage(err) {
  return String(err?.message || err || 'Unknown error')
}

export async function capturePaste(ctx, input = {}) {
  await assertManaged(ctx)
  const text = typeof input.text === 'string' ? input.text : ''
  await ctx.progress?.step?.('Parsing pasted references')
  const parsed = await parsePastedReferences(ctx, text)
  const results = []
  for (const item of parsed) {
    let addInput
    if (item.doi) {
      await ctx.progress?.step?.(`Resolving ${item.doi}`)
      const resolved = await resolveDoi(ctx, item.doi)
      addInput = { entry: resolved.entry, source: 'paste', confidence: resolved.confidence }
    } else if (item.entry.fields.title) {
      await ctx.progress?.step?.(`Searching ${item.entry.fields.title}`)
      const matches = await searchBibliographic(ctx, item.entry.fields.title, { rows: 3 })
      addInput = matches[0]
        ? { entry: matches[0].entry, source: 'paste-search', confidence: matches[0].confidence, needsReview: true }
        : { entry: item.entry, source: 'paste', confidence: 'parsed', needsReview: true }
    } else {
      results.push({ status: 'failed', reason: 'missing title and DOI' })
      continue
    }
    try {
      const result = await addReference(ctx, addInput)
      results.push({ status: result.added ? 'added' : 'duplicate', key: result.key, duplicateOf: result.duplicateOf })
    } catch (err) {
      results.push({ status: 'failed', reason: String(err?.message || err) })
    }
  }
  const result = { results, added: results.filter(item => item.status === 'added').length }
  await ctx.progress?.done?.(result)
  return result
}

export async function importReferences(ctx, input = {}) {
  await assertManaged(ctx)
  const text = typeof input.text === 'string' ? input.text : ''
  const explicitEntries = Array.isArray(input.entries) ? input.entries : null
  if (!text && !explicitEntries) throw new Error('references.import requires text or entries')
  const imported = explicitEntries
    ? explicitEntries.map(entryFromInput).filter(Boolean)
    : parseImportText(text, input.format)
  const library = await readLibrary(ctx)
  const next = [...library.entries]
  const results = []
  for (const candidate of imported) {
    const entry = withGeneratedKey(candidate, next)
    const duplicate = findDuplicate(next, entry)
    if (duplicate) {
      results.push({ key: duplicate.key, status: 'duplicate', duplicateOf: duplicate.key })
      continue
    }
    next.push(entry)
    results.push({ key: entry.key, status: 'added' })
  }
  if (next.length !== library.entries.length) await writeManagedEntries(ctx, next)
  return { results, added: results.filter(item => item.status === 'added').length }
}

export async function attachPdf(ctx, input = {}) {
  await assertManaged(ctx)
  const key = requireKey(input)
  const source = typeof input.path === 'string' ? input.path.trim() : ''
  if (!source) throw new Error('references.attach_pdf requires path')
  if (!/\.pdf$/i.test(source)) throw new Error('references.attach_pdf only accepts PDF files')
  const library = await readLibrary(ctx)
  const index = library.entries.findIndex(item => item.key === key)
  if (index === -1) throw new Error(`Reference not found: ${key}`)

  const target = `${PDF_DIR}/${key}.pdf`
  if (source !== target) {
    await ctx.tools.call('fs.mkdir', { path: PDF_DIR })
    if (input.move === true) {
      await ctx.tools.call('fs.rename', { old_path: source, new_path: target })
    } else {
      await ctx.tools.call('fs.copy', { path: source, new_path: target })
    }
  }

  const next = [...library.entries]
  next[index] = mergeEntryFields(next[index], { file: `pdf/${key}.pdf` })
  await writeManagedEntries(ctx, next)
  await upsertMeta(ctx, key, {
    pdfPath: target,
    pdfAttachedAt: new Date().toISOString(),
  })
  return { key, path: target }
}

export async function referencesAgentContext(ctx) {
  const library = await readLibrary(ctx)
  const meta = await readMeta(ctx)
  const recentKeys = Array.isArray(meta.recent) ? meta.recent.slice(0, RECENT_LIMIT) : []
  const byKey = new Map(library.entries.map(entry => [entry.key, referenceSummary(entry)]))
  const lines = [
    `Mode: ${library.mode.kind}`,
    `Active library: ${library.path || library.mode.path}`,
    `References: ${library.entries.length}`,
  ]
  const recent = recentKeys.map(key => byKey.get(key)).filter(Boolean)
  if (recent.length > 0) {
    lines.push('')
    lines.push('Recent additions:')
    for (const ref of recent) lines.push(`- ${ref.key}: ${ref.author} ${ref.year} ${ref.title}`.trim())
  }
  return { title: 'References', body: lines.join('\n') }
}

async function assertManaged(ctx) {
  const mode = await readLibraryMode(ctx)
  if (mode.kind === 'external') {
    throw new Error(`References library is in External mode (${mode.path}); writes are disabled`)
  }
}

async function writeManagedEntries(ctx, entries) {
  await ctx.tools.call('fs.write', { path: MANAGED_BIB_PATH, content: serializeBibtex(entries) })
  await ctx.tools.call('references.setBibliographyPath', { path: MANAGED_BIB_PATH })
}

export async function readMeta(ctx) {
  try {
    const result = await ctx.tools.call('fs.read', { path: META_PATH, full: true })
    const parsed = JSON.parse(result?.content || '{}')
    return {
      entries: parsed && typeof parsed.entries === 'object' && !Array.isArray(parsed.entries) ? parsed.entries : {},
      recent: Array.isArray(parsed?.recent) ? parsed.recent.filter(item => typeof item === 'string') : [],
    }
  } catch {
    return { entries: {}, recent: [] }
  }
}

async function writeMeta(ctx, meta) {
  await ctx.tools.call('fs.write', { path: META_PATH, content: `${JSON.stringify(meta, null, 2)}\n` })
}

async function upsertMeta(ctx, key, patch) {
  const meta = await readMeta(ctx)
  meta.entries[key] = { ...(meta.entries[key] || {}), ...patch }
  meta.recent = [key, ...meta.recent.filter(item => item !== key)].slice(0, RECENT_LIMIT)
  await writeMeta(ctx, meta)
}

function parseImportText(text, format) {
  const normalized = String(format || '').toLowerCase()
  if (normalized === 'csl-json' || (!normalized && text.trim().startsWith('[')) || (!normalized && text.trim().startsWith('{'))) {
    const parsed = JSON.parse(text)
    return (Array.isArray(parsed) ? parsed : [parsed]).map(entryFromCsl)
  }
  if (normalized && normalized !== 'bibtex') throw new Error(`Unsupported import format: ${format}`)
  return parseBibtex(text)
}

function scoreReference(summary, query) {
  if (!query) return 1
  const q = query.toLowerCase()
  const terms = q.split(/\s+/).filter(Boolean)
  const haystack = [
    summary.key,
    summary.author,
    summary.year,
    summary.title,
    summary.venue,
    summary.doi,
  ].filter(Boolean).join(' ').toLowerCase()
  if (summary.key.toLowerCase() === q) return 200
  let score = 0
  if (summary.key.toLowerCase().includes(q)) score += 80
  if (normalizeDoi(summary.doi) && normalizeDoi(summary.doi) === normalizeDoi(q)) score += 120
  for (const term of terms) {
    if (haystack.includes(term)) score += 20
  }
  if (haystack.includes(q)) score += 30
  return score
}

function requireKey(input) {
  const key = typeof input.key === 'string' ? input.key.trim() : ''
  if (!key) throw new Error('Missing required parameter: key')
  return key
}

function numberInRange(value, min, max, fallback) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.max(min, Math.min(max, Math.floor(value)))
}

const addSchema = objectSchema({
  doi: { type: 'string' },
  entry: bibEntrySchema,
  csl: { type: 'object' },
  source: { type: 'string' },
  confidence: { type: 'string' },
  needsReview: { type: 'boolean' },
})

export const tools = {
  search: {
    name: 'references.search',
    label: 'Search references',
    description: 'Search the active project bibliography. Returns only real citation keys from the library.',
    inputSchema: objectSchema({ query: { type: 'string' }, limit: { type: 'number' } }),
    audience: ['chat'],
    execute: searchReferences,
  },
  get: {
    name: 'references.get',
    label: 'Get reference',
    description: 'Get one library reference with fields and attached PDF path if present.',
    inputSchema: objectSchema({ key: { type: 'string' } }, ['key']),
    audience: ['chat'],
    execute: getReference,
  },
  add: {
    name: 'references.add',
    label: 'Add reference',
    description: 'Add a reference to the managed bibliography from a BibEntry, CSL object, or DOI.',
    inputSchema: addSchema,
    audience: ['chat'],
    execute: addReference,
  },
  import: {
    name: 'references.import',
    label: 'Import references',
    description: 'Import BibTeX or CSL-JSON text into the managed bibliography, deduping by DOI or title/author/year.',
    inputSchema: objectSchema({
      text: { type: 'string' },
      format: { type: 'string', enum: ['bibtex', 'csl-json'] },
      entries: { type: 'array', items: bibEntrySchema },
    }),
    audience: ['chat'],
    execute: importReferences,
  },
  attachPdf: {
    name: 'references.attach_pdf',
    label: 'Attach PDF',
    description: 'Attach a workspace PDF to an existing reference and record it in the BibTeX file field.',
    inputSchema: objectSchema({
      key: { type: 'string' },
      path: { type: 'string' },
      move: { type: 'boolean' },
    }, ['key', 'path']),
    audience: ['chat'],
    execute: attachPdf,
  },
}

export const jobs = {
  captureDoi: {
    label: 'Capture DOI',
    inputSchema: objectSchema({ doi: { type: 'string' }, text: { type: 'string' } }),
    concurrency: 'parallel',
    run: captureDoi,
  },
  capturePdf: {
    label: 'Capture PDF',
    inputSchema: objectSchema({
      path: { type: 'string' },
      move: { type: 'boolean' },
      max_chars: { type: 'number' },
    }, ['path']),
    concurrency: 'parallel',
    run: capturePdf,
  },
  capturePaste: {
    label: 'Capture pasted references',
    inputSchema: objectSchema({ text: { type: 'string' } }, ['text']),
    concurrency: 'parallel',
    run: capturePaste,
  },
}
export const agentContext = referencesAgentContext

export { MANAGED_BIB_PATH, META_PATH, PDF_DIR, FULLTEXT_DIR, PDF_PROVENANCE_DIR, sniffDoi }
