import { describe, it, expect } from 'vitest'
import {
  CHARS_PER_TOKEN,
  PER_IMAGE_TOKENS,
  tokensFromChars,
  charsFromTokens,
  STAGE_PROFILES,
  paperBudgetForModel,
  effectivePaperCharBudget,
} from './budget.mjs'

// Self-contained registry fixture (the package test suite does not have the
// core repo's resources/ai-models.json). Mirrors the real contextWindows.
const REGISTRY = {
  models: [
    { id: 'claude-opus-4-7', provider: 'anthropic', model: 'claude-opus-4-7', contextWindow: 200_000 },
    { id: 'claude-sonnet-4-6', provider: 'anthropic', model: 'claude-sonnet-4-6', contextWindow: 200_000 },
    { id: 'gpt-5.4', provider: 'openai', model: 'gpt-5.4', contextWindow: 200_000 },
    { id: 'gpt-5.4-nano', provider: 'openai', model: 'gpt-5.4-nano', contextWindow: 200_000, capabilities: { vision: false } },
    { id: 'gemini-3.1-pro-preview', provider: 'google', model: 'gemini-3.1-pro-preview', contextWindow: 1_000_000 },
  ],
}
const M200 = REGISTRY.models[1]
const M1M = REGISTRY.models[4]

describe('budget: conversion helpers', () => {
  it('1 tokensFromChars rounds up', () => {
    expect(tokensFromChars(0)).toBe(0)
    expect(tokensFromChars(3500)).toBe(1000)
    expect(tokensFromChars(3501)).toBe(1001)
  })
  it('2 charsFromTokens rounds down', () => {
    expect(charsFromTokens(0)).toBe(0)
    expect(charsFromTokens(1000)).toBe(3500)
    expect(charsFromTokens(1001)).toBe(3503) // floor(3503.5)
  })
  it('3 token round-trip never grows the estimate', () => {
    for (const t of [1000, 12345, 75500, 875500]) {
      expect(tokensFromChars(charsFromTokens(t))).toBeLessThanOrEqual(t)
    }
  })
  it('4 negative / NaN clamp to 0', () => {
    expect(tokensFromChars(-100)).toBe(0)
    expect(charsFromTokens(-100)).toBe(0)
    expect(tokensFromChars(NaN)).toBe(0)
    expect(charsFromTokens(NaN)).toBe(0)
  })
  it('uses 3.5 as the constant', () => {
    expect(CHARS_PER_TOKEN).toBe(3.5)
  })
})

describe('budget: paperBudgetForModel', () => {
  it('5 unknown stage throws', () => {
    expect(() => paperBudgetForModel(M200, REGISTRY, 'nope')).toThrow(/Unknown budget stage/)
  })
  it('6 missing/zero/NaN contextWindow throws', () => {
    expect(() => paperBudgetForModel({ id: 'x' }, REGISTRY, 'reviewer')).toThrow(/no usable contextWindow/)
    expect(() => paperBudgetForModel({ id: 'x', contextWindow: 0 }, REGISTRY, 'reviewer')).toThrow(/no usable contextWindow/)
    expect(() => paperBudgetForModel({ id: 'x', contextWindow: 'big' }, REGISTRY, 'reviewer')).toThrow(/no usable contextWindow/)
  })
  it('7 reviewer @ 200k', () => {
    const b = paperBudgetForModel(M200, REGISTRY, 'reviewer')
    expect(b.toolRoundtripGrowthTokens).toBe(44_000)
    expect(b.paperTokens).toBe(75_500)
    expect(b.paperCharBudget).toBe(264_250)
    expect(b.fits).toBe(true)
  })
  it('8 reviewer @ 1M', () => {
    const b = paperBudgetForModel(M1M, REGISTRY, 'reviewer')
    expect(b.paperTokens).toBe(875_500)
    expect(b.paperCharBudget).toBe(3_064_250)
  })
  it('9 reconciler @ 200k', () => {
    const b = paperBudgetForModel(M200, REGISTRY, 'reconciler')
    expect(b.toolRoundtripGrowthTokens).toBe(28_000)
    expect(b.paperTokens).toBe(114_500)
    expect(b.paperCharBudget).toBe(400_750)
  })
  it('10 referenceCheck @ 200k', () => {
    const b = paperBudgetForModel(M200, REGISTRY, 'referenceCheck')
    expect(b.toolRoundtripGrowthTokens).toBe(55_000)
    expect(b.paperTokens).toBe(112_500)
  })
  it('11 gatekeeper', () => {
    const b = paperBudgetForModel(M200, REGISTRY, 'gatekeeper')
    expect(b.toolRoundtripGrowthTokens).toBe(0)
    expect(b.sampleChars).toBe(8_000)
    expect(b.maxOutputTokens).toBe(1_000)
  })
  it('12 docxRepair @ 200k', () => {
    const b = paperBudgetForModel(M200, REGISTRY, 'docxRepair')
    expect(b.toolRoundtripGrowthTokens).toBe(6_000)
  })
  it('13 guidanceCharBudget reviewer 140000, reconciler 0', () => {
    expect(paperBudgetForModel(M200, REGISTRY, 'reviewer').guidanceCharBudget).toBe(140_000)
    expect(paperBudgetForModel(M200, REGISTRY, 'reconciler').guidanceCharBudget).toBe(0)
  })
  it('14 maxOutputTokens equals reservedOutput each stage', () => {
    for (const stage of Object.keys(STAGE_PROFILES)) {
      const b = paperBudgetForModel(M200, REGISTRY, stage)
      expect(b.maxOutputTokens).toBe(STAGE_PROFILES[stage].reservedOutput)
    }
  })
  it('15 toolRoundtripGrowth === perStepGrowth*(maxSteps-1) every stage', () => {
    for (const stage of Object.keys(STAGE_PROFILES)) {
      const p = STAGE_PROFILES[stage]
      const b = paperBudgetForModel(M200, REGISTRY, stage)
      expect(b.toolRoundtripGrowthTokens).toBe(p.perStepGrowth * Math.max(0, p.maxSteps - 1))
    }
  })
  it('16 invariant: terms sum <= contextWindow for every stage × every model', () => {
    for (const model of REGISTRY.models) {
      for (const stage of Object.keys(STAGE_PROFILES)) {
        const b = paperBudgetForModel(model, REGISTRY, stage)
        const sum = b.reservedOutputTokens + b.systemTokens + b.guidanceTokens +
          b.fixedOverheadTokens + b.toolRoundtripGrowthTokens + b.paperTokens
        expect(sum).toBeLessThanOrEqual(b.contextWindow)
      }
    }
  })
  it('17 tiny window: fits=false, paperTokens=0 when below MIN', () => {
    const tiny = { id: 'tiny', contextWindow: 50_000 }
    const b = paperBudgetForModel(tiny, REGISTRY, 'reviewer')
    expect(b.fits).toBe(false)
    expect(b.paperTokens).toBe(0)
  })
  it('17b fits=false when rawPaperTokens between 0 and MIN', () => {
    // reviewer nonPaper = 124500; window 126000 -> raw 1500 (0 < 1500 < 4000)
    const b = paperBudgetForModel({ id: 'edge', contextWindow: 126_000 }, REGISTRY, 'reviewer')
    expect(b.paperTokens).toBe(1_500)
    expect(b.fits).toBe(false)
  })
  it('18 paperTokens never negative', () => {
    const b = paperBudgetForModel({ id: 'small', contextWindow: 10_000 }, REGISTRY, 'reviewer')
    expect(b.paperTokens).toBe(0)
    expect(b.fits).toBe(false)
  })
  it('18b subtracts image tokens from reviewer budget only', () => {
    const noImages = paperBudgetForModel(M200, REGISTRY, 'reviewer')
    const withImages = paperBudgetForModel(M200, REGISTRY, 'reviewer', 3)
    expect(PER_IMAGE_TOKENS).toBe(1600)
    expect(withImages.paperCharBudget).toBe(noImages.paperCharBudget - charsFromTokens(3 * PER_IMAGE_TOKENS))

    expect(paperBudgetForModel(M200, REGISTRY, 'referenceCheck', 3).paperCharBudget)
      .toBe(paperBudgetForModel(M200, REGISTRY, 'referenceCheck').paperCharBudget)
    expect(paperBudgetForModel(M200, REGISTRY, 'reconciler', 3).paperCharBudget)
      .toBe(paperBudgetForModel(M200, REGISTRY, 'reconciler').paperCharBudget)
  })
})

describe('budget: effectivePaperCharBudget', () => {
  it('19 equals min over paper stages; reviewer binds at 200k', () => {
    const eff = effectivePaperCharBudget(M200, REGISTRY)
    const reviewer = paperBudgetForModel(M200, REGISTRY, 'reviewer').paperCharBudget
    expect(eff).toBe(reviewer)
    expect(eff).toBe(264_250)
  })
  it('20 excludes gatekeeper and docxRepair', () => {
    const eff = effectivePaperCharBudget(M200, REGISTRY)
    const gate = paperBudgetForModel(M200, REGISTRY, 'gatekeeper').paperCharBudget
    expect(eff).toBeLessThan(gate) // gatekeeper has huge unused paper budget
  })
  it('21 scales monotonically with contextWindow', () => {
    expect(effectivePaperCharBudget(M200, REGISTRY)).toBeLessThan(effectivePaperCharBudget(M1M, REGISTRY))
  })
  it('21b effective budget drops by reviewer image cost', () => {
    expect(effectivePaperCharBudget(M200, REGISTRY, 2))
      .toBe(effectivePaperCharBudget(M200, REGISTRY) - charsFromTokens(2 * PER_IMAGE_TOKENS))
  })
})

describe('budget: registry integration', () => {
  it('22 every model succeeds for all five stages; invariant holds', () => {
    for (const model of REGISTRY.models) {
      for (const stage of Object.keys(STAGE_PROFILES)) {
        expect(() => paperBudgetForModel(model, REGISTRY, stage)).not.toThrow()
      }
    }
  })
  it('23 snapshot 264250 (200k) / 3064250 (1M) guards constant drift', () => {
    expect(effectivePaperCharBudget(M200, REGISTRY)).toBe(264_250)
    expect(effectivePaperCharBudget(M1M, REGISTRY)).toBe(3_064_250)
  })
  it('24 vision-disabled model still yields a valid envelope', () => {
    const nano = REGISTRY.models.find(m => m.id === 'gpt-5.4-nano')
    const b = paperBudgetForModel(nano, REGISTRY, 'reviewer')
    expect(b.fits).toBe(true)
    expect(b.paperCharBudget).toBe(264_250)
  })
})
