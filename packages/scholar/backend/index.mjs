import { deduplicate } from './dedup.mjs'
import { assignBibKeys } from './bib.mjs'
import { answerWithAi, buildArtifacts, defaultPlan, planWithAi, screenWithAi, slugFor } from './outputs.mjs'
import { adapters, enabledAdapters, knownSources, SOURCE_ORDER } from './sources/index.mjs'
import { capRecords, sourceResult, withProvenance } from './sources/common.mjs'

const DEFAULT_SOURCE_IDS = ['pubmed', 'europepmc', 'clinicaltrials', 'arxiv', 'semanticscholar', 'openalex']

const runSearchSchema = {
  type: 'object',
  properties: {
    question: { type: 'string' },
    criteria: { type: 'string' },
    sources: { type: 'array', items: { type: 'string' } },
    depth: { type: 'string', enum: ['quick', 'standard', 'deep'] },
    max_results_per_source: { type: 'number' },
    use_ai_plan: { type: 'boolean' },
    use_ai_screening: { type: 'boolean' },
    use_ai_answer: { type: 'boolean' },
    slug: { type: 'string' },
  },
  required: ['question'],
}

const searchSchema = {
  type: 'object',
  properties: {
    query: { type: 'string' },
    sources: { type: 'array', items: { type: 'string' } },
    max_results_per_source: { type: 'number' },
  },
  required: ['query'],
}

const lookupSchema = {
  type: 'object',
  properties: {
    ids: { type: 'array', items: { type: 'object' } },
    sources: { type: 'array', items: { type: 'string' } },
  },
  required: ['ids'],
}

const citationsSchema = {
  type: 'object',
  properties: {
    ids: { type: 'array', items: { type: 'object' } },
    direction: { type: 'string', enum: ['forward', 'backward'] },
    sources: { type: 'array', items: { type: 'string' } },
  },
  required: ['ids'],
}

export const jobs = {
  runSearch: {
    label: 'Run literature search',
    inputSchema: runSearchSchema,
    concurrency: 'parallel',
    async run(ctx, input) {
      return runSearch(ctx, input)
    },
  },
}

export const tools = {
  search: {
    name: 'litsearch.search',
    label: 'Search literature',
    description: 'Search public academic databases and return a bounded, source-grounded candidate set. The candidate list is built only from HTTP responses.',
    inputSchema: searchSchema,
    audience: ['chat'],
    async execute(ctx, input) {
      const sourceIds = await selectedSourceIds(ctx, input)
      const sourceResults = await executeSources(ctx, sourceIds, defaultPlan({ question: input.query }), capRecords(input.max_results_per_source, 10, 40))
      const allRecords = sourceResults.flatMap(result => result.records)
      const dedup = deduplicate(allRecords)
      return {
        query: input.query,
        sources: summarizeResults(sourceResults),
        candidates: dedup.records.slice(0, 80).map(publicCandidate),
        exactDuplicateCount: dedup.exactDuplicateCount,
        possibleDuplicates: dedup.possibleDuplicates,
      }
    },
  },

  lookup: {
    name: 'litsearch.lookup',
    label: 'Look up literature records',
    description: 'Look up known literature records by source identifiers such as DOI, PMID, arXiv id, NCT id, OpenAlex id, or Semantic Scholar paper id.',
    inputSchema: lookupSchema,
    audience: ['chat'],
    async execute(ctx, input) {
      const sourceIds = await selectedSourceIds(ctx, input)
      const sourceResults = []
      for (const adapter of enabledAdapters(sourceIds)) {
        sourceResults.push(await guardedSourceCall(adapter, 'getByIds', ctx, input.ids || []))
      }
      const dedup = deduplicate(sourceResults.flatMap(result => result.records))
      return {
        sources: summarizeResults(sourceResults),
        candidates: dedup.records.map(publicCandidate),
        possibleDuplicates: dedup.possibleDuplicates,
      }
    },
  },

  citations: {
    name: 'litsearch.citations',
    label: 'Expand citations',
    description: 'Expand forward or backward citations for source-grounded records where a source exposes citation graph metadata. OpenAlex requires openalex_api_key; Semantic Scholar works best with semantic_scholar_api_key.',
    inputSchema: citationsSchema,
    audience: ['chat'],
    async execute(ctx, input) {
      const sourceIds = await selectedSourceIds(ctx, { ...input, sources: input.sources || ['openalex', 'semanticscholar'] })
      const direction = input.direction === 'backward' ? 'backward' : 'forward'
      const sourceResults = []
      for (const adapter of enabledAdapters(sourceIds)) {
        sourceResults.push(await guardedSourceCall(adapter, 'citations', ctx, input.ids || [], direction))
      }
      const dedup = deduplicate(sourceResults.flatMap(result => result.records))
      return {
        direction,
        sources: summarizeResults(sourceResults),
        candidates: dedup.records.map(publicCandidate),
        possibleDuplicates: dedup.possibleDuplicates,
      }
    },
  },

  sourceStatus: {
    label: 'Literature source status',
    description: 'Report which Scholar literature sources are configured, limited, or missing API keys.',
    inputSchema: { type: 'object', properties: {} },
    audience: [],
    async execute(ctx) {
      return { sources: await getSourceStatuses(ctx) }
    },
  },
}

export async function agentContext(ctx) {
  const records = await ctx.data.collection('searches').list()
  const recent = records
    .map(item => item.value)
    .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
    .slice(0, 5)
  if (!recent.length) return 'No Scholar literature searches recorded yet.'
  return {
    title: 'Scholar searches',
    body: recent.map(item => `${item.createdAt || ''} ${item.slug}: ${item.included || 0}/${item.deduped || 0} included`).join('\n'),
  }
}

export async function runSearch(ctx, input = {}) {
  const question = String(input.question || '').trim()
  if (!question) throw new Error('Missing required input: question')
  const sourceIds = await selectedSourceIds(ctx, input)
  const maxResults = resolveMaxResults(input)
  const createdAt = ctx.job?.startedAt || new Date().toISOString()
  const slug = slugFor(input, new Date(createdAt))
  const warnings = []

  await ctx.progress.step('Understanding the question')
  await ctx.progress.progress(0.04, 'Building search terms')
  const planned = await planWithAi(ctx, { ...input, question }, sourceIds)
  warnings.push(...planned.warnings)
  await ctx.progress.progress(0.16, 'Search terms ready')

  await ctx.progress.step('Searching sources')
  const sourceStatuses = await getSourceStatuses(ctx)
  const sourceResults = await executeSources(ctx, sourceIds, planned.plan, maxResults)
  warnings.push(...sourceResults.flatMap(result => result.warnings || []))
  await ctx.progress.progress(0.66, `${sourceResults.reduce((sum, result) => sum + result.recordsReturned, 0)} records found`)

  await ctx.progress.step('Removing duplicates')
  await ctx.progress.progress(0.7, 'Comparing identifiers and titles')
  const candidatesWithProvenance = sourceResults.flatMap(result =>
    result.records.map((record, index) => withProvenance(record, result, index)),
  )
  const dedup = deduplicate(candidatesWithProvenance)
  const candidates = dedup.records.map((record, index) => ({ ...record, tempKey: `r${index + 1}` }))
  await ctx.progress.progress(0.78, `${candidates.length} unique records`)

  await ctx.progress.step('Sorting records')
  await ctx.progress.progress(0.82, planned.plan.criteria ? 'Ranking records against your focus' : 'Ranking likely matches')
  const screened = input.use_ai_screening === false
    ? { records: candidates.map(record => ({ ...record, screen: { decision: 'maybe', reason: 'AI screening disabled; needs human review', criteriaMatched: [] } })), ai: null, warnings: [] }
    : await screenWithAi(ctx, candidates, planned.plan, { progress: ctx.progress })
  warnings.push(...screened.warnings)

  await ctx.progress.progress(0.91, 'Drafting answer from abstracts')
  const answerRecords = assignBibKeys(screened.records)
  const answered = input.use_ai_answer === false
    ? { answer: null, ai: null, warnings: [] }
    : await answerWithAi(ctx, planned.plan, answerRecords)
  warnings.push(...answered.warnings)

  await ctx.progress.step('Writing the brief')
  await ctx.progress.progress(0.93, 'Saving summary and evidence files')
  const artifacts = buildArtifacts({
    slug,
    createdAt,
    plan: planned.plan,
    candidates: screened.records,
    sourceResults,
    sourceStatuses,
    dedup,
    planAi: planned.ai,
    screenAi: screened.ai,
    answerAi: answered.ai,
    answer: answered.answer,
    warnings,
  })
  const folder = `searches/${slug}`
  await writeArtifacts(ctx, folder, artifacts)
  await ctx.data.collection('searches').put(ctx.job?.runId || slug, {
    slug,
    question,
    createdAt: artifacts.searchJson.createdAt,
    deduped: artifacts.searchJson.flow.deduped,
    included: artifacts.searchJson.flow.included,
    folder,
    warnings,
  })

  const outputs = [
    { kind: 'markdown', label: 'Brief', path: `${folder}/summary.md`, action: 'Open brief', openWith: 'editor' },
    { kind: 'json', label: 'Search record', path: `${folder}/search.json`, action: 'Open search.json', openWith: 'editor' },
    { kind: 'json', label: 'Candidate records', path: `${folder}/candidates.json`, action: 'Open candidates', openWith: 'editor' },
    { kind: 'bibtex', label: 'Run BibTeX', path: `${folder}/results.bib`, action: 'Open BibTeX', openWith: 'editor' },
    { kind: 'csv', label: 'Study table', path: `${folder}/table.csv`, action: 'Open table', openWith: 'editor' },
  ]
  const result = {
    slug,
    folder,
    flow: artifacts.searchJson.flow,
    warnings,
    sourceResults: summarizeResults(sourceResults),
    primaryOutput: outputs[0],
    evidenceOutputs: outputs.slice(1),
    outputs,
  }
  await ctx.progress.done(`Search complete: ${result.flow.included} included of ${result.flow.deduped} deduped records`)
  return result
}

function resolveMaxResults(input = {}) {
  if (input.max_results_per_source != null) return capRecords(input.max_results_per_source, 8, 80)
  if (input.depth === 'deep') return 30
  if (input.depth === 'standard') return 15
  return 8
}

async function executeSources(ctx, sourceIds, plan, maxResults) {
  const selected = enabledAdapters(sourceIds)
  if (ctx.progress?.progress) await ctx.progress.progress(0.22, `${selected.length} sources queued`)
  let completed = 0
  const results = await Promise.all(selected.map(async adapter => {
    const sourceQuery = { ...(plan.sourceQueries?.[adapter.source] || {}), maxResults }
    const result = await guardedSourceCall(adapter, 'search', ctx, sourceQuery)
    completed += 1
    if (ctx.progress?.progress) await ctx.progress.progress(0.22 + (completed / Math.max(selected.length, 1)) * 0.4, `${completed}/${selected.length} sources searched`)
    return result
  }))
  return results
}

async function guardedSourceCall(adapter, method, ctx, ...args) {
  try {
    return await adapter[method](ctx, ...args)
  } catch (error) {
    return sourceResult(adapter.source, { method, args }, [], { warnings: [`${adapter.source} ${method} failed: ${error.message}`] })
  }
}

async function selectedSourceIds(ctx, input = {}) {
  const explicit = Array.isArray(input.sources) && input.sources.length
  const requested = explicit
    ? input.sources.map(String)
    : DEFAULT_SOURCE_IDS
  const allowed = new Set(knownSources())
  if (explicit) return requested.filter(source => allowed.has(source))
  const statuses = await getSourceStatuses(ctx)
  const statusBySource = new Map(statuses.map(item => [item.source, item]))
  return requested
    .filter(source => allowed.has(source))
    .filter(source => source !== 'openalex' || statusBySource.get('openalex')?.configured)
}

async function getSourceStatuses(ctx) {
  const statuses = []
  for (const source of SOURCE_ORDER) {
    statuses.push(await adapters[source].status(ctx))
  }
  return statuses
}

async function writeArtifacts(ctx, folder, artifacts) {
  await ctx.tools.call('fs.mkdir', { path: folder })
  await ctx.tools.call('fs.write', { path: `${folder}/search.json`, content: JSON.stringify(artifacts.searchJson, null, 2) + '\n' })
  await ctx.tools.call('fs.write', { path: `${folder}/candidates.json`, content: JSON.stringify(artifacts.candidatesJson, null, 2) + '\n' })
  await ctx.tools.call('fs.write', { path: `${folder}/results.bib`, content: artifacts.bibtex })
  await ctx.tools.call('fs.write', { path: `${folder}/table.csv`, content: artifacts.tableCsv })
  await ctx.tools.call('fs.write', { path: `${folder}/summary.md`, content: artifacts.summaryMarkdown })
}

function summarizeResults(sourceResults) {
  return sourceResults.map(result => ({
    source: result.source,
    recordsReturned: result.recordsReturned,
    rawCount: result.rawCount,
    warnings: result.warnings || [],
    query: result.query,
  }))
}

function publicCandidate(record) {
  return {
    title: record.title,
    authors: record.authors,
    year: record.year,
    venue: record.venue,
    type: record.type,
    source: record.source,
    sources: record.sources || [record.source],
    ids: record.ids,
    sourceUrl: record.sourceUrl,
    abstract: record.abstract ? record.abstract.slice(0, 1200) : '',
    citedByCount: record.citedByCount,
    possibleDuplicate: record.possibleDuplicate === true,
  }
}
