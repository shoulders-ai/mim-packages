import { describe, expect, it } from 'vitest'
import { createArxivAdapter, parseArxivEntry } from './sources/arxiv.mjs'
import { parseClinicalTrial } from './sources/clinicaltrials.mjs'
import { parseEuropePmcItem } from './sources/europepmc.mjs'
import { abstractFromInvertedIndex, parseOpenAlexWork } from './sources/openalex.mjs'
import { parsePubmedXml } from './sources/pubmed.mjs'
import { parseSemanticScholarPaper } from './sources/semanticscholar.mjs'

describe('Scholar source adapters', () => {
  it('parses PubMed XML into a normalized candidate', () => {
    const [record] = parsePubmedXml(`
      <PubmedArticle>
        <MedlineCitation>
          <PMID>123</PMID>
          <Article>
            <ArticleTitle>Shoulder rehabilitation after surgery</ArticleTitle>
            <Abstract><AbstractText>Exercise improved pain.</AbstractText></Abstract>
            <Journal><Title>Trials Journal</Title><JournalIssue><PubDate><Year>2024</Year></PubDate></JournalIssue></Journal>
            <AuthorList><Author><ForeName>Ada</ForeName><LastName>Lovelace</LastName></Author></AuthorList>
          </Article>
        </MedlineCitation>
        <PubmedData><ArticleIdList><ArticleId IdType="doi">10.1000/example</ArticleId></ArticleIdList></PubmedData>
      </PubmedArticle>
    `)

    expect(record).toMatchObject({
      source: 'pubmed',
      title: 'Shoulder rehabilitation after surgery',
      authors: ['Ada Lovelace'],
      year: 2024,
      ids: { pmid: '123', doi: '10.1000/example' },
      abstract: 'Exercise improved pain.',
    })
  })

  it('maps Europe PMC, ClinicalTrials, arXiv, OpenAlex, and Semantic Scholar records', () => {
    expect(parseEuropePmcItem({
      id: '1',
      source: 'MED',
      title: 'Health economics review',
      authorString: 'Smith J, Jones A.',
      pubYear: '2025',
      journalTitle: 'Value Health',
      doi: '10.1/abc',
      abstractText: 'Costs were lower.',
    })).toMatchObject({ source: 'europepmc', type: 'article', year: 2025, ids: { doi: '10.1/abc' } })

    expect(parseClinicalTrial({
      protocolSection: {
        identificationModule: { nctId: 'NCT1', briefTitle: 'Trial title' },
        statusModule: { startDateStruct: { date: '2023-01-01' }, overallStatus: 'COMPLETED' },
        descriptionModule: { briefSummary: 'Registry abstract.' },
      },
    })).toMatchObject({ source: 'clinicaltrials', type: 'trial', ids: { nct: 'NCT1' }, year: 2023 })

    expect(parseArxivEntry(`
      <entry><id>http://arxiv.org/abs/2401.12345v1</id><title>Preprint title</title>
      <published>2024-01-01T00:00:00Z</published><summary>Preprint abstract.</summary>
      <author><name>Jane Roe</name></author><category term="cs.CL" /><arxiv:doi>10.2/preprint</arxiv:doi></entry>
    `)).toMatchObject({ source: 'arxiv', type: 'preprint', venue: 'arXiv cs.CL', ids: { arxiv: '2401.12345', doi: '10.2/preprint' } })

    expect(abstractFromInvertedIndex({ Exercise: [0], helps: [1], pain: [2] })).toBe('Exercise helps pain')
    expect(parseOpenAlexWork({
      id: 'https://openalex.org/W1',
      doi: 'https://doi.org/10.3/open',
      display_name: 'OpenAlex title',
      publication_year: 2022,
      authorships: [{ author: { display_name: 'Kai Lee' } }],
      abstract_inverted_index: { Open: [0], abstract: [1] },
    })).toMatchObject({ source: 'openalex', ids: { doi: '10.3/open', openalex: 'W1' }, abstract: 'Open abstract' })

    expect(parseSemanticScholarPaper({
      paperId: 'S2',
      externalIds: { DOI: '10.4/s2', PubMed: '456' },
      title: 'Semantic title',
      year: 2021,
      authors: [{ name: 'R. Scholar' }],
      abstract: 'S2 abstract',
    })).toMatchObject({ source: 'semanticscholar', ids: { s2: 'S2', doi: '10.4/s2', pmid: '456' } })
  })

  it('lets tests create an arXiv adapter without waiting for the production delay', async () => {
    const sleeps = []
    let now = 1000
    const adapter = createArxivAdapter({ minDelayMs: 3000, sleep: async ms => sleeps.push(ms), clock: () => now })
    const ctx = { http: { request: async () => ({ ok: true, text: async () => '<feed></feed>' }) } }

    await adapter.search(ctx, { query: 'all:test' })
    now = 2000
    await adapter.search(ctx, { query: 'all:test' })

    expect(sleeps).toEqual([2000])
  })
})
