// The single model-derived budget envelope. Pure, no I/O — fully unit-testable.
// Replaces the three inconsistent ad-hoc caps (8k gatekeeper / 150k review /
// 30k report) and the orphaned 300k guidance budget with one accounting
// equation derived from the selected model's contextWindow:
//
//   contextWindow >= reservedOutput + system + guidance + fixedOverhead
//                    + toolRoundtripGrowth + paperTokens
//
// We solve for paperTokens and expose it as a char ceiling. See
// docs/upgrade/02-budget-envelope.md for the full rationale.

export const CHARS_PER_TOKEN = 3.5
export const PER_IMAGE_TOKENS = 1600
export const tokensFromChars = (chars) => Math.ceil(Math.max(0, Number(chars) || 0) / CHARS_PER_TOKEN)
export const charsFromTokens = (tokens) => Math.floor(Math.max(0, Number(tokens) || 0) * CHARS_PER_TOKEN)

// Stage profiles. All values in TOKENS unless suffixed. Reviewers are raised
// far above the old 8k output cap for thoroughness on critical clinical
// manuscripts; the reconciler (merges everything AND writes the report) gets
// the most. Guidance is a first-class subtracted term so it can never overflow
// the window, and tool-result accumulation across the loop is modeled as
// perStepGrowth × (maxSteps - 1).
export const STAGE_PROFILES = {
  gatekeeper:     { reservedOutput: 1_000,  system: 1_500, fixedOverhead:   500, guidance:      0, maxSteps: 1,  perStepGrowth:     0, sampleChars: 8_000 },
  reviewer:       { reservedOutput: 32_000, system: 2_500, fixedOverhead: 6_000, guidance: 40_000, maxSteps: 12, perStepGrowth: 4_000 },
  referenceCheck: { reservedOutput: 24_000, system: 2_500, fixedOverhead: 6_000, guidance:      0, maxSteps: 12, perStepGrowth: 5_000 },
  reconciler:     { reservedOutput: 48_000, system: 3_500, fixedOverhead: 6_000, guidance:      0, maxSteps: 8,  perStepGrowth: 4_000 },
  docxRepair:     { reservedOutput:  4_000, system: 1_000, fixedOverhead: 4_000, guidance:      0, maxSteps: 4,  perStepGrowth: 2_000 },
}

// Below this many paper tokens a stage does not meaningfully fit; we surface it
// via `fits` rather than silently shipping an absurd budget.
const MIN_PAPER_TOKENS = 4_000

/**
 * Derive the full per-stage budget envelope from a model's context window.
 * @param {object} model    Registry model entry: { id, model, provider, contextWindow, ... }
 * @param {object} registry The ai.registry result (reserved for future per-provider tuning; unused today)
 * @param {keyof STAGE_PROFILES} stage
 */
export function paperBudgetForModel(model, registry, stage, imageCount = 0) {
  const profile = STAGE_PROFILES[stage]
  if (!profile) throw new Error(`Unknown budget stage: ${stage}`)
  const contextWindow = Number(model?.contextWindow)
  if (!Number.isFinite(contextWindow) || contextWindow <= 0) {
    throw new Error(`Model "${model?.id || '?'}" has no usable contextWindow`)
  }

  const toolRoundtripGrowthTokens = profile.perStepGrowth * Math.max(0, profile.maxSteps - 1)
  const imageTokens = stage === 'reviewer'
    ? Math.max(0, Math.floor(Number(imageCount) || 0)) * PER_IMAGE_TOKENS
    : 0
  const nonPaperTokens =
    profile.reservedOutput +
    profile.system +
    profile.guidance +
    profile.fixedOverhead +
    toolRoundtripGrowthTokens +
    imageTokens

  const rawPaperTokens = contextWindow - nonPaperTokens
  const fits = rawPaperTokens >= MIN_PAPER_TOKENS
  const paperTokens = Math.max(0, rawPaperTokens)

  return {
    stage,
    contextWindow,
    reservedOutputTokens: profile.reservedOutput,
    systemTokens: profile.system,
    guidanceTokens: profile.guidance,
    fixedOverheadTokens: profile.fixedOverhead,
    toolRoundtripGrowthTokens,
    imageTokens,
    paperTokens,
    paperCharBudget: charsFromTokens(paperTokens),
    guidanceCharBudget: charsFromTokens(profile.guidance),
    sampleChars: profile.sampleChars ?? null,
    maxOutputTokens: profile.reservedOutput,
    maxSteps: profile.maxSteps,
    fits,
  }
}

/**
 * The single number that replaces MAX_PAPER_CHARS: the smallest paper char
 * budget across the stages that ingest the full paper. It is the min because
 * the same paper string is fed to all of them; the binding constraint is
 * whichever stage leaves the least room (the reviewer, due to guidance +
 * roundtrip terms). Gatekeeper (sample only) and docxRepair (anchor surface
 * only) are excluded.
 */
export function effectivePaperCharBudget(model, registry, imageCount = 0) {
  const stages = ['reviewer', 'referenceCheck', 'reconciler']
  return Math.min(...stages.map((s) => paperBudgetForModel(model, registry, s, imageCount).paperCharBudget))
}
