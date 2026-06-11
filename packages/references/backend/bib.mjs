export const MANAGED_BIB_PATH = 'references/references.bib'
export const META_PATH = 'references/.mim/meta.json'
export const PDF_DIR = 'references/pdf'
export const FULLTEXT_DIR = 'references/fulltext'
export const PDF_PROVENANCE_DIR = 'references/.mim/pdf'

const KEY_SUFFIXES = 'abcdefghijklmnopqrstuvwxyz'
const FIELD_ORDER = [
  'author',
  'title',
  'journal',
  'booktitle',
  'publisher',
  'year',
  'volume',
  'number',
  'pages',
  'doi',
  'url',
  'file',
  'keywords',
  'abstract',
]

export function parseBibtex(text) {
  const entries = []
  const raw = String(text ?? '')
  let i = 0
  while (i < raw.length) {
    const at = raw.indexOf('@', i)
    if (at === -1) break
    i = at + 1
    const typeStart = i
    while (i < raw.length && /[A-Za-z0-9_-]/.test(raw[i])) i++
    const type = raw.slice(typeStart, i).trim().toLowerCase()
    while (i < raw.length && /\s/.test(raw[i])) i++
    const open = raw[i]
    if (!type || (open !== '{' && open !== '(')) {
      i += 1
      continue
    }
    const close = open === '{' ? '}' : ')'
    i += 1
    while (i < raw.length && /\s/.test(raw[i])) i++
    const keyStart = i
    while (i < raw.length && raw[i] !== ',' && raw[i] !== close) i++
    const key = raw.slice(keyStart, i).trim()
    if (!key || raw[i] !== ',') {
      i += 1
      continue
    }
    i += 1
    const fields = {}
    while (i < raw.length) {
      while (i < raw.length && (/\s/.test(raw[i]) || raw[i] === ',')) i++
      if (raw[i] === close) {
        i += 1
        break
      }
      const nameStart = i
      while (i < raw.length && /[A-Za-z0-9_-]/.test(raw[i])) i++
      const name = raw.slice(nameStart, i).trim().toLowerCase()
      while (i < raw.length && /\s/.test(raw[i])) i++
      if (!name || raw[i] !== '=') {
        i += 1
        continue
      }
      i += 1
      while (i < raw.length && /\s/.test(raw[i])) i++
      const parsed = parseBibValue(raw, i, close)
      fields[name] = parsed.value.trim()
      i = parsed.next
    }
    entries.push({ type, key, fields })
  }
  return entries
}

function parseBibValue(raw, start, entryClose) {
  let i = start
  if (raw[i] === '{') {
    let depth = 0
    let value = ''
    while (i < raw.length) {
      const ch = raw[i]
      if (ch === '{') {
        if (depth > 0) value += ch
        depth++
        i++
        continue
      }
      if (ch === '}') {
        depth--
        if (depth === 0) {
          i++
          break
        }
        value += ch
        i++
        continue
      }
      value += ch
      i++
    }
    return { value, next: i }
  }
  if (raw[i] === '"') {
    i++
    let value = ''
    while (i < raw.length) {
      const ch = raw[i]
      if (ch === '\\' && i + 1 < raw.length) {
        value += raw[i + 1]
        i += 2
        continue
      }
      if (ch === '"') {
        i++
        break
      }
      value += ch
      i++
    }
    return { value, next: i }
  }
  const valueStart = i
  while (i < raw.length && raw[i] !== ',' && raw[i] !== entryClose) i++
  return { value: raw.slice(valueStart, i), next: i }
}

export function serializeBibtex(entries) {
  const clean = entries.map(normalizeEntry).filter(Boolean)
  if (clean.length === 0) return ''
  return `${clean.map(serializeEntry).join('\n\n')}\n`
}

export function serializeEntry(entry) {
  const normalized = normalizeEntry(entry)
  const fields = orderedFields(normalized.fields)
  const lines = [`@${normalized.type}{${normalized.key},`]
  fields.forEach(([name, value], index) => {
    const comma = index === fields.length - 1 ? '' : ','
    lines.push(`  ${name} = {${escapeBibValue(value)}}${comma}`)
  })
  lines.push('}')
  return lines.join('\n')
}

export function normalizeEntry(entry) {
  if (!entry || typeof entry !== 'object') return null
  const type = cleanToken(entry.type || 'article') || 'article'
  const key = cleanKey(entry.key || '')
  const fields = {}
  for (const [name, value] of Object.entries(entry.fields || {})) {
    const field = cleanToken(name)
    if (!field) continue
    const text = stringField(value)
    if (text !== '') fields[field] = text
  }
  if (entry.doi && !fields.doi) fields.doi = stringField(entry.doi)
  if (entry.title && !fields.title) fields.title = stringField(entry.title)
  return { type, key, fields }
}

export function entryFromReference(ref) {
  const entry = normalizeEntry({
    type: ref?.type || 'article',
    key: ref?.key || '',
    fields: ref?.fields || {},
  })
  if (!entry) throw new Error('Invalid reference row')
  return entry
}

export function entryFromCsl(csl) {
  if (!csl || typeof csl !== 'object') throw new Error('Invalid CSL entry')
  const fields = {}
  setField(fields, 'title', firstString(csl.title))
  setField(fields, 'doi', firstString(csl.DOI, csl.doi))
  setField(fields, 'url', firstString(csl.URL, csl.url))
  setField(fields, 'journal', firstString(csl['container-title'], csl['journal-title']))
  setField(fields, 'publisher', firstString(csl.publisher))
  setField(fields, 'volume', firstString(csl.volume))
  setField(fields, 'number', firstString(csl.issue, csl.number))
  setField(fields, 'pages', firstString(csl.page, csl.pages))
  setField(fields, 'abstract', firstString(csl.abstract))
  const year = cslYear(csl.issued) || cslYear(csl.event_date) || firstString(csl.year)
  setField(fields, 'year', year)
  const authors = Array.isArray(csl.author) ? csl.author.map(formatCslName).filter(Boolean) : []
  if (authors.length > 0) fields.author = authors.join(' and ')
  const type = cslToBibType(csl.type)
  return normalizeEntry({ type, key: '', fields })
}

export function entryFromInput(input = {}) {
  if (input.entry) return normalizeEntry(input.entry)
  if (input.csl) return entryFromCsl(input.csl)
  if (input.type || input.fields || input.title || input.doi) return normalizeEntry(input)
  return null
}

export function withGeneratedKey(entry, existingEntries = []) {
  const normalized = normalizeEntry(entry)
  if (!normalized) throw new Error('Invalid bibliography entry')
  const existing = new Set(existingEntries.map(item => item.key).filter(Boolean))
  if (normalized.key && !existing.has(normalized.key)) return normalized
  const base = baseCitationKey(normalized)
  let key = base
  if (!existing.has(key)) return { ...normalized, key }
  for (const suffix of KEY_SUFFIXES) {
    key = `${base}${suffix}`
    if (!existing.has(key)) return { ...normalized, key }
  }
  let n = 2
  while (existing.has(`${base}${n}`)) n++
  return { ...normalized, key: `${base}${n}` }
}

export function findDuplicate(entries, entry) {
  const targetDoi = normalizeDoi(entry?.fields?.doi)
  if (targetDoi) {
    const duplicate = entries.find(item => normalizeDoi(item?.fields?.doi) === targetDoi)
    if (duplicate) return duplicate
  }
  const target = titleFingerprint(entry)
  if (!target) return null
  return entries.find(item => titleFingerprint(item) === target) || null
}

export function mergeEntryFields(entry, fields) {
  const normalized = normalizeEntry(entry)
  if (!normalized) throw new Error('Invalid bibliography entry')
  const nextFields = { ...normalized.fields }
  for (const [name, value] of Object.entries(fields || {})) {
    const key = cleanToken(name)
    const text = stringField(value)
    if (key && text) nextFields[key] = text
  }
  return { ...normalized, fields: nextFields }
}

export function referenceSummary(entry) {
  const fields = entry?.fields || {}
  return {
    key: entry.key,
    author: authorLabel(fields.author),
    year: fields.year || '',
    title: fields.title || entry.key,
    venue: firstString(fields.journal, fields.booktitle, fields.publisher, fields.institution) || '',
    doi: fields.doi || '',
    hasPdf: Boolean(pdfPathForEntry(entry)),
  }
}

export function pdfPathForEntry(entry) {
  const value = stringField(entry?.fields?.file)
  if (!value) return ''
  const match = value.match(/(?:^|[:;])([^:;{}]+\.pdf)(?:[:;]|$)/i) || value.match(/([^:;{}]+\.pdf)/i)
  if (!match) return ''
  const matched = match[1].trim()
  if (!matched || matched.startsWith('/') || matched.startsWith('..') || /^[A-Za-z]:/.test(matched)) return ''
  const path = matched.replace(/^\/+/, '')
  return path
}

export function normalizeDoi(value) {
  const text = stringField(value)
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//i, '')
    .replace(/^doi:\s*/i, '')
    .trim()
  return text ? text.toLowerCase() : ''
}

export function sniffDoi(text) {
  const match = String(text ?? '').match(/\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i)
  return match ? normalizeDoi(match[0].replace(/[.,;)\]]+$/, '')) : ''
}

function orderedFields(fields) {
  const entries = Object.entries(fields || {}).filter(([, value]) => stringField(value) !== '')
  const order = new Map(FIELD_ORDER.map((name, index) => [name, index]))
  return entries.sort(([a], [b]) => {
    const ao = order.has(a) ? order.get(a) : FIELD_ORDER.length
    const bo = order.has(b) ? order.get(b) : FIELD_ORDER.length
    return ao === bo ? a.localeCompare(b) : ao - bo
  })
}

function escapeBibValue(value) {
  return stringField(value).replace(/\r?\n+/g, ' ').replace(/[{}]/g, '').trim()
}

function cleanToken(value) {
  return String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '')
}

function cleanKey(value) {
  return asciiFold(String(value ?? '').trim()).replace(/[^A-Za-z0-9:_-]+/g, '')
}

function stringField(value) {
  if (value == null) return ''
  if (Array.isArray(value)) return value.map(stringField).filter(Boolean).join('; ')
  return String(value).trim()
}

function setField(fields, name, value) {
  const text = stringField(value)
  if (text) fields[name] = text
}

function firstString(...values) {
  return values.find(value => typeof value === 'string' && value.trim())?.trim() || ''
}

function cslYear(date) {
  const parts = date?.['date-parts']
  const year = Array.isArray(parts) && Array.isArray(parts[0]) ? parts[0][0] : null
  return year ? String(year) : ''
}

function cslToBibType(type) {
  switch (type) {
    case 'book':
    case 'chapter':
    case 'thesis':
    case 'report':
      return type === 'chapter' ? 'incollection' : type
    case 'paper-conference':
      return 'inproceedings'
    case 'article-journal':
    default:
      return 'article'
  }
}

function formatCslName(name) {
  if (!name || typeof name !== 'object') return ''
  if (name.literal) return stringField(name.literal)
  const family = stringField(name.family)
  const given = stringField(name.given)
  if (family && given) return `${family}, ${given}`
  return family || given
}

function baseCitationKey(entry) {
  const family = asciiSlug(firstAuthorFamily(entry.fields.author))
  const year = String(entry.fields.year || '').match(/\d{4}/)?.[0] || ''
  const title = asciiSlug(entry.fields.title).slice(0, 24)
  const base = `${family || title || 'ref'}${year}`.toLowerCase()
  return base || 'ref'
}

function firstAuthorFamily(author) {
  const first = stringField(author).split(/\s+and\s+/i)[0]?.trim() || ''
  if (!first) return ''
  if (first.includes(',')) return first.split(',')[0].trim()
  const parts = first.split(/\s+/).filter(Boolean)
  return parts[parts.length - 1] || ''
}

function authorLabel(author) {
  const family = firstAuthorFamily(author)
  return family || ''
}

function titleFingerprint(entry) {
  const fields = entry?.fields || {}
  const title = asciiSlug(fields.title)
  if (!title) return ''
  const author = asciiSlug(firstAuthorFamily(fields.author))
  const year = String(fields.year || '').match(/\d{4}/)?.[0] || ''
  return `${title}|${author}|${year}`
}

function asciiSlug(value) {
  return asciiFold(value).toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function asciiFold(value) {
  return String(value ?? '').normalize('NFKD').replace(/[^\x00-\x7F]/g, '')
}
