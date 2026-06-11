import { entryFromCsl, sniffDoi } from './bib.mjs'

export async function parsePastedReferences(ctx, text) {
  const source = String(text || '').trim()
  if (!source) throw new Error('Paste capture requires citation text')
  const result = await ctx.ai.generateObject({
    system: [
      'Parse pasted academic citations into CSL-JSON-like records.',
      'Return only fields visible in the pasted text. Do not invent DOIs, years, venues, or authors.',
    ].join(' '),
    prompt: source,
    schema: {
      type: 'object',
      properties: {
        references: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              DOI: { type: 'string' },
              author: { type: 'array', items: { type: 'object' } },
              issued: { type: 'object' },
              'container-title': { type: 'string' },
              publisher: { type: 'string' },
              URL: { type: 'string' },
            },
          },
        },
      },
      required: ['references'],
    },
  })
  const object = result?.object || result
  const refs = Array.isArray(object?.references) ? object.references : []
  return refs.map((item) => {
    const doi = sniffDoi(item.DOI || item.doi || item.URL || '')
    return {
      csl: { type: 'article-journal', ...item, DOI: doi || item.DOI || item.doi || '' },
      doi,
      entry: entryFromCsl({ type: 'article-journal', ...item, DOI: doi || item.DOI || item.doi || '' }),
    }
  })
}
