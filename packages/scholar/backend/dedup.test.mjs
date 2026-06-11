import { describe, expect, it } from 'vitest'
import { deduplicate, exactKey, fuzzyKey } from './dedup.mjs'

function record(source, title, extra = {}) {
  return {
    source,
    title,
    authors: ['Ada Lovelace'],
    year: 2024,
    ids: {},
    provenance: [{ source }],
    ...extra,
  }
}

describe('Scholar deduplication', () => {
  it('merges exact DOI matches and preserves provenance', () => {
    const result = deduplicate([
      record('pubmed', 'Same paper', { ids: { doi: 'https://doi.org/10.1000/ABC' }, abstract: '' }),
      record('europepmc', 'Same paper', { ids: { doi: '10.1000/abc' }, abstract: 'Abstract from Europe PMC' }),
    ])

    expect(result.exactDuplicateCount).toBe(1)
    expect(result.records).toHaveLength(1)
    expect(result.records[0]).toMatchObject({
      ids: { doi: '10.1000/abc' },
      abstract: 'Abstract from Europe PMC',
      sources: ['pubmed', 'europepmc'],
    })
    expect(result.records[0].provenance.map(item => item.source)).toEqual(['pubmed', 'europepmc'])
  })

  it('flags fuzzy duplicates without merging them', () => {
    const result = deduplicate([
      record('pubmed', '  Same title: a randomized trial!  '),
      record('arxiv', 'Same title a randomized trial'),
    ])

    expect(result.records).toHaveLength(2)
    expect(result.possibleDuplicates).toHaveLength(1)
    expect(result.records.every(item => item.possibleDuplicate)).toBe(true)
  })

  it('builds stable exact and fuzzy keys', () => {
    expect(exactKey(record('x', 'Title', { ids: { pmid: '123' } }))).toBe('pmid:123')
    expect(fuzzyKey(record('x', 'Title!', { year: 2020, authors: ['Grace Hopper'] }))).toBe('title|2020|hopper')
  })
})
