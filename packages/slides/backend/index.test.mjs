import { describe, it, expect } from 'vitest'
import {
  jobs,
  findSectionBlocks,
  replaceSlideSection,
  normalizeReferences,
  extractHtmlDocument,
  deckSlug,
} from './index.mjs'

const FAKE_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Deck</title>
<style>
@page { size: 13.333in 7.5in; margin: 0; }
section.slide { width: 1280px; height: 720px; page-break-after: always; }
</style>
</head>
<body>
<section class="slide" data-slide-id="S01"><h1>Empty slide</h1></section>
</body>
</html>`

function slideHtml(id, body = 'Body') {
  return `<section class="slide" data-slide-id="${id}"><h1>${body}</h1></section>`
}

function deckDoc(ids) {
  return `<!DOCTYPE html><html><head><style>section.slide{page-break-after:always}</style></head><body>\n${ids.map(id => slideHtml(id)).join('\n')}\n</body></html>`
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
      callModel: overrides.callModel || (async () => ({ text: deckDoc(['S01']), usage: null })),
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
          case 'ai.registry':
            return registry
          case 'render.htmlToPdf': {
            if (overrides.renderResult) return overrides.renderResult(params, files)
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

describe('extractHtmlDocument', () => {
  it('extracts fenced HTML and rejects scripts', () => {
    expect(extractHtmlDocument(`Here:\n\`\`\`html\n${deckDoc(['S01'])}\n\`\`\``)).toContain('<!DOCTYPE html>')
    expect(() => extractHtmlDocument('<html><body><script>x()</script><section class="slide"></section></body></html>'))
      .toThrow(/script/)
  })

  it('rejects executable attributes and remote resources', () => {
    expect(() => extractHtmlDocument('<html><body><section class="slide" onclick="x()"></section></body></html>'))
      .toThrow(/event handler/)
    expect(() => extractHtmlDocument('<html><body><section class="slide"><img src="https://example.com/a.png"></section></body></html>'))
      .toThrow(/remote URL/)
    expect(() => extractHtmlDocument('<html><head><style>@import "theme.css";</style></head><body><section class="slide"></section></body></html>'))
      .toThrow(/@import/)
  })

  it('requires slide sections', () => {
    expect(() => extractHtmlDocument('<html><body><p>No deck</p></body></html>')).toThrow(/section\.slide/)
  })
})

describe('generateDeck', () => {
  it('writes normal deck files, calls the model once without tools, and renders once', async () => {
    let modelInput = null
    const { ctx, files, collections, toolCalls } = createFakeCtx({
      runId: 'run123456',
      files: { 'data.md': '# Source data' },
      callModel: async (input) => {
        modelInput = input
        return { text: deckDoc(['S01', 'S02']), usage: { input: 100, output: 40 } }
      },
    })

    const result = await jobs.generateDeck.run(ctx, {
      brief: 'Quarterly Update! 2026 results for the board of directors',
      style: 'quiet, editorial',
      references: [{ role: 'source', path: 'data.md' }],
    })

    expect(modelInput.tools).toBeUndefined()
    expect(modelInput.maxSteps).toBe(1)
    expect(modelInput.messages[0].content).toContain('# Source data')
    expect(modelInput.messages[0].content).toContain('template/deck.html')

    expect(result.status).toBe('complete')
    expect(result.clean).toBe(true)
    expect(result.slideCount).toBe(2)
    expect(result.pageCount).toBe(2)
    expect(result.deckDir).toBe('slides/quarterly-update-2026-results-for-the-run123')
    expect(result.outputs.map(o => o.kind)).toEqual(['pdf', 'html', 'json', 'markdown'])

    expect(files.get(result.htmlPath)).toContain('data-slide-id="S01"')
    expect(files.get(result.briefPath)).toContain('Quarterly Update')
    expect(files.get(result.planPath)).toContain('"mode": "single-pass"')
    expect(files.has(result.pdfPath)).toBe(true)
    expect(collections.get('decks').get('run123456')).toBe(result)

    expect(toolCalls.filter(([name]) => name === 'render.htmlToPdf')).toHaveLength(1)
    expect(toolCalls.some(([name]) => name === 'fs.write')).toBe(true)
  })

  it('returns layout issues after one render and does not retry or repair', async () => {
    const { ctx, toolCalls } = createFakeCtx({
      callModel: async () => ({ text: deckDoc(['S01']), usage: null }),
      renderResult: (params, files) => {
        files.set(params.output_path, '%PDF one page')
        return {
          ok: false,
          slide_count: 1,
          page_count: 1,
          issues: [{ slide: 1, type: 'overflow-y', detail: 'content is too tall' }],
          warnings: [],
        }
      },
    })

    const result = await jobs.generateDeck.run(ctx, { brief: 'dense deck' })

    expect(result.status).toBe('complete')
    expect(result.clean).toBe(false)
    expect(result.issues).toHaveLength(1)
    expect(result.summary).toContain('layout issue')
    expect(toolCalls.filter(([name]) => name === 'render.htmlToPdf')).toHaveLength(1)
  })

  it('rejects an empty brief before any model call', async () => {
    const { ctx, toolCalls } = createFakeCtx({})
    await expect(jobs.generateDeck.run(ctx, { brief: '   ' })).rejects.toThrow(/brief is required/)
    expect(toolCalls).toEqual([])
  })

  it('accepts any configured text model selected by id', async () => {
    const { ctx } = createFakeCtx({
      registry: {
        models: [{ id: 'gpt-9', model: 'gpt-9', provider: 'openai', capabilities: { tools: true, text: true } }],
        defaults: { agent: ['gpt-9'] },
      },
      callModel: async (input) => {
        expect(input.modelId).toBe('gpt-9')
        return { text: deckDoc(['S01']), usage: null }
      },
    })
    const result = await jobs.generateDeck.run(ctx, { brief: 'a deck', modelId: 'gpt-9' })
    expect(result.techNotes.model).toBe('gpt-9')
  })
})

describe('refineDeck', () => {
  const deckDir = 'slides/demo'
  const htmlPath = `${deckDir}/deck.html`

  it('rewrites the deck with one model call and one final render', async () => {
    let modelInput = null
    const { ctx, files, toolCalls } = createFakeCtx({
      runId: 'refine12345',
      files: { [htmlPath]: deckDoc(['S01', 'S02']) },
      callModel: async (input) => {
        modelInput = input
        return { text: deckDoc(['S01', 'S02', 'S03']), usage: { input: 10, output: 20 } }
      },
    })

    const result = await jobs.refineDeck.run(ctx, { deckDir, instruction: 'add a closing slide' })

    expect(modelInput.tools).toBeUndefined()
    expect(modelInput.maxSteps).toBe(1)
    expect(modelInput.messages[0].content).toContain('CURRENT DECK HTML')
    expect(result.status).toBe('complete')
    expect(result.slideCount).toBe(3)
    expect(result.refinedFrom).toBe(deckDir)
    expect(files.get(htmlPath)).toContain('data-slide-id="S03"')
    expect(toolCalls.filter(([name]) => name === 'render.htmlToPdf')).toHaveLength(1)
  })

  it('rejects missing inputs and missing decks', async () => {
    const { ctx } = createFakeCtx({})
    await expect(jobs.refineDeck.run(ctx, { deckDir: '', instruction: 'x' })).rejects.toThrow(/deck directory is required/)
    await expect(jobs.refineDeck.run(ctx, { deckDir, instruction: '  ' })).rejects.toThrow(/refinement instruction is required/)
    await expect(jobs.refineDeck.run(ctx, { deckDir, instruction: 'make it blue' }))
      .rejects.toThrow(`Deck not found at ${htmlPath}`)
  })
})

describe('normalizeReferences', () => {
  it('normalizes roles, trims fields, drops entries without a path, and dedupes', () => {
    expect(normalizeReferences([
      { role: 'template', path: ' deck.css ', notes: ' use colors ' },
      { role: 'bogus', path: 'facts.md' },
      { path: 'plain.md' },
      { role: 'source', path: 'facts.md' },
      { role: 'asset', path: '' },
      'not-an-object',
      null,
    ])).toEqual([
      { role: 'template', path: 'deck.css', notes: 'use colors' },
      { role: 'source', path: 'facts.md', notes: '' },
      { role: 'source', path: 'plain.md', notes: '' },
    ])
  })
})

describe('deckSlug', () => {
  it('builds a lowercase hyphen slug from the first six words', () => {
    expect(deckSlug('Quarterly Update! 2026 Results for the Board of Directors'))
      .toBe('quarterly-update-2026-results-for-the')
  })

  it('falls back to "deck" when nothing survives', () => {
    expect(deckSlug('!!! ??? ***')).toBe('deck')
  })
})

describe('findSectionBlocks and replaceSlideSection', () => {
  it('keeps nested sections inside a single top-level block', () => {
    const html = '<section class="slide" data-slide-id="S01"><section class="inner"><p>x</p></section><p>tail</p></section>'
    const blocks = findSectionBlocks(html)
    expect(blocks).toHaveLength(1)
    expect(blocks[0].html).toContain('tail')
  })

  it('replaces exactly the targeted slide', () => {
    const deck = deckDoc(['S01', 'S02', 'S03'])
    const updated = replaceSlideSection(deck, 'S02', slideHtml('S02', 'UPDATED'))
    expect(updated).toContain('UPDATED')
    expect(updated).toContain(slideHtml('S01'))
    expect(updated).toContain(slideHtml('S03'))
    expect(updated).not.toContain('<section class="slide" data-slide-id="S02"><h1>Body</h1>')
  })
})
