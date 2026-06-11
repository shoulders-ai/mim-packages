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

  it('declares reference inputs', async () => {
    const backend = await import('../backend/index.mjs') as any
    const schema = backend.jobs.generateDeck.inputSchema

    expect(schema.properties.references.type).toBe('array')
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

    it('throws when replacement has wrong id', async () => {
      const replaceSlideSection = await getReplaceSlideSection()
      const newSection = '<section class="slide" data-slide-id="S03"><h1>Wrong</h1></section>'
      expect(() => replaceSlideSection(deckHtml, 'S02', newSection)).toThrow('data-slide-id must match')
    })

    it('throws when replacement has no slide class', async () => {
      const replaceSlideSection = await getReplaceSlideSection()
      const newSection = '<section data-slide-id="S02"><h1>No class</h1></section>'
      expect(() => replaceSlideSection(deckHtml, 'S02', newSection)).toThrow('section class="slide"')
    })

    it('throws when replacement contains script', async () => {
      const replaceSlideSection = await getReplaceSlideSection()
      const newSection = '<section class="slide" data-slide-id="S02"><script>alert(1)</script></section>'
      expect(() => replaceSlideSection(deckHtml, 'S02', newSection)).toThrow('script')
    })

    it('throws when replacement has multiple sections', async () => {
      const replaceSlideSection = await getReplaceSlideSection()
      const newSection = '<section class="slide" data-slide-id="S02"><h1>A</h1></section><section class="slide" data-slide-id="S02"><h1>B</h1></section>'
      expect(() => replaceSlideSection(deckHtml, 'S02', newSection)).toThrow('exactly one')
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

    it('matches unquoted data-slide-id attribute values', async () => {
      const replaceSlideSection = await getReplaceSlideSection()
      const unquotedDeck = '<body><section class="slide" data-slide-id=S01><h1>One</h1></section></body>'
      const newSection = '<section class="slide" data-slide-id="S01"><h1>New</h1></section>'
      const result = replaceSlideSection(unquotedDeck, 'S01', newSection)
      expect(result).toContain('<h1>New</h1>')
      expect(result).not.toContain('<h1>One</h1>')
    })
  })

  describe('findSectionBlocks', () => {
    async function getFindSectionBlocks() {
      const backend = await import('../backend/index.mjs') as any
      return backend.findSectionBlocks as (html: string) => Array<{ start: number; end: number; html: string }>
    }

    it('returns top-level section blocks with nested sections fully included', async () => {
      const findSectionBlocks = await getFindSectionBlocks()
      const html = '<p>x</p><section class="slide"><section class="inner"><p>a</p></section><p>b</p></section><section class="slide"><p>c</p></section>'
      const blocks = findSectionBlocks(html)
      expect(blocks).toHaveLength(2)
      expect(blocks[0].html).toContain('<p>b</p>')
      expect(blocks[0].html).toContain('class="inner"')
      expect(blocks[1].html).toBe('<section class="slide"><p>c</p></section>')
    })

    it('drops an unclosed trailing section instead of corrupting the scan', async () => {
      const findSectionBlocks = await getFindSectionBlocks()
      const html = '<section class="slide"><p>a</p></section><section class="slide"><p>open'
      const blocks = findSectionBlocks(html)
      expect(blocks).toHaveLength(1)
      expect(blocks[0].html).toBe('<section class="slide"><p>a</p></section>')
    })
  })

  describe('deckCapableModels', () => {
    it('filters to models with tools and text capabilities regardless of provider', async () => {
      const backend = await import('../backend/index.mjs') as any
      const models = [
        { id: 'a', provider: 'anthropic', capabilities: { tools: true, text: true } },
        { id: 'b', provider: 'openai', capabilities: { tools: true, text: true } },
        { id: 'c', provider: 'anthropic', capabilities: { tools: false, text: true } },
        { id: 'd', provider: 'anthropic', capabilities: { tools: true, text: false } },
        { id: 'e', provider: 'anthropic', capabilities: {} },
      ]
      const result = backend.deckCapableModels(models)
      expect(result.map((m: any) => m.id)).toEqual(['a', 'b', 'e'])
    })

    it('returns empty array for non-array input', async () => {
      const backend = await import('../backend/index.mjs') as any
      expect(backend.deckCapableModels(null)).toEqual([])
      expect(backend.deckCapableModels(undefined)).toEqual([])
    })
  })

  describe('refineDeck job', () => {
    it('is declared with required deckDir and instruction inputs', async () => {
      const backend = await import('../backend/index.mjs') as any
      expect(backend.jobs.refineDeck).toBeDefined()
      expect(backend.jobs.refineDeck.label).toBe('Refine deck')
      const schema = backend.jobs.refineDeck.inputSchema
      expect(schema.properties.deckDir.type).toBe('string')
      expect(schema.properties.instruction.type).toBe('string')
      expect(schema.required).toContain('deckDir')
      expect(schema.required).toContain('instruction')
    })

    it('has an optional modelId input', async () => {
      const backend = await import('../backend/index.mjs') as any
      const schema = backend.jobs.refineDeck.inputSchema
      expect(schema.properties.modelId.type).toBe('string')
      expect(schema.required).not.toContain('modelId')
    })

    it('exports a run function', async () => {
      const backend = await import('../backend/index.mjs') as any
      expect(typeof backend.jobs.refineDeck.run).toBe('function')
    })
  })

  describe('buildRefineSystemPrompt', () => {
    it('includes the html path and instruction context', async () => {
      const backend = await import('../backend/index.mjs') as any
      const prompt = backend.buildRefineSystemPrompt('<template/>', 'slides/test/deck.html')
      expect(prompt).toContain('slides/test/deck.html')
      expect(prompt).toContain('refinement')
      expect(prompt).toContain('read_deck')
      expect(prompt).toContain('edit_slide')
      expect(prompt).toContain('make_chart')
    })
  })

  describe('buildRefineUserMessage', () => {
    it('includes the instruction', async () => {
      const backend = await import('../backend/index.mjs') as any
      const msg = backend.buildRefineUserMessage('change slide 3', null)
      expect(msg).toContain('change slide 3')
      expect(msg).toContain('INSTRUCTION')
    })

    it('includes deck context when available', async () => {
      const backend = await import('../backend/index.mjs') as any
      const context = { brief: 'Test deck', style: 'minimal' }
      const msg = backend.buildRefineUserMessage('fix it', context)
      expect(msg).toContain('DECK CONTEXT')
      expect(msg).toContain('Test deck')
    })

    it('omits context section when null', async () => {
      const backend = await import('../backend/index.mjs') as any
      const msg = backend.buildRefineUserMessage('fix it', null)
      expect(msg).not.toContain('DECK CONTEXT')
    })
  })
})
