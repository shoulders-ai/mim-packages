import { assignBibKeys, recordsToBibtex } from './bib.mjs'
import { compactText, normalizeToken } from './sources/common.mjs'

export const PLAN_SCHEMA_VERSION = 'scholar-search-v1'
export const SCREEN_SCHEMA_VERSION = 'scholar-screen-v1'
export const ANSWER_SCHEMA_VERSION = 'scholar-answer-v1'

export function defaultPlan(input = {}) {
  const question = compactText(input.question || input.query)
  const criteria = compactText(input.criteria || input.inclusionCriteria || '')
  const query = [question, criteria].filter(Boolean).join(' ')
  return {
    schemaVersion: PLAN_SCHEMA_VERSION,
    question,
    criteria,
    concepts: question ? [question] : [],
    sourceQueries: {
      pubmed: { term: query },
      europepmc: { query },
      openalex: { search: query },
      clinicaltrials: { term: query },
      arxiv: { query: query ? `all:${query}` : '' },
      semanticscholar: { query },
    },
  }
}

export async function planWithAi(ctx, input, sourceIds) {
  const fallback = defaultPlan(input)
  if (input.use_ai_plan === false) return { plan: fallback, ai: null, warnings: [] }
  try {
    const result = await ctx.ai.generateObject({
      system: 'You design reproducible literature search queries. Return only database query strings; do not invent records.',
      prompt: `Research question:\n${fallback.question}\n\nOptional focus or exclusions:\n${fallback.criteria || '(none supplied)'}\n\nSources: ${sourceIds.join(', ')}\n\nReturn concise source-specific search queries. Keep them broad enough to find relevant answer sources.`,
      schema: {
        type: 'object',
        properties: {
          concepts: { type: 'array', items: { type: 'string' } },
          pubmed: { type: 'string' },
          europepmc: { type: 'string' },
          openalex: { type: 'string' },
          clinicaltrials: { type: 'string' },
          arxiv: { type: 'string' },
          semanticscholar: { type: 'string' },
        },
      },
      maxOutputTokens: 1200,
      temperature: 0.1,
    })
    const object = result?.object || {}
    const plan = {
      ...fallback,
      concepts: Array.isArray(object.concepts) && object.concepts.length ? object.concepts.map(compactText).filter(Boolean) : fallback.concepts,
      sourceQueries: {
        pubmed: { term: compactText(object.pubmed) || fallback.sourceQueries.pubmed.term },
        europepmc: { query: compactText(object.europepmc) || fallback.sourceQueries.europepmc.query },
        openalex: { search: compactText(object.openalex) || fallback.sourceQueries.openalex.search },
        clinicaltrials: { term: compactText(object.clinicaltrials) || fallback.sourceQueries.clinicaltrials.term },
        arxiv: { query: compactText(object.arxiv) || fallback.sourceQueries.arxiv.query },
        semanticscholar: { query: compactText(object.semanticscholar) || fallback.sourceQueries.semanticscholar.query },
      },
    }
    return { plan, ai: aiDescriptor(result, PLAN_SCHEMA_VERSION), warnings: [] }
  } catch (error) {
    return { plan: fallback, ai: null, warnings: [`AI planning unavailable: ${error.message}`] }
  }
}

export async function screenWithAi(ctx, records, plan, { batchSize = 12, progress = null, progressStart = 0.82, progressEnd = 0.9 } = {}) {
  if (!records.length) return { records, ai: null, warnings: [] }
  const screened = records.map(record => ({ ...record, screen: { decision: 'unscreened', reason: 'AI screening not run', criteriaMatched: [] } }))
  const ai = []
  const warnings = []
  const question = compactText(plan?.question || '')
  const criteria = compactText(plan?.criteria || '')
  const batches = Math.ceil(screened.length / batchSize)
  for (let i = 0; i < screened.length; i += batchSize) {
    const batch = screened.slice(i, i + batchSize)
    const batchNumber = Math.floor(i / batchSize) + 1
    if (progress?.progress) await progress.progress(progressStart + ((batchNumber - 1) / Math.max(batches, 1)) * (progressEnd - progressStart), `Ranking abstracts ${batchNumber}/${batches}`)
    try {
      const result = await ctx.ai.generateObject({
        system: 'You rank literature-search records for relevance. Use only record metadata and abstracts. Exclude records that clearly do not help answer the question.',
        prompt: `Question:\n${question}\n\nOptional focus or exclusions:\n${criteria || '(none supplied)'}\n\nFor each record, decide whether it is a likely answer source. If no focus is supplied, judge topical relevance to the question only. Keep reasons short and specific to the question.\n\nRecords:\n${JSON.stringify(batch.map(record => ({
          key: record.tempKey,
          title: record.title,
          abstract: record.abstract,
          year: record.year,
          type: record.type,
          source: record.source,
        })), null, 2)}`,
        schema: {
          type: 'object',
          properties: {
            decisions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  key: { type: 'string' },
                  decision: { type: 'string', enum: ['include', 'maybe', 'exclude'] },
                  reason: { type: 'string' },
                  criteriaMatched: { type: 'array', items: { type: 'string' } },
                },
                required: ['key', 'decision', 'reason'],
              },
            },
          },
          required: ['decisions'],
        },
        maxOutputTokens: 2400,
        temperature: 0,
      })
      ai.push(aiDescriptor(result, SCREEN_SCHEMA_VERSION))
      const decisions = Array.isArray(result?.object?.decisions) ? result.object.decisions : []
      for (const decision of decisions) {
        const record = screened.find(item => item.tempKey === decision.key)
        if (!record) continue
        record.screen = {
          decision: ['include', 'maybe', 'exclude'].includes(decision.decision) ? decision.decision : 'maybe',
          reason: compactText(decision.reason),
          criteriaMatched: Array.isArray(decision.criteriaMatched) ? decision.criteriaMatched.map(compactText).filter(Boolean) : [],
          actor: 'ai',
        }
      }
      if (progress?.progress) await progress.progress(progressStart + (batchNumber / Math.max(batches, 1)) * (progressEnd - progressStart), `Ranked abstracts ${batchNumber}/${batches}`)
    } catch (error) {
      warnings.push(`AI screening unavailable for batch ${batchNumber}: ${error.message}`)
    }
  }
  return { records: screened, ai, warnings }
}

export async function answerWithAi(ctx, plan, records, { maxRecords = 14 } = {}) {
  const usable = records
    .filter(record => record.screen?.decision !== 'exclude')
    .slice(0, maxRecords)
  if (!usable.length) return { answer: null, ai: null, warnings: [] }
  try {
    const result = await ctx.ai.generateObject({
      system: 'You write concise evidence answers from retrieved literature records. Use only supplied titles, metadata, abstracts, and citation keys. Never invent prevalence values, countries, methods, or conclusions.',
      prompt: `Question:\n${plan.question || '(not supplied)'}\n\nOptional focus or exclusions:\n${plan.criteria || '(none supplied)'}\n\nWrite an answer for a researcher. If abstracts contain numeric estimates, include them with citation keys. If the retrieved abstracts do not directly answer the question, say that clearly and name the closest evidence.\n\nRecords:\n${JSON.stringify(usable.map(record => ({
        key: record.bibKey,
        title: record.title,
        year: record.year,
        venue: record.venue,
        source: record.source,
        abstract: record.abstract,
        ids: record.ids,
      })), null, 2)}`,
      schema: {
        type: 'object',
        properties: {
          answer: { type: 'string' },
          findings: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                text: { type: 'string' },
                citations: { type: 'array', items: { type: 'string' } },
              },
              required: ['text'],
            },
          },
          caveats: { type: 'array', items: { type: 'string' } },
        },
        required: ['answer'],
      },
      maxOutputTokens: 1800,
      temperature: 0.1,
    })
    const object = result?.object || {}
    return {
      answer: {
        answer: compactText(object.answer),
        findings: Array.isArray(object.findings) ? object.findings.map(item => ({
          text: compactText(item?.text),
          citations: Array.isArray(item?.citations) ? item.citations.map(citationKey).filter(Boolean) : [],
        })).filter(item => item.text) : [],
        caveats: Array.isArray(object.caveats) ? object.caveats.map(compactText).filter(Boolean) : [],
      },
      ai: aiDescriptor(result, ANSWER_SCHEMA_VERSION),
      warnings: [],
    }
  } catch (error) {
    return { answer: null, ai: null, warnings: [`AI answer unavailable: ${error.message}`] }
  }
}

export function buildArtifacts({ slug, createdAt, plan, candidates, sourceResults, sourceStatuses, dedup, planAi, screenAi, answerAi, answer, warnings }) {
  const withKeys = assignBibKeys(candidates).map((record, index) => ({ ...record, tempKey: record.tempKey || `r${index + 1}` }))
  const included = sortForBrief(withKeys.filter(record => record.screen?.decision !== 'exclude'))
  const searchJson = {
    schemaVersion: PLAN_SCHEMA_VERSION,
    slug,
    createdAt: createdAt || new Date().toISOString(),
    plan,
    sourceStatuses,
    sourceResults: sourceResults.map(result => ({
      source: result.source,
      adapterVersion: result.adapterVersion,
      requestedAt: result.requestedAt,
      query: result.query,
      page: result.page,
      recordsReturned: result.recordsReturned,
      rawCount: result.rawCount,
      requestIds: result.requestIds,
      warnings: result.warnings,
    })),
    modelUse: {
      plan: planAi,
      screen: screenAi,
      answer: answerAi,
    },
    flow: {
      identified: sourceResults.reduce((sum, result) => sum + (result.recordsReturned || 0), 0),
      exactDuplicates: dedup.exactDuplicateCount,
      deduped: withKeys.length,
      possibleDuplicateGroups: dedup.possibleDuplicates.length,
      screened: withKeys.filter(record => record.screen?.actor === 'ai').length,
      included: included.length,
      excluded: withKeys.filter(record => record.screen?.decision === 'exclude').length,
    },
    warnings,
    answer,
    decisions: withKeys.map(record => ({
      key: record.bibKey,
      title: record.title,
      source: record.source,
      ids: record.ids,
      screen: record.screen,
      possibleDuplicate: record.possibleDuplicate === true,
    })),
    possibleDuplicates: dedup.possibleDuplicates,
  }
  return {
    searchJson,
    candidatesJson: withKeys,
    bibtex: recordsToBibtex(included),
    tableCsv: recordsToCsv(withKeys),
    summaryMarkdown: recordsToMarkdown({ slug, plan, records: withKeys, included, answer }),
  }
}

export function slugFor(input = {}, now = new Date()) {
  const root = normalizeToken(input.slug || input.question || input.query || 'search').slice(0, 48) || 'search'
  const day = now.toISOString().slice(0, 10)
  return `${day}-${root}`.slice(0, 80)
}

export function recordsToCsv(records) {
  const rows = [
    ['key', 'decision', 'title', 'authors', 'year', 'type', 'source', 'venue', 'doi', 'pmid', 'nct', 'arxiv', 'outcome_direction', 'abstract_note'],
    ...records.map(record => [
      record.bibKey || '',
      record.screen?.decision || '',
      record.title,
      (record.authors || []).join('; '),
      record.year || '',
      record.type,
      record.source,
      record.venue,
      record.ids?.doi || '',
      record.ids?.pmid || '',
      record.ids?.nct || '',
      record.ids?.arxiv || '',
      '',
      record.abstract ? record.abstract.slice(0, 280) : '',
    ]),
  ]
  return rows.map(row => row.map(csvCell).join(',')).join('\n') + '\n'
}

function recordsToMarkdown({ slug, plan, records, included, answer }) {
  const topRecords = included.slice(0, 10)
  const lines = [
    '---',
    `bibliography: searches/${slug}/results.bib`,
    '---',
    '',
    `# Literature brief`,
    '',
    plan.question || 'Search question not supplied.',
    '',
    `Scholar found ${records.length} unique record${records.length === 1 ? '' : 's'} and kept ${included.length} for review.`,
    '',
    '## Answer',
    '',
    answer?.answer || fallbackAnswer(plan, included),
    '',
  ]
  if (answer?.findings?.length) {
    lines.push('## Key Findings', '')
    for (const finding of answer.findings) {
      const cites = finding.citations?.length ? ` ${finding.citations.map(key => `[@${key}]`).join(' ')}` : ''
      lines.push(`- ${finding.text}${cites}`)
    }
    lines.push('')
  }
  if (answer?.caveats?.length) {
    lines.push('## Caveats', '')
    for (const caveat of answer.caveats) lines.push(`- ${caveat}`)
    lines.push('')
  }
  lines.push(
    '## Read First',
    '',
  )
  for (const record of topRecords) {
    const citation = `[@${record.bibKey}]`
    const meta = [record.year, record.venue, record.source].filter(Boolean).join(' | ')
    lines.push(`- ${record.title || 'Untitled'} ${citation}${meta ? ` - ${meta}` : ''}`)
    if (record.screen?.reason) lines.push(`  ${record.screen.reason}`)
    else if (record.abstract) lines.push(`  ${record.abstract.slice(0, 220)}`)
  }
  if (included.length === 0) lines.push('No records were included by the assistive screen.')
  if (included.length > topRecords.length) lines.push('', `${included.length - topRecords.length} more included records are in results.bib and candidates.json.`)
  lines.push(
    '',
    '## What To Check Next',
    '',
    '- Confirm the included records against your own criteria.',
    '- Open the BibTeX file before citing from this brief.',
    '- Re-run the search before submission if the review needs a current date.',
    '',
    '## Limits',
    '',
    'This brief uses metadata and abstracts only. It contains no full-text extraction, PDF mining, or quantitative effect extraction.',
  )
  return lines.join('\n') + '\n'
}

function fallbackAnswer(plan, included) {
  if (!included.length) return 'I did not find a clear abstract-level answer in the searched sources.'
  const first = included[0]
  return `I found ${included.length} candidate record${included.length === 1 ? '' : 's'} that may help answer this question. The strongest next step is to open the cited brief records and confirm whether their abstracts directly report ${compactText(plan.question || 'the requested outcome')}. Start with ${first.title ? `${first.title} [@${first.bibKey}]` : `[@${first.bibKey}]`}.`
}

function sortForBrief(records) {
  const decisionRank = { include: 0, maybe: 1, unscreened: 2, exclude: 3 }
  return [...records].sort((a, b) => {
    const decisionDelta = (decisionRank[a.screen?.decision] ?? 2) - (decisionRank[b.screen?.decision] ?? 2)
    if (decisionDelta) return decisionDelta
    return (Number(b.year) || 0) - (Number(a.year) || 0)
  })
}

function citationKey(value) {
  return compactText(value).replace(/^@/, '').replace(/^\[?@?/, '').replace(/\]?$/, '')
}

function csvCell(value) {
  const text = compactText(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function aiDescriptor(result, schemaVersion) {
  if (!result) return null
  return {
    schemaVersion,
    modelId: result.modelId || '',
    provider: result.provider || '',
    usage: result.usage || null,
  }
}
