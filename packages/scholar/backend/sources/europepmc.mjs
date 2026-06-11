import {
  capRecords,
  candidateBase,
  compactText,
  httpJson,
  queryParam,
  sourceResult,
} from './common.mjs'

const SOURCE = 'europepmc'

export async function status() {
  return {
    source: SOURCE,
    configured: true,
    limited: false,
    label: 'Keyless REST API',
  }
}

export async function search(ctx, query) {
  const term = compactText(query?.query || query?.term || query)
  if (!term) return sourceResult(SOURCE, { query: term }, [], { warnings: ['Europe PMC query was empty'] })
  const pageSize = capRecords(query?.maxResults, 25, 100)
  const url = `https://www.ebi.ac.uk/europepmc/webservices/rest/search?${queryParam({
    query: term,
    pageSize,
    resultType: 'core',
    format: 'json',
    synonym: false,
  })}`
  const data = await httpJson(ctx, SOURCE, url)
  const results = Array.isArray(data?.resultList?.result) ? data.resultList.result : []
  return sourceResult(SOURCE, { query: term, pageSize }, results.map(parseEuropePmcItem), {
    rawCount: Number(data?.hitCount) || results.length,
    page: data?.nextCursorMark ? { nextCursorMark: data.nextCursorMark } : null,
  })
}

export async function getByIds(ctx, ids = []) {
  const terms = ids.map(id => compactText(id?.doi || id?.pmid || id)).filter(Boolean)
  if (terms.length === 0) return sourceResult(SOURCE, { ids: [] }, [])
  const records = []
  const warnings = []
  for (const id of terms.slice(0, 20)) {
    try {
      const result = await search(ctx, { query: `EXT_ID:${id}`, maxResults: 1 })
      records.push(...result.records)
      warnings.push(...result.warnings)
    } catch (error) {
      warnings.push(`${id}: ${error.message}`)
    }
  }
  return sourceResult(SOURCE, { ids: terms }, records, { warnings, requestIds: terms })
}

export async function citations() {
  return sourceResult(SOURCE, { direction: 'unsupported' }, [], { warnings: ['Europe PMC citation expansion is not enabled in v0.1'] })
}

export function parseEuropePmcItem(item = {}) {
  const id = compactText(item.id || item.pmid || item.pmcid)
  const type = item.source === 'PPR' ? 'preprint' : 'article'
  const abstract = item.abstractText || item.abstract || ''
  return candidateBase(SOURCE, {
    title: item.title,
    authors: compactText(item.authorString).split(/\s*,\s*/).filter(Boolean),
    year: item.pubYear,
    venue: item.journalTitle || item.bookOrReportDetails || '',
    type,
    abstract,
    ids: {
      pmid: item.pmid,
      pmcid: item.pmcid,
      doi: item.doi,
      europepmc: id,
    },
    sourceUrl: id ? `https://europepmc.org/article/${item.source || 'MED'}/${id}` : '',
    oaStatus: item.isOpenAccess === 'Y' ? 'open' : '',
    citedByCount: item.citedByCount,
    raw: item,
    abstractSource: abstract ? 'europepmc' : '',
  })
}

export const europePmcAdapter = { source: SOURCE, status, search, getByIds, citations }
