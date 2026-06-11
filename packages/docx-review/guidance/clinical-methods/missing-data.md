---
id: missing-data
category: clinical-methods
name: Missing Data & Dropouts
applies_to: "Clinical trials and longitudinal studies"
---

# Missing Data & Dropouts

Use this chapter whenever a trial or longitudinal study has participant dropout, missed visits, or incomplete outcome ascertainment — i.e. almost always — to check that the missingness mechanism is justified, that the handling method matches that justification, that the analysis set is honest, and that conclusions are not an artefact of how missing values were filled in.

## How to use this chapter
- Find the numbers first: locate the CONSORT flow diagram (or participant disposition table), the planned vs. analysed N per arm, and the % of participants with missing primary-endpoint data per arm.
- Then find the words: locate where the statistical methods describe the missing-data handling (named method + assumed mechanism) and where the sensitivity analyses are reported.
- Cross-check the three must agree: the disposition numbers, the analysis-set definitions, and the denominators actually used in the results tables.
- Anchor every finding to a section/table/figure and, where possible, a number (e.g. "Table 2: n=84 analysed but 96 randomised, 12 dropouts unaccounted").
- Severity convention: **Major** = could change the direction, significance, or interpretation of the primary result, or misrepresents who was analysed; **Minor** = completeness/clarity/reporting gaps that do not change conclusions.

## 1. Quantify the missingness (do this before anything else)
- [ ] Overall and per-arm dropout/withdrawal rate is stated as a number AND a percentage.
- [ ] % missing on the **primary endpoint** is reported separately (not just overall attrition).
- [ ] Reasons for missingness are tabulated by arm (withdrawal of consent, AE, lack of efficacy, lost to follow-up, death, protocol deviation).
- [ ] Timing of dropout is described for longitudinal designs (early vs. late, monotone vs. intermittent missingness).
- **Decision rule (attrition magnitude):** <5% missing on the primary endpoint is usually low concern; 5–20% requires a stated method and sensitivity analysis; >20% is high risk and the primary conclusion should be treated as fragile unless robustness is demonstrated. Differential dropout between arms matters more than the absolute rate.
- **Decision rule (differential attrition):** a between-arm difference in dropout rate or reasons is a threat to internal validity regardless of total rate — flag it even if overall attrition is modest.

## 2. Estimand framing (ICH E9(R1)) — what question is being answered?
Modern confirmatory trials are expected to define a target **estimand** that specifies how intercurrent events (treatment discontinuation, rescue medication, death) are handled — missing data is the residual after the estimand is defined. Do not let "missing data" and "intercurrent events" be conflated.

- [ ] The estimand is stated, covering: population, endpoint, treatment, handling of intercurrent events, and population-level summary.
- [ ] The intercurrent-event strategy is named (treatment-policy, composite, while-on-treatment, hypothetical, or principal-stratum).
- [ ] Genuine missing data (no value obtained) is distinguished from data that exist but are post-discontinuation (an estimand choice, not a missingness problem).
- **Decision rule:** if a treatment-policy estimand is claimed but post-discontinuation data were not collected (so they had to be imputed), the chosen estimand and the available data are mismatched — flag it. Imputing your way into a treatment-policy estimand from data you never collected is a **Major** conceptual gap.
- **Flag:** "missing data" used as a catch-all that hides treatment discontinuations or rescue-medication use that should have been handled as intercurrent events under the estimand.

## 3. Missingness mechanism: MCAR / MAR / MNAR
Every handling method assumes a mechanism. The reviewer's job is to check the assumed mechanism is stated and plausible — not to accept the method on faith.

- **MCAR (Missing Completely At Random):** missingness unrelated to observed or unobserved data. Strong, usually implausible in clinical trials. Required for complete-case analysis to be unbiased.
- **MAR (Missing At Random):** missingness depends only on **observed** data (baseline covariates, earlier outcomes). The working assumption behind multiple imputation (MI) and MMRM. Untestable from the data alone.
- **MNAR (Missing Not At Random):** missingness depends on the **unobserved** value itself (e.g. patients drop out because they are getting worse). Common in trials; cannot be ruled out from observed data.

Checklist:
- [ ] The paper names which mechanism it assumes (not just the method).
- [ ] The plausibility of MAR is argued, not merely asserted ("we assumed MAR" with no rationale is weak).
- [ ] The authors acknowledge that MAR/MCAR cannot be verified from the observed data.
- **Decision rule:** if dropout is plausibly outcome-driven (efficacy failures, AEs, disease progression), MNAR is on the table and an MNAR-style sensitivity analysis is expected. A primary MAR analysis with **no** MNAR sensitivity check, in a trial where sicker patients leave, is a **Major** gap.

## 4. Handling method vs. assumption — is the method defensible?

### Complete-case / available-case analysis
- Assumes MCAR. Drops anyone with missing data.
- [ ] Flag if used as the primary analysis without MCAR justification.
- **Major** if substantial or differential dropout + complete-case primary analysis (biased and underpowered).

### LOCF (Last Observation Carried Forward) — and BOCF/WOCF
- Carries the last observed value forward. **Not** generally MAR-valid; assumes the outcome is frozen after dropout.
- [ ] Flag LOCF as a **primary** method in any modern trial — it is broadly discouraged (it can bias toward or away from the null unpredictably and understates uncertainty by treating imputed values as observed).
- [ ] LOCF may be acceptable only as a clearly-labelled conservative sensitivity analysis with rationale.
- **Major** if LOCF is the primary handling method for the primary endpoint and drives the result.

### Multiple Imputation (MI)
- MAR-valid when done properly. Imputes several complete datasets, analyses each, pools via Rubin's rules (propagates imputation uncertainty).
- [ ] Number of imputations stated (and adequate; very small numbers reduce efficiency).
- [ ] Imputation model is **congenial** with / at least as rich as the analysis model, and includes the outcome, treatment, and auxiliary/baseline predictors of missingness.
- [ ] Rubin's rules (or equivalent) used to combine estimates — single-imputation passed off as MI is wrong.
- [ ] Software/procedure named.
- **Flag:** imputation model that omits the treatment indicator or key auxiliary variables; "imputation" that fills a single value (that is single imputation, not MI).

### MMRM (Mixed Model for Repeated Measures)
- The default for continuous longitudinal endpoints. MAR-valid; uses all available observations without explicit imputation.
- [ ] Covariance structure is pre-specified (e.g. unstructured) and the fallback if it fails to converge is stated.
- [ ] Model includes time, treatment, treatment-by-time interaction, and baseline; the estimand/timepoint of interest is identified.
- [ ] Denominator: MMRM uses all randomised with ≥1 post-baseline measure — confirm this matches the stated analysis set.
- **Flag:** MMRM described but a complete-case denominator reported, or convergence/structure details absent.

### General
- [ ] The handling method is **pre-specified** in the protocol/SAP, not chosen after seeing the data.
- **Major** if the missing-data method appears to have been selected post hoc (compare to registry/protocol/SAP).

## 5. Sensitivity analyses (the heart of credibility)
A single missing-data method is never enough; robustness to the untestable assumption must be shown.

- [ ] At least one sensitivity analysis under a **different** missingness assumption is reported.
- [ ] At least one analysis departs from MAR toward MNAR (e.g. tipping-point analysis, delta-adjusted / pattern-mixture imputation, reference-based imputation such as jump-to-reference or copy-reference).
- [ ] The sensitivity analyses are **pre-specified**, not reverse-engineered to support the primary result.
- [ ] The conclusion is stated to hold (or not) across the sensitivity analyses — and if it does not hold, that is acknowledged honestly.
- [ ] A tipping-point analysis (if used) reports how extreme the assumption must become before the result reverses, with a judgement on clinical plausibility.
- **Decision rule:** primary result significant under MAR but not robust to plausible MNAR departures → the conclusion is fragile; the paper must say so. Claiming a robust effect while burying a sensitivity analysis that overturns it is a **Major** integrity issue.
- **Decision rule:** no sensitivity analysis at all, with non-trivial missingness, is **Major** for a confirmatory trial and at least **Minor–Major** for any longitudinal study.

## 6. Analysis sets and denominators (ITT honesty)
This is where missing-data handling and reporting integrity collide. Read the denominators in every key results table.

- [ ] ITT/full-analysis-set (FAS), per-protocol (PP), and safety set are each defined explicitly.
- [ ] The denominator in each results table matches the stated analysis set for that analysis.
- [ ] ITT analyses include all randomised participants in their **assigned** arm (intention-to-treat = analyse-as-randomised), regardless of adherence or completion.
- [ ] If a "modified ITT" (mITT) is used, the exclusions are defined, pre-specified, and small — and the rationale is given.
- **Decision rule:** if the paper says "ITT" but the analysed N is smaller than randomised N with no imputation/model accounting for the missing (i.e. the dropouts were simply dropped), that is a **complete-case analysis mislabelled as ITT** — **Major**.

## 7. CONSORT participant flow consistency
The flow diagram is the ground truth; everything must reconcile to it.

- [ ] A CONSORT-style flow diagram (or equivalent disposition table) exists, per arm: assessed for eligibility → randomised → received intervention → lost/discontinued (with reasons) → analysed.
- [ ] Numbers add up at every node: randomised = received + did-not-receive; randomised = analysed + (excluded with stated reasons).
- [ ] "Analysed for primary outcome" per arm in the flow diagram matches the primary results table denominator.
- [ ] Every post-randomisation exclusion has a reason, and post-randomisation exclusions are justified (post-randomisation exclusion breaks randomisation and is itself a red flag).
- [ ] Reasons for discontinuation are given by arm, not pooled.
- **Decision rule:** any arithmetic that does not reconcile across the flow diagram, methods, and results tables is at least **Minor** (reporting) and **Major** if it obscures who was actually analysed or hides differential dropout.

## 8. Reconciliation worked example (how to verify in practice)
Walk these steps on the actual numbers; this is the single most productive missing-data check.
1. Read randomised N per arm from the flow diagram (e.g. 100 vs. 100).
2. Read "analysed for primary outcome" per arm from the flow diagram (e.g. 88 vs. 79).
3. Open the primary results table and read its denominator per arm.
   - If it matches step 2 → consistent reporting; now check the **method** justifies using only those participants.
   - If it is larger than step 2 → values were imputed/modelled; confirm the method (MI/MMRM) and its assumption are stated.
   - If it is smaller than step 2, or smaller than randomised, while labelled "ITT" → mislabelled complete-case analysis (**Major**).
4. Compute per-arm missingness: (randomised − analysed)/randomised. Compare arms. A gap (e.g. 12% vs. 21%) is differential attrition — check it is acknowledged.
5. Sum the stated discontinuation reasons per arm and confirm they equal the dropout count at that node. Unexplained residual = **Minor–Major** depending on size.
6. Confirm the abstract/synopsis effect estimate uses the same denominator and method as the body. A headline number computed on completers while the body uses ITT is a **Major** inconsistency.

## Red flags to flag
Raise these explicitly, anchored to the location and (where possible) the numbers:

- **"ITT claimed but per-protocol / completers denominators used"** — analysed N < randomised N with no model or imputation; dropouts silently excluded under the ITT label.
- **Primary endpoint in results differs from the registered / pre-specified endpoint** — and missing-data handling may have been chosen to favour the new endpoint. Cross-check registry, protocol, and SAP.
- **Missing-data method not pre-specified** — method described only in the results/methods of the paper, absent from protocol/SAP, suggesting post hoc selection.
- **LOCF (or BOCF/WOCF) as the primary handling method** for the primary endpoint in a modern trial.
- **Single imputation presented as "imputation"** without Rubin's rules / multiple draws — understates uncertainty (CIs too narrow, p-values too small).
- **No sensitivity analysis** despite non-trivial or differential missingness; or sensitivity analyses that all stay within MAR (never stress MNAR).
- **Differential dropout between arms** (rate or reasons) not acknowledged or not addressed analytically.
- **Outcome-driven dropout treated as MAR/MCAR** — e.g. participants withdrawing for lack of efficacy or AEs, yet MNAR never considered.
- **Flow-diagram arithmetic that does not reconcile** with the results-table denominators, or post-randomisation exclusions without reasons.
- **% missing not reported for the primary endpoint** (only overall attrition given, masking endpoint-specific loss).
- **Imputation model omits the treatment indicator or known predictors of missingness** — biases toward the null or produces implausible imputations.
- **Conclusions assert robustness while a reported sensitivity analysis overturns the primary result** — the most serious integrity finding here.
- **"Available data" / "as observed" analysis** for a longitudinal endpoint presented as if it handled missingness.
- **Deaths imputed as if recoverable outcomes** (e.g. carrying forward QoL for deceased participants) without a composite/while-alive estimand framing.

## Severity quick-reference
- **Major:** mislabelled ITT; primary/registered endpoint mismatch; post hoc method selection; LOCF-driven primary result; no sensitivity analysis in a confirmatory trial with material missingness; primary result not robust to plausible MNAR but claimed robust; unreconciled denominators that hide who was analysed.
- **Minor:** missing % stated overall but not per endpoint; reasons for dropout pooled rather than by arm; number of imputations not stated though MI otherwise sound; covariance structure of MMRM not specified though results plausible; flow-diagram rounding/labelling gaps that still reconcile.

## Reviewer one-liners (wording to look for)
Confirm the report contains, in substance, statements like these — and flag their absence:
- "X% of participants on the primary endpoint were missing; this did not differ between arms."
- "The primary analysis used [MMRM / multiple imputation] under a missing-at-random assumption, pre-specified in the SAP."
- "Robustness to departures from MAR was assessed using [tipping-point / reference-based / delta-adjusted pattern-mixture] analysis; conclusions were unchanged."
- "All randomised participants were analysed in their assigned group (intention-to-treat)."
- "No post-randomisation exclusions were made," or each such exclusion is listed with a reason and arm.
