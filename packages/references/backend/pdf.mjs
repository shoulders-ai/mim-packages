import { normalizeDoi, sniffDoi } from './bib.mjs'

const DEFAULT_MAX_CHARS = 120000
const MAX_TITLE_CANDIDATES = 6

export function doiFromPdfExtraction(extracted) {
  return collectDoiCandidates(extracted)[0]?.doi || ''
}

export function titleFromPdfExtraction(extracted) {
  return collectTitleCandidates(extracted)[0]?.title || ''
}

export async function analyzePdf(ctx, path, options = {}) {
  if (!ctx.documents?.pdf?.extract) throw new Error('ctx.documents.pdf.extract is unavailable')
  const extracted = await ctx.documents.pdf.extract(path, { max_chars: options.max_chars || DEFAULT_MAX_CHARS })
  const stats = pdfStats(extracted)
  const warnings = pdfWarnings(stats)
  const doiCandidates = collectDoiCandidates(extracted)
  const titleCandidates = collectTitleCandidates(extracted)
  return {
    extracted,
    stats,
    warnings,
    doiCandidates,
    titleCandidates,
    doi: doiCandidates[0]?.doi || '',
    title: titleCandidates[0]?.title || '',
  }
}

export async function extractPdfCandidate(ctx, path, options = {}) {
  const analysis = await analyzePdf(ctx, path, options)
  return {
    extracted: analysis.extracted,
    doi: analysis.doi,
    title: analysis.title,
    analysis,
  }
}

export async function aiPdfMetadataCandidate(ctx, analysis) {
  if (!ctx.ai?.generateObject) return null
  const info = analysis?.extracted?.info && typeof analysis.extracted.info === 'object' ? analysis.extracted.info : {}
  const text = String(analysis?.extracted?.text || '').slice(0, 8000)
  if (!text.trim() && Object.keys(info).length === 0) return null

  const result = await ctx.ai.generateObject({
    system: [
      'Extract bibliographic metadata from the beginning of an academic PDF.',
      'Return only fields directly visible in the PDF text or PDF metadata.',
      'Do not invent DOI, title, authors, venue, year, pages, or publisher.',
    ].join(' '),
    prompt: [
      'PDF metadata:',
      JSON.stringify(info).slice(0, 4000),
      '',
      'PDF text excerpt:',
      text,
    ].join('\n'),
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        DOI: { type: 'string' },
        doi: { type: 'string' },
        author: { type: 'array', items: { type: 'object' } },
        issued: { type: 'object' },
        'container-title': { type: 'string' },
        publisher: { type: 'string' },
        volume: { type: 'string' },
        issue: { type: 'string' },
        page: { type: 'string' },
        abstract: { type: 'string' },
      },
    },
  })
  const object = result?.object || result
  const item = Array.isArray(object?.references) ? object.references[0] : object
  if (!item || typeof item !== 'object') return null
  const doi = sniffDoi(item.DOI || item.doi || item.URL || '')
  const title = cleanTitle(item.title || item.Title || '')
  if (!doi && !title) return null
  return {
    csl: { type: 'article-journal', ...item, DOI: doi || item.DOI || item.doi || '' },
    doi,
    title,
    source: 'ai-pdf',
    confidence: 'parsed',
    evidence: 'AI metadata extraction over PDF metadata and first text excerpt',
  }
}

export function collectDoiCandidates(extracted) {
  const candidates = []
  const info = extracted?.info && typeof extracted.info === 'object' ? extracted.info : {}
  for (const [field, value] of Object.entries(info)) {
    const score = /^(doi|DOI|Doi)$/i.test(field) ? 130 : /subject|keyword|identifier/i.test(field) ? 115 : 80
    addDoiCandidatesFromText(candidates, value, `metadata.${field}`, score, true)
  }
  addDoiCandidatesFromText(candidates, extracted?.text, 'text', 90, false)
  return candidates.sort((a, b) => b.score - a.score || a.doi.localeCompare(b.doi))
}

export function collectTitleCandidates(extracted) {
  const candidates = []
  const info = extracted?.info && typeof extracted.info === 'object' ? extracted.info : {}
  for (const field of ['Title', 'title', 'dc:title', 'dcTitle']) {
    if (Object.prototype.hasOwnProperty.call(info, field)) {
      addTitleCandidate(candidates, info[field], `metadata.${field}`, 130)
    }
  }

  const lines = firstTextLines(extracted?.text)
  for (let i = 0; i < Math.min(lines.length, 80); i++) {
    addTitleCandidate(candidates, lines[i], 'text-line', 105 - i)
  }
  for (let i = 0; i < Math.min(lines.length - 1, 35); i++) {
    const left = cleanTitle(lines[i])
    const right = cleanTitle(lines[i + 1])
    if (left && right && left.length < 120 && right.length < 120) {
      addTitleCandidate(candidates, `${left} ${right}`, 'text-lines', 92 - i)
    }
  }

  return candidates
    .sort((a, b) => b.score - a.score || a.title.length - b.title.length)
    .slice(0, MAX_TITLE_CANDIDATES)
}

function stringValue(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function cleanTitle(value) {
  return String(value || '')
    .replace(/\s*-\s*\n\s*/g, '')
    .replace(/\s*\n\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function pdfStats(extracted) {
  const pages = numberValue(extracted?.pages)
  const totalChars = numberValue(extracted?.total_chars ?? extracted?.totalChars) || String(extracted?.text || '').length
  const emittedChars = String(extracted?.text || '').length
  return {
    pages,
    totalChars,
    emittedChars,
    charsPerPage: pages > 0 ? totalChars / pages : totalChars,
    truncated: extracted?.truncated === true,
  }
}

function pdfWarnings(stats) {
  const warnings = []
  if (stats.truncated) warnings.push('text-truncated')
  if (stats.pages > 0 && stats.totalChars < Math.max(80, stats.pages * 40)) warnings.push('likely-scanned')
  return warnings
}

function numberValue(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function addDoiCandidatesFromText(candidates, value, source, score, allowBareArxiv) {
  const text = stringValue(value).replace(/\s+/g, ' ')
  if (!text) return
  for (const doi of extractDois(text)) {
    addDoiCandidate(candidates, doi, source, score, evidenceSnippet(text, doi))
  }
  for (const doi of extractArxivDois(text, allowBareArxiv)) {
    addDoiCandidate(candidates, doi, `${source}:arxiv`, score - 5, evidenceSnippet(text, doi.replace(/^10\.48550\/arxiv\./i, '')))
  }
}

function extractDois(text) {
  const dois = []
  const pattern = /\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+/ig
  for (const match of text.matchAll(pattern)) {
    const doi = normalizeDoi(match[0].replace(/[.,;)\]\s]+$/g, ''))
    if (doi && !dois.includes(doi)) dois.push(doi)
  }
  return dois
}

function extractArxivDois(text, allowBare) {
  const dois = []
  const patterns = [
    /10\.48550\/arxiv\.([\w.-]+\/\d+|\d{4}\.\d{4,5})(?:v\d+)?/ig,
    /arxiv\.org\/(?:abs|pdf|html)\/([\w.-]+\/\d+|\d{4}\.\d{4,5})(?:v\d+)?/ig,
    /\barxiv:\s*([\w.-]+\/\d+|\d{4}\.\d{4,5})(?:v\d+)?\b/ig,
  ]
  if (allowBare) patterns.push(/\b([\w.-]+\/\d{7}|\d{4}\.\d{4,5})(?:v\d+)?\b/ig)
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const id = String(match[1] || '').replace(/v\d+$/i, '')
      if (!id) continue
      const doi = normalizeDoi(`10.48550/arXiv.${id}`)
      if (doi && !dois.includes(doi)) dois.push(doi)
    }
  }
  return dois
}

function addDoiCandidate(candidates, doi, source, score, evidence) {
  const normalized = normalizeDoi(doi)
  if (!normalized) return
  const existing = candidates.find(item => item.doi === normalized)
  if (existing) {
    if (!existing.sources.includes(source)) existing.sources.push(source)
    if (score > existing.score) {
      existing.score = score
      existing.source = source
      existing.evidence = evidence
    }
    return
  }
  candidates.push({ doi: normalized, source, sources: [source], score, evidence })
}

function firstTextLines(text) {
  return String(text || '')
    .slice(0, 24000)
    .split(/\r?\n| {4,}/)
    .map(line => cleanTitle(line))
    .filter(Boolean)
}

function addTitleCandidate(candidates, value, source, score) {
  const title = cleanTitle(value)
  if (!isUsableTitle(title)) return
  const key = titleFingerprint(title)
  const existing = candidates.find(item => item.key === key)
  if (existing) {
    if (score > existing.score) {
      existing.title = title
      existing.source = source
      existing.score = score
    }
    return
  }
  candidates.push({ title, source, score, key })
}

function isUsableTitle(title) {
  if (!title || title.length < 8 || title.length > 260) return false
  if (sniffDoi(title)) return false
  if (/https?:\/\/|www\.|@/.test(title)) return false
  if (!/[A-Za-z]{4,}/.test(title)) return false
  if (title.split(/\s+/).length < 2) return false
  if (/^\d+$/.test(title)) return false
  if (/^(abstract|summary|introduction|background|keywords?|references|bibliography|contents|appendix)\b/i.test(title)) return false
  if (/^(research article|original article|article|review article|case report|short communication)$/i.test(title)) return false
  if (/^(downloaded from|published by|copyright|creative commons|license|received:|accepted:|published:)/i.test(title)) return false
  if (/^(vol\.?|volume|issue|no\.?|page|pages)\b/i.test(title)) return false
  if (/[|]{2,}/.test(title)) return false
  return true
}

function titleFingerprint(title) {
  return String(title || '').toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function evidenceSnippet(text, needle) {
  const source = String(text || '')
  const index = source.toLowerCase().indexOf(String(needle || '').toLowerCase())
  if (index === -1) return source.slice(0, 180)
  return source.slice(Math.max(0, index - 80), index + 120).trim()
}
