import { describe, expect, it } from 'vitest'

describe('slides package backend contracts', () => {
  it('normalizes structured file references for deck jobs', async () => {
    const backend = await import('../backend/index.mjs') as any

    expect(backend.normalizeReferences([
      { role: 'template', path: 'templates/client.html', notes: 'Use visual system' },
      { role: 'unknown', path: 'reports/source.md' },
      { role: 'source', path: 'reports/source.md' },
      { role: 'asset', path: '' },
    ])).toEqual([
      { role: 'template', path: 'templates/client.html', notes: 'Use visual system' },
      { role: 'source', path: 'reports/source.md', notes: '' },
    ])
  })

  it('declares generation, refinement, and render jobs', async () => {
    const backend = await import('../backend/index.mjs') as any

    expect(backend.jobs.generateDeck.inputSchema.properties.references.type).toBe('array')
    expect(backend.jobs.refineDeck.inputSchema.required).toEqual(['deckDir', 'instruction'])
    expect(backend.jobs.renderDeck.inputSchema.required).toEqual(['deckDir'])
  })

  it('extracts complete HTML from a model response', async () => {
    const backend = await import('../backend/index.mjs') as any
    const html = '<!DOCTYPE html><html><body><section class="slide" data-slide-id="S01"></section></body></html>'

    expect(backend.extractHtmlDocument(`\`\`\`html\n${html}\n\`\`\``)).toBe(html)
    expect(() => backend.extractHtmlDocument('<html><body>No slides</body></html>')).toThrow('section.slide')
    expect(() => backend.extractHtmlDocument('<html><body><script>x()</script><section class="slide"></section></body></html>')).toThrow('script')
  })

  describe('replaceSlideSection', () => {
    async function getReplaceSlideSection() {
      const backend = await import('../backend/index.mjs') as any
      return backend.replaceSlideSection as (html: string, slideId: string, sectionHtml: string) => string
    }

    const deckHtml = `<!DOCTYPE html><html><body>
<section class="slide" data-slide-id="S01"><h1>Intro</h1></section>
<section class="slide" data-slide-id="S02"><h1>Middle</h1></section>
<section class="slide" data-slide-id="S03"><h1>End</h1></section>
</body></html>`

    it('replaces the matching slide section by id', async () => {
      const replaceSlideSection = await getReplaceSlideSection()
      const newSection = '<section class="slide" data-slide-id="S02"><h1>Updated</h1></section>'
      const result = replaceSlideSection(deckHtml, 'S02', newSection)
      expect(result).toContain('<h1>Updated</h1>')
      expect(result).toContain('data-slide-id="S01"')
      expect(result).toContain('data-slide-id="S03"')
      expect(result).not.toContain('<h1>Middle</h1>')
    })

    it('throws on unknown slide id', async () => {
      const replaceSlideSection = await getReplaceSlideSection()
      const newSection = '<section class="slide" data-slide-id="S99"><h1>X</h1></section>'
      expect(() => replaceSlideSection(deckHtml, 'S99', newSection)).toThrow('No section found')
    })

    it('replaces a slide containing a nested section without orphaning content', async () => {
      const replaceSlideSection = await getReplaceSlideSection()
      const nestedDeck = [
        '<body>',
        '<section class="slide" data-slide-id="S01"><section class="callout"><p>Note</p></section><p>Tail</p></section>',
        '<section class="slide" data-slide-id="S02"><h1>Two</h1></section>',
        '</body>',
      ].join('\n')
      const newSection = '<section class="slide" data-slide-id="S01"><h1>Replaced</h1></section>'
      const result = replaceSlideSection(nestedDeck, 'S01', newSection)
      expect(result).toContain('<h1>Replaced</h1>')
      expect(result).not.toContain('Tail')
      expect(result).not.toContain('callout')
      expect(result).toContain('<h1>Two</h1>')
    })
  })

  describe('deckCapableModels', () => {
    it('filters to models with text capability regardless of provider or tool support', async () => {
      const backend = await import('../backend/index.mjs') as any
      const models = [
        { id: 'a', provider: 'anthropic', capabilities: { tools: true, text: true } },
        { id: 'b', provider: 'openai', capabilities: { tools: false, text: true } },
        { id: 'c', provider: 'google', capabilities: { text: false } },
        { id: 'd', provider: 'anthropic', capabilities: {} },
      ]
      const result = backend.deckCapableModels(models)
      expect(result.map((m: any) => m.id)).toEqual(['a', 'b', 'd'])
    })
  })
})
