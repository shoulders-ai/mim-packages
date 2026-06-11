export const ADAPTER_VERSION = '2026-06-15'

const ENTITY_RE = /&(#x?[0-9a-fA-F]+|[A-Za-z]+);/g
const ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
}

export class SourceHttpError extends Error {
  constructor(source, status, url) {
    super(`${source} request failed with status ${status}`)
    this.name = 'SourceHttpError'
    this.source = source
    this.status = status
    this.url = url
  }
}

export function nowIso(now = () => new Date()) {
  const value = now()
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

export function compactText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

export function maybeNumber(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export function cleanDoi(value) {
  const cleaned = compactText(value)
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
    .replace(/^doi:\s*/i, '')
    .toLowerCase()
  return cleaned || ''
}

export function idTail(value) {
  const text = compactText(value)
  if (!text) return ''
  return text.split('/').filter(Boolean).pop() || text
}

export function authorsFromNames(names) {
  return (Array.isArray(names) ? names : [])
    .map(name => typeof name === 'string' ? compactText(name) : compactText(name?.name ?? name?.display_name ?? ''))
    .filter(Boolean)
}

export function firstAuthorFamily(record) {
  const first = Array.isArray(record?.authors) ? record.authors[0] : ''
  const parts = compactText(first).split(/\s+/).filter(Boolean)
  return (parts[parts.length - 1] || '').toLowerCase()
}

export function normalizeTitle(value) {
  return compactText(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function normalizeToken(value) {
  return compactText(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function sourceResult(source, query, records, {
  requestedAt,
  page = null,
  requestIds = [],
  warnings = [],
  rawCount = records.length,
} = {}) {
  return {
    source,
    adapterVersion: ADAPTER_VERSION,
    requestedAt: requestedAt || nowIso(),
    query,
    page,
    recordsReturned: records.length,
    rawCount,
    requestIds,
    warnings,
    records,
  }
}

export function disabledResult(source, query, reason) {
  return sourceResult(source, query, [], { warnings: [reason], rawCount: 0 })
}

export async function httpJson(ctx, source, url, options = {}) {
  const response = await ctx.http.request({ url, ...(options.headers ? { headers: options.headers } : {}) })
  if (!response.ok) throw new SourceHttpError(source, response.status, url)
  return response.json()
}

export async function httpText(ctx, source, url, options = {}) {
  const response = await ctx.http.request({ url, ...(options.headers ? { headers: options.headers } : {}) })
  if (!response.ok) throw new SourceHttpError(source, response.status, url)
  return response.text()
}

export function queryParam(params) {
  const url = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    url.set(key, String(value))
  }
  return url.toString()
}

export function decodeXml(value) {
  return String(value ?? '').replace(ENTITY_RE, (_, entity) => {
    if (entity[0] === '#') {
      const raw = entity[1]?.toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10)
      return Number.isFinite(raw) ? String.fromCodePoint(raw) : ''
    }
    return ENTITIES[entity] ?? ''
  })
}

export function xmlBlocks(xml, tag) {
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi')
  const out = []
  let match
  while ((match = re.exec(String(xml ?? '')))) out.push(match[1])
  return out
}

export function xmlText(xml, tag) {
  const block = xmlBlocks(xml, tag)[0]
  return compactText(decodeXml(stripXml(block ?? '')))
}

export function xmlTexts(xml, tag) {
  return xmlBlocks(xml, tag).map(block => compactText(decodeXml(stripXml(block)))).filter(Boolean)
}

export function stripXml(value) {
  return String(value ?? '').replace(/<[^>]+>/g, ' ')
}

export function candidateBase(source, {
  title,
  authors = [],
  year = null,
  venue = '',
  type = 'article',
  abstract = '',
  ids = {},
  sourceUrl = '',
  oaStatus = '',
  citedByCount = null,
  raw = null,
  abstractSource = 'source',
}) {
  const normalizedIds = {}
  for (const [key, value] of Object.entries(ids || {})) {
    const text = key === 'doi' ? cleanDoi(value) : compactText(value)
    if (text) normalizedIds[key] = text
  }
  return {
    source,
    title: compactText(title),
    authors: authorsFromNames(authors),
    year: maybeNumber(year),
    venue: compactText(venue),
    type,
    abstract: compactText(abstract),
    ids: normalizedIds,
    sourceUrl: compactText(sourceUrl),
    oaStatus: compactText(oaStatus),
    citedByCount: maybeNumber(citedByCount),
    abstractSource,
    raw,
    provenance: [],
  }
}

export function withProvenance(record, result, index) {
  return {
    ...record,
    provenance: [
      ...(record.provenance || []),
      {
        source: result.source,
        adapterVersion: result.adapterVersion,
        requestedAt: result.requestedAt,
        query: result.query,
        page: result.page,
        rank: index + 1,
      },
    ],
  }
}

export function capRecords(value, fallback = 25, hardCap = 100) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.max(1, Math.min(Math.floor(n), hardCap))
}
