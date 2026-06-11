// Pure scorer for the docx-review eval harness. Given a fixture's planted-defect
// answer key and the pipeline's produced comments, compute RECALL (mustCatch
// defects caught) and PRECISION (produced major/minor comments that map to a real
// defect). No I/O, no model — the LLM judge is injected so this is fully
// unit-testable offline. See docs/upgrade/05-eval-harness.md.
//
// Reads the AUTHORED fixture field names: defect.locationSnippet (+altSnippets),
// defect.description, defect.mustCatch (default true), defect.category. A fixture
// with zero defects is the clean control (precision-only).

export const LOCATION_SLACK_CHARS = 240
export const STRONG_OVERLAP = 0.6

// Map authored categories onto the gate's closed set; unknown categories pass through.
const CATEGORY_MAP = { reporting: 'reporting-standards', citation: 'references', citations: 'references' }
export function normalizeCategory(cat) {
  const c = String(cat || 'uncategorized').trim().toLowerCase()
  return CATEGORY_MAP[c] || c
}

export function spanOf(markdown, snippet) {
  if (!markdown || !snippet) return null
  const i = markdown.indexOf(snippet)
  if (i >= 0) return [i, i + snippet.length]
  // whitespace-normalized fallback (mirrors validateAnchors), mapped back to original offsets
  const { norm, map } = normalizeWithMap(markdown)
  const ns = snippet.replace(/\s+/g, ' ').trim()
  const j = norm.indexOf(ns)
  if (j < 0) return null
  const start = map[j]
  const end = map[Math.min(j + ns.length, map.length - 1)] ?? markdown.length
  return [start, end]
}

function normalizeWithMap(text) {
  let norm = ''
  const map = []
  let prevSpace = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (/\s/.test(ch)) {
      if (prevSpace) continue
      norm += ' '; map.push(i); prevSpace = true
    } else {
      norm += ch; map.push(i); prevSpace = false
    }
  }
  map.push(text.length)
  return { norm: norm.trim(), map }
}

export function overlaps(a, b) {
  return !!(a && b && a[0] < b[1] && b[0] < a[1])
}

export function overlapRatio(a, b) {
  if (!a || !b) return 0
  const inter = Math.max(0, Math.min(a[1], b[1]) - Math.max(a[0], b[0]))
  const union = Math.max(a[1], b[1]) - Math.min(a[0], b[0])
  return union > 0 ? inter / union : 0
}

function gap(a, b) {
  if (!a || !b) return Infinity
  if (overlaps(a, b)) return 0
  return a[1] <= b[0] ? b[0] - a[1] : a[0] - b[1]
}

export function stem(word) {
  return String(word).toLowerCase().replace(/[^a-z0-9]/g, '').replace(/(ing|ed|es|s)$/,'')
}

export function keywordHit(content, keywords) {
  if (!Array.isArray(keywords) || !keywords.length) return false
  const tokens = new Set(String(content || '').toLowerCase().split(/[^a-z0-9]+/).map(stem).filter(Boolean))
  return keywords.some(kw => String(kw).toLowerCase().split(/\s+/).map(stem).filter(Boolean).every(t => tokens.has(t)))
}

// Pull quoted '...' or "..." spans out of a free-text cleanClaim string so we can
// detect a false positive that lands on a correct, quoted practice.
export function extractQuotedSnippets(claim) {
  const out = []
  const re = /["'“”‘’]([^"'“”‘’]{12,})["'“”‘’]/g
  let m
  while ((m = re.exec(String(claim || ''))) !== null) out.push(m[1].trim())
  return out
}

function defectSnippets(defect) {
  const primary = defect.locationSnippet ?? defect.snippet
  const alts = Array.isArray(defect.altSnippets) ? defect.altSnippets : []
  return [primary, ...alts].filter(Boolean)
}

/**
 * Score one fixture. `judge` is async ({ defect, comment }) => { match, why }.
 * With opts.noJudge, Tier-1 (keyword OR strong overlap) decides instead.
 */
export async function scoreFixture({ slug, defectsSpec, comments, markdown, judge, options = {} }) {
  const noJudge = !!options.noJudge
  const slack = options.locationSlack ?? LOCATION_SLACK_CHARS
  const strong = options.strongOverlap ?? STRONG_OVERLAP
  const status = options.status || 'complete'
  const defects = Array.isArray(defectsSpec.defects) ? defectsSpec.defects : []
  const clean = defects.length === 0
  const list = Array.isArray(comments) ? comments : []

  // ---- pre-flight: every planted/clean snippet must exist in the markdown ----
  for (const d of defects) {
    for (const s of defectSnippets(d)) {
      if (!spanOf(markdown, s)) throw new EvalAuthoringError(`defect ${d.id || '?'} snippet not found in ${slug}: "${String(s).slice(0, 60)}"`)
    }
  }

  let judgeErrors = 0

  // ---- failed pipeline: recall 0, precision excluded ----
  if (status !== 'complete') {
    return {
      slug, clean, status, failReason: options.failReason || 'pipeline did not complete',
      mustCatchTotal: defects.filter(d => d.mustCatch !== false).length,
      mustCatchCaught: 0, recall: 0,
      commentsTotal: list.length, truePositives: 0, falsePositives: 0, freeSuggestions: 0, precision: null,
      perCategory: {}, caught: [], missed: defects.map(d => miss(d)), falsePos: [], cleanClaimHits: [], judgeErrors,
    }
  }

  // ---- build candidate (comment, defect) pairs passing location gate ----
  const commentSpans = list.map(c => spanOf(markdown, (c.text_snippet || '').trim()))
  const candidates = []
  for (let di = 0; di < defects.length; di++) {
    const dSpans = defectSnippets(defects[di]).map(s => spanOf(markdown, s)).filter(Boolean)
    for (let ci = 0; ci < list.length; ci++) {
      const cSpan = commentSpans[ci]
      if (!cSpan) continue
      let best = 0
      let locOk = false
      for (const ds of dSpans) {
        if (overlaps(cSpan, ds) || gap(cSpan, ds) <= slack) locOk = true
        best = Math.max(best, overlapRatio(cSpan, ds))
      }
      if (locOk) candidates.push({ ci, di, overlap: best })
    }
  }

  // ---- semantic gate (Tier 1 keyword/overlap, Tier 2 judge) ----
  const matched = []
  for (const cand of candidates) {
    const defect = defects[cand.di]
    const comment = list[cand.ci]
    const tier1 = keywordHit(comment.content, defect.keywords) || cand.overlap >= strong
    let passB
    let why
    if (noJudge) {
      passB = tier1
    } else {
      try {
        const verdict = await judge({ defect, comment })
        passB = !!verdict?.match
        why = verdict?.why
      } catch {
        judgeErrors++
        passB = tier1
      }
    }
    if (passB) matched.push({ ...cand, why })
  }

  // ---- greedy one-to-one assignment by descending overlap ----
  matched.sort((a, b) => b.overlap - a.overlap)
  const usedComments = new Set()
  const usedDefects = new Set()
  const assignments = []
  for (const m of matched) {
    if (usedComments.has(m.ci) || usedDefects.has(m.di)) continue
    usedComments.add(m.ci); usedDefects.add(m.di)
    assignments.push(m)
  }

  // ---- tally ----
  const cleanClaimSpans = clean
    ? (defectsSpec.cleanClaims || []).flatMap(extractClaimText).map(s => spanOf(markdown, s)).filter(Boolean)
    : []

  const caught = []
  for (const a of assignments) {
    const d = defects[a.di]
    caught.push({ defectId: d.id, category: normalizeCategory(d.category), severity: d.severity, byComment: list[a.ci].number ?? a.ci, overlapRatio: a.overlap, judge: a.why })
  }
  const caughtDefectIdx = new Set(assignments.map(a => a.di))
  const missed = defects.map((d, i) => caughtDefectIdx.has(i) ? null : miss(d)).filter(Boolean)

  let truePositives = 0, falsePositives = 0, freeSuggestions = 0
  const falsePos = []
  const cleanClaimHits = []
  for (let ci = 0; ci < list.length; ci++) {
    const c = list[ci]
    const isMatched = usedComments.has(ci)
    if (isMatched) { truePositives++; continue }
    const sev = c.severity
    if (sev === 'major' || sev === 'minor') {
      const cSpan = commentSpans[ci]
      const onCleanClaim = clean && cleanClaimSpans.some(s => overlaps(cSpan, s))
      falsePositives++
      falsePos.push({ comment: c.number ?? ci, severity: sev, text_snippet: c.text_snippet, content: c.content, onCleanClaim: onCleanClaim || undefined })
      if (onCleanClaim) cleanClaimHits.push({ byComment: c.number ?? ci, content: c.content })
    } else {
      freeSuggestions++
    }
  }

  const mustCatchDefects = defects.filter(d => d.mustCatch !== false)
  const mustCatchCaught = assignments.filter(a => defects[a.di].mustCatch !== false).length
  const mustCatchTotal = mustCatchDefects.length

  const perCategory = {}
  for (const d of defects) {
    const cat = normalizeCategory(d.category)
    perCategory[cat] ??= { mustCatchTotal: 0, mustCatchCaught: 0, recall: 0, truePositives: 0, falsePositives: 0 }
    if (d.mustCatch !== false) perCategory[cat].mustCatchTotal++
  }
  for (const a of assignments) {
    const d = defects[a.di]
    const cat = normalizeCategory(d.category)
    perCategory[cat].truePositives++
    if (d.mustCatch !== false) perCategory[cat].mustCatchCaught++
  }
  for (const cat of Object.keys(perCategory)) {
    const p = perCategory[cat]
    p.recall = p.mustCatchTotal ? p.mustCatchCaught / p.mustCatchTotal : 1
  }

  return {
    slug, clean, status, model: options.model, judgeModel: noJudge ? null : (options.judgeModel || null),
    mustCatchTotal, mustCatchCaught,
    recall: mustCatchTotal ? mustCatchCaught / mustCatchTotal : 1,
    commentsTotal: list.length,
    majorMinorTotal: list.filter(c => c.severity === 'major' || c.severity === 'minor').length,
    truePositives, falsePositives, freeSuggestions,
    precision: (truePositives + falsePositives) ? truePositives / (truePositives + falsePositives) : 1,
    perCategory, caught, missed, falsePos, cleanClaimHits, judgeErrors,
  }
}

function extractClaimText(claim) {
  const quoted = extractQuotedSnippets(claim)
  return quoted.length ? quoted : []
}

function miss(d) {
  return { defectId: d.id, category: normalizeCategory(d.category), severity: d.severity, snippet: d.locationSnippet ?? d.snippet, rationale: d.description ?? d.rationale }
}

export class EvalAuthoringError extends Error {}

// ---- aggregation across fixtures ----
export function aggregate(fixtureScores) {
  const defectFixtures = fixtureScores.filter(f => !f.clean && f.status === 'complete')
  const completeFixtures = fixtureScores.filter(f => f.status === 'complete')
  const sum = (arr, k) => arr.reduce((a, f) => a + (f[k] || 0), 0)

  const mustCatchTotal = sum(defectFixtures, 'mustCatchTotal')
  const mustCatchCaught = sum(defectFixtures, 'mustCatchCaught')
  const tp = sum(completeFixtures, 'truePositives')
  const fp = sum(completeFixtures, 'falsePositives')
  const recallMacro = defectFixtures.length
    ? defectFixtures.reduce((a, f) => a + f.recall, 0) / defectFixtures.length : 1

  const perCategory = {}
  for (const f of completeFixtures) {
    for (const [cat, p] of Object.entries(f.perCategory)) {
      perCategory[cat] ??= { mustCatchTotal: 0, mustCatchCaught: 0, recall: 0, truePositives: 0, falsePositives: 0 }
      perCategory[cat].mustCatchTotal += p.mustCatchTotal
      perCategory[cat].mustCatchCaught += p.mustCatchCaught
      perCategory[cat].truePositives += p.truePositives
    }
  }
  for (const cat of Object.keys(perCategory)) {
    const p = perCategory[cat]
    p.recall = p.mustCatchTotal ? p.mustCatchCaught / p.mustCatchTotal : 1
  }
  perCategory._unmatched = { falsePositives: fp }

  const cleanScores = fixtureScores.filter(f => f.clean && f.status === 'complete')
  return {
    recall: mustCatchTotal ? mustCatchCaught / mustCatchTotal : 1,
    recallMacro,
    precision: (tp + fp) ? tp / (tp + fp) : 1,
    mustCatchTotal, mustCatchCaught,
    truePositives: tp, falsePositives: fp,
    freeSuggestions: sum(completeFixtures, 'freeSuggestions'),
    cleanControl: {
      falsePositives: sum(cleanScores, 'falsePositives'),
      falsePositivesOnCleanClaims: cleanScores.reduce((a, f) => a + f.cleanClaimHits.length, 0),
    },
    failedFixtures: fixtureScores.filter(f => f.status !== 'complete').map(f => f.slug),
    judgeErrors: sum(fixtureScores, 'judgeErrors'),
    perCategory,
  }
}

export function checkGates(agg, gates) {
  const failures = []
  if (agg.recall < (gates.minRecallMicro ?? 0)) failures.push(`recall ${agg.recall.toFixed(2)} < ${gates.minRecallMicro}`)
  if (agg.precision < (gates.minPrecisionMicro ?? 0)) failures.push(`precision ${agg.precision.toFixed(2)} < ${gates.minPrecisionMicro}`)
  if (agg.cleanControl.falsePositives > (gates.maxCleanControlFalsePositives ?? Infinity)) {
    failures.push(`clean-control FPs ${agg.cleanControl.falsePositives} > ${gates.maxCleanControlFalsePositives}`)
  }
  if (agg.cleanControl.falsePositivesOnCleanClaims > (gates.maxFalsePositivesOnCleanClaims ?? Infinity)) {
    failures.push(`FPs on clean claims ${agg.cleanControl.falsePositivesOnCleanClaims} > ${gates.maxFalsePositivesOnCleanClaims}`)
  }
  for (const [cat, min] of Object.entries(gates.perCategoryMinRecall || {})) {
    const r = agg.perCategory[cat]?.recall
    if (typeof r === 'number' && r < min) failures.push(`recall[${cat}] ${r.toFixed(2)} < ${min}`)
  }
  if (agg.failedFixtures.length > (gates.maxFailedFixtures ?? Infinity)) {
    failures.push(`failed fixtures ${agg.failedFixtures.length} > ${gates.maxFailedFixtures}`)
  }
  return { passed: failures.length === 0, failures }
}
