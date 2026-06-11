import { describe, it, expect } from 'vitest'
import {
  jobs,
  findSectionBlocks,
  replaceSlideSection,
  normalizeReferences,
  buildRefineSystemPrompt,
  buildRefineUserMessage,
  deckSlug,
} from './index.mjs'

// ---------------------------------------------------------------------------
// Fake ctx harness. All boundaries (AI, tools runtime, fs, data store) are
// faked; everything in index.mjs runs for real.
// ---------------------------------------------------------------------------

const FAKE_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Deck</title>
<style>
@page { size: 13.333in 7.5in; margin: 0; }
section.slide { width: 1280px; height: 720px; }
</style>
</head>
<body>
<section class="slide" data-slide-id="T1"><h1>Template slide</h1></section>
</body>
</html>`

function slideHtml(id, body = 'Body') {
  return `<section class="slide" data-slide-id="${id}"><h1>${body}</h1></section>`
}

function deckDoc(ids) {
  return `<!DOCTYPE html><html><head><style>p{margin:0}</style></head><body>\n${ids.map(id => slideHtml(id)).join('\n')}\n</body></html>`
}

function planObject(count, extra = {}) {
  return {
    title: 'Test Deck',
    slides: Array.from({ length: count }, (_, i) => ({
      id: `S${String(i + 1).padStart(2, '0')}`,
      title: `Slide ${i + 1}`,
      message: `Message ${i + 1}`,
    })),
    ...extra,
  }
}

function getTool(opts, name) {
  const found = (opts.tools || []).find(t => t.name === name)
  if (!found) throw new Error(`tool ${name} not offered to agent`)
  return found.execute
}

function createFakeCtx(overrides = {}) {
  const files = new Map(Object.entries(overrides.files || {}))
  const progress = []
  const collections = new Map()
  const toolCalls = []
  const registry = overrides.registry || {
    models: [{
      id: 'claude-sonnet-4-6',
      model: 'claude-sonnet-4-6',
      provider: 'anthropic',
      capabilities: { tools: true, text: true },
    }],
    defaults: { agent: ['claude-sonnet-4-6'] },
  }
  const ctx = {
    job: { runId: overrides.runId || 'run123456789' },
    abort: {
      aborted: false,
      throwIfAborted() { if (this.aborted) throw new Error('aborted') },
    },
    progress: {
      async step(label) { progress.push(['step', label]) },
      async progress(value, label) { progress.push(['progress', value, label]) },
      async log(message) { progress.push(['log', message]) },
      async done(message) { progress.push(['done', message]) },
    },
    files: {
      async readPackageText(path) {
        return overrides.packageFiles?.[path] ?? FAKE_TEMPLATE
      },
    },
    documents: {
      docx: {
        extract: overrides.docxExtract || (async () => { throw new Error('docx extract not faked') }),
      },
    },
    ai: {
      callModel: overrides.callModel || (async () => ({ text: '', usage: null })),
    },
    data: {
      collection(name) {
        if (!collections.has(name)) collections.set(name, new Map())
        const map = collections.get(name)
        return { async put(key, value) { map.set(key, value) } }
      },
    },
    tools: {
      async call(name, params = {}) {
        toolCalls.push([name, params])
        switch (name) {
          case 'fs.exists':
            return { exists: files.has(params.path) }
          case 'fs.read': {
            if (!files.has(params.path)) throw new Error(`File not found: ${params.path}`)
            const content = files.get(params.path)
            return { content, total_chars: content.length, truncated: false }
          }
          case 'fs.write':
            files.set(params.path, params.content)
            return { ok: true }
          case 'fs.list':
            return { entries: [...files.keys()] }
          case 'ai.registry':
            return registry
          case 'render.htmlToPdf': {
            const html = files.get(params.path) || ''
            const count = (html.match(/<section\b[^>]*class\s*=\s*["'][^"']*\bslide\b/gi) || []).length
            files.set(params.output_path, `%PDF ${count} slides`)
            return { ok: true, slide_count: count, page_count: count, issues: [], warnings: [] }
          }
          default:
            throw new Error(`Unexpected tool call: ${name}`)
        }
      },
    },
  }
  return { ctx, files, progress, collections, toolCalls }
}

// ---------------------------------------------------------------------------
// findSectionBlocks
// ---------------------------------------------------------------------------

describe('findSectionBlocks', () => {
  it('returns [] for empty or non-string input', () => {
    expect(findSectionBlocks('')).toEqual([])
    expect(findSectionBlocks(null)).toEqual([])
    expect(findSectionBlocks(undefined)).toEqual([])
    expect(findSectionBlocks('<div>no sections</div>')).toEqual([])
  })

  it('finds multiple top-level blocks with correct offsets', () => {
    const a = slideHtml('S01', 'A')
    const b = slideHtml('S02', 'B')
    const html = `prefix ${a}\nbetween\n${b} suffix`
    const blocks = findSectionBlocks(html)
    expect(blocks).toHaveLength(2)
    expect(blocks[0].html).toBe(a)
    expect(blocks[1].html).toBe(b)
    expect(html.slice(blocks[0].start, blocks[0].end)).toBe(a)
    expect(html.slice(blocks[1].start, blocks[1].end)).toBe(b)
  })

  it('keeps nested sections inside a single top-level block', () => {
    const html = '<section class="slide" data-slide-id="S01"><section class="inner"><p>x</p></section><p>tail</p></section>'
    const blocks = findSectionBlocks(html)
    expect(blocks).toHaveLength(1)
    expect(blocks[0].html).toBe(html)
    expect(blocks[0].html).toContain('tail')
  })

  it('drops an unclosed trailing section and ignores stray close tags', () => {
    const closed = slideHtml('S01')
    const html = `</section>${closed}<section class="slide" data-slide-id="S02"><p>never closed`
    const blocks = findSectionBlocks(html)
    expect(blocks).toHaveLength(1)
    expect(blocks[0].html).toBe(closed)
  })

  it('is case-insensitive on the tag name', () => {
    const html = '<SECTION class="slide" data-slide-id="S01">x</SECTION>'
    expect(findSectionBlocks(html)).toHaveLength(1)
  })
})

// ---------------------------------------------------------------------------
// replaceSlideSection
// ---------------------------------------------------------------------------

describe('replaceSlideSection', () => {
  const deck = deckDoc(['S01', 'S02', 'S03'])

  it('replaces exactly the targeted slide, preserving siblings', () => {
    const replacement = slideHtml('S02', 'UPDATED')
    const updated = replaceSlideSection(deck, 'S02', replacement)
    expect(updated).toContain('UPDATED')
    expect(updated).toContain(slideHtml('S01'))
    expect(updated).toContain(slideHtml('S03'))
    expect(findSectionBlocks(updated)).toHaveLength(3)
    expect(updated).not.toContain('<section class="slide" data-slide-id="S02"><h1>Body</h1>')
  })

  it('matches single-quoted and unquoted data-slide-id attributes', () => {
    const single = `<section class='slide' data-slide-id='S07'><p>old</p></section>`
    const unquoted = '<section class="slide" data-slide-id=S08><p>old</p></section>'
    const html = `${single}\n${unquoted}`
    const out1 = replaceSlideSection(html, 'S07', slideHtml('S07', 'NEW7'))
    expect(out1).toContain('NEW7')
    const out2 = replaceSlideSection(html, 'S08', slideHtml('S08', 'NEW8'))
    expect(out2).toContain('NEW8')
  })

  it('does not match a slide whose id merely starts with the requested id', () => {
    const html = `${slideHtml('S10', 'TEN')}\n${slideHtml('S1', 'ONE')}`
    const updated = replaceSlideSection(html, 'S1', slideHtml('S1', 'NEW'))
    expect(updated).toContain('TEN')
    expect(updated).toContain('NEW')
    expect(updated).not.toContain('ONE')
  })

  it('replaces the whole block even when the target contains a nested section', () => {
    const target = '<section class="slide" data-slide-id="S02"><section class="inner">x</section><p>tail</p></section>'
    const html = `${slideHtml('S01')}\n${target}`
    const updated = replaceSlideSection(html, 'S02', slideHtml('S02', 'CLEAN'))
    expect(updated).not.toContain('tail')
    expect(updated).not.toContain('inner')
    expect(updated).toContain('CLEAN')
  })

  it('handles slide ids containing regex metacharacters', () => {
    const id = 'S1.2(a)+b'
    const html = `<section class="slide" data-slide-id="${id}"><p>old</p></section>`
    const updated = replaceSlideSection(html, id, `<section class="slide" data-slide-id="${id}"><p>new</p></section>`)
    expect(updated).toContain('<p>new</p>')
  })

  it('rejects invalid arguments', () => {
    expect(() => replaceSlideSection(null, 'S01', slideHtml('S01'))).toThrow(/html must be a string/)
    expect(() => replaceSlideSection(deck, '', slideHtml('S01'))).toThrow(/slideId must be a non-empty string/)
    expect(() => replaceSlideSection(deck, 'S01', 42)).toThrow(/sectionHtml must be a string/)
  })

  it('rejects replacements that are not exactly one section element', () => {
    expect(() => replaceSlideSection(deck, 'S01', `${slideHtml('S01')}${slideHtml('S02')}`))
      .toThrow(/exactly one <section>/)
    expect(() => replaceSlideSection(deck, 'S01', `${slideHtml('S01')} trailing junk`))
      .toThrow(/exactly one <section>/)
    expect(() => replaceSlideSection(deck, 'S01', '<div>not a section</div>'))
      .toThrow(/exactly one <section>/)
  })

  it('rejects non-slide sections, scripts, and mismatched ids', () => {
    expect(() => replaceSlideSection(deck, 'S01', '<section data-slide-id="S01">x</section>'))
      .toThrow(/must be a <section class="slide">/)
    expect(() => replaceSlideSection(deck, 'S01', '<section class="slide" data-slide-id="S01"><script>x()</script></section>'))
      .toThrow(/must not contain <script>/)
    expect(() => replaceSlideSection(deck, 'S01', slideHtml('S02')))
      .toThrow(/data-slide-id must match "S01"/)
  })

  it('throws when no slide with the id exists', () => {
    expect(() => replaceSlideSection(deck, 'S99', slideHtml('S99')))
      .toThrow(/No section found with data-slide-id="S99"/)
  })
})

// ---------------------------------------------------------------------------
// normalizeReferences
// ---------------------------------------------------------------------------

describe('normalizeReferences', () => {
  it('returns [] for non-arrays', () => {
    expect(normalizeReferences(undefined)).toEqual([])
    expect(normalizeReferences('x')).toEqual([])
    expect(normalizeReferences({})).toEqual([])
  })

  it('normalizes roles, trims fields, drops entries without a path, and dedupes', () => {
    const refs = normalizeReferences([
      { role: 'template', path: ' deck.css ', notes: ' use colors ' },
      { role: 'bogus', path: 'facts.md' },
      { path: 'plain.md' },
      { role: 'source', path: 'facts.md' }, // duplicate of normalized bogus->source
      { role: 'asset', path: '' },
      'not-an-object',
      null,
    ])
    expect(refs).toEqual([
      { role: 'template', path: 'deck.css', notes: 'use colors' },
      { role: 'source', path: 'facts.md', notes: '' },
      { role: 'source', path: 'plain.md', notes: '' },
    ])
  })

  it('keeps the same path under different roles', () => {
    const refs = normalizeReferences([
      { role: 'source', path: 'a.html' },
      { role: 'template', path: 'a.html' },
    ])
    expect(refs.map(r => r.role)).toEqual(['source', 'template'])
  })
})

// ---------------------------------------------------------------------------
// deckSlug
// ---------------------------------------------------------------------------

describe('deckSlug', () => {
  it('builds a lowercase hyphen slug from the first six words', () => {
    expect(deckSlug('Quarterly Update! 2026 Results for the Board of Directors'))
      .toBe('quarterly-update-2026-results-for-the')
  })

  it('falls back to "deck" when nothing survives', () => {
    expect(deckSlug('!!! ??? ***')).toBe('deck')
  })
})

// ---------------------------------------------------------------------------
// Refine prompt builders
// ---------------------------------------------------------------------------

describe('refine prompt builders', () => {
  it('buildRefineSystemPrompt embeds the deck path and template', () => {
    const prompt = buildRefineSystemPrompt('TEMPLATE-MARKER', 'slides/x/deck.html')
    expect(prompt).toContain('slides/x/deck.html')
    expect(prompt).toContain('TEMPLATE-MARKER')
    expect(prompt).toContain('data-slide-id')
  })

  it('buildRefineUserMessage includes context only when provided', () => {
    const withContext = buildRefineUserMessage('make it blue', { brief: 'a deck about blue things' })
    expect(withContext).toContain('INSTRUCTION\nmake it blue')
    expect(withContext).toContain('DECK CONTEXT')
    expect(withContext).toContain('blue things')
    const withoutContext = buildRefineUserMessage('make it blue', null)
    expect(withoutContext).toBe('INSTRUCTION\nmake it blue')
  })
})

// ---------------------------------------------------------------------------
// generateDeck job
// ---------------------------------------------------------------------------

describe('generateDeck', () => {
  it('runs the pipeline end to end and assembles the result', async () => {
    const toolResults = {}
    const { ctx, files, collections } = createFakeCtx({
      runId: 'run123456',
      callModel: async (opts) => {
        toolResults.earlyRender = await getTool(opts, 'render_pdf')()
        toolResults.badWrite = await getTool(opts, 'write_deck')({ html: '<div>not a deck</div>' })
        toolResults.goodWrite = await getTool(opts, 'write_deck')({ html: deckDoc(['S01', 'S02']) })
        toolResults.render = await getTool(opts, 'render_pdf')()
        return { text: 'Deck written.', usage: { output_tokens: 9 } }
      },
    })

    const result = await jobs.generateDeck.run(ctx, {
      brief: 'Quarterly Update! 2026 results for the board of directors',
    })

    // Tool guardrails observed by the agent
    expect(toolResults.earlyRender.error).toMatch(/Write the deck with write_deck/)
    expect(toolResults.badWrite.error).toMatch(/no <section class="slide">/)
    expect(toolResults.goodWrite).toMatchObject({ ok: true, path: 'slides/quarterly-update-2026-results-for-the-run123/deck.html' })
    expect(toolResults.render.ok).toBe(true)

    // Result contract
    expect(result.status).toBe('complete')
    expect(result.clean).toBe(true)
    expect(result.slideCount).toBe(2)
    expect(result.pageCount).toBe(2)
    expect(result.deckDir).toBe('slides/quarterly-update-2026-results-for-the-run123')
    expect(result.summary).toBe('Deck written.')
    expect(result.outputs.map(o => o.kind)).toEqual(['pdf', 'html', 'json'])
    expect(result.outputs.map(o => o.path)).toEqual([result.pdfPath, result.htmlPath, result.planPath])

    // Durable artifacts
    expect(files.get(result.htmlPath)).toContain('data-slide-id="S01"')
    expect(files.has(result.pdfPath)).toBe(true)
    const storedPlan = JSON.parse(files.get(result.planPath))
    expect(storedPlan.brief).toContain('Quarterly Update')

    // Result is persisted in the decks collection under the run id
    expect(collections.get('decks').get('run123456')).toBe(result)
  })

  it('fails gracefully when the agent never writes a deck', async () => {
    const { ctx, collections } = createFakeCtx({
      callModel: async () => ({ text: 'I could not do it.', usage: null }),
    })
    const result = await jobs.generateDeck.run(ctx, { brief: 'a deck' })
    expect(result.status).toBe('failed')
    expect(result.reason).toMatch(/did not produce a deck/)
    expect(collections.get('decks').get(ctx.job.runId)).toBe(result)
  })

  it('rejects an empty brief', async () => {
    const { ctx } = createFakeCtx({})
    await expect(jobs.generateDeck.run(ctx, { brief: '   ' })).rejects.toThrow(/brief is required/)
  })
})

// ---------------------------------------------------------------------------
// generateDeck job — model resolution
// ---------------------------------------------------------------------------

describe('generateDeck model resolution', () => {
  it('rejects unknown model ids', async () => {
    const { ctx } = createFakeCtx({})
    await expect(jobs.generateDeck.run(ctx, { brief: 'a deck', modelId: 'nope' }))
      .rejects.toThrow(/Unknown deck model: nope/)
  })

  it('throws when the registry has no usable model at all', async () => {
    const { ctx } = createFakeCtx({ registry: { models: [], defaults: {} } })
    await expect(jobs.generateDeck.run(ctx, { brief: 'a deck' }))
      .rejects.toThrow(/Unknown deck model/)
  })

  it('falls back to the chat default when no agent default exists', async () => {
    const { ctx } = createFakeCtx({
      registry: {
        models: [
          { id: 'a', model: 'claude-a', provider: 'anthropic', capabilities: { tools: true, text: true } },
          { id: 'b', model: 'claude-b', provider: 'anthropic', capabilities: { tools: true, text: true } },
        ],
        defaults: { chat: ['b'] },
      },
      callModel: async (opts) => {
        await getTool(opts, 'write_deck')({ html: deckDoc(['S01']) })
        await getTool(opts, 'render_pdf')()
        return { text: 'done', usage: null }
      },
    })
    const result = await jobs.generateDeck.run(ctx, { brief: 'a deck' })
    expect(result.techNotes.model).toBe('b')
  })

  it('accepts non-Anthropic models when available', async () => {
    const { ctx } = createFakeCtx({
      registry: {
        models: [{ id: 'gpt-9', model: 'gpt-9', provider: 'openai', capabilities: { tools: true, text: true } }],
        defaults: { agent: ['gpt-9'] },
      },
      callModel: async (opts) => {
        await getTool(opts, 'write_deck')({ html: deckDoc(['S01']) })
        await getTool(opts, 'render_pdf')()
        return { text: 'done', usage: null }
      },
    })
    const result = await jobs.generateDeck.run(ctx, { brief: 'a deck', modelId: 'gpt-9' })
    expect(result.techNotes.model).toBe('gpt-9')
    expect(result.status).toBe('complete')
  })

  it('resolves the default model implicitly when only non-Anthropic models exist', async () => {
    const { ctx } = createFakeCtx({
      registry: {
        models: [{ id: 'gemini-pro', model: 'gemini-pro', provider: 'google', capabilities: { tools: true, text: true } }],
        defaults: { agent: ['gemini-pro'] },
      },
      callModel: async (opts) => {
        await getTool(opts, 'write_deck')({ html: deckDoc(['S01']) })
        await getTool(opts, 'render_pdf')()
        return { text: 'done', usage: null }
      },
    })
    const result = await jobs.generateDeck.run(ctx, { brief: 'a deck' })
    expect(result.techNotes.model).toBe('gemini-pro')
    expect(result.status).toBe('complete')
  })
})

// ---------------------------------------------------------------------------
// generateDeck job — prompt content and tool guards
// ---------------------------------------------------------------------------

describe('generateDeck prompt and tool guards', () => {
  it('passes the template and deck path to the agent system prompt', async () => {
    let systemPrompt = ''
    const { ctx } = createFakeCtx({
      callModel: async (opts) => {
        systemPrompt = opts.system
        await getTool(opts, 'write_deck')({ html: deckDoc(['S01']) })
        await getTool(opts, 'render_pdf')()
        return { text: 'done', usage: null }
      },
    })
    await jobs.generateDeck.run(ctx, { brief: 'test deck' })
    expect(systemPrompt).toContain('section.slide { width: 1280px; height: 720px; }')
    expect(systemPrompt).toContain('slides/test-deck-run123/deck.html')
    expect(systemPrompt).toContain('data-slide-id')
    expect(systemPrompt).toContain('write_deck')
    expect(systemPrompt).toContain('render_pdf')
    expect(systemPrompt).toContain('make_chart')
  })

  it('passes brief, style, and references to the agent user message', async () => {
    let userMessage = ''
    const { ctx } = createFakeCtx({
      files: { 'data.md': '# Some data' },
      callModel: async (opts) => {
        userMessage = opts.messages[0].content
        await getTool(opts, 'write_deck')({ html: deckDoc(['S01']) })
        await getTool(opts, 'render_pdf')()
        return { text: 'done', usage: null }
      },
    })
    await jobs.generateDeck.run(ctx, {
      brief: 'quarterly results',
      style: 'dark theme, minimal',
      references: [{ role: 'source', path: 'data.md' }],
    })
    expect(userMessage).toContain('DECK BRIEF\nquarterly results')
    expect(userMessage).toContain('STYLE AND FORMAT NOTES\ndark theme, minimal')
    expect(userMessage).toContain('# Some data')
  })

  it('returns render limit error after MAX_RENDERS calls', async () => {
    let renderCount = 0
    const { ctx } = createFakeCtx({
      callModel: async (opts) => {
        await getTool(opts, 'write_deck')({ html: deckDoc(['S01']) })
        let result
        for (let i = 0; i < 9; i++) {
          result = await getTool(opts, 'render_pdf')()
          if (result.error) break
          renderCount++
        }
        return { text: `rendered ${renderCount} times, last: ${result.error || 'ok'}`, usage: null }
      },
    })
    const result = await jobs.generateDeck.run(ctx, { brief: 'a deck' })
    expect(renderCount).toBe(8)
    expect(result.summary).toContain('Render limit reached')
  })
})

// ---------------------------------------------------------------------------
// generateDeck job — references
// ---------------------------------------------------------------------------

describe('generateDeck references', () => {
  it('reads text, asset, and docx references and surfaces them to the agent and result', async () => {
    let agentMessage = ''
    let readFileResult = null
    const { ctx } = createFakeCtx({
      files: {
        'notes.md': '# Facts about turtles',
        'logo.png': 'PNGDATA',
        'extra.md': 'extra context',
      },
      docxExtract: async (path) => {
        expect(path).toBe('report.docx')
        return { markdown: 'Docx body text', total_chars: 14, truncated: false }
      },
      callModel: async (opts) => {
        agentMessage = opts.messages[0].content
        readFileResult = await getTool(opts, 'read_file')({ path: 'notes.md' })
        await getTool(opts, 'write_deck')({ html: deckDoc(['S01']) })
        await getTool(opts, 'render_pdf')()
        return { text: 'done', usage: null }
      },
    })

    const result = await jobs.generateDeck.run(ctx, {
      brief: 'turtle deck',
      references: [
        { role: 'source', path: 'notes.md', notes: 'main source' },
        { role: 'asset', path: 'logo.png' },
        { role: 'source', path: 'report.docx' },
        { role: 'source', path: 'notes.md' }, // duplicate, dropped
        { role: 'totally-invalid', path: 'extra.md' }, // coerced to source
      ],
    })

    expect(result.references.map(r => [r.role, r.path, r.contentKind])).toEqual([
      ['source', 'notes.md', 'md'],
      ['asset', 'logo.png', 'asset'],
      ['source', 'report.docx', 'docx'],
      ['source', 'extra.md', 'md'],
    ])
    expect(result.techNotes.reads).toContain('notes.md')
    expect(result.techNotes.reads).toContain('report.docx')
    expect(agentMessage).toContain('# Facts about turtles')
    expect(agentMessage).toContain('Docx body text')
    expect(agentMessage).toContain('Local asset')
    expect(readFileResult).toMatchObject({
      path: 'notes.md',
      contentKind: 'md',
      content: '# Facts about turtles',
      truncated: false,
    })
  })

  it('rejects non-HTML/CSS template references, unsupported types, and missing assets', async () => {
    const make = () => createFakeCtx({ files: { 'notes.txt': 'x' } }).ctx
    await expect(jobs.generateDeck.run(make(), {
      brief: 'a deck',
      references: [{ role: 'template', path: 'notes.txt' }],
    })).rejects.toThrow(/Template references must be HTML or CSS/)

    await expect(jobs.generateDeck.run(make(), {
      brief: 'a deck',
      references: [{ role: 'source', path: 'data.bin' }],
    })).rejects.toThrow(/Unsupported reference file type/)

    await expect(jobs.generateDeck.run(make(), {
      brief: 'a deck',
      references: [{ role: 'asset', path: 'missing.png' }],
    })).rejects.toThrow(/Reference file does not exist/)
  })
})

// ---------------------------------------------------------------------------
// refineDeck job
// ---------------------------------------------------------------------------

describe('refineDeck', () => {
  const deckDir = 'slides/demo'
  const htmlPath = `${deckDir}/deck.html`
  const planPath = `${deckDir}/deck-plan.json`

  function refineFiles(planContent) {
    const files = { [htmlPath]: deckDoc(['S01', 'S02']) }
    if (planContent !== undefined) files[planPath] = planContent
    return files
  }

  it('rejects missing inputs and missing decks', async () => {
    const { ctx } = createFakeCtx({})
    await expect(jobs.refineDeck.run(ctx, { deckDir: '', instruction: 'x' })).rejects.toThrow(/deck directory is required/)
    await expect(jobs.refineDeck.run(ctx, { deckDir, instruction: '  ' })).rejects.toThrow(/refinement instruction is required/)
    await expect(jobs.refineDeck.run(ctx, { deckDir, instruction: 'make it blue' }))
      .rejects.toThrow(`Deck not found at ${htmlPath}`)
  })

  it('applies a surgical edit_slide change and reports the refined result', async () => {
    const toolResults = {}
    const contextJson = JSON.stringify({ brief: 'demo deck', style: '', references: [] })
    const { ctx, files, collections } = createFakeCtx({
      runId: 'refine12345',
      files: refineFiles(contextJson),
      callModel: async (opts) => {
        expect(opts.system).toContain('refinement agent')
        expect(opts.messages[0].content).toContain('INSTRUCTION\nmake slide two pop')
        expect(opts.messages[0].content).toContain('DECK CONTEXT')
        expect(opts.messages[0].content).toContain('demo deck')
        toolResults.read = await getTool(opts, 'read_deck')()
        toolResults.badEdit = await getTool(opts, 'edit_slide')({ slide_id: 'S99', html: slideHtml('S99') })
        toolResults.edit = await getTool(opts, 'edit_slide')({ slide_id: 'S02', html: slideHtml('S02', 'UPDATED') })
        return { text: 'Updated slide 2.', usage: null }
      },
    })

    const result = await jobs.refineDeck.run(ctx, { deckDir, instruction: 'make slide two pop' })

    expect(toolResults.read.content).toContain('data-slide-id="S01"')
    expect(toolResults.badEdit.error).toBe('No slide with data-slide-id="S99". Available ids: S01, S02')
    expect(toolResults.edit).toMatchObject({ ok: true, slide_id: 'S02' })

    expect(result.status).toBe('complete')
    expect(result.clean).toBe(true)
    expect(result.slideCount).toBe(2)
    expect(result.summary).toBe('Updated slide 2.')
    expect(result.refinedFrom).toBe(deckDir)
    expect(result.instruction).toBe('make slide two pop')
    expect(result.techNotes.mode).toBe('refine')
    expect(files.get(htmlPath)).toContain('UPDATED')
    expect(files.get(htmlPath)).toContain(slideHtml('S01'))
    expect(collections.get('decks').get('refine12345')).toBe(result)
  })

  it('completes when the refine agent changes nothing', async () => {
    const { ctx } = createFakeCtx({
      files: refineFiles(),
      callModel: async () => ({ text: 'nothing to do', usage: null }),
    })
    const result = await jobs.refineDeck.run(ctx, { deckDir, instruction: 'noop' })
    expect(result.status).toBe('complete')
  })

  it('tolerates a corrupt deck-plan.json and proceeds without context', async () => {
    const { ctx } = createFakeCtx({
      files: refineFiles('{not valid json'),
      callModel: async (opts) => {
        expect(opts.messages[0].content).not.toContain('DECK CONTEXT')
        await getTool(opts, 'edit_slide')({ slide_id: 'S01', html: slideHtml('S01', 'X') })
        return { text: 'done', usage: null }
      },
    })
    const result = await jobs.refineDeck.run(ctx, { deckDir, instruction: 'tweak' })
    expect(result.status).toBe('complete')
  })
})
