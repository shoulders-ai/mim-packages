import { describe, expect, it } from 'vitest'
import {
  MANAGED_BIB_PATH,
  META_PATH,
  addReference,
  attachPdf,
  importReferences,
  readLibrary,
  referencesAgentContext,
  searchReferences,
  setLibraryMode,
  tools,
} from './index.mjs'
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
      async delete(key) {
        kv.delete(key)
      },
      async keys() {
        return [...kv.keys()]
      },
    },
    collection() {
      throw new Error('collections are not used in these tests')
    },
  }
}

function createCtx(files = {}) {
  const store = new Map(Object.entries(files))
  const calls = []
  let activeBibPath = MANAGED_BIB_PATH
  return {
    files: store,
    calls,
    data: memoryData(),
    tools: {
      async call(name, params = {}) {
        calls.push([name, params])
        switch (name) {
          case 'references.readBib': {
            const path = params.path || activeBibPath
            const content = store.get(path)
            if (content === undefined) return { path, exists: false, references: [], duplicateKeys: [] }
            const entries = parseBibtex(content)
            return {
              path,
              exists: true,
              references: entries.map(entry => ({ key: entry.key, type: entry.type, fields: entry.fields })),
              duplicateKeys: [],
            }
          }
          case 'references.setBibliographyPath': {
            if (!String(params.path || '').endsWith('.bib')) throw new Error('Expected a .bib file')
            if (!store.has(params.path)) throw new Error(`Bibliography file does not exist: ${params.path}`)
            activeBibPath = params.path
            return { path: activeBibPath }
          }
          case 'fs.read': {
            if (!store.has(params.path)) throw new Error(`File not found: ${params.path}`)
            return { content: store.get(params.path), truncated: false }
          }
          case 'fs.write':
            store.set(params.path, params.content)
            return { written: params.path }
          case 'fs.exists':
            return { exists: store.has(params.path) || [...store.keys()].some(path => path.startsWith(`${params.path}/`)) }
          case 'fs.mkdir':
            return { path: params.path }
          case 'fs.copy':
            if (!store.has(params.path)) throw new Error(`File not found: ${params.path}`)
            if (store.has(params.new_path)) throw new Error(`Path already exists: ${params.new_path}`)
            store.set(params.new_path, store.get(params.path))
            return { copied: params.new_path }
          case 'fs.rename':
            if (typeof params.old_path !== 'string') throw new Error('old_path must be a string')
            if (!store.has(params.old_path)) throw new Error(`File not found: ${params.old_path}`)
            if (store.has(params.new_path)) throw new Error(`Path already exists: ${params.new_path}`)
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

function bib(entries) {
  return serializeBibtex(entries)
}

describe('references package backend', () => {
  it('declares the five named public tool descriptors', () => {
    expect(Object.values(tools).map(tool => tool.name).sort()).toEqual([
      'references.add',
      'references.attach_pdf',
      'references.get',
      'references.import',
      'references.search',
    ])
  })

  it('reads the managed library through core references.readBib', async () => {
    const ctx = createCtx({
      [MANAGED_BIB_PATH]: bib([{ type: 'article', key: 'smith2024', fields: { title: 'A', year: '2024' } }]),
    })

    const library = await readLibrary(ctx)
    expect(library.entries.map(entry => entry.key)).toEqual(['smith2024'])
    expect(ctx.calls[0]).toEqual(['references.readBib', { path: MANAGED_BIB_PATH }])
  })

  it('searches key, author, year, title, venue, and DOI', async () => {
    const ctx = createCtx({
      [MANAGED_BIB_PATH]: bib([
        { type: 'article', key: 'smith2024', fields: { author: 'Smith, Jane', year: '2024', title: 'Budget Impact', journal: 'Value Health', doi: '10.1000/a' } },
        { type: 'article', key: 'doe2020', fields: { author: 'Doe, John', year: '2020', title: 'Other', journal: 'Methods' } },
      ]),
    })

    const result = await searchReferences(ctx, { query: 'budget value' })
    expect(result.items.map(item => item.key)).toEqual(['smith2024'])
  })

  it('adds a ready entry, writes references.bib, sets the active bibliography, and records meta', async () => {
    const ctx = createCtx()
    const result = await addReference(ctx, {
      entry: { type: 'article', fields: { author: 'Smith, Jane', year: '2024', title: 'New Paper', doi: '10.1000/new' } },
      source: 'manual-test',
    })

    expect(result).toEqual({ key: 'smith2024', added: true })
    expect(parseBibtex(ctx.files.get(MANAGED_BIB_PATH)).map(entry => entry.key)).toEqual(['smith2024'])
    expect(ctx.calls).toContainEqual(['references.setBibliographyPath', { path: MANAGED_BIB_PATH }])
    expect(JSON.parse(ctx.files.get(META_PATH)).entries.smith2024.source).toBe('manual-test')
  })

  it('does not append duplicates', async () => {
    const ctx = createCtx({
      [MANAGED_BIB_PATH]: bib([{ type: 'article', key: 'smith2024', fields: { author: 'Smith, Jane', year: '2024', title: 'New Paper', doi: '10.1000/new' } }]),
    })

    const result = await addReference(ctx, {
      entry: { type: 'article', fields: { author: 'Other, Pat', year: '2025', title: 'Different', doi: 'https://doi.org/10.1000/new' } },
    })

    expect(result).toEqual({ key: 'smith2024', added: false, duplicateOf: 'smith2024' })
    expect(parseBibtex(ctx.files.get(MANAGED_BIB_PATH)).length).toBe(1)
  })

  it('imports BibTeX and CSL-JSON with per-entry statuses', async () => {
    const ctx = createCtx()
    const imported = await importReferences(ctx, {
      text: [
        '@article{one, title={One}, author={One, A}, year={2020}, doi={10.1/one}}',
        '@article{dup, title={Duplicate}, author={Other, B}, year={2021}, doi={10.1/one}}',
      ].join('\n\n'),
    })
    expect(imported.results).toEqual([
      { key: 'one', status: 'added' },
      { key: 'one', status: 'duplicate', duplicateOf: 'one' },
    ])

    const csl = await importReferences(ctx, {
      format: 'csl-json',
      text: JSON.stringify({ type: 'article-journal', title: 'Two', author: [{ family: 'Two' }], issued: { 'date-parts': [[2022]] } }),
    })
    expect(csl.results).toEqual([{ key: 'two2022', status: 'added' }])
  })

  it('attaches a PDF by copying it into references/pdf and updating the file field', async () => {
    const ctx = createCtx({
      [MANAGED_BIB_PATH]: bib([{ type: 'article', key: 'smith2024', fields: { author: 'Smith, Jane', year: '2024', title: 'A' } }]),
      'uploads/source.pdf': '%PDF',
    })

    const result = await attachPdf(ctx, { key: 'smith2024', path: 'uploads/source.pdf' })

    expect(result).toEqual({ key: 'smith2024', path: 'references/pdf/smith2024.pdf' })
    expect(ctx.files.get('references/pdf/smith2024.pdf')).toBe('%PDF')
    expect(parseBibtex(ctx.files.get(MANAGED_BIB_PATH))[0].fields.file).toBe('pdf/smith2024.pdf')
  })

  it('attaches a PDF by moving a staged upload with the core fs.rename contract', async () => {
    const ctx = createCtx({
      [MANAGED_BIB_PATH]: bib([{ type: 'article', key: 'smith2024', fields: { author: 'Smith, Jane', year: '2024', title: 'A' } }]),
      'references/pdf/_staged.pdf': '%PDF',
    })

    const result = await attachPdf(ctx, { key: 'smith2024', path: 'references/pdf/_staged.pdf', move: true })

    expect(result).toEqual({ key: 'smith2024', path: 'references/pdf/smith2024.pdf' })
    expect(ctx.files.has('references/pdf/_staged.pdf')).toBe(false)
    expect(ctx.files.get('references/pdf/smith2024.pdf')).toBe('%PDF')
    expect(parseBibtex(ctx.files.get(MANAGED_BIB_PATH))[0].fields.file).toBe('pdf/smith2024.pdf')
  })

  it('supports External mode for reads and refuses writes', async () => {
    const ctx = createCtx({
      'shared/external.bib': bib([{ type: 'article', key: 'team2024', fields: { title: 'Shared', year: '2024' } }]),
    })
    await setLibraryMode(ctx, { kind: 'external', path: 'shared/external.bib' })

    const search = await searchReferences(ctx, { query: 'shared' })
    expect(search).toMatchObject({ mode: 'external', path: 'shared/external.bib' })
    expect(search.items.map(item => item.key)).toEqual(['team2024'])
    await expect(addReference(ctx, { entry: { type: 'article', fields: { title: 'Nope' } } }))
      .rejects.toThrow(/External mode/)
  })

  it('agentContext summarizes backend-computable library facts', async () => {
    const ctx = createCtx()
    await addReference(ctx, {
      entry: { type: 'article', fields: { author: 'Smith, Jane', year: '2024', title: 'New Paper' } },
    })

    const section = await referencesAgentContext(ctx)
    expect(section.title).toBe('References')
    expect(section.body).toContain('Mode: managed')
    expect(section.body).toContain('References: 1')
    expect(section.body).toContain('smith2024')
  })
})
