import { describe, expect, it } from 'vitest'
import { analyzePdf, collectDoiCandidates, titleFromPdfExtraction } from './pdf.mjs'

describe('PDF analysis', () => {
  it('finds DOI candidates from metadata, text, and arXiv identifiers', () => {
    const candidates = collectDoiCandidates({
      info: { Subject: 'Published as https://doi.org/10.5555/Meta.' },
      text: 'Preprint arXiv:2401.12345 and doi:10.7777/text',
    })

    expect(candidates.map(item => item.doi)).toEqual([
      '10.5555/meta',
      '10.7777/text',
      '10.48550/arxiv.2401.12345',
    ])
    expect(candidates[0].source).toBe('metadata.Subject')
  })

  it('prefers credible title candidates over noisy first-page lines', () => {
    const title = titleFromPdfExtraction({
      info: {},
      text: [
        'Downloaded from example.com by guest',
        'Abstract',
        'A Better Paper Title for Import',
        'Smith J, Doe P',
      ].join('\n'),
    })

    expect(title).toBe('A Better Paper Title for Import')
  })

  it('reports scanned and truncated warnings from extraction stats', async () => {
    const ctx = {
      documents: {
        pdf: {
          async extract() {
            return { text: '', pages: 4, total_chars: 0, truncated: true, info: {} }
          },
        },
      },
    }

    const analysis = await analyzePdf(ctx, 'references/pdf/scanned.pdf')

    expect(analysis.warnings).toEqual(['text-truncated', 'likely-scanned'])
    expect(analysis.stats).toMatchObject({ pages: 4, totalChars: 0, emittedChars: 0 })
  })
})
