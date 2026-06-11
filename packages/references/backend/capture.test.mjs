import { describe, expect, it } from 'vitest'
import {
  FULLTEXT_DIR,
  PDF_PROVENANCE_DIR,
  captureDoi,
  capturePaste,
  capturePdf,
  MANAGED_BIB_PATH,
  META_PATH,
} from './index.mjs'
import { resolveDoi, searchBibliographic } from './doi.mjs'
import { parseBibtex, serializeBibtex } from './bib.mjs'

function memoryData() {
  const kv = new Map()
  return {
    kv: {
      async get(key) {
        return kv.has(key) ? structuredClone(kv.get(key)) : null
      },
      async set(key, value) {
        kv.set(key, structuredClone(value))
      },
    },
  }
}

function response(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return body
    },
    async text() {
      return typeof body === 'string' ? body : JSON.stringify(body)
    },
    headers: { get: () => null },
  }
}

function scriptedHttp(routes) {
  const calls = []
  return {
    calls,
    async request(input) {
      calls.push(input)
      const route = routes.find(item => item.match(input.url, input))
      if (!route) throw new Error(`No route for ${input.url}`)
      return response(route.status ?? 200, typeof route.body === 'function' ? route.body(input) : route.body)
    },
  }
}

function createCtx({ files = {}, http, pdfExtract, aiObject } = {}) {
  const store = new Map(Object.entries(files))
  let activeBibPath = MANAGED_BIB_PATH
  const progress = { steps: [], done: null }
  return {
    files: store,
    data: memoryData(),
    http: http || scriptedHttp([]),
    ai: {
      async generateObject() {
        return { object: structuredClone(aiObject || { references: [] }) }
      },
    },
    documents: {
      pdf: {
        async extract(path) {
          if (!pdfExtract) throw new Error('No PDF extraction scripted')
          return typeof pdfExtract === 'function' ? pdfExtract(path) : structuredClone(pdfExtract)
        },
      },
    },
    progress: {
      async step(title) {
        progress.steps.push(title)
      },
      async done(result) {
        progress.done = result
      },
      records: progress,
    },
    tools: {
      async call(name, params = {}) {
        switch (name) {
          case 'references.readBib': {
            const path = params.path || activeBibPath
            const content = store.get(path)
            if (content === undefined) return { path, exists: false, references: [], duplicateKeys: [] }
            return {
              path,
              exists: true,
              references: parseBibtex(content).map(entry => ({ key: entry.key, type: entry.type, fields: entry.fields })),
              duplicateKeys: [],
            }
          }
          case 'references.setBibliographyPath':
            if (!store.has(params.path)) throw new Error(`Bibliography file does not exist: ${params.path}`)
            activeBibPath = params.path
            return { path: activeBibPath }
          case 'fs.read':
            if (!store.has(params.path)) throw new Error(`File not found: ${params.path}`)
            return { content: store.get(params.path), truncated: false }
          case 'fs.write':
            store.set(params.path, params.content)
            return { written: params.path }
          case 'fs.mkdir':
            return { path: params.path }
          case 'fs.copy':
            if (!store.has(params.path)) throw new Error(`File not found: ${params.path}`)
            store.set(params.new_path, store.get(params.path))
            return { copied: params.new_path }
          case 'fs.rename':
            if (typeof params.old_path !== 'string') throw new Error('old_path must be a string')
            if (!store.has(params.old_path)) throw new Error(`File not found: ${params.old_path}`)
            store.set(params.new_path, store.get(params.old_path))
            store.delete(params.old_path)
            return { renamed: params.new_path }
          default:
            throw new Error(`Unexpected tool call: ${name}`)
        }
      },
    },
  }
}

function crossrefWork(overrides = {}) {
  return {
    DOI: '10.1000/abc',
    title: ['A DOI Paper'],
    author: [{ family: 'Smith', given: 'Jane' }],
    issued: { 'date-parts': [[2024]] },
    'container-title': ['Value Health'],
    type: 'journal-article',
    ...overrides,
  }
}

describe('references capture jobs', () => {
  it('resolves a DOI through CrossRef', async () => {
    const http = scriptedHttp([
      { match: url => url.includes('/works/10.1000%2Fabc'), body: { message: crossrefWork() } },
    ])
    const result = await resolveDoi({ http }, 'https://doi.org/10.1000/ABC')

    expect(result).toMatchObject({ source: 'crossref', confidence: 'verified' })
    expect(result.entry.fields).toMatchObject({
      title: 'A DOI Paper',
      author: 'Smith, Jane',
      year: '2024',
      doi: '10.1000/abc',
      journal: 'Value Health',
    })
  })

  it('falls back to doi.org CSL JSON when CrossRef misses', async () => {
    const http = scriptedHttp([
      { match: url => url.includes('api.crossref.org'), status: 404, body: {} },
      {
        match: url => url.includes('doi.org'),
        body: {
          type: 'article-journal',
          title: 'Fallback Paper',
          DOI: '10.2000/fallback',
          author: [{ family: 'Doe', given: 'Pat' }],
          issued: { 'date-parts': [[2023]] },
        },
      },
    ])

    const result = await resolveDoi({ http }, '10.2000/fallback')
    expect(result.source).toBe('doi.org')
    expect(result.entry.fields.title).toBe('Fallback Paper')
  })

  it('uses OpenAlex as a title-search backstop when CrossRef search is empty', async () => {
    const http = scriptedHttp([
      { match: url => url.includes('api.crossref.org/works?'), body: { message: { items: [] } } },
      {
        match: url => url.includes('api.openalex.org/works?'),
        body: {
          results: [{
            title: 'OpenAlex Paper',
            doi: '10.3000/open',
            publication_year: 2022,
            authorships: [{ author: { display_name: 'Ada Lovelace' } }],
            primary_location: { source: { display_name: 'Open Journal' } },
          }],
        },
      },
    ])

    const results = await searchBibliographic({ http }, 'OpenAlex Paper')
    expect(results[0].source).toBe('openalex-search')
    expect(results[0].entry.fields).toMatchObject({ title: 'OpenAlex Paper', author: 'Lovelace, Ada' })
  })

  it('captures a DOI into the managed bibliography', async () => {
    const ctx = createCtx({
      http: scriptedHttp([
        { match: url => url.includes('/works/10.1000%2Fabc'), body: { message: crossrefWork() } },
      ]),
    })

    const result = await captureDoi(ctx, { doi: '10.1000/abc' })

    expect(result).toEqual({ key: 'smith2024', added: true })
    expect(parseBibtex(ctx.files.get(MANAGED_BIB_PATH))[0].fields.title).toBe('A DOI Paper')
    expect(ctx.progress.records.done).toEqual(result)
  })

  it('captures a PDF by DOI, attaches the staged file, and records metadata', async () => {
    const ctx = createCtx({
      files: { 'references/pdf/staged.pdf': '%PDF' },
      pdfExtract: { text: 'Published as doi:10.1000/abc', pages: 1, total_chars: 28, info: {} },
      http: scriptedHttp([
        { match: url => url.includes('/works/10.1000%2Fabc'), body: { message: crossrefWork() } },
      ]),
    })

    const result = await capturePdf(ctx, { path: 'references/pdf/staged.pdf' })

    expect(result).toMatchObject({ key: 'smith2024', added: true, pdfPath: 'references/pdf/smith2024.pdf' })
    expect(ctx.files.get('references/pdf/smith2024.pdf')).toBe('%PDF')
    expect(parseBibtex(ctx.files.get(MANAGED_BIB_PATH))[0].fields.file).toBe('pdf/smith2024.pdf')
    expect(ctx.files.get(`${FULLTEXT_DIR}/smith2024.txt`)).toBe('Published as doi:10.1000/abc')
    const meta = JSON.parse(ctx.files.get(META_PATH)).entries.smith2024
    expect(meta.fulltextPath).toBe(`${FULLTEXT_DIR}/smith2024.txt`)
    expect(meta.pdfProvenancePath).toBe(`${PDF_PROVENANCE_DIR}/smith2024.json`)
    const provenance = JSON.parse(ctx.files.get(`${PDF_PROVENANCE_DIR}/smith2024.json`))
    expect(provenance.selected).toMatchObject({ method: 'doi', doi: '10.1000/abc', needsReview: false })
    expect(provenance.doiCandidates[0]).toMatchObject({ doi: '10.1000/abc', source: 'text' })
  })

  it('captures a PDF by metadata DOI before falling back to text title guesses', async () => {
    const ctx = createCtx({
      files: { 'uploads/metadata.pdf': '%PDF' },
      pdfExtract: {
        text: 'Downloaded from publisher page\nA misleading header',
        pages: 1,
        info: { Subject: 'Official version: https://doi.org/10.1000/abc' },
      },
      http: scriptedHttp([
        { match: url => url.includes('/works/10.1000%2Fabc'), body: { message: crossrefWork() } },
      ]),
    })

    const result = await capturePdf(ctx, { path: 'uploads/metadata.pdf' })
    const provenance = JSON.parse(ctx.files.get(`${PDF_PROVENANCE_DIR}/${result.key}.json`))

    expect(result.needsReview).toBe(false)
    expect(provenance.selected).toMatchObject({ method: 'doi', doi: '10.1000/abc' })
    expect(provenance.doiCandidates[0].source).toBe('metadata.Subject')
  })

  it('captures a PDF by title search and flags it for review', async () => {
    const ctx = createCtx({
      files: { 'uploads/no-doi.pdf': '%PDF' },
      pdfExtract: { text: 'Title Without DOI\nAuthors', pages: 1, info: {} },
      http: scriptedHttp([
        { match: url => url.includes('api.crossref.org/works?'), body: { message: { items: [crossrefWork({ DOI: '10.1000/title', title: ['Title Without DOI'] })] } } },
      ]),
    })

    const result = await capturePdf(ctx, { path: 'uploads/no-doi.pdf' })

    expect(result.needsReview).toBe(true)
    const meta = JSON.parse(ctx.files.get(META_PATH)).entries[result.key]
    expect(meta.needsReview).toBe(true)
    expect(meta.pdfCapture).toMatchObject({ method: 'title-search', title: 'Title Without DOI' })
  })

  it('records title-search alternatives in PDF provenance', async () => {
    const ctx = createCtx({
      files: { 'uploads/ambiguous.pdf': '%PDF' },
      pdfExtract: { text: 'Ambiguous Study Title', pages: 1, info: {} },
      http: scriptedHttp([
        {
          match: url => url.includes('api.crossref.org/works?'),
          body: {
            message: {
              items: [
                crossrefWork({ DOI: '10.1000/first', title: ['Ambiguous Study Title'], author: [{ family: 'First', given: 'A' }] }),
                crossrefWork({ DOI: '10.1000/second', title: ['Ambiguous Study Title'], author: [{ family: 'Second', given: 'B' }] }),
              ],
            },
          },
        },
      ]),
    })

    const result = await capturePdf(ctx, { path: 'uploads/ambiguous.pdf' })
    const provenance = JSON.parse(ctx.files.get(`${PDF_PROVENANCE_DIR}/${result.key}.json`))

    expect(provenance.selected.method).toBe('title-search')
    expect(provenance.selected.alternatives).toHaveLength(1)
    expect(provenance.selected.alternatives[0].match.doi).toBe('10.1000/second')
  })

  it('uses AI PDF metadata only after deterministic evidence fails', async () => {
    const ctx = createCtx({
      files: { 'uploads/ai.pdf': '%PDF' },
      pdfExtract: { text: 'Downloaded from publisher page\nAbstract', pages: 1, info: {} },
      aiObject: { title: 'AI Found Paper', DOI: '10.1000/ai' },
      http: scriptedHttp([
        { match: url => url.includes('/works/10.1000%2Fai'), body: { message: crossrefWork({ DOI: '10.1000/ai', title: ['AI Found Paper'] }) } },
      ]),
    })

    const result = await capturePdf(ctx, { path: 'uploads/ai.pdf' })
    const meta = JSON.parse(ctx.files.get(META_PATH)).entries[result.key]

    expect(result.needsReview).toBe(false)
    expect(meta.source).toBe('pdf-ai-doi')
    expect(meta.pdfCapture).toMatchObject({ method: 'ai-doi', doi: '10.1000/ai' })
  })

  it('captures pasted references through AI parse then DOI/title enrichment', async () => {
    const ctx = createCtx({
      aiObject: {
        references: [
          { title: 'A DOI Paper', DOI: '10.1000/abc' },
          { title: 'Title Only', author: [{ family: 'Team' }], issued: { 'date-parts': [[2020]] } },
        ],
      },
      http: scriptedHttp([
        { match: url => url.includes('/works/10.1000%2Fabc'), body: { message: crossrefWork() } },
        { match: url => url.includes('api.crossref.org/works?'), body: { message: { items: [crossrefWork({ DOI: '10.1000/titleonly', title: ['Title Only'] })] } } },
      ]),
    })

    const result = await capturePaste(ctx, { text: 'Smith... Team...' })

    expect(result.added).toBe(2)
    expect(result.results.map(item => item.status)).toEqual(['added', 'added'])
    expect(parseBibtex(ctx.files.get(MANAGED_BIB_PATH)).map(entry => entry.fields.title)).toEqual(['A DOI Paper', 'Title Only'])
  })
})
