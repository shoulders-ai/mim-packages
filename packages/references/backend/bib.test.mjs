import { describe, expect, it } from 'vitest'
import {
  entryFromCsl,
  findDuplicate,
  mergeEntryFields,
  parseBibtex,
  pdfPathForEntry,
  referenceSummary,
  serializeBibtex,
  sniffDoi,
  withGeneratedKey,
} from './bib.mjs'

describe('references bib model', () => {
  it('round-trips owned entries semantically through BibTeX', () => {
    const entries = [{
      type: 'article',
      key: 'smith2024',
      fields: {
        title: 'Evidence Synthesis',
        author: 'Smith, Jane and Doe, John',
        year: '2024',
        journal: 'Journal of Tests',
        doi: '10.1000/Test.1',
        file: 'pdf/smith2024.pdf',
        keywords: 'hta; methods',
      },
    }]

    const parsed = parseBibtex(serializeBibtex(entries))
    expect(parsed).toEqual(entries)
    expect(referenceSummary(parsed[0])).toMatchObject({
      key: 'smith2024',
      author: 'Smith',
      year: '2024',
      venue: 'Journal of Tests',
      hasPdf: true,
    })
  })

  it('generates stable citation keys and suffixes collisions', () => {
    const first = withGeneratedKey({
      type: 'article',
      fields: { author: 'Garcia Marquez, Ana', year: '2022', title: 'Care pathways' },
    }, [])
    const second = withGeneratedKey({
      type: 'article',
      fields: { author: 'Garcia Marquez, Ana', year: '2022', title: 'Other' },
    }, [first])

    expect(first.key).toBe('garciamarquez2022')
    expect(second.key).toBe('garciamarquez2022a')
  })

  it('dedupes by normalized DOI before title fingerprint', () => {
    const existing = [{
      type: 'article',
      key: 'one',
      fields: { title: 'A', author: 'One, A', year: '2020', doi: 'https://doi.org/10.5555/ABC' },
    }]
    expect(findDuplicate(existing, {
      type: 'article',
      key: 'two',
      fields: { title: 'Different', author: 'Two, B', year: '2022', doi: '10.5555/abc' },
    })?.key).toBe('one')
    expect(findDuplicate(existing, {
      type: 'article',
      key: 'three',
      fields: { title: 'A', author: 'One, A', year: '2020' },
    })?.key).toBe('one')
  })

  it('maps CSL-JSON into a BibTeX entry', () => {
    const entry = entryFromCsl({
      id: 'ignored id',
      type: 'article-journal',
      title: 'CSL Paper',
      DOI: '10.1234/csl',
      author: [{ family: 'Nguyen', given: 'Mai' }],
      issued: { 'date-parts': [[2021, 4, 1]] },
      'container-title': 'CSL Journal',
      page: '12-18',
    })

    expect(entry).toEqual({
      type: 'article',
      key: '',
      fields: {
        title: 'CSL Paper',
        doi: '10.1234/csl',
        journal: 'CSL Journal',
        pages: '12-18',
        year: '2021',
        author: 'Nguyen, Mai',
      },
    })
  })

  it('keeps Better BibTeX PDF paths simple and rejects unsafe file paths', () => {
    const entry = mergeEntryFields({ type: 'article', key: 'x', fields: {} }, { file: 'pdf/x.pdf' })
    expect(pdfPathForEntry(entry)).toBe('pdf/x.pdf')
    expect(pdfPathForEntry({ fields: { file: '../secret.pdf' } })).toBe('')
    expect(pdfPathForEntry({ fields: { file: '/tmp/secret.pdf' } })).toBe('')
  })

  it('sniffs DOI strings from text and URLs', () => {
    expect(sniffDoi('See https://doi.org/10.1000/XYZ.')).toBe('10.1000/xyz')
  })
})
