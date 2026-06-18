import { buildChartSvg } from '../shared/charts.mjs'
import { deckCapableModels } from '../shared/models.mjs'

const MAX_READ_CHARS = 80_000
const MAX_DECK_READ_CHARS = 240_000
const MAX_REFERENCE_PROMPT_CHARS = 140_000

const REFERENCE_ROLES = new Set(['source', 'template', 'example', 'asset'])
const TEXT_EXTENSIONS = new Set([
  '.css', '.csv', '.html', '.htm', '.json', '.md', '.markdown', '.txt', '.tsv', '.xml', '.yaml', '.yml',
])
const ASSET_EXTENSIONS = new Set(['.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp'])

export const jobs = {
  generateDeck: {
    label: 'Generate deck',
    concurrency: 'parallel',
    inputSchema: {
      type: 'object',
      properties: {
        brief: { type: 'string', description: 'What the deck is about.' },
        style: { type: 'string', description: 'Free-text style, formatting, and length guidance.' },
        modelId: { type: 'string', description: 'Model id for the deck draft.' },
        references: {
          type: 'array',
          description: 'Workspace files to use as sources, HTML/CSS templates, examples, or assets.',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string', description: 'source, template, example, or asset.' },
              path: { type: 'string', description: 'Workspace-relative path.' },
              notes: { type: 'string', description: 'Optional instructions for how to use this file.' },
            },
          },
        },
      },
      required: ['brief'],
    },
    async run(ctx, input) {
      return runGenerateDeck(ctx, String(input.brief || '').trim(), {
        style: typeof input.style === 'string' ? input.style.trim() : '',
        requestedModel: typeof input.modelId === 'string' && input.modelId ? input.modelId : undefined,
        references: normalizeReferences(input.references),
      })
    },
  },
  refineDeck: {
    label: 'Refine deck',
    concurrency: 'parallel',
    inputSchema: {
      type: 'object',
      properties: {
        deckDir: { type: 'string', description: 'Workspace-relative deck directory (e.g. slides/my-deck-abc123).' },
        instruction: { type: 'string', description: 'What to change in the deck.' },
        modelId: { type: 'string', description: 'Model id for the deck refinement.' },
      },
      required: ['deckDir', 'instruction'],
    },
    async run(ctx, input) {
      return runRefineDeck(ctx, {
        deckDir: String(input.deckDir || '').trim(),
        instruction: String(input.instruction || '').trim(),
        requestedModel: typeof input.modelId === 'string' && input.modelId ? input.modelId : undefined,
      })
    },
  },
  renderDeck: {
    label: 'Render deck PDF',
    concurrency: 'parallel',
    inputSchema: {
      type: 'object',
      properties: {
        deckDir: { type: 'string', description: 'Workspace-relative deck directory (e.g. slides/my-deck-abc123).' },
      },
      required: ['deckDir'],
    },
    async run(ctx, input) {
      return runRenderDeck(ctx, String(input.deckDir || '').trim())
    },
  },
}

async function runGenerateDeck(ctx, brief, options) {
  if (!brief) throw new Error('A deck brief is required')

  const model = await resolveDeckModel(ctx, options.requestedModel)
  const template = await ctx.files.readPackageText('template/deck.html')
  const deckDir = `slides/${deckSlug(brief)}-${ctx.job.runId.slice(0, 6)}`
  const paths = deckPaths(deckDir)
  const techNotes = {
    model: model.id,
    provider: model.provider,
    mode: 'single-pass',
    renders: 0,
    reads: [],
    references: options.references.map(({ role, path }) => ({ role, path })),
    usage: {},
  }

  await ctx.progress.step('Reading the brief')
  await ctx.progress.progress(0.05, 'Preparing deck files')

  const referenceDocs = await readReferences(ctx, options.references, techNotes)
  if (referenceDocs.length) {
    await ctx.progress.progress(0.12, `${referenceDocs.length} reference${referenceDocs.length === 1 ? '' : 's'} loaded`)
  }

  await writeBrief(ctx, paths.briefPath, { brief, style: options.style, references: referenceSummaries(referenceDocs) })
  await writePlan(ctx, paths.planPath, {
    brief,
    style: options.style,
    mode: 'single-pass',
    references: referenceSummaries(referenceDocs),
    generatedAt: new Date().toISOString(),
  })

  await ctx.progress.step('Drafting deck HTML')
  const draftResult = await ctx.ai.callModel({
    modelId: model.id,
    system: buildDraftSystemPrompt(template, paths.htmlPath),
    messages: [{ role: 'user', content: buildDraftUserMessage(brief, options.style, referenceDocs, paths.htmlPath) }],
    maxTokens: 30_000,
    maxSteps: 1,
  })
  techNotes.usage.draft = draftResult?.usage || null

  const html = extractHtmlDocument(draftResult?.text || '')
  await writeDeckHtml(ctx, paths.htmlPath, html)
  await ctx.progress.progress(0.72, 'Deck HTML written')

  const render = await renderDeckPdf(ctx, paths.htmlPath, paths.pdfPath, techNotes)
  const result = buildDeckResult({
    status: 'complete',
    deckDir,
    paths,
    render,
    techNotes,
    references: referenceSummaries(referenceDocs),
    summary: deckSummary(render, 'Deck draft written'),
  })

  await ctx.data.collection('decks').put(ctx.job.runId, result)
  await ctx.progress.done(result.clean
    ? `Deck ready, ${result.slideCount || 0} slides`
    : `Deck written with ${(result.issues || []).length} layout issue${(result.issues || []).length === 1 ? '' : 's'}`,
  )
  return result
}

async function runRefineDeck(ctx, { deckDir, instruction, requestedModel }) {
  if (!deckDir) throw new Error('A deck directory is required')
  if (!instruction) throw new Error('A refinement instruction is required')

  const paths = deckPaths(deckDir)
  await ctx.progress.step('Reading deck')
  const exists = await ctx.tools.call('fs.exists', { path: paths.htmlPath })
  if (!exists?.exists) throw new Error(`Deck not found at ${paths.htmlPath}`)

  const currentFile = await ctx.tools.call('fs.read', { path: paths.htmlPath, max_chars: MAX_DECK_READ_CHARS })
  if (currentFile?.truncated) {
    throw new Error(`Deck is too large to refine safely in one pass: ${paths.htmlPath}`)
  }
  const currentHtml = String(currentFile?.content || '')
  if (!hasSlideSections(currentHtml)) throw new Error(`Deck has no section.slide elements: ${paths.htmlPath}`)

  const model = await resolveDeckModel(ctx, requestedModel)
  const template = await ctx.files.readPackageText('template/deck.html')
  const techNotes = {
    model: model.id,
    provider: model.provider,
    mode: 'single-pass-refine',
    renders: 0,
    reads: [paths.htmlPath],
    references: [],
    usage: {},
  }

  await ctx.progress.step('Applying instruction')
  const refineResult = await ctx.ai.callModel({
    modelId: model.id,
    system: buildRefineSystemPrompt(template, paths.htmlPath),
    messages: [{ role: 'user', content: buildRefineUserMessage(instruction, currentHtml, paths.htmlPath) }],
    maxTokens: 30_000,
    maxSteps: 1,
  })
  techNotes.usage.refine = refineResult?.usage || null

  const html = extractHtmlDocument(refineResult?.text || '')
  await writeDeckHtml(ctx, paths.htmlPath, html)
  await ctx.progress.progress(0.72, 'Deck HTML updated')

  const render = await renderDeckPdf(ctx, paths.htmlPath, paths.pdfPath, techNotes)
  const result = buildDeckResult({
    status: 'complete',
    deckDir,
    paths,
    render,
    techNotes,
    references: [],
    summary: deckSummary(render, `Deck refined: ${instruction}`),
    refinedFrom: deckDir,
    instruction,
  })

  await ctx.data.collection('decks').put(ctx.job.runId, result)
  await ctx.progress.done(result.clean
    ? `Deck refined, ${result.slideCount || 0} slides`
    : `Deck refined with ${(result.issues || []).length} layout issue${(result.issues || []).length === 1 ? '' : 's'}`,
  )
  return result
}

async function runRenderDeck(ctx, deckDir) {
  if (!deckDir) throw new Error('A deck directory is required')
  const paths = deckPaths(deckDir)
  await ctx.progress.step('Rendering PDF')
  const exists = await ctx.tools.call('fs.exists', { path: paths.htmlPath })
  if (!exists?.exists) throw new Error(`Deck not found at ${paths.htmlPath}`)

  const techNotes = { mode: 'render-only', renders: 0, reads: [paths.htmlPath], references: [], usage: {} }
  const render = await renderDeckPdf(ctx, paths.htmlPath, paths.pdfPath, techNotes)
  const result = buildDeckResult({
    status: 'complete',
    deckDir,
    paths,
    render,
    techNotes,
    references: [],
    summary: deckSummary(render, 'Deck rendered'),
  })
  await ctx.data.collection('decks').put(ctx.job.runId, result)
  await ctx.progress.done(result.clean
    ? `PDF ready, ${result.slideCount || 0} slides`
    : `PDF rendered with ${(result.issues || []).length} layout issue${(result.issues || []).length === 1 ? '' : 's'}`,
  )
  return result
}

function buildDraftSystemPrompt(template, htmlPath) {
  return `You are a slide deck author working in normal HTML and CSS.

Return a complete HTML document only. Do not use markdown fences unless unavoidable.

Use the provided starter template as the base geometry. You may redesign the visual style and slide content, but keep:
- one top-level <section class="slide"> per slide
- 1280x720 CSS pixel slides
- print pagination with page-break-after/break-after on .slide
- no JavaScript
- no remote scripts, fonts, or images

The deck file will be written to ${htmlPath}.

STARTER TEMPLATE (template/deck.html)
${template}`
}

function buildDraftUserMessage(brief, style, referenceDocs, htmlPath) {
  return [
    `DECK BRIEF\n${brief}`,
    style ? `STYLE AND FORMAT NOTES\n${style}` : 'STYLE AND FORMAT NOTES\nNone given.',
    `OUTPUT PATH\n${htmlPath}`,
    'TEMPLATE SOURCE\ntemplate/deck.html',
    'LOCAL ASSET PATHS\nIf you use attached local assets, reference them from the deck directory. ../../ reaches the workspace root.',
    `REFERENCES\n${formatReferencesForPrompt(referenceDocs)}`,
    'Return only the finished HTML document.',
  ].join('\n\n')
}

export function buildRefineSystemPrompt(template, htmlPath) {
  return `You refine an existing HTML slide deck.

Return the complete updated HTML document only. Do not describe the changes outside the HTML.

Keep:
- one top-level <section class="slide"> per slide
- 1280x720 CSS pixel slides
- print pagination with page-break-after/break-after on .slide
- no JavaScript
- no remote scripts, fonts, or images

The deck file is ${htmlPath}.

STARTER TEMPLATE GEOMETRY
${template}`
}

export function buildRefineUserMessage(instruction, currentHtml, htmlPath = 'deck.html') {
  return [
    `INSTRUCTION\n${instruction}`,
    `OUTPUT PATH\n${htmlPath}`,
    `CURRENT DECK HTML\n${currentHtml}`,
    'Return only the complete updated HTML document.',
  ].join('\n\n')
}

export function extractHtmlDocument(text) {
  const raw = String(text || '').trim()
  if (!raw) throw new Error('The model did not return deck HTML')

  const fenced = raw.match(/```(?:html)?\s*([\s\S]*?)```/i)
  const candidate = fenced ? fenced[1].trim() : extractHtmlRange(raw)

  assertSafeHtmlDocument(candidate)
  if (!hasSlideSections(candidate)) {
    throw new Error('Deck HTML must contain top-level section.slide elements')
  }
  return candidate
}

function assertSafeHtmlDocument(html) {
  if (/<script\b/i.test(html)) {
    throw new Error('Deck HTML must not contain <script> elements')
  }
  if (/\son[a-z][\w:-]*\s*=/i.test(html)) {
    throw new Error('Deck HTML must not contain event handler attributes')
  }
  if (/javascript\s*:/i.test(html)) {
    throw new Error('Deck HTML must not contain javascript: URLs')
  }
  if (/@import\b/i.test(html)) {
    throw new Error('Deck HTML must not contain CSS @import rules')
  }
  if (/\b(?:src|srcset|poster|xlink:href)\s*=\s*["']?\s*(?:https?:)?\/\//i.test(html) ||
      /url\(\s*["']?\s*(?:https?:)?\/\//i.test(html)) {
    throw new Error('Deck HTML must not contain remote URL resources')
  }
}

function extractHtmlRange(raw) {
  const htmlStart = raw.search(/<!doctype\s+html\b|<html\b/i)
  if (htmlStart < 0) return raw
  const htmlEnd = raw.toLowerCase().lastIndexOf('</html>')
  return htmlEnd >= 0 ? raw.slice(htmlStart, htmlEnd + '</html>'.length).trim() : raw.slice(htmlStart).trim()
}

async function writeDeckHtml(ctx, htmlPath, html) {
  if (!hasSlideSections(html)) throw new Error('The deck HTML has no slide sections')
  await ctx.tools.call('fs.write', { path: htmlPath, content: html })
}

async function renderDeckPdf(ctx, htmlPath, pdfPath, techNotes) {
  techNotes.renders++
  await ctx.progress.step('Rendering PDF')
  const report = await ctx.tools.call('render.htmlToPdf', { path: htmlPath, output_path: pdfPath })
  await ctx.progress.progress(
    0.92,
    report.ok
      ? 'PDF rendered'
      : `${(report.issues || []).length} layout issue${(report.issues || []).length === 1 ? '' : 's'}`,
  )
  return report
}

async function writeBrief(ctx, briefPath, data) {
  const lines = [
    '# Deck brief',
    '',
    data.brief,
    '',
  ]
  if (data.style) {
    lines.push('## Style', '', data.style, '')
  }
  if (data.references?.length) {
    lines.push('## References', '')
    for (const ref of data.references) {
      lines.push(`- ${ref.role}: ${ref.path}${ref.notes ? ` - ${ref.notes}` : ''}`)
    }
    lines.push('')
  }
  await ctx.tools.call('fs.write', { path: briefPath, content: `${lines.join('\n').trim()}\n` })
}

async function writePlan(ctx, planPath, plan) {
  await ctx.tools.call('fs.write', {
    path: planPath,
    content: `${JSON.stringify(plan, null, 2)}\n`,
  })
}

async function readReferences(ctx, references, techNotes) {
  const docs = []
  for (const reference of references) {
    ctx.abort.throwIfAborted()
    await ctx.progress.log(`Reading ${reference.role} ${reference.path}`)
    docs.push(await readWorkspaceReference(ctx, reference, techNotes))
  }
  return docs
}

async function readWorkspaceReference(ctx, reference, techNotes) {
  const ext = extensionForPath(reference.path)
  if (reference.role === 'template' && ext !== '.html' && ext !== '.htm' && ext !== '.css') {
    throw new Error(`Template references must be HTML or CSS: ${reference.path}`)
  }

  techNotes.reads.push(reference.path)
  if (ext === '.docx') {
    const result = await ctx.documents.docx.extract(reference.path, { max_chars: MAX_READ_CHARS })
    return {
      ...reference,
      contentKind: 'docx',
      content: String(result.markdown || result.text || ''),
      totalChars: Number(result.total_chars || 0),
      truncated: result.truncated === true,
    }
  }

  if (TEXT_EXTENSIONS.has(ext)) {
    const result = await ctx.tools.call('fs.read', { path: reference.path, max_chars: MAX_READ_CHARS })
    return {
      ...reference,
      contentKind: ext.replace(/^\./, '') || 'text',
      content: String(result.content || ''),
      totalChars: Number(result.total_chars || result.content?.length || 0),
      truncated: result.truncated === true,
    }
  }

  if (ASSET_EXTENSIONS.has(ext) || reference.role === 'asset') {
    const exists = await ctx.tools.call('fs.exists', { path: reference.path })
    if (!exists?.exists) throw new Error(`Reference file does not exist: ${reference.path}`)
    return {
      ...reference,
      contentKind: 'asset',
      content: '',
      totalChars: 0,
      truncated: false,
      usage: 'Local asset. Reference from generated deck HTML by relative path from the deck directory.',
    }
  }

  throw new Error(`Unsupported reference file type for ${reference.path}. Use text, CSV, Markdown, HTML/CSS, SVG/image assets, or DOCX.`)
}

function formatReferencesForPrompt(referenceDocs) {
  if (!referenceDocs.length) return 'No explicit references.'
  let remaining = MAX_REFERENCE_PROMPT_CHARS
  const parts = []
  for (const ref of referenceDocs) {
    const header = [
      `REFERENCE ${parts.length + 1}`,
      `role: ${ref.role}`,
      `path: ${ref.path}`,
      ref.notes ? `notes: ${ref.notes}` : '',
      `kind: ${ref.contentKind}`,
      ref.usage ? `usage: ${ref.usage}` : '',
    ].filter(Boolean).join('\n')
    let content = ref.content || ''
    if (content.length > remaining) content = `${content.slice(0, Math.max(0, remaining))}\n[truncated for prompt budget]`
    remaining -= content.length
    parts.push(`${header}\n\n${content ? `CONTENT\n${content}` : 'CONTENT\n[file is available but not text-readable]'}`)
    if (remaining <= 0) break
  }
  return parts.join('\n\n---\n\n')
}

export function normalizeReferences(value) {
  if (!Array.isArray(value)) return []
  const seen = new Set()
  const references = []
  for (const item of value) {
    const raw = asRecord(item)
    if (!raw) continue
    const path = stringField(raw, 'path').trim()
    if (!path) continue
    const role = REFERENCE_ROLES.has(stringField(raw, 'role')) ? stringField(raw, 'role') : 'source'
    const key = `${role}:${path}`
    if (seen.has(key)) continue
    seen.add(key)
    references.push({
      role,
      path,
      notes: stringField(raw, 'notes').trim(),
    })
  }
  return references
}

function referenceSummaries(references) {
  return references.map(reference => ({
    role: reference.role,
    path: reference.path,
    notes: reference.notes,
    contentKind: reference.contentKind,
    totalChars: reference.totalChars,
    truncated: reference.truncated,
  }))
}

function buildDeckResult({
  status,
  deckDir,
  paths,
  render,
  techNotes,
  references,
  summary,
  refinedFrom,
  instruction,
}) {
  return {
    status,
    clean: render.ok === true,
    htmlPath: paths.htmlPath,
    pdfPath: paths.pdfPath,
    planPath: paths.planPath,
    briefPath: paths.briefPath,
    deckDir,
    slideCount: render.slide_count,
    pageCount: render.page_count,
    issues: render.issues || [],
    warnings: render.warnings || [],
    outputs: buildResultOutputs(paths),
    summary,
    references,
    usage: techNotes.usage,
    techNotes,
    ...(refinedFrom ? { refinedFrom } : {}),
    ...(instruction ? { instruction } : {}),
    completedAt: new Date().toISOString(),
  }
}

function deckSummary(render, base) {
  if (render.ok) return `${base}. PDF rendered successfully.`
  const issueCount = (render.issues || []).length
  return `${base}. PDF rendered with ${issueCount} layout issue${issueCount === 1 ? '' : 's'}; edit deck.html and render again.`
}

function buildResultOutputs({ pdfPath, htmlPath, planPath, briefPath }) {
  return [
    {
      kind: 'pdf',
      label: 'Deck PDF',
      path: pdfPath,
      description: 'Rendered slide deck PDF.',
      action: 'Open PDF',
      openWith: 'native',
    },
    {
      kind: 'html',
      label: 'Deck HTML',
      path: htmlPath,
      description: 'Paginated source HTML for the generated deck.',
      action: 'Open in editor',
      openWith: 'editor',
    },
    {
      kind: 'json',
      label: 'Deck metadata',
      path: planPath,
      description: 'Generation metadata and source references.',
      action: 'Open',
      openWith: 'editor',
    },
    {
      kind: 'markdown',
      label: 'Deck brief',
      path: briefPath,
      description: 'Original deck brief and reference list.',
      action: 'Open',
      openWith: 'editor',
    },
  ]
}

async function resolveDeckModel(ctx, requestedModel) {
  const registry = await ctx.tools.call('ai.registry')
  const models = Array.isArray(registry?.models) ? registry.models : []
  const defaultIds = Array.isArray(registry?.defaults?.agent)
    ? registry.defaults.agent
    : Array.isArray(registry?.defaults?.chat)
      ? registry.defaults.chat
      : []
  const compatible = deckCapableModels(models)
  const defaultModel = compatible.find(model => defaultIds.includes(model.id) || defaultIds.includes(model.model))
  const requestedId = requestedModel || defaultModel?.id || compatible[0]?.id || 'claude-sonnet-4-6'
  const found = models.find(model => model.id === requestedId || model.model === requestedId)
  if (!found) throw new Error(`Unknown deck model: ${requestedId}`)
  if (found.capabilities?.text === false) throw new Error(`Deck model must support text output: ${requestedId}`)
  return {
    id: found.id || found.model,
    model: found.model || found.id,
    provider: found.provider || 'unknown',
  }
}

function deckPaths(deckDir) {
  return {
    deckDir,
    htmlPath: `${deckDir}/deck.html`,
    pdfPath: `${deckDir}/deck.pdf`,
    planPath: `${deckDir}/deck-plan.json`,
    briefPath: `${deckDir}/brief.md`,
  }
}

export function deckSlug(brief) {
  const slug = brief
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 6)
    .join('-')
    .slice(0, 48)
    .replace(/^-+|-+$/g, '')
  return slug || 'deck'
}

export function findSectionBlocks(html) {
  const text = String(html || '')
  const tag = /<\/?section\b[^>]*>/gi
  const blocks = []
  let depth = 0
  let start = -1
  let match
  while ((match = tag.exec(text))) {
    if (match[0][1] !== '/') {
      if (depth === 0) start = match.index
      depth++
    } else if (depth > 0) {
      depth--
      if (depth === 0 && start >= 0) {
        blocks.push({ start, end: tag.lastIndex, html: text.slice(start, tag.lastIndex) })
        start = -1
      }
    }
  }
  return blocks
}

export function replaceSlideSection(html, slideId, sectionHtml) {
  if (typeof html !== 'string') throw new Error('html must be a string')
  if (typeof slideId !== 'string' || !slideId) throw new Error('slideId must be a non-empty string')
  if (typeof sectionHtml !== 'string') throw new Error('sectionHtml must be a string')

  const trimmed = sectionHtml.trim()
  const replacementBlocks = findSectionBlocks(trimmed)
  if (replacementBlocks.length !== 1 || replacementBlocks[0].html !== trimmed) {
    throw new Error('sectionHtml must contain exactly one <section> element')
  }
  if (!isSlideOpeningTag(trimmed)) {
    throw new Error('sectionHtml must be a <section class="slide"> element')
  }
  if (/<script\b/i.test(trimmed)) {
    throw new Error('sectionHtml must not contain <script> elements')
  }
  if (!slideIdPattern(slideId).test(sectionOpeningTag(trimmed))) {
    throw new Error(`sectionHtml data-slide-id must match "${slideId}"`)
  }

  const idPattern = slideIdPattern(slideId)
  const target = findSectionBlocks(html).find(block => idPattern.test(sectionOpeningTag(block.html)))
  if (!target) {
    throw new Error(`No section found with data-slide-id="${slideId}"`)
  }
  return html.slice(0, target.start) + trimmed + html.slice(target.end)
}

function hasSlideSections(html) {
  return /<section\b[^>]*class\s*=\s*["'][^"']*\bslide\b/i.test(String(html || ''))
}

function sectionOpeningTag(blockHtml) {
  const end = blockHtml.indexOf('>')
  return end >= 0 ? blockHtml.slice(0, end + 1) : blockHtml
}

function isSlideOpeningTag(blockHtml) {
  return /class\s*=\s*["'][^"']*\bslide\b/i.test(sectionOpeningTag(blockHtml))
}

function slideIdPattern(slideId) {
  const escapedId = slideId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`data-slide-id\\s*=\\s*(?:["']${escapedId}["']|${escapedId}(?=[\\s/>]))`, 'i')
}

function extensionForPath(path) {
  const name = String(path || '').toLowerCase()
  const dot = name.lastIndexOf('.')
  return dot >= 0 ? name.slice(dot) : ''
}

function asRecord(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : null
}

function stringField(record, key) {
  const value = record?.[key]
  return typeof value === 'string' ? value : ''
}

export { buildChartSvg, deckCapableModels }
