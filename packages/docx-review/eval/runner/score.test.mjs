import { describe, it, expect } from 'vitest'
import {
  spanOf, overlaps, overlapRatio, keywordHit, normalizeCategory,
  extractQuotedSnippets, scoreFixture, aggregate, checkGates, EvalAuthoringError,
} from './score.mjs'

const MD = [
  '# Trial',
  'We used a two-sample t-test with n=12 participants and no power calculation.',
  'The effect was significant (p = 0.049) with a large effect size.',
  'We pre-registered the primary outcome and analysis plan.',
].join('\n\n')

const yes = async () => ({ match: true, why: 'same issue' })
const no = async () => ({ match: false, why: 'different issue' })

describe('span/overlap (pure)', () => {
  it('E1 spanOf finds an exact substring', () => {
    expect(spanOf(MD, 'n=12 participants')).toEqual([MD.indexOf('n=12 participants'), MD.indexOf('n=12 participants') + 'n=12 participants'.length])
  })
  it('E2 spanOf finds a whitespace-respaced snippet', () => {
    expect(spanOf(MD, 'two-sample   t-test')).not.toBeNull()
  })
  it('E3 spanOf returns null when absent', () => {
    expect(spanOf(MD, 'purple elephant')).toBeNull()
  })
  it('E4 overlaps true for partial, false for disjoint', () => {
    expect(overlaps([0, 10], [5, 15])).toBe(true)
    expect(overlaps([0, 10], [20, 30])).toBe(false)
  })
  it('E5 overlapRatio 1 identical, 0 disjoint, fractional partial', () => {
    expect(overlapRatio([0, 10], [0, 10])).toBe(1)
    expect(overlapRatio([0, 10], [20, 30])).toBe(0)
    expect(overlapRatio([0, 10], [5, 15])).toBeCloseTo(5 / 15)
  })
  it('keywordHit stems and matches; extractQuotedSnippets pulls quotes', () => {
    expect(keywordHit('the study was underpowered', ['underpower'])).toBe(true)
    expect(extractQuotedSnippets(`must not flag "the pre-registered primary outcome" here`)).toEqual(['the pre-registered primary outcome'])
  })
  it('normalizeCategory maps reporting/citation', () => {
    expect(normalizeCategory('reporting')).toBe('reporting-standards')
    expect(normalizeCategory('citation')).toBe('references')
    expect(normalizeCategory('statistics')).toBe('statistics')
  })
})

const DEFECTS = {
  slug: 'f', defects: [
    { id: 'd1', category: 'statistics', severity: 'major', mustCatch: true, locationSnippet: 'n=12 participants and no power calculation', description: 'underpowered' },
  ],
}

describe('matching gates', () => {
  it('E6 location + judge-yes => match (true positive)', async () => {
    const s = await scoreFixture({ slug: 'f', defectsSpec: DEFECTS, markdown: MD, judge: yes,
      comments: [{ number: 1, severity: 'major', text_snippet: 'n=12 participants and no power calculation', content: 'underpowered, no power calc' }] })
    expect(s.mustCatchCaught).toBe(1)
    expect(s.recall).toBe(1)
    expect(s.truePositives).toBe(1)
  })
  it('E9 right place, wrong issue (judge-no) => miss AND false positive', async () => {
    const s = await scoreFixture({ slug: 'f', defectsSpec: DEFECTS, markdown: MD, judge: no,
      comments: [{ number: 1, severity: 'major', text_snippet: 'n=12 participants and no power calculation', content: 'the sample is fine' }] })
    expect(s.mustCatchCaught).toBe(0)
    expect(s.falsePositives).toBe(1)
  })
  it('E7 no-judge + no keyword + weak overlap => not a match', async () => {
    const s = await scoreFixture({ slug: 'f', defectsSpec: DEFECTS, markdown: MD, options: { noJudge: true },
      comments: [{ number: 1, severity: 'major', text_snippet: 'The effect was significant (p = 0.049)', content: 'p hacking' }] })
    expect(s.mustCatchCaught).toBe(0)
  })
  it('E10 strong overlap passes Tier-1 without keyword (no-judge)', async () => {
    const s = await scoreFixture({ slug: 'f', defectsSpec: DEFECTS, markdown: MD, options: { noJudge: true },
      comments: [{ number: 1, severity: 'major', text_snippet: 'n=12 participants and no power calculation', content: 'x' }] })
    expect(s.mustCatchCaught).toBe(1)
  })
})

describe('assignment / precision', () => {
  it('E13 two comments on one defect => one TP, one FP', async () => {
    const s = await scoreFixture({ slug: 'f', defectsSpec: DEFECTS, markdown: MD, judge: yes,
      comments: [
        { number: 1, severity: 'major', text_snippet: 'n=12 participants and no power calculation', content: 'a' },
        { number: 2, severity: 'major', text_snippet: 'n=12 participants', content: 'b' },
      ] })
    expect(s.truePositives).toBe(1)
    expect(s.falsePositives).toBe(1)
  })
  it('E15 unmatched suggestion is free, not penalized', async () => {
    const s = await scoreFixture({ slug: 'f', defectsSpec: DEFECTS, markdown: MD, judge: no,
      comments: [{ number: 1, severity: 'suggestion', text_snippet: 'large effect size', content: 'consider rephrasing' }] })
    expect(s.falsePositives).toBe(0)
    expect(s.freeSuggestions).toBe(1)
  })
})

describe('clean control', () => {
  const CLEAN = { slug: 'clean', defects: [], cleanClaims: ['A reviewer must NOT flag "We pre-registered the primary outcome and analysis plan." because it is correct.'] }
  it('E16/E17 clean control: major on a clean-claim span => FP on clean claim; recall excluded', async () => {
    const s = await scoreFixture({ slug: 'clean', defectsSpec: CLEAN, markdown: MD, judge: no,
      comments: [{ number: 1, severity: 'major', text_snippet: 'We pre-registered the primary outcome and analysis plan.', content: 'you should pre-register (wrongly flagged)' }] })
    expect(s.clean).toBe(true)
    expect(s.recall).toBe(1) // excluded (no defects)
    expect(s.falsePositives).toBe(1)
    expect(s.cleanClaimHits).toHaveLength(1)
  })
})

describe('pre-flight / failed pipeline', () => {
  it('E22 a planted snippet absent from markdown throws an authoring error', async () => {
    await expect(scoreFixture({ slug: 'bad', markdown: MD, judge: yes,
      defectsSpec: { slug: 'bad', defects: [{ id: 'x', category: 'statistics', mustCatch: true, locationSnippet: 'NOT IN DOC' }] }, comments: [] }))
      .rejects.toBeInstanceOf(EvalAuthoringError)
  })
  it('E20 failed pipeline => recall 0, precision null, all missed', async () => {
    const s = await scoreFixture({ slug: 'f', defectsSpec: DEFECTS, markdown: MD, judge: yes, comments: [], options: { status: 'failed', failReason: 'gate' } })
    expect(s.recall).toBe(0)
    expect(s.precision).toBeNull()
    expect(s.missed).toHaveLength(1)
  })
  it('E24 judge throw falls back to Tier-1 and counts judgeErrors', async () => {
    const boom = async () => { throw new Error('judge down') }
    const s = await scoreFixture({ slug: 'f', defectsSpec: DEFECTS, markdown: MD, judge: boom,
      comments: [{ number: 1, severity: 'major', text_snippet: 'n=12 participants and no power calculation', content: 'x' }] })
    expect(s.judgeErrors).toBe(1)
    expect(s.mustCatchCaught).toBe(1) // tier-1 strong overlap rescued it
  })
})

describe('aggregate + gates', () => {
  const fixtureScores = [
    { slug: 'a', clean: false, status: 'complete', mustCatchTotal: 4, mustCatchCaught: 3, recall: 0.75, truePositives: 3, falsePositives: 1, freeSuggestions: 0, cleanClaimHits: [], judgeErrors: 0, perCategory: { statistics: { mustCatchTotal: 4, mustCatchCaught: 3, recall: 0.75, truePositives: 3, falsePositives: 0 } } },
    { slug: 'clean', clean: true, status: 'complete', mustCatchTotal: 0, mustCatchCaught: 0, recall: 1, truePositives: 0, falsePositives: 2, freeSuggestions: 1, cleanClaimHits: [{}], judgeErrors: 0, perCategory: {} },
  ]
  it('E18/E19 micro recall over defect fixtures; clean excluded; FPs in _unmatched', () => {
    const agg = aggregate(fixtureScores)
    expect(agg.recall).toBeCloseTo(3 / 4)
    expect(agg.cleanControl.falsePositives).toBe(2)
    expect(agg.cleanControl.falsePositivesOnCleanClaims).toBe(1)
    expect(agg.perCategory._unmatched.falsePositives).toBe(3)
  })
  it('E25/E26 gates: below recall fails; clean-claim FP hard-fails', () => {
    const agg = aggregate(fixtureScores)
    expect(checkGates(agg, { minRecallMicro: 0.8 }).passed).toBe(false)
    expect(checkGates(agg, { minRecallMicro: 0.7, maxFalsePositivesOnCleanClaims: 0 }).passed).toBe(false)
    expect(checkGates(agg, { minRecallMicro: 0.7, maxFalsePositivesOnCleanClaims: 5, maxCleanControlFalsePositives: 5 }).passed).toBe(true)
  })
})
