import { cleanDoi, compactText, normalizeToken } from './sources/common.mjs'

export function assignBibKeys(records) {
  const used = new Map()
  return records.map(record => {
    const base = baseKey(record)
    const count = used.get(base) || 0
    used.set(base, count + 1)
    const key = count === 0 ? base : `${base}${suffix(count)}`
    return { ...record, bibKey: key }
  })
}

export function recordsToBibtex(records) {
  return records.map(recordToBibtex).join('\n\n') + (records.length ? '\n' : '')
}

export function recordToBibtex(record) {
  const key = record.bibKey || baseKey(record)
  const type = record.type === 'trial' ? 'misc' : record.type === 'preprint' ? 'misc' : 'article'
  const fields = {
    title: record.title,
    author: (record.authors || []).join(' and '),
    year: record.year ? String(record.year) : '',
    journal: type === 'article' ? record.venue : '',
    howpublished: type !== 'article' ? record.venue : '',
    doi: cleanDoi(record.ids?.doi),
    url: record.sourceUrl,
    note: record.type === 'trial' ? 'Clinical trial registry record' : record.type === 'preprint' ? 'Preprint record' : '',
    keywords: ['mim-scholar', record.source, ...(record.sources || [])].filter(Boolean).join('; '),
  }
  const lines = Object.entries(fields)
    .filter(([, value]) => compactText(value))
    .map(([name, value]) => `  ${name} = {${escapeBib(value)}}`)
  return `@${type}{${key},\n${lines.join(',\n')}\n}`
}

function baseKey(record) {
  const author = normalizeToken((record.authors || [])[0]?.split(/\s+/).pop() || '')
  const title = normalizeToken(record.title).split('-').slice(0, 3).join('-')
  const year = record.year ? String(record.year) : 'nd'
  const base = [author || title || record.source || 'record', year].filter(Boolean).join('')
  return base.replace(/-/g, '').slice(0, 48) || 'record'
}

function suffix(n) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz'
  return alphabet[(n - 1) % alphabet.length] || String(n)
}

function escapeBib(value) {
  return compactText(value).replace(/[{}]/g, '')
}
