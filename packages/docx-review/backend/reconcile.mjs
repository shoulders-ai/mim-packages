// The reconciliation stage. Replaces both deduplicateComments (snippet-only) and
// writeReport with ONE agent that has full visibility over every raw comment:
// it merges/aggregates, resolves contradictions, normalizes severity, may drop
// comments WITH a logged reason, and writes the final report — in a single tool
// loop via the provider-agnostic ctx.ai.callModel.
//
// The anchor-safety spine: code (never the model) assigns occurrenceIndex using
// the DOCX worker's EXACT counting algorithm (per-paragraph, overlapping, no
// normalization) and feeds the same index to both the DOCX op and the HTML mark,
// so the two surfaces can never disagree. A recurring snippet must be
// disambiguated by a code-verified `disambiguator_before`.
//
// See docs/upgrade/04-reconciliation-design.md.

import {
  validateAnchors,
  normalizeSeverity,
  reviewNotesBlock,
  docProfileBlock,
  deduplicateComments,
  anchorCommentsInHtml,
  addUsage,
  runAgent,
} from './index.mjs'

const unique = (arr) => [...new Set(arr)]

// ---------------------------------------------------------------------------
// Occurrence counting — mirror of TextSearcher.FindAllOccurrences (verified
// against the C# worker): paragraphs split on a blank line, ordinal indexOf,
// advance by +1 (OVERLAPPING), no whitespace normalization.
// ---------------------------------------------------------------------------

export function findAllOccurrencesWorkerFaithful(text, snippet) {
  const out = []
  if (!snippet || !text) return out
  let base = 0
  const units = String(text).split(/(\n{2,})/) // keep separators so charStart stays absolute
  for (const unit of units) {
    if (/^\n{2,}$/.test(unit)) { base += unit.length; continue }
    let from = 0
    while (true) {
      const idx = unit.indexOf(snippet, from)
      if (idx === -1) break
      out.push({ index: out.length, charStart: base + idx, charEnd: base + idx + snippet.length })
      from = idx + 1 // overlapping, mirrors startIdx = idx + 1
    }
    base += unit.length
  }
  return out
}

export function resolveOccurrence(paperMarkdown, snippet, disambiguatorBefore) {
  const occs = findAllOccurrencesWorkerFaithful(paperMarkdown, snippet)
  if (occs.length === 0) return { index: 0, normalized: true } // worker normalized fallback → single match
  if (occs.length === 1) return { index: 0 }
  if (disambiguatorBefore && disambiguatorBefore.trim()) {
    const dab = disambiguatorBefore
    const hit = occs.findIndex(o => paperMarkdown.slice(0, o.charStart).endsWith(dab))
    if (hit >= 0) return { index: hit }
    return { error:
      `disambiguator_before did not match the text preceding any of the ${occs.length} ` +
      `occurrences of this snippet; pass the EXACT verbatim text immediately before the intended occurrence` }
  }
  return { error:
    `snippet occurs ${occs.length} times; pass disambiguator_before (verbatim text immediately ` +
    `preceding the intended occurrence) so the comment anchors uniquely` }
}

export function nthOccurrenceInText(haystack, needle, n) {
  if (!needle) return -1
  let idx = -1
  for (let k = 0; k <= n; k++) {
    idx = haystack.indexOf(needle, idx + 1) // +1: overlapping, mirrors the worker
    if (idx === -1) return -1
  }
  return idx
}

// Final safety pass: guarantee no two final entries share (snippet, occurrenceIndex)
// and that no index exceeds M-1 (which would throw in the worker). Preserves
// already-distinct disambiguated occurrences; only relocates true collisions.
export function assignFallbackOccurrenceForCollisions(final, paperMarkdown, conflicts = []) {
  const byKey = new Map()
  for (const c of final) {
    const key = c.text_snippet
    if (!byKey.has(key)) byKey.set(key, [])
    byKey.get(key).push(c)
  }
  for (const [snippet, group] of byKey) {
    if (group.length <= 1) continue
    const occs = findAllOccurrencesWorkerFaithful(paperMarkdown, snippet)
    const M = Math.max(1, occs.length)
    const used = new Set()
    // lower intended occurrence keeps its slot
    group.sort((a, b) => (a.occurrenceIndex || 0) - (b.occurrenceIndex || 0))
    for (const c of group) {
      let occ = Number.isInteger(c.occurrenceIndex) ? c.occurrenceIndex : 0
      if (occ > M - 1) occ = M - 1
      if (used.has(occ)) {
        let k = 0
        while (k < M && used.has(k)) k++
        const next = Math.min(k, M - 1)
        if (next !== c.occurrenceIndex) {
          conflicts.push({ number: c.number ?? null, snippet, intended: c.occurrenceIndex, htmlResolved: next })
        }
        occ = next
      } else if (occ !== c.occurrenceIndex) {
        conflicts.push({ number: c.number ?? null, snippet, intended: c.occurrenceIndex, htmlResolved: occ })
      }
      used.add(occ)
      c.occurrenceIndex = occ
      const refreshed = findAllOccurrencesWorkerFaithful(paperMarkdown, snippet)[occ]
      if (refreshed) c.charStart = refreshed.charStart
    }
  }
  return final
}

export function buildNumberedComments(final) {
  return [...final]
    .sort((a, b) => (a.charStart ?? 0) - (b.charStart ?? 0))
    .map((c, i) => ({
      id: `comment-${i + 1}`,
      number: i + 1,
      reviewer: (c.sourceReviewers && c.sourceReviewers.length ? c.sourceReviewers : [c.reviewer].filter(Boolean)).join(', '),
      sourceReviewers: c.sourceReviewers || (c.reviewer ? [c.reviewer] : []),
      severity: normalizeSeverity(c.severity),
      text_snippet: c.text_snippet,
      occurrenceIndex: Number.isInteger(c.occurrenceIndex) ? c.occurrenceIndex : 0,
      content: String(c.content || ''),
      origin: c.origin || [],
    }))
}

// Advisory duplicate hint (prompt-side only): group rawIds whose snippets are
// normalized-equal or one contains the other. Not a partition — the agent may
// override it.
export function preGroupByAnchor(rawComments) {
  const norm = s => (s || '').trim().replace(/\s+/g, ' ').toLowerCase()
  const items = rawComments.map(c => ({ id: c.rawId, n: norm(c.text_snippet) })).filter(x => x.id && x.n)
  const groups = []
  const used = new Set()
  for (let i = 0; i < items.length; i++) {
    if (used.has(i)) continue
    const group = [items[i].id]
    used.add(i)
    for (let j = i + 1; j < items.length; j++) {
      if (used.has(j)) continue
      const a = items[i].n
      const b = items[j].n
      if (a === b || a.includes(b) || b.includes(a)) { group.push(items[j].id); used.add(j) }
    }
    if (group.length > 1) groups.push(group)
  }
  return groups
}

export function synthesizeFallbackReport(final) {
  const bySev = { major: [], minor: [], suggestion: [] }
  for (const c of final) (bySev[normalizeSeverity(c.severity)] || bySev.suggestion).push(c)
  let r = '## Peer Review Summary\n\n'
  r += `This review produced ${final.length} comment(s): ${bySev.major.length} major, ` +
    `${bySev.minor.length} minor, ${bySev.suggestion.length} suggestion(s).\n\n`
  if (bySev.major.length) {
    r += '### Key Issues\n\n'
    for (const c of bySev.major.slice(0, 12)) {
      r += `- ${String(c.content || '').split('\n')[0].slice(0, 160)}\n`
    }
  }
  return r.trim()
}

// Deterministic path when the reconciler model is unavailable. Retains the only
// remaining use of deduplicateComments.
// Deterministic path when the reconciler model is unavailable. MERGES same-snippet
// comments (rather than dropping duplicates) so EVERY rawId is accounted for in
// some final entry's `origin` — the recall guarantee must hold on the degraded
// path too, not only the agent path.
export function fallbackReconcile(rawComments, paperMarkdown, conflicts = []) {
  const SEV_RANK = { major: 3, minor: 2, suggestion: 1 }
  const groups = new Map()
  for (const c of rawComments) {
    const snippet = String(c.text_snippet || '').trim()
    const key = snippet.replace(/\s+/g, ' ')
    if (!groups.has(key)) groups.set(key, { snippet, members: [] })
    groups.get(key).members.push(c)
  }
  const final = []
  for (const { snippet, members } of groups.values()) {
    const occ = resolveOccurrence(paperMarkdown, snippet, undefined)
    const index = occ.error ? 0 : occ.index
    if (occ.error) conflicts.push({ number: null, snippet, intended: null, htmlResolved: 0 })
    const occs = findAllOccurrencesWorkerFaithful(paperMarkdown, snippet)
    // highest severity wins; content preserves every reviewer's perspective
    const severity = members.map(m => normalizeSeverity(m.severity)).sort((a, b) => SEV_RANK[b] - SEV_RANK[a])[0]
    const content = members.length === 1
      ? String(members[0].content || '')
      : members.map(m => `${m.reviewer ? m.reviewer + ': ' : ''}${String(m.content || '')}`).join('\n')
    final.push({
      text_snippet: snippet,
      content,
      severity,
      occurrenceIndex: index,
      charStart: occs[index]?.charStart ?? 0,
      sourceReviewers: unique(members.map(m => m.reviewer).filter(Boolean)),
      origin: members.map(m => m.rawId).filter(Boolean),
    })
  }
  return { final, report: synthesizeFallbackReport(final) }
}

// ---------------------------------------------------------------------------
// rawId assignment (stable ids for audit + the decide/coverage protocol)
// ---------------------------------------------------------------------------

function reviewerPrefix(reviewer) {
  if (/^techn/i.test(reviewer)) return 't'
  if (/^edit/i.test(reviewer)) return 'e'
  if (/^refer/i.test(reviewer)) return 'r'
  return 'c'
}

function assignRawIds(rawComments) {
  const counters = {}
  return rawComments.map(c => {
    const prefix = reviewerPrefix(c.reviewer || '')
    const n = counters[prefix] = (counters[prefix] ?? 0)
    counters[prefix] = n + 1
    return {
      rawId: `${prefix}${n}`,
      reviewer: c.reviewer || '',
      severity: normalizeSeverity(c.severity),
      text_snippet: String(c.text_snippet || ''),
      content: String(c.content || ''),
    }
  })
}

// The author reads these as margin notes in Word. The reviewers' raw comments
// are often long, multi-sentence justifications; the reconciler's job includes
// COMPRESSING them to a note a busy clinician will actually read. Reviewer
// identity, severity word, and numbering are added (or not) by the renderer —
// they must never appear in the comment text itself.
export const COMMENT_STYLE = `COMMENT STYLE — every balloon is a margin note the author will actually read:
- One sentence, ~30 words; two only if a fix must be named. Hard ceiling 45 words.
- Lead with the specific problem at the anchored phrase. Do NOT restate or quote the anchored text back.
- Name the fix in a few words only if it is not obvious ("add the design term", "report AEs by arm").
- Cite a standard as a short parenthetical tag only — "(STROBE 1b)", "(ICH E9(R1))" — never a sentence explaining the standard.
- No preamble, no reviewer name, no severity word, no "Fix:" label, no number. Just the note.`

const RECONCILER_SYSTEM = `You are the reconciliation editor for an academic/clinical peer review. Three reviewers — Technical (statistics/methods), Editorial (argumentation/reporting standards), and Reference (citations) — independently produced inline comments on the manuscript below. You see the FULL manuscript and EVERY raw comment, each with a stable id. Produce ONE authoritative review.

Your job:
1. MERGE comments that address the same issue or the same span into ONE balloon. Synthesize them into a SINGLE concise note — do not concatenate them and do not label perspectives inline ("Technical: … Editorial: …"). If two reviewers add genuinely different points about the same span, state the combined point in one sentence; if they are the same point, say it once. A "Likely duplicates" hint is provided; treat it as advice, not instruction.
2. RESOLVE contradictions. When reviewers disagree (e.g. one says the sample is adequate, another says it is underpowered), DECIDE and emit ONE balloon stating the better-supported position — never two contradictory balloons on the same span. Keep the adjudication to a clause, not a paragraph.
3. NORMALIZE severity. Per merged balloon choose a single severity. Take the HIGHEST severity among the merged inputs unless it is clearly unwarranted.
4. ACCOUNT FOR EVERY raw comment EXACTLY ONCE. Use decide_comment with action "keep", "merge", or "drop". You MAY drop a comment that is wrong, redundant after merging, out of scope, or not actionable — but a drop is an EXPLICIT decision with a reason; never drop a perspective silently inside a merge. After each call the tool tells you which ids remain.
5. ANCHORS. Each keep/merge text_snippet MUST be a verbatim substring of the manuscript. Prefer the SHORTEST UNIQUE span that locates the issue. For table data, anchor on a single cell's text, never a pipe row. If the only available phrasing recurs in the document, you MUST pass disambiguator_before: the verbatim text immediately preceding the occurrence you mean, so the balloon lands on the right sentence. If the tool rejects an anchor, fix it and call again.
6. For action "keep", do not pass the raw comment through unchanged — rewrite it to the comment style below (raw comments are usually too long).
7. When you have accounted for every id, call submit_report ONCE with a one-page summary (<=400 words) that orients the reader. The reader also sees every inline balloon — the summary must NOT restate them.

${COMMENT_STYLE}

Call decide_comment repeatedly, then submit_report last. Do not write prose outside the tools.`

export async function reconcileReview(ctx, opts) {
  const {
    paperMarkdown,
    anchorText = paperMarkdown,
    html,
    rawComments: rawInput,
    citationSummary,
    reviewModel,
    reviewNotes = '',
    docProfile = null,
    truncated = false,
    budget = null,
  } = opts

  const usage = { input: 0, output: 0, cacheRead: 0, cacheCreation: 0 }
  const techNotes = {
    rawCount: rawInput.length,
    keptCount: 0,
    droppedCount: 0,
    autoKept: [],
    rejectedAnchors: [],
    occurrenceConflicts: [],
    degraded: null,
    clusterHintUsed: false,
    reportFallback: false,
    reportWordCount: 0,
    timedOut: false,
  }

  // The reviewers already truncate at effectivePaperCharBudget (the smallest paper
  // stage) and continue in partial-review mode, so by here the doc is never simply
  // "rejected". If the FULL markdown does not fit the reconciler prompt, reason over
  // the reviewed surface (anchorText, always <= the reconciler budget) but resolve
  // every occurrence against the FULL markdown so anchors still match the real DOCX.
  // Only fail loudly if even the reviewed surface cannot seat (should not happen).
  const paperCharBudget = budget?.paperCharBudget ?? Infinity
  const promptPaper = paperMarkdown.length > paperCharBudget ? anchorText : paperMarkdown
  const partial = truncated || promptPaper !== paperMarkdown
  if (promptPaper.length > paperCharBudget) {
    return {
      status: 'failed',
      reason: 'Document exceeds the selected model context window; choose Gemini (1M) for documents this large',
      techNotes,
      usage,
    }
  }

  const raw = assignRawIds(rawInput)
  const rawById = new Map(raw.map(c => [c.rawId, c]))
  const allRawIds = new Set(rawById.keys())

  const final = []
  const dropped = []
  const accountedIds = new Set()
  let report = ''

  function remaining() {
    return [...allRawIds].filter(id => !accountedIds.has(id))
  }

  function pushFinalInto(list, snippet, content, severity, occIndex, ids) {
    const occs = findAllOccurrencesWorkerFaithful(paperMarkdown, snippet)
    list.push({
      text_snippet: snippet,
      content,
      severity: normalizeSeverity(severity),
      occurrenceIndex: occIndex,
      charStart: occs[occIndex]?.charStart ?? 0,
      sourceReviewers: unique(ids.map(id => rawById.get(id)?.reviewer).filter(Boolean)),
      origin: [...ids],
    })
  }
  function pushFinal(snippet, content, severity, occIndex, ids) {
    pushFinalInto(final, snippet, content, severity, occIndex, ids)
  }

  async function emitReconcileProgress() {
    const total = allRawIds.size
    if (!total || typeof ctx?.progress?.progress !== 'function') return
    const accounted = accountedIds.size
    const value = Math.round((0.72 + 0.16 * (accounted / total)) * 10_000) / 10_000
    await ctx.progress.progress(value, `Reconciling ${accounted}/${total}`)
  }

  async function recordDecision(input = {}) {
    const ids = Array.isArray(input.source_ids) ? input.source_ids : []
    if (!ids.length) return { success: false, error: 'source_ids required', remaining: remaining() }
    if (ids.some(id => !rawById.has(id) || accountedIds.has(id))) {
      return { success: false, error: 'unknown or already-accounted id', remaining: remaining() }
    }

    if (input.action === 'drop') {
      if (!input.reason || !String(input.reason).trim()) {
        return { success: false, error: 'drop requires a reason', remaining: remaining() }
      }
      for (const id of ids) {
        const c = rawById.get(id)
        dropped.push({ rawId: id, snippet: c.text_snippet, reviewer: c.reviewer, reason: String(input.reason) })
      }
      ids.forEach(id => accountedIds.add(id))
      await emitReconcileProgress()
      return { success: true, remaining: remaining() }
    }

    if (input.action !== 'keep' && input.action !== 'merge') {
      return { success: false, error: 'action must be keep, merge, or drop', remaining: remaining() }
    }
    if (!input.content || !String(input.content).trim()) {
      return { success: false, error: 'content required for keep/merge', remaining: remaining() }
    }
    const { valid, invalid } = validateAnchors(
      [{ text_snippet: input.text_snippet, content: input.content, severity: input.severity }],
      paperMarkdown,
    )
    if (invalid.length) {
      techNotes.rejectedAnchors.push({ snippet: String(input.text_snippet || '').slice(0, 120), reason: invalid[0].reason })
      return { success: false, error: 'text_snippet is not a verbatim substring of the paper', reason: invalid[0].reason, remaining: remaining() }
    }
    const snippet = valid[0].text_snippet
    const occ = resolveOccurrence(paperMarkdown, snippet, input.disambiguator_before)
    if (occ.error) return { success: false, error: occ.error, remaining: remaining() }
    pushFinal(snippet, valid[0].content, valid[0].severity, occ.index, ids)
    ids.forEach(id => accountedIds.add(id))
    await emitReconcileProgress()
    return { success: true, occurrenceIndex: occ.index, remaining: remaining() }
  }

  function recordReport(text) {
    if (accountedIds.size !== allRawIds.size) {
      return { success: false, error: 'Not all comments accounted for', remaining: remaining() }
    }
    report = String(text || '')
    return { success: true }
  }

  // Prompt assembly (no truncation up to window).
  const hintGroups = preGroupByAnchor(raw)
  if (hintGroups.length) techNotes.clusterHintUsed = true
  let userMessage = reviewNotesBlock(reviewNotes)
  userMessage += docProfileBlock(docProfile)
  if (partial) {
    techNotes.partialReview = true
    userMessage += `IMPORTANT: This document was longer than the review window, so the reviewers and this summary cover only the portion below; later sections were NOT reviewed. State this limitation explicitly in your report so the reader knows the review is partial.\n\n`
  }
  userMessage += `Manuscript${partial ? ' (reviewed portion)' : ' (full text)'}:\n\n${promptPaper}\n\n`
  if (citationSummary) userMessage += `Reference/citation check summary:\n${citationSummary}\n\n`
  if (hintGroups.length) {
    userMessage += `Likely duplicates (same/overlapping anchor): ${hintGroups.map(g => `[${g.join(', ')}]`).join('; ')}\n\n`
  }
  userMessage += `Raw comments — account for EVERY id exactly once via decide_comment:\n` +
    `${JSON.stringify(raw.map(({ rawId, reviewer, severity, text_snippet, content }) => ({ rawId, reviewer, severity, text_snippet, content })), null, 2)}\n`

  const decideTool = {
    name: 'decide_comment',
    description:
      'Record ONE reconciliation decision. action="keep" emits a single final comment from one raw comment. ' +
      'action="merge" emits ONE final comment fusing several raw comments — preserve each distinct perspective and ' +
      'state any contradiction explicitly. action="drop" discards one or more raw comments with a reason. Every raw ' +
      'comment id must be accounted for exactly once across all calls. For keep/merge, text_snippet MUST be a verbatim ' +
      'substring of the paper; if that snippet occurs more than once you MUST also pass disambiguator_before (the ' +
      'verbatim text immediately preceding the intended occurrence) so the comment anchors to the correct location.',
    input_schema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['keep', 'merge', 'drop'] },
        source_ids: { type: 'array', items: { type: 'string' }, minItems: 1, description: 'rawIds consumed by this decision' },
        text_snippet: { type: 'string', description: 'Exact verbatim quote anchoring the balloon. Prefer the shortest UNIQUE span.' },
        content: { type: 'string', description: 'Final balloon text — one concise margin note (~30 words, max 45). No reviewer name, severity word, number, or "Fix:" label; standards as short parenthetical tags only.' },
        severity: { type: 'string', enum: ['major', 'minor', 'suggestion'] },
        disambiguator_before: { type: 'string', description: 'Verbatim text immediately preceding the intended occurrence; required only when text_snippet recurs.' },
        reason: { type: 'string', description: 'Why these comments are dropped (action=drop).' },
      },
      required: ['action', 'source_ids'],
    },
    execute: async (input) => recordDecision(input),
  }
  const reportTool = {
    name: 'submit_report',
    description:
      'Submit the one-page peer-review summary. Call this LAST, only after EVERY raw comment has been accounted for ' +
      'via decide_comment. The summary orients the reader; it must NOT restate the inline comments. <=400 words.',
    input_schema: {
      type: 'object',
      properties: { report: { type: 'string' } },
      required: ['report'],
    },
    execute: async ({ report: text } = {}) => recordReport(text),
  }

  const maxSteps = Math.min(40, rawInput.length * 2 + 6)
  const agentResult = await runAgent(() => ctx.ai.callModel({
    modelId: reviewModel,
    system: RECONCILER_SYSTEM,
    messages: [{ role: 'user', content: userMessage }],
    tools: [decideTool, reportTool],
    maxTokens: budget?.maxOutputTokens ?? 48_000,
    maxSteps,
  }))

  if (!agentResult) {
    // Degraded: deterministic fallback reconciler.
    techNotes.degraded = 'reconciler_unavailable'
    const fb = fallbackReconcile(raw, paperMarkdown, techNotes.occurrenceConflicts)
    return finalizeBundle(fb.final, [], fb.report, { fallbackReport: true })
  }
  addUsage(usage, agentResult.usage)

  // Finish discipline: auto-keep any rawId left unaccounted (recall guarantee).
  for (const id of remaining()) {
    const c = rawById.get(id)
    const { valid } = validateAnchors([{ text_snippet: c.text_snippet, content: c.content, severity: c.severity }], paperMarkdown)
    if (!valid.length) {
      // Anchor no longer validates — still never silently lost: log + drop with reason.
      dropped.push({ rawId: id, snippet: c.text_snippet, reviewer: c.reviewer, reason: 'anchor could not be re-validated' })
      techNotes.rejectedAnchors.push({ snippet: String(c.text_snippet || '').slice(0, 120), reason: 'auto-keep re-validation failed' })
      accountedIds.add(id)
      continue
    }
    const occ = resolveOccurrence(paperMarkdown, valid[0].text_snippet, undefined)
    pushFinal(valid[0].text_snippet, valid[0].content, valid[0].severity, occ.error ? 0 : occ.index, [id])
    techNotes.autoKept.push(id)
    accountedIds.add(id)
  }

  return finalizeBundle(final, dropped, report, { fallbackReport: false })

  function finalizeBundle(finalList, droppedList, reportText, { fallbackReport }) {
    // Recall invariant (enforced on EVERY path, incl. degraded): every rawId must
    // be in some final entry's origin OR explicitly dropped. Anything missing is
    // auto-kept under its original snippet — never silently lost.
    const accounted = new Set([
      ...finalList.flatMap(c => c.origin || []),
      ...droppedList.flatMap(d => d.rawIds || (d.rawId ? [d.rawId] : [])),
    ])
    for (const id of allRawIds) {
      if (accounted.has(id)) continue
      const c = rawById.get(id)
      if (!c) continue
      const { valid } = validateAnchors([{ text_snippet: c.text_snippet, content: c.content, severity: c.severity }], paperMarkdown)
      if (valid.length) {
        const occ = resolveOccurrence(paperMarkdown, valid[0].text_snippet, undefined)
        pushFinalInto(finalList, valid[0].text_snippet, valid[0].content, valid[0].severity, occ.error ? 0 : occ.index, [id])
      } else {
        droppedList.push({ snippet: c.text_snippet, reviewer: c.reviewer, reason: 'anchor could not be re-validated', rawIds: [id] })
      }
      if (!techNotes.autoKept.includes(id)) techNotes.autoKept.push(id)
    }
    assignFallbackOccurrenceForCollisions(finalList, paperMarkdown, techNotes.occurrenceConflicts)
    const numbered = buildNumberedComments(finalList)
    let finalReport = reportText
    if (!finalReport || !finalReport.trim()) {
      finalReport = synthesizeFallbackReport(finalList)
      techNotes.reportFallback = true
    } else if (fallbackReport) {
      techNotes.reportFallback = true
    }
    techNotes.keptCount = numbered.length
    techNotes.droppedCount = droppedList.length
    techNotes.reportWordCount = finalReport.split(/\s+/).filter(Boolean).length
    const anchoredHtml = anchorCommentsInHtml(html, numbered)
    return { comments: numbered, dropped: droppedList, report: finalReport, anchoredHtml, usage, techNotes }
  }
}
