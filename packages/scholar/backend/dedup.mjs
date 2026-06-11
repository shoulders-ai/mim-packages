import { cleanDoi, compactText, firstAuthorFamily, normalizeTitle } from './sources/common.mjs'

const ID_PRIORITY = ['doi', 'pmid', 'pmcid', 'nct', 'arxiv', 'openalex', 's2', 'europepmc']

export function deduplicate(records) {
  const exact = new Map()
  const merged = []
  const exactDuplicateCount = { value: 0 }

  for (const raw of records.filter(Boolean)) {
    const record = normalizeRecordIds(raw)
    const key = exactKey(record)
    if (!key) {
      merged.push(record)
      continue
    }
    if (!exact.has(key)) {
      const next = { ...record, dedupKey: key }
      exact.set(key, next)
      merged.push(next)
      continue
    }
    exactDuplicateCount.value += 1
    const existing = exact.get(key)
    mergeInto(existing, record)
  }

  const possibleDuplicates = fuzzyDuplicateGroups(merged)
  const duplicateKeys = new Set(possibleDuplicates.flatMap(group => group.recordKeys))
  for (const record of merged) {
    const localKey = localRecordKey(record)
    if (duplicateKeys.has(localKey)) record.possibleDuplicate = true
  }

  return {
    records: merged,
    exactDuplicateCount: exactDuplicateCount.value,
    possibleDuplicates,
  }
}

export function exactKey(record) {
  const ids = record?.ids || {}
  for (const id of ID_PRIORITY) {
    const value = id === 'doi' ? cleanDoi(ids[id]) : compactText(ids[id]).toLowerCase()
    if (value) return `${id}:${value}`
  }
  return ''
}

export function fuzzyKey(record) {
  const title = normalizeTitle(record?.title)
  const year = record?.year ? String(record.year) : ''
  const author = firstAuthorFamily(record)
  if (!title || !year || !author) return ''
  return `${title}|${year}|${author}`
}

export function localRecordKey(record) {
  return exactKey(record) || fuzzyKey(record) || `${record?.source || 'record'}:${normalizeTitle(record?.title)}`
}

function mergeInto(target, incoming) {
  target.sources = [...new Set([...(target.sources || [target.source]), incoming.source])]
  target.provenance = [...(target.provenance || []), ...(incoming.provenance || [])]
  target.abstract = target.abstract || incoming.abstract
  target.venue = target.venue || incoming.venue
  target.year = target.year || incoming.year
  target.sourceUrl = target.sourceUrl || incoming.sourceUrl
  target.oaStatus = target.oaStatus || incoming.oaStatus
  target.citedByCount = Math.max(Number(target.citedByCount) || 0, Number(incoming.citedByCount) || 0) || null
  target.ids = { ...(incoming.ids || {}), ...(target.ids || {}) }
  target.alternateRecords = [...(target.alternateRecords || []), incoming]
}

function normalizeRecordIds(record) {
  const ids = { ...(record.ids || {}) }
  if (ids.doi) ids.doi = cleanDoi(ids.doi)
  return { ...record, ids }
}

function fuzzyDuplicateGroups(records) {
  const groups = new Map()
  for (const record of records) {
    const key = fuzzyKey(record)
    if (!key) continue
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(record)
  }
  return [...groups.values()]
    .filter(group => group.length > 1)
    .map(group => ({
      reason: 'same normalized title, year, and first author',
      title: group[0].title,
      year: group[0].year,
      recordKeys: group.map(localRecordKey),
      records: group.map(record => ({
        source: record.source,
        title: record.title,
        year: record.year,
        ids: record.ids,
      })),
    }))
}
