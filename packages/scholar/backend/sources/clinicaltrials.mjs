import {
  capRecords,
  candidateBase,
  compactText,
  httpJson,
  queryParam,
  sourceResult,
} from './common.mjs'

const SOURCE = 'clinicaltrials'

export async function status() {
  return {
    source: SOURCE,
    configured: true,
    limited: false,
    label: 'Keyless ClinicalTrials.gov API v2',
  }
}

export async function search(ctx, query) {
  const term = compactText(query?.term || query?.query || query)
  if (!term) return sourceResult(SOURCE, { term }, [], { warnings: ['ClinicalTrials.gov query was empty'] })
  const pageSize = capRecords(query?.maxResults, 25, 100)
  const url = `https://clinicaltrials.gov/api/v2/studies?${queryParam({
    'query.term': term,
    pageSize,
    format: 'json',
  })}`
  const data = await httpJson(ctx, SOURCE, url)
  const studies = Array.isArray(data?.studies) ? data.studies : []
  return sourceResult(SOURCE, { term, pageSize }, studies.map(parseClinicalTrial), {
    rawCount: Number(data?.totalCount) || studies.length,
    page: data?.nextPageToken ? { nextPageToken: data.nextPageToken } : null,
  })
}

export async function getByIds(ctx, ids = []) {
  const ncts = ids.map(id => compactText(id?.nct || id)).filter(Boolean)
  const records = []
  const warnings = []
  for (const nct of ncts.slice(0, 20)) {
    try {
      const data = await httpJson(ctx, SOURCE, `https://clinicaltrials.gov/api/v2/studies/${encodeURIComponent(nct)}`)
      records.push(parseClinicalTrial(data))
    } catch (error) {
      warnings.push(`${nct}: ${error.message}`)
    }
  }
  return sourceResult(SOURCE, { ids: ncts }, records.filter(record => record.title), { warnings, requestIds: ncts })
}

export async function citations() {
  return sourceResult(SOURCE, { direction: 'unsupported' }, [], { warnings: ['ClinicalTrials.gov records do not provide citation graph expansion'] })
}

export function parseClinicalTrial(study = {}) {
  const protocol = study.protocolSection || study
  const id = protocol.identificationModule?.nctId || study.nctId
  const title = protocol.identificationModule?.officialTitle || protocol.identificationModule?.briefTitle || study.title
  const status = protocol.statusModule?.overallStatus || ''
  const design = protocol.designModule?.studyType || ''
  const conditions = protocol.conditionsModule?.conditions || []
  const interventions = (protocol.armsInterventionsModule?.interventions || [])
    .map(item => [item.type, item.name].filter(Boolean).join(': '))
  const brief = protocol.descriptionModule?.briefSummary || ''
  const outcome = protocol.outcomesModule?.primaryOutcomes?.[0]?.measure || ''
  const year = (protocol.statusModule?.startDateStruct?.date || '').match(/\b(18|19|20|21)\d{2}\b/)?.[0] || null
  return candidateBase(SOURCE, {
    title,
    authors: [protocol.sponsorCollaboratorsModule?.leadSponsor?.name].filter(Boolean),
    year,
    venue: 'ClinicalTrials.gov',
    type: 'trial',
    abstract: [brief, conditions.length ? `Conditions: ${conditions.join('; ')}` : '', interventions.length ? `Interventions: ${interventions.join('; ')}` : '', outcome ? `Primary outcome: ${outcome}` : ''].filter(Boolean).join(' '),
    ids: { nct: id },
    sourceUrl: id ? `https://clinicaltrials.gov/study/${id}` : '',
    raw: { status, design, protocol },
    abstractSource: brief ? 'clinicaltrials' : '',
  })
}

export const clinicalTrialsAdapter = { source: SOURCE, status, search, getByIds, citations }
