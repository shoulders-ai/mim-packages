import {
  capRecords,
  candidateBase,
  cleanDoi,
  compactText,
  httpText,
  idTail,
  queryParam,
  sourceResult,
  xmlBlocks,
  xmlText,
  xmlTexts,
} from './common.mjs'

const SOURCE = 'arxiv'

export function createArxivAdapter({ minDelayMs = 3000, sleep = ms => new Promise(resolve => setTimeout(resolve, ms)), clock = () => Date.now() } = {}) {
  let lastCallAt = 0
  async function beforeRequest() {
    const elapsed = clock() - lastCallAt
    if (lastCallAt && elapsed < minDelayMs) await sleep(minDelayMs - elapsed)
    lastCallAt = clock()
  }
  return {
    source: SOURCE,
    status,
    async search(ctx, query) {
      await beforeRequest()
      return search(ctx, query)
    },
    async getByIds(ctx, ids) {
      await beforeRequest()
      return getByIds(ctx, ids)
    },
    citations,
  }
}

export async function status() {
  return {
    source: SOURCE,
    configured: true,
    limited: true,
    label: 'Keyless API; 3-second delay between repeated calls',
  }
}

export async function search(ctx, query) {
  const term = compactText(query?.search_query || query?.query || query?.term || query)
  if (!term) return sourceResult(SOURCE, { query: term }, [], { warnings: ['arXiv query was empty'] })
  const maxResults = capRecords(query?.maxResults, 25, 100)
  const url = `https://export.arxiv.org/api/query?${queryParam({
    search_query: term.includes(':') ? term : `all:${term}`,
    start: 0,
    max_results: maxResults,
    sortBy: 'relevance',
    sortOrder: 'descending',
  })}`
  const xml = await httpText(ctx, SOURCE, url)
  const entries = xmlBlocks(xml, 'entry')
  return sourceResult(SOURCE, { query: term, maxResults }, entries.map(parseArxivEntry).filter(record => record.title), {
    rawCount: Number(xmlText(xml, 'opensearch:totalResults')) || entries.length,
  })
}

export async function getByIds(ctx, ids = []) {
  const arxivIds = ids.map(id => compactText(id?.arxiv || id)).filter(Boolean)
  if (arxivIds.length === 0) return sourceResult(SOURCE, { ids: [] }, [])
  const url = `https://export.arxiv.org/api/query?${queryParam({ id_list: arxivIds.slice(0, 50).join(',') })}`
  const xml = await httpText(ctx, SOURCE, url)
  const entries = xmlBlocks(xml, 'entry')
  return sourceResult(SOURCE, { ids: arxivIds }, entries.map(parseArxivEntry).filter(record => record.title), { requestIds: arxivIds })
}

export async function citations() {
  return sourceResult(SOURCE, { direction: 'unsupported' }, [], { warnings: ['arXiv adapter does not expose citation graph expansion'] })
}

export function parseArxivEntry(entry) {
  const rawId = xmlText(entry, 'id')
  const arxivId = idTail(rawId).replace(/v\d+$/i, '')
  const published = xmlText(entry, 'published') || xmlText(entry, 'updated')
  const doi = xmlText(entry, 'arxiv:doi')
  const categories = arxivCategories(entry).join(', ')
  return candidateBase(SOURCE, {
    title: xmlText(entry, 'title'),
    authors: xmlBlocks(entry, 'author').map(author => xmlText(author, 'name')).filter(Boolean),
    year: published.slice(0, 4),
    venue: categories ? `arXiv ${categories}` : 'arXiv',
    type: 'preprint',
    abstract: xmlText(entry, 'summary'),
    ids: { arxiv: arxivId, doi: cleanDoi(doi) },
    sourceUrl: rawId,
    raw: { id: rawId, published, categories },
    abstractSource: 'arxiv',
  })
}

export function arxivCategories(entry) {
  const categories = new Set(xmlTexts(entry, 'category'))
  const re = /<category\b[^>]*\bterm=["']([^"']+)["'][^>]*\/?>/gi
  let match
  while ((match = re.exec(String(entry ?? '')))) categories.add(compactText(match[1]))
  return [...categories].filter(Boolean)
}

export const arxivAdapter = createArxivAdapter()
