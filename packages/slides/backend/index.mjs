import { buildChartSvg } from '../shared/charts.mjs'
import { deckCapableModels } from '../shared/models.mjs'

const AGENT_TIMEOUT = 600_000
const MAX_STEPS = 24
const MAX_READ_CHARS = 80_000
const MAX_REFERENCE_PROMPT_CHARS = 140_000
const MAX_RENDERS = 8

const REFERENCE_ROLES = new Set(['source', 'template', 'example', 'asset'])
const TEXT_EXTENSIONS = new Set([
  '.css', '.csv', '.html', '.htm', '.json', '.md', '.markdown', '.txt', '.tsv', '.xml', '.yaml', '.yml',
])
const ASSET_EXTENSIONS = new Set(['.gif', '.jpeg', '.jpg', '.png', '.svg', '.webp'])

function tokenNote(usage) {
  if (!usage || typeof usage !== 'object') return ''
  const input = usage.inputTokens ?? usage.input ?? usage.promptTokens
  const output = usage.outputTokens ?? usage.output ?? usage.completionTokens
  if (input == null && output == null) return ''
  return ` · ${input ?? '?'}→${output ?? '?'} tok`
}

async function logged(ctx, label, fn) {
  const startedAt = Date.now()
  await ctx.progress.log(`▶ ${label}`)
  try {
    const result = await fn()
    const usage = result && typeof result === 'object'
      ? (result.usage ?? result.totalUsage ?? null)
      : null
    await ctx.progress.log(`✓ ${label} — ${Date.now() - startedAt}ms${tokenNote(usage)}`)
    return result
  } catch (err) {
    const message = err && err.message ? err.message : String(err)
    await ctx.progress.log(`✗ ${label} — failed after ${Date.now() - startedAt}ms: ${message}`)
    throw err instanceof Error ? err : new Error(message || 'Model call failed')
  }
}

export const jobs = {
  generateDeck: {
    label: 'Generate deck',
    concurrency: 'parallel',
    inputSchema: {
      type: 'object',
      properties: {
        brief: { type: 'string', description: 'What the deck is about.' },
        style: { type: 'string', description: 'Free-text style, formatting, and length guidance.' },
        modelId: { type: 'string', description: 'Model id for the deck agent.' },
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
      return runDeckPipeline(ctx, String(input.brief || '').trim(), {
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
        modelId: { type: 'string', description: 'Model id. Uses the default deck model if omitted.' },
      },
      required: ['deckDir', 'instruction'],
    },
    async run(ctx, input) {
      return runRefinePipeline(ctx, {
        deckDir: String(input.deckDir || '').trim(),
        instruction: String(input.instruction || '').trim(),
        requestedModel: typeof input.modelId === 'string' && input.modelId ? input.modelId : undefined,
      })
    },
  },
}

// ---------------------------------------------------------------------------
// Pipelines
// ---------------------------------------------------------------------------

async function runDeckPipeline(ctx, brief, options) {
  if (!brief) throw new Error('A deck brief is required')
  const model = await resolveDeckModel(ctx, options.requestedModel)
  const template = await ctx.files.readPackageText('template/deck.html')
  const deckDir = `slides/${deckSlug(brief)}-${ctx.job.runId.slice(0, 6)}`
  const htmlPath = `${deckDir}/deck.html`
  const pdfPath = `${deckDir}/deck.pdf`
  const planPath = `${deckDir}/deck-plan.json`
  const techNotes = {
    model,
    deckDir,
    drafts: 0,
    renders: 0,
    reads: [],
    references: options.references.map(({ role, path }) => ({ role, path })),
    usage: {},
  }
  const state = { written: false, dirty: false, lastRender: null }

  await ctx.progress.step('Reading the brief')
  await ctx.progress.progress(0.04, 'Preparing deck inputs')

  const referenceDocs = await readReferences(ctx, options.references, techNotes)
  if (referenceDocs.length) {
    await ctx.progress.progress(0.1, `${referenceDocs.length} reference${referenceDocs.length === 1 ? '' : 's'} loaded`)
  }

  await writePlan(ctx, planPath, {
    brief,
    style: options.style,
    references: referenceSummaries(referenceDocs),
  })

  await ctx.progress.step('Writing deck')
  const tools = createDeckTools(ctx, { htmlPath, pdfPath, state, techNotes })
  const agentResult = await logged(ctx, `Writing deck (${model} tool loop)`, () => runAgent(() => ctx.ai.callModel({
    modelId: model,
    system: buildSystemPrompt(template, htmlPath),
    messages: [{ role: 'user', content: buildUserMessage(brief, options.style, referenceDocs) }],
    tools,
    maxTokens: 30_000,
    maxSteps: MAX_STEPS,
  })))
  techNotes.usage.generate = agentResult?.usage || null

  if (!state.written) {
    const result = {
      status: 'failed',
      reason: 'The deck agent did not produce a deck. Try a more specific brief or fewer slides.',
      planPath,
      techNotes,
    }
    await ctx.data.collection('decks').put(ctx.job.runId, result)
    return result
  }

  if (state.dirty || !state.lastRender) {
    await ctx.progress.step('Rendering final PDF')
    state.lastRender = await renderDeckPdf(ctx, htmlPath, pdfPath, state, techNotes)
  }

  const render = state.lastRender
  const result = {
    status: 'complete',
    clean: render.ok === true,
    htmlPath,
    pdfPath,
    planPath,
    deckDir,
    slideCount: render.slide_count,
    pageCount: render.page_count,
    issues: render.issues || [],
    outputs: buildResultOutputs({ pdfPath, htmlPath, planPath }),
    summary: agentResult?.text?.trim() || `Deck generated: ${brief}`,
    references: referenceSummaries(referenceDocs),
    usage: techNotes.usage,
    techNotes,
    completedAt: new Date().toISOString(),
  }
  await ctx.data.collection('decks').put(ctx.job.runId, result)
  await ctx.progress.done(
    render.ok
      ? `Deck ready, ${render.slide_count} slides`
      : `Deck ready with ${result.issues.length} unresolved layout issue${result.issues.length === 1 ? '' : 's'}`,
  )
  return result
}

async function runRefinePipeline(ctx, { deckDir, instruction, requestedModel }) {
  if (!deckDir) throw new Error('A deck directory is required')
  if (!instruction) throw new Error('A refinement instruction is required')

  const htmlPath = `${deckDir}/deck.html`
  const pdfPath = `${deckDir}/deck.pdf`
  const planPath = `${deckDir}/deck-plan.json`

  await ctx.progress.step('Validating deck')
  const exists = await ctx.tools.call('fs.exists', { path: htmlPath })
  if (!exists?.exists) throw new Error(`Deck not found at ${htmlPath}`)

  const model = await resolveDeckModel(ctx, requestedModel)
  const template = await ctx.files.readPackageText('template/deck.html')
  const techNotes = {
    model,
    deckDir,
    mode: 'refine',
    drafts: 0,
    renders: 0,
    reads: [],
    references: [],
    usage: {},
  }
  const state = { written: true, dirty: false, lastRender: null }

  let deckContext = null
  try {
    const planExists = await ctx.tools.call('fs.exists', { path: planPath })
    if (planExists?.exists) {
      const planFile = await ctx.tools.call('fs.read', { path: planPath, max_chars: MAX_READ_CHARS })
      const planText = String(planFile?.content || planFile || '')
      if (planText) deckContext = JSON.parse(planText)
    }
  } catch {
    // Plan is optional context; proceed without it
  }

  await ctx.progress.step('Refining deck')
  await ctx.progress.progress(0.1, 'Reading and applying changes')

  const tools = createDeckTools(ctx, { htmlPath, pdfPath, state, techNotes })
  const agentResult = await logged(ctx, `Refining deck (${model} tool loop)`, () => runAgent(() => ctx.ai.callModel({
    modelId: model,
    system: buildRefineSystemPrompt(template, htmlPath),
    messages: [{ role: 'user', content: buildRefineUserMessage(instruction, deckContext) }],
    tools,
    maxTokens: 30_000,
    maxSteps: MAX_STEPS,
  })))
  techNotes.usage.refine = agentResult?.usage || null
  await ctx.progress.progress(0.6, 'Changes applied')

  if (state.dirty || !state.lastRender) {
    await ctx.progress.step('Rendering PDF')
    state.lastRender = await renderDeckPdf(ctx, htmlPath, pdfPath, state, techNotes)
  }

  const render = state.lastRender
  const result = {
    status: 'complete',
    clean: render?.ok === true,
    htmlPath,
    pdfPath,
    planPath,
    deckDir,
    slideCount: render?.slide_count,
    pageCount: render?.page_count,
    issues: render?.issues || [],
    outputs: buildResultOutputs({ pdfPath, htmlPath, planPath }),
    summary: agentResult?.text?.trim() || `Deck refined: ${instruction}`,
    usage: techNotes.usage,
    techNotes,
    refinedFrom: deckDir,
    instruction,
    completedAt: new Date().toISOString(),
  }
  await ctx.data.collection('decks').put(ctx.job.runId, result)
  await ctx.progress.done(
    render?.ok
      ? `Deck refined, ${render.slide_count} slides`
      : `Deck refined with ${(result.issues || []).length} unresolved layout issue${(result.issues || []).length === 1 ? '' : 's'}`,
  )
  return result
}

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

function buildSystemPrompt(template, htmlPath) {
  return `You are a slide deck author. You produce finished, well-designed decks as a single self-contained HTML file, then verify them by rendering to PDF.

WORKFLOW
1. Plan the deck structure: title slide, content slides, section dividers. Think about narrative flow, visual variety, and pacing. Then write all slides in one write_deck call.
2. If the brief references workspace files you haven't seen, use read_file or list_files to find them.
3. Call write_deck with the COMPLETE HTML document.
4. Call render_pdf. It returns a layout report.
5. If the report lists issues, use edit_slide to fix individual slides (call read_deck first to see current state). Use write_deck only for structural rewrites.
6. Repeat render_pdf until ok=true or issues are minor.
7. Finish with a 2-3 sentence summary of the deck. Do not paste HTML into your reply.

THE TEMPLATE — your document must follow its geometry contract exactly. Restyle the theme tokens and layout freely to match the requested style; never change the geometry block:

${template}

HARD RULES
- The deck lives at ${htmlPath}; write_deck writes there. Never write anywhere else.
- Every <section class="slide"> MUST carry data-slide-id (e.g. data-slide-id="S01", "S02", ...). Never nest <section> elements inside a slide (edit_slide matches the first </section> close).
- 1280×720px slides as <section class="slide">, one idea per slide, nothing outside the slide boxes (mark intentional full-bleed decoration with data-bleed).
- Self-contained file. No external scripts, no remote fonts, no remote images, no JavaScript. System fonts, inline SVG, CSS only. Local workspace images may be referenced by relative path from the deck file (../../ reaches the workspace root).
- Charts with numeric data: ALWAYS use the make_chart tool to generate SVG charts. Never hand-draw SVG numbers or axes.
- Write tight, declarative copy. Slides support a presenter; they are not a document.`
}

function buildUserMessage(brief, style, referenceDocs) {
  return [
    `DECK BRIEF\n${brief}`,
    style ? `STYLE AND FORMAT NOTES\n${style}` : 'STYLE AND FORMAT NOTES\nNone given.',
    `REFERENCES\n${formatReferencesForPrompt(referenceDocs)}`,
  ].join('\n\n')
}

export function buildRefineSystemPrompt(template, htmlPath) {
  return `You are a slide deck refinement agent. You modify an existing deck based on user instructions.

WORKFLOW
1. ALWAYS start by calling read_deck to see the current state of the deck.
2. Understand the user's instruction and plan your changes.
3. Use edit_slide for targeted changes to individual slides (preferred). Use write_deck only for deck-wide changes like retheming or restructuring.
4. Use make_chart for any numeric charts — never hand-draw SVG numbers.
5. Call render_pdf to verify the changes. Fix any layout issues.
6. Finish with a brief summary of what you changed. Do not paste HTML into your reply.

HARD RULES
- The deck lives at ${htmlPath}; do not write anywhere else.
- Every <section class="slide"> MUST keep its data-slide-id attribute. Never nest <section> elements inside a slide.
- 1280x720px slides. Self-contained file, no external scripts or remote resources.
- Charts with numeric data: ALWAYS use make_chart. Never hand-draw SVG.
- Read first, then edit. Do not guess at the current deck content.

The template geometry is immutable:

${template}`
}

export function buildRefineUserMessage(instruction, deckContext) {
  const parts = [`INSTRUCTION\n${instruction}`]
  if (deckContext) {
    parts.push(`DECK CONTEXT\n${JSON.stringify(deckContext, null, 2)}`)
  }
  return parts.join('\n\n')
}

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

function createDeckTools(ctx, params) {
  return [
    {
      name: 'list_files',
      description: 'List files in a workspace folder. Use to locate files mentioned in the brief.',
      input_schema: {
        type: 'object',
        properties: { path: { type: 'string', description: 'Workspace-relative folder. Omit for the workspace root.' } },
      },
      execute: async (toolInput) => {
        ctx.abort.throwIfAborted()
        return ctx.tools.call('fs.list', toolInput.path ? { path: String(toolInput.path) } : { path: '.' })
      },
    },
    {
      name: 'read_file',
      description: 'Read a text-like workspace file or DOCX file referenced in the brief.',
      input_schema: {
        type: 'object',
        properties: { path: { type: 'string' } },
        required: ['path'],
      },
      execute: async (toolInput) => {
        ctx.abort.throwIfAborted()
        const path = String(toolInput.path)
        const reference = await readWorkspaceReference(ctx, { role: 'source', path, notes: '' }, params.techNotes)
        return {
          path: reference.path,
          role: reference.role,
          contentKind: reference.contentKind,
          content: reference.content,
          truncated: reference.truncated === true,
        }
      },
    },
    {
      name: 'read_deck',
      description: `Read the current complete deck HTML from ${params.htmlPath}.`,
      input_schema: { type: 'object', properties: {} },
      execute: async () => {
        ctx.abort.throwIfAborted()
        if (!params.state.written) return { error: 'No deck has been written yet.' }
        return ctx.tools.call('fs.read', { path: params.htmlPath, max_chars: 200_000 })
      },
    },
    {
      name: 'write_deck',
      description: `Write the complete deck HTML to ${params.htmlPath}. Always pass the full document, never a fragment.`,
      input_schema: {
        type: 'object',
        properties: { html: { type: 'string', description: 'The complete self-contained HTML document.' } },
        required: ['html'],
      },
      execute: async (toolInput) => {
        ctx.abort.throwIfAborted()
        const html = String(toolInput.html || '')
        if (!hasSlideSections(html)) {
          return { error: 'The document has no <section class="slide"> elements. Follow the template.' }
        }
        await writeDeckHtml(ctx, params.htmlPath, html, params.state, params.techNotes, `Draft ${params.techNotes.drafts + 1} written`)
        return { ok: true, path: params.htmlPath, chars: html.length }
      },
    },
    {
      name: 'edit_slide',
      description: `Replace a single slide in the deck by its data-slide-id. Prefer this over write_deck for fixing individual slides. The html must be exactly one <section class="slide" data-slide-id="<id>">...</section>.`,
      input_schema: {
        type: 'object',
        properties: {
          slide_id: { type: 'string', description: 'The data-slide-id of the slide to replace.' },
          html: { type: 'string', description: 'The replacement section HTML (single <section class="slide" data-slide-id="...">).' },
        },
        required: ['slide_id', 'html'],
      },
      execute: async (toolInput) => {
        ctx.abort.throwIfAborted()
        if (!params.state.written) return { error: 'No deck has been written yet.' }
        const slideId = String(toolInput.slide_id || '')
        const sectionHtml = String(toolInput.html || '')
        const currentHtml = await ctx.tools.call('fs.read', { path: params.htmlPath, max_chars: 200_000 })
        const deckContent = String(currentHtml?.content || currentHtml || '')

        const availableIds = findSectionBlocks(deckContent).map(block => slideIdOfBlock(block.html)).filter(Boolean)

        try {
          const updated = replaceSlideSection(deckContent, slideId, sectionHtml)
          await ctx.tools.call('fs.write', { path: params.htmlPath, content: updated })
          params.state.written = true
          params.state.dirty = true
          params.techNotes.drafts++
          return { ok: true, slide_id: slideId, path: params.htmlPath }
        } catch (err) {
          if (err.message.includes('No section found')) {
            return { error: `No slide with data-slide-id="${slideId}". Available ids: ${availableIds.join(', ')}` }
          }
          return { error: err.message }
        }
      },
    },
    createMakeChartTool(),
    {
      name: 'render_pdf',
      description: 'Render the written deck to PDF and get a layout report. Returns ok=true when every slide fits its page.',
      input_schema: { type: 'object', properties: {} },
      execute: async () => {
        ctx.abort.throwIfAborted()
        if (!params.state.written) return { error: 'Write the deck with write_deck before rendering.' }
        if (params.techNotes.renders >= MAX_RENDERS) {
          return { error: 'Render limit reached. Simplify the dense slides or split them, then write and render once more.' }
        }
        params.state.lastRender = await renderDeckPdf(ctx, params.htmlPath, params.pdfPath, params.state, params.techNotes)
        return params.state.lastRender
      },
    },
  ]
}

function createMakeChartTool() {
  return {
    name: 'make_chart',
    description: 'Generate a deterministic SVG chart. Charts must be generated with this tool whenever numeric data is shown — never hand-draw SVG numbers. Returns {svg} with a self-contained inline <svg> string.',
    input_schema: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'Chart type: bar, line, pie, donut, or scatter.' },
        title: { type: 'string', description: 'Optional chart title.' },
        data: {
          type: 'array',
          description: 'Data points: [{label, value}] for bar/pie/donut, [{x, y}] for line/scatter.',
          items: { type: 'object' },
        },
        series: {
          type: 'array',
          description: 'Multi-series data for line/bar: [{label, data: [...]}].',
          items: { type: 'object' },
        },
        width: { type: 'number', description: 'SVG width in px (default 600).' },
        height: { type: 'number', description: 'SVG height in px (default 400).' },
        colors: {
          type: 'array',
          description: 'Custom color palette.',
          items: { type: 'string' },
        },
        options: {
          type: 'object',
          description: 'Extra options: showValues (boolean), yLabel (string), xLabel (string).',
          properties: {
            showValues: { type: 'boolean' },
            yLabel: { type: 'string' },
            xLabel: { type: 'string' },
          },
        },
      },
      required: ['type', 'data'],
    },
    execute: async (toolInput) => {
      try {
        const svg = buildChartSvg(toolInput)
        return { svg }
      } catch (err) {
        return { error: err.message }
      }
    },
  }
}

// ---------------------------------------------------------------------------
// Deck I/O
// ---------------------------------------------------------------------------

async function writeDeckHtml(ctx, htmlPath, html, state, techNotes, label) {
  if (!hasSlideSections(html)) throw new Error('The deck HTML has no slide sections')
  await ctx.tools.call('fs.write', { path: htmlPath, content: html })
  state.written = true
  state.dirty = true
  techNotes.drafts++
  await ctx.progress.progress(
    Math.min(0.3 + (techNotes.drafts - 1) * 0.08, 0.76),
    label,
  )
}

async function renderDeckPdf(ctx, htmlPath, pdfPath, state, techNotes) {
  techNotes.renders++
  await ctx.progress.step(`Rendering PDF (pass ${techNotes.renders})`)
  const report = await ctx.tools.call('render.htmlToPdf', { path: htmlPath, output_path: pdfPath })
  state.dirty = false
  await ctx.progress.progress(
    report.ok ? 0.9 : Math.min(0.64 + techNotes.renders * 0.04, 0.86),
    report.ok ? 'Layout clean' : `${report.issues.length} layout issue${report.issues.length === 1 ? '' : 's'} to fix`,
  )
  return report
}

async function writePlan(ctx, planPath, plan) {
  await ctx.tools.call('fs.write', {
    path: planPath,
    content: `${JSON.stringify(plan, null, 2)}\n`,
  })
}

// ---------------------------------------------------------------------------
// References
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// HTML parsing
// ---------------------------------------------------------------------------

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

function slideIdOfBlock(blockHtml) {
  const match = sectionOpeningTag(blockHtml).match(/data-slide-id\s*=\s*(?:["']([^"']*)["']|([^\s/>]+))/i)
  return match ? (match[1] ?? match[2] ?? '') : ''
}

function hasSlideSections(html) {
  return /<section\b[^>]*class\s*=\s*["'][^"']*\bslide\b/i.test(String(html || ''))
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

// ---------------------------------------------------------------------------
// Result helpers
// ---------------------------------------------------------------------------

function buildResultOutputs({ pdfPath, htmlPath, planPath }) {
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
      label: 'Deck plan',
      path: planPath,
      description: 'Metadata for the generated deck.',
      action: 'Open',
      openWith: 'editor',
    },
  ]
}

// ---------------------------------------------------------------------------
// Infrastructure
// ---------------------------------------------------------------------------

async function runAgent(fn) {
  let lastError = null
  for (let attempt = 1; attempt <= 2; attempt++) {
    let timeout = null
    try {
      return await Promise.race([
        fn(),
        new Promise((_, reject) => {
          timeout = setTimeout(() => reject(new Error('Agent timeout')), AGENT_TIMEOUT)
          timeout.unref?.()
        }),
      ])
    } catch (err) {
      lastError = err
      if (attempt === 2) break
      await new Promise(resolve => setTimeout(resolve, 5_000))
    } finally {
      if (timeout) clearTimeout(timeout)
    }
  }
  throw lastError || new Error('Agent failed')
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
  return found.id || found.model
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

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
