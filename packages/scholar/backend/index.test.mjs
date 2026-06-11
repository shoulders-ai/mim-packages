import { describe, expect, it } from 'vitest'
import { jobs, tools } from './index.mjs'
import { makeCtx } from '../test/harness.mjs'

const PUBMED_XML = `
  <PubmedArticleSet>
    <PubmedArticle>
      <MedlineCitation>
        <PMID>123</PMID>
        <Article>
          <ArticleTitle>Exercise therapy after shoulder surgery</ArticleTitle>
          <Abstract><AbstractText>Exercise reduced pain in adults.</AbstractText></Abstract>
          <Journal><Title>Rehabilitation Journal</Title><JournalIssue><PubDate><Year>2024</Year></PubDate></JournalIssue></Journal>
          <AuthorList><Author><ForeName>Ada</ForeName><LastName>Lovelace</LastName></Author></AuthorList>
        </Article>
      </MedlineCitation>
      <PubmedData><ArticleIdList><ArticleId IdType="doi">10.1000/shoulder</ArticleId></ArticleIdList></PubmedData>
    </PubmedArticle>
  </PubmedArticleSet>
`

function routes() {
  return [
    {
      match: input => input.url.includes('esearch.fcgi'),
      respond: {
        body: {
          esearchresult: {
            count: '1',
            idlist: ['123'],
            webenv: 'NCBI_ENV',
            querykey: '1',
          },
        },
      },
    },
    {
      match: input => input.url.includes('efetch.fcgi'),
      respond: { body: PUBMED_XML },
    },
    {
      match: input => input.url.includes('europepmc'),
      respond: {
        body: {
          hitCount: 1,
          resultList: {
            result: [{
              id: '123',
              source: 'MED',
              pmid: '123',
              doi: '10.1000/shoulder',
              title: 'Exercise therapy after shoulder surgery',
              authorString: 'Lovelace A.',
              pubYear: '2024',
              journalTitle: 'Rehabilitation Journal',
              abstractText: 'Exercise reduced pain in adults.',
            }],
          },
        },
      },
    },
  ]
}

describe('Scholar backend', () => {
  it('runs a source-grounded search job and writes reproducible artifacts', async () => {
    const ctx = makeCtx({
      routes: routes(),
      aiResponses: [{
        answer: 'Exercise therapy appears relevant after shoulder surgery based on the retrieved abstracts.',
        findings: [{ text: 'The retrieved abstract reports reduced pain in adults.', citations: ['lovelace2024'] }],
        caveats: ['This is abstract-level only.'],
      }],
    })

    const result = await jobs.runSearch.run(ctx, {
      question: 'exercise therapy after shoulder surgery',
      criteria: 'adult rehabilitation studies',
      sources: ['pubmed', 'europepmc'],
      max_results_per_source: 3,
      use_ai_plan: false,
      use_ai_screening: false,
      slug: 'shoulder-search',
    })

    expect(ctx.progress.records.steps).toEqual([
      'Understanding the question',
      'Searching sources',
      'Removing duplicates',
      'Sorting records',
      'Writing the brief',
    ])
    expect(ctx.progress.records.values[0]).toEqual({ value: 0.04, label: 'Building search terms' })
    expect(ctx.progress.records.values.some(item => item.label === '1/2 sources searched')).toBe(true)
    expect(ctx.progress.records.values.some(item => item.label === 'Drafting answer from abstracts')).toBe(true)
    expect(result.flow).toMatchObject({ identified: 2, exactDuplicates: 1, deduped: 1, included: 1 })
    expect(result.primaryOutput).toMatchObject({
      label: 'Brief',
      path: 'searches/2026-06-15-shoulder-search/summary.md',
    })
    expect(result.outputs.map(output => output.path)).toEqual([
      'searches/2026-06-15-shoulder-search/summary.md',
      'searches/2026-06-15-shoulder-search/search.json',
      'searches/2026-06-15-shoulder-search/candidates.json',
      'searches/2026-06-15-shoulder-search/results.bib',
      'searches/2026-06-15-shoulder-search/table.csv',
    ])

    const searchJson = JSON.parse(ctx.tools.writes.get('searches/2026-06-15-shoulder-search/search.json'))
    expect(searchJson.sourceResults).toHaveLength(2)
    expect(searchJson.answer.answer).toContain('Exercise therapy appears relevant')
    expect(searchJson.sourceResults[0].page).toMatchObject({ queryKey: '1', webenv: 'NCBI_ENV' })
    expect(searchJson.decisions[0]).toMatchObject({
      title: 'Exercise therapy after shoulder surgery',
      screen: { decision: 'maybe', reason: 'AI screening disabled; needs human review' },
    })
    expect(ctx.tools.writes.get('searches/2026-06-15-shoulder-search/results.bib')).toContain('@article{lovelace2024')
    const summary = ctx.tools.writes.get('searches/2026-06-15-shoulder-search/summary.md')
    expect(summary).toContain('# Literature brief')
    expect(summary).toContain('## Answer')
    expect(summary).toContain('Exercise therapy appears relevant')
    expect(summary).toContain('[@lovelace2024]')
  })

  it('keeps OpenAlex missing-key state visible when explicitly requested', async () => {
    const ctx = makeCtx()

    const result = await tools.search.execute(ctx, {
      query: 'shoulder surgery',
      sources: ['openalex'],
      max_results_per_source: 2,
    })

    expect(ctx.http.calls).toHaveLength(0)
    expect(result.candidates).toEqual([])
    expect(result.sources[0]).toMatchObject({
      source: 'openalex',
      recordsReturned: 0,
      warnings: ['OpenAlex skipped: missing openalex_api_key'],
    })
  })

  it('exposes stable named tools for chat and CLI', () => {
    expect(tools.search.name).toBe('litsearch.search')
    expect(tools.lookup.name).toBe('litsearch.lookup')
    expect(tools.citations.name).toBe('litsearch.citations')
  })
})
