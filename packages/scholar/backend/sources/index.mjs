import { arxivAdapter } from './arxiv.mjs'
import { clinicalTrialsAdapter } from './clinicaltrials.mjs'
import { europePmcAdapter } from './europepmc.mjs'
import { openAlexAdapter } from './openalex.mjs'
import { pubmedAdapter } from './pubmed.mjs'
import { semanticScholarAdapter } from './semanticscholar.mjs'

export const SOURCE_ORDER = ['pubmed', 'europepmc', 'openalex', 'clinicaltrials', 'arxiv', 'semanticscholar']

export const adapters = {
  pubmed: pubmedAdapter,
  europepmc: europePmcAdapter,
  openalex: openAlexAdapter,
  clinicaltrials: clinicalTrialsAdapter,
  arxiv: arxivAdapter,
  semanticscholar: semanticScholarAdapter,
}

export function knownSources() {
  return SOURCE_ORDER.slice()
}

export function enabledAdapters(sourceIds = SOURCE_ORDER) {
  return sourceIds.map(id => adapters[id]).filter(Boolean)
}
