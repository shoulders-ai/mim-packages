import {
  capRecords,
  candidateBase,
  compactText,
  decodeXml,
  httpJson,
  httpText,
  queryParam,
  sourceResult,
  stripXml,
  xmlBlocks,
  xmlText,
  xmlTexts,
} from './common.mjs'

const SOURCE = 'pubmed'
const BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'

export async function status(ctx) {
  const hasKey = await ctx.secrets.has('ncbi_api_key')
  return {
    source: SOURCE,
    configured: true,
    limited: !hasKey,
    label: hasKey ? 'NCBI key configured' : 'No NCBI key; capped at 3 requests/sec',
  }
}

export async function search(ctx, query) {
  const term = compactText(query?.term || query?.query || query)
  if (!term) return sourceResult(SOURCE, { term }, [], { warnings: ['PubMed query was empty'] })
  const retmax = capRecords(query?.maxResults, 25, 100)
  const apiKey = await ctx.secrets.get('ncbi_api_key')
  const params = {
    db: 'pubmed',
    retmode: 'json',
    usehistory: 'y',
    sort: 'relevance',
    term,
    retmax,
    tool: 'mim_scholar',
    ...(apiKey ? { api_key: apiKey } : {}),
  }
  const searchUrl = `${BASE}/esearch.fcgi?${queryParam(params)}`
  const esearch = await httpJson(ctx, SOURCE, searchUrl)
  const idList = Array.isArray(esearch?.esearchresult?.idlist) ? esearch.esearchresult.idlist : []
  if (idList.length === 0) return sourceResult(SOURCE, { term, retmax }, [], { requestIds: [] })

  const webenv = esearch?.esearchresult?.webenv
  const queryKey = esearch?.esearchresult?.querykey
  const fetchParams = webenv && queryKey
    ? { db: 'pubmed', retmode: 'xml', query_key: queryKey, WebEnv: webenv, retmax, tool: 'mim_scholar', ...(apiKey ? { api_key: apiKey } : {}) }
    : { db: 'pubmed', retmode: 'xml', id: idList.join(','), tool: 'mim_scholar', ...(apiKey ? { api_key: apiKey } : {}) }
  const fetchUrl = `${BASE}/efetch.fcgi?${queryParam(fetchParams)}`
  const xml = await httpText(ctx, SOURCE, fetchUrl)
  const records = parsePubmedXml(xml)
  return sourceResult(SOURCE, { term, retmax }, records, {
    requestIds: idList,
    rawCount: Number(esearch?.esearchresult?.count) || records.length,
    page: webenv && queryKey ? { queryKey, webenv } : null,
  })
}

export async function getByIds(ctx, ids = []) {
  const pmids = ids.map(id => compactText(id?.pmid || id)).filter(Boolean)
  if (pmids.length === 0) return sourceResult(SOURCE, { ids: [] }, [])
  const apiKey = await ctx.secrets.get('ncbi_api_key')
  const url = `${BASE}/efetch.fcgi?${queryParam({
    db: 'pubmed',
    retmode: 'xml',
    id: pmids.join(','),
    tool: 'mim_scholar',
    ...(apiKey ? { api_key: apiKey } : {}),
  })}`
  const xml = await httpText(ctx, SOURCE, url)
  return sourceResult(SOURCE, { ids: pmids }, parsePubmedXml(xml), { requestIds: pmids })
}

export async function citations() {
  return sourceResult(SOURCE, { direction: 'unsupported' }, [], { warnings: ['PubMed adapter does not expose citation graph expansion in v0.1'] })
}

export function parsePubmedXml(xml) {
  return xmlBlocks(xml, 'PubmedArticle')
    .map(parsePubmedArticle)
    .filter(record => record.title)
}

function parsePubmedArticle(article) {
  const pmid = xmlText(article, 'PMID')
  const articleTitle = xmlText(article, 'ArticleTitle')
  const abstract = xmlTexts(article, 'AbstractText').join(' ')
  const journal = xmlText(article, 'Title') || xmlText(article, 'ISOAbbreviation')
  const year = xmlText(article, 'PubDate').match(/\b(18|19|20|21)\d{2}\b/)?.[0] || null
  const doi = articleId(article, 'doi')
  const pmcid = articleId(article, 'pmc')
  const authors = xmlBlocks(article, 'Author')
    .map(author => compactText(`${xmlText(author, 'ForeName')} ${xmlText(author, 'LastName')}`))
    .filter(Boolean)
  return candidateBase(SOURCE, {
    title: articleTitle,
    authors,
    year,
    venue: journal,
    abstract,
    ids: { pmid, doi, pmcid },
    sourceUrl: pmid ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/` : '',
    raw: { pmid, journal },
    abstractSource: abstract ? 'pubmed' : '',
  })
}

function articleId(article, idType) {
  const re = new RegExp(`<ArticleId\\b[^>]*IdType=["']${idType}["'][^>]*>([\\s\\S]*?)<\\/ArticleId>`, 'i')
  const block = String(article ?? '').match(re)?.[1] || ''
  return compactText(decodeXml(stripXml(block)))
}

export const pubmedAdapter = { source: SOURCE, status, search, getByIds, citations }
