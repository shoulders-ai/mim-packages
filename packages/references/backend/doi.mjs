import { entryFromCsl, sniffDoi } from './bib.mjs'

export function extractDoi(input) {
  return sniffDoi(input)
}

export async function resolveDoi(ctx, input) {
  const doi = extractDoi(input)
  if (!doi) throw new Error('No DOI found')
  const crossref = await resolveCrossrefDoi(ctx, doi)
  if (crossref) return crossref
  const doiOrg = await resolveDoiOrg(ctx, doi)
  if (doiOrg) return doiOrg
  throw new Error(`DOI not found: ${doi}`)
}

export async function resolveCrossrefDoi(ctx, doi) {
  const url = `https://api.crossref.org/works/${encodeURIComponent(doi)}`
  const res = await ctx.http.request({ url, headers: { Accept: 'application/json' } })
  if (!res.ok) return null
  const json = await res.json()
  const message = json?.message
  if (!message) return null
  return {
    entry: entryFromCsl(crossrefWorkToCsl(message)),
    source: 'crossref',
    confidence: 'verified',
    raw: message,
  }
}

export async function resolveDoiOrg(ctx, doi) {
  const url = `https://doi.org/${encodeURIComponent(doi)}`
  const res = await ctx.http.request({
    url,
    headers: { Accept: 'application/vnd.citationstyles.csl+json' },
  })
  if (!res.ok) return null
  const json = await res.json()
  return {
    entry: entryFromCsl({ ...json, DOI: json.DOI || doi }),
    source: 'doi.org',
    confidence: 'verified',
    raw: json,
  }
}

export async function searchBibliographic(ctx, query, { rows = 3 } = {}) {
  const q = String(query ?? '').trim()
  if (!q) return []
  const crossref = await searchCrossref(ctx, q, rows)
  if (crossref.length > 0) return crossref
  return searchOpenAlex(ctx, q, rows)
}

export async function searchCrossref(ctx, query, rows = 3) {
  const url = `https://api.crossref.org/works?query.bibliographic=${encodeURIComponent(query)}&rows=${rows}`
  const res = await ctx.http.request({ url, headers: { Accept: 'application/json' } })
  if (!res.ok) return []
  const json = await res.json()
  return (json?.message?.items || [])
    .filter(Boolean)
    .map((item, index) => ({
      entry: entryFromCsl(crossrefWorkToCsl(item)),
      source: 'crossref-search',
      confidence: index === 0 ? 'enriched' : 'parsed',
      score: typeof item.score === 'number' ? item.score : 0,
      raw: item,
    }))
}

export async function searchOpenAlex(ctx, query, rows = 3) {
  const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per-page=${rows}`
  const res = await ctx.http.request({ url, headers: { Accept: 'application/json' } })
  if (!res.ok) return []
  const json = await res.json()
  return (json?.results || [])
    .filter(Boolean)
    .map((item, index) => ({
      entry: entryFromCsl(openAlexWorkToCsl(item)),
      source: 'openalex-search',
      confidence: index === 0 ? 'enriched' : 'parsed',
      score: typeof item.relevance_score === 'number' ? item.relevance_score : 0,
      raw: item,
    }))
}

export function crossrefWorkToCsl(work) {
  return {
    id: work.DOI || work.doi || '',
    type: crossrefType(work.type),
    title: firstArrayValue(work.title),
    DOI: work.DOI || work.doi || '',
    URL: work.URL || work.url || '',
    author: Array.isArray(work.author)
      ? work.author.map(author => ({ family: author.family || '', given: author.given || '' }))
      : [],
    issued: work.issued || work.published || work['published-print'] || work['published-online'],
    'container-title': firstArrayValue(work['container-title'], work['short-container-title']),
    publisher: work.publisher || '',
    volume: work.volume || '',
    issue: work.issue || '',
    page: work.page || '',
    abstract: stripJats(work.abstract || ''),
  }
}

export function openAlexWorkToCsl(work) {
  const authors = (work.authorships || [])
    .map(item => item?.author?.display_name)
    .filter(Boolean)
    .map(splitDisplayName)
  return {
    id: work.doi || work.id || '',
    type: 'article-journal',
    title: work.title || work.display_name || '',
    DOI: work.doi || '',
    URL: work.primary_location?.landing_page_url || work.id || '',
    author: authors,
    issued: work.publication_year ? { 'date-parts': [[work.publication_year]] } : undefined,
    'container-title': work.primary_location?.source?.display_name || '',
  }
}

function crossrefType(type) {
  if (type === 'book') return 'book'
  if (type === 'book-chapter') return 'chapter'
  if (type === 'proceedings-article') return 'paper-conference'
  if (type === 'report') return 'report'
  return 'article-journal'
}

function firstArrayValue(...values) {
  for (const value of values) {
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'string') return value[0]
    if (typeof value === 'string' && value.trim()) return value
  }
  return ''
}

function splitDisplayName(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return {}
  if (parts.length === 1) return { family: parts[0] }
  return { family: parts[parts.length - 1], given: parts.slice(0, -1).join(' ') }
}

function stripJats(value) {
  return String(value || '').replace(/<[^>]+>/g, '').trim()
}
