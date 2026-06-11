import {
  capRecords,
  candidateBase,
  cleanDoi,
  compactText,
  httpJson,
  queryParam,
  sourceResult,
} from './common.mjs'

const SOURCE = 'semanticscholar'
const BASE = 'https://api.semanticscholar.org/graph/v1'
const FIELDS = 'paperId,externalIds,title,abstract,year,venue,authors,citationCount,isOpenAccess,tldr,url'

export async function status(ctx) {
  const hasKey = await ctx.secrets.has('semantic_scholar_api_key')
  return {
    source: SOURCE,
    configured: true,
    limited: !hasKey,
    label: hasKey ? 'Semantic Scholar key configured' : 'Shared unauthenticated limit; source may throttle',
  }
}

export async function search(ctx, query) {
  const term = compactText(query?.query || query?.term || query)
  if (!term) return sourceResult(SOURCE, { query: term }, [], { warnings: ['Semantic Scholar query was empty'] })
  const limit = capRecords(query?.maxResults, 25, 100)
  const key = await ctx.secrets.get('semantic_scholar_api_key')
  const url = `${BASE}/paper/search?${queryParam({ query: term, limit, fields: FIELDS })}`
  try {
    const data = await httpJson(ctx, SOURCE, url, key ? { headers: { 'x-api-key': key } } : {})
    const rows = Array.isArray(data?.data) ? data.data : []
    return sourceResult(SOURCE, { query: term, limit }, rows.map(parseSemanticScholarPaper), {
      rawCount: Number(data?.total) || rows.length,
      page: data?.next ? { next: data.next } : null,
    })
  } catch (error) {
    return sourceResult(SOURCE, { query: term, limit }, [], {
      warnings: [`Semantic Scholar skipped: ${error.status === 429 ? 'rate limited' : error.message}`],
    })
  }
}

export async function getByIds(ctx, ids = []) {
  const key = await ctx.secrets.get('semantic_scholar_api_key')
  const records = []
  const requestIds = []
  const warnings = []
  for (const id of ids.slice(0, 20)) {
    const paperId = compactText(id?.s2 || id?.semanticScholar || id?.doi || id)
    if (!paperId) continue
    requestIds.push(paperId)
    const lookupId = cleanDoi(paperId) ? `DOI:${cleanDoi(paperId)}` : paperId
    try {
      const data = await httpJson(ctx, SOURCE, `${BASE}/paper/${encodeURIComponent(lookupId)}?${queryParam({ fields: FIELDS })}`, key ? { headers: { 'x-api-key': key } } : {})
      records.push(parseSemanticScholarPaper(data))
    } catch (error) {
      warnings.push(`${paperId}: ${error.message}`)
    }
  }
  return sourceResult(SOURCE, { ids: requestIds }, records.filter(record => record.title), { warnings, requestIds })
}

export async function citations(ctx, ids = [], direction = 'forward') {
  const key = await ctx.secrets.get('semantic_scholar_api_key')
  const first = ids.find(Boolean)
  const paperId = compactText(first?.s2 || first?.semanticScholar || first?.doi || first)
  if (!paperId) return sourceResult(SOURCE, { ids: [], direction }, [])
  const lookupId = cleanDoi(paperId) ? `DOI:${cleanDoi(paperId)}` : paperId
  const endpoint = direction === 'backward' ? 'references' : 'citations'
  try {
    const data = await httpJson(ctx, SOURCE, `${BASE}/paper/${encodeURIComponent(lookupId)}/${endpoint}?${queryParam({ limit: 25, fields: FIELDS })}`, key ? { headers: { 'x-api-key': key } } : {})
    const rows = Array.isArray(data?.data) ? data.data : []
    const records = rows
      .map(row => parseSemanticScholarPaper(direction === 'backward' ? row.citedPaper : row.citingPaper))
      .filter(record => record.title)
    return sourceResult(SOURCE, { id: paperId, direction }, records, { requestIds: [paperId], rawCount: Number(data?.total) || records.length })
  } catch (error) {
    return sourceResult(SOURCE, { id: paperId, direction }, [], { warnings: [`Semantic Scholar citations skipped: ${error.status === 429 ? 'rate limited' : error.message}`] })
  }
}

export function parseSemanticScholarPaper(paper = {}) {
  const ids = paper.externalIds || {}
  const tldr = paper.tldr?.text || ''
  return candidateBase(SOURCE, {
    title: paper.title,
    authors: (paper.authors || []).map(author => author.name).filter(Boolean),
    year: paper.year,
    venue: paper.venue,
    type: 'article',
    abstract: paper.abstract || tldr,
    ids: {
      s2: paper.paperId,
      doi: ids.DOI,
      pmid: ids.PubMed,
      arxiv: ids.ArXiv,
    },
    sourceUrl: paper.url || (paper.paperId ? `https://www.semanticscholar.org/paper/${paper.paperId}` : ''),
    oaStatus: paper.isOpenAccess ? 'open' : '',
    citedByCount: paper.citationCount,
    raw: paper,
    abstractSource: paper.abstract ? 'semanticscholar' : (tldr ? 'semanticscholar_tldr' : ''),
  })
}

export const semanticScholarAdapter = { source: SOURCE, status, search, getByIds, citations }
