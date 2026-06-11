import {
  capRecords,
  candidateBase,
  cleanDoi,
  compactText,
  disabledResult,
  httpJson,
  idTail,
  queryParam,
  sourceResult,
} from './common.mjs'

const SOURCE = 'openalex'

export async function status(ctx) {
  const hasKey = await ctx.secrets.has('openalex_api_key')
  return {
    source: SOURCE,
    configured: hasKey,
    limited: !hasKey,
    label: hasKey ? 'OpenAlex key configured' : 'OpenAlex requires a free API key for real runs',
  }
}

export async function search(ctx, query) {
  const apiKey = await ctx.secrets.get('openalex_api_key')
  const term = compactText(query?.search || query?.query || query?.term || query)
  if (!apiKey) return disabledResult(SOURCE, { search: term }, 'OpenAlex skipped: missing openalex_api_key')
  if (!term) return sourceResult(SOURCE, { search: term }, [], { warnings: ['OpenAlex query was empty'] })
  const perPage = capRecords(query?.maxResults, 25, 100)
  const url = `https://api.openalex.org/works?${queryParam({
    search: term,
    'per-page': perPage,
    sort: 'relevance_score:desc',
    api_key: apiKey,
    select: 'id,doi,display_name,publication_year,authorships,primary_location,abstract_inverted_index,type,open_access,cited_by_count,referenced_works',
  })}`
  const data = await httpJson(ctx, SOURCE, url)
  const results = Array.isArray(data?.results) ? data.results : []
  return sourceResult(SOURCE, { search: term, perPage }, results.map(parseOpenAlexWork), {
    rawCount: Number(data?.meta?.count) || results.length,
    page: data?.meta ? { page: data.meta.page, perPage: data.meta.per_page } : null,
  })
}

export async function getByIds(ctx, ids = []) {
  const apiKey = await ctx.secrets.get('openalex_api_key')
  if (!apiKey) return disabledResult(SOURCE, { ids }, 'OpenAlex lookup skipped: missing openalex_api_key')
  const records = []
  const warnings = []
  const requestIds = []
  for (const id of ids.slice(0, 20)) {
    const openalexId = compactText(id?.openalex || id)
    const doi = cleanDoi(id?.doi || '')
    const pathId = doi ? `doi:${doi}` : idTail(openalexId)
    if (!pathId) continue
    requestIds.push(pathId)
    try {
      const data = await httpJson(ctx, SOURCE, `https://api.openalex.org/works/${encodeURIComponent(pathId)}?${queryParam({ api_key: apiKey })}`)
      records.push(parseOpenAlexWork(data))
    } catch (error) {
      warnings.push(`${pathId}: ${error.message}`)
    }
  }
  return sourceResult(SOURCE, { ids: requestIds }, records.filter(record => record.title), { warnings, requestIds })
}

export async function citations(ctx, ids = [], direction = 'forward') {
  const apiKey = await ctx.secrets.get('openalex_api_key')
  if (!apiKey) return disabledResult(SOURCE, { ids, direction }, 'OpenAlex citations skipped: missing openalex_api_key')
  const first = ids.find(Boolean)
  const openalexId = compactText(first?.openalex || first)
  if (!openalexId) return sourceResult(SOURCE, { ids: [], direction }, [])
  if (direction === 'backward') {
    const lookedUp = await getByIds(ctx, [{ openalex: openalexId }])
    const refs = lookedUp.records[0]?.raw?.referenced_works || []
    return getByIds(ctx, refs.slice(0, 25))
  }
  const workId = idTail(openalexId)
  const url = `https://api.openalex.org/works?${queryParam({
    filter: `cites:${workId}`,
    'per-page': 25,
    api_key: apiKey,
  })}`
  const data = await httpJson(ctx, SOURCE, url)
  const records = (Array.isArray(data?.results) ? data.results : []).map(parseOpenAlexWork)
  return sourceResult(SOURCE, { id: workId, direction }, records, {
    rawCount: Number(data?.meta?.count) || records.length,
    requestIds: [workId],
  })
}

export function parseOpenAlexWork(work = {}) {
  const abstract = abstractFromInvertedIndex(work.abstract_inverted_index)
  const source = work.primary_location?.source || {}
  const id = compactText(work.id)
  return candidateBase(SOURCE, {
    title: work.display_name,
    authors: (work.authorships || []).map(item => item?.author?.display_name).filter(Boolean),
    year: work.publication_year,
    venue: source.display_name || '',
    type: work.type === 'preprint' ? 'preprint' : 'article',
    abstract,
    ids: {
      doi: work.doi,
      openalex: idTail(id),
    },
    sourceUrl: id || (work.doi ? work.doi : ''),
    oaStatus: work.open_access?.is_oa ? (work.open_access?.oa_status || 'open') : '',
    citedByCount: work.cited_by_count,
    raw: work,
    abstractSource: abstract ? 'openalex' : '',
  })
}

export function abstractFromInvertedIndex(index) {
  if (!index || typeof index !== 'object') return ''
  const words = []
  for (const [word, positions] of Object.entries(index)) {
    for (const pos of Array.isArray(positions) ? positions : []) {
      words[Number(pos)] = word
    }
  }
  return compactText(words.filter(Boolean).join(' '))
}

export const openAlexAdapter = { source: SOURCE, status, search, getByIds, citations }
