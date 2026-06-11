---
id: stard
category: reporting-standards
name: STARD 2015 (Diagnostic Accuracy)
applies_to: "Diagnostic test-accuracy studies"
---

# STARD 2015 — Diagnostic Accuracy Reviewer Tool

Use this chapter when reviewing a study that estimates how well an index test classifies patients against a reference standard (sensitivity, specificity, predictive values, likelihood ratios, AUC/ROC, agreement) — not when reviewing an RCT (use CONSORT) or a prognostic/screening-effectiveness trial.

STARD 2015 has 30 items. The reviewer's job is not to tick all 30 but to confirm that a reader can (a) tell who was tested, (b) trust the reference standard, (c) reconstruct the 2x2 table, and (d) judge whether the reported accuracy generalizes. Anchor every comment to the manuscript text (table, figure, sentence) that is missing or wrong.

## How to read a diagnostic-accuracy paper fast (do this first)
1. Find the **target condition** and the **reference standard** used to define it. If you cannot state both in one sentence, the paper has a core reporting failure.
2. Find the **2x2 table** (or reconstruct it from TP/FP/FN/TN, or from n + sensitivity + specificity + prevalence). If you cannot rebuild the table, flag it — every estimate downstream is unverifiable.
3. Trace the **flow diagram**: enrolled → received index test → received reference standard → included in analysis. Note every drop and every "indeterminate".
4. Check whether the **threshold / cutoff** for a positive index test was pre-specified or chosen from the data.
5. Check whether index-test and reference-standard readers were **blinded** to each other.

## Reconstructing the 2x2 (do this on every paper)
Lay out the table and fill it from whatever the paper gives you. The reference standard is the truth; the index test is what you are grading.

|                  | Disease + (ref) | Disease − (ref) |
|------------------|-----------------|-----------------|
| Index test +     | TP              | FP              |
| Index test −     | FN              | TN              |

- **Sensitivity** = TP / (TP + FN) — among diseased, fraction the test catches. Driven by the FN.
- **Specificity** = TN / (TN + FP) — among non-diseased, fraction correctly cleared. Driven by the FP.
- **PPV** = TP / (TP + FP) — prevalence-dependent. **NPV** = TN / (TN + FN) — prevalence-dependent.
- **LR+** = sensitivity / (1 − specificity); **LR−** = (1 − sensitivity) / specificity. Prevalence-independent; prefer these for transportability.
- Recovery checks: if only n, sensitivity, specificity, and prevalence are given, TP = sens × prev × n, FN = (1−sens) × prev × n, TN = spec × (1−prev) × n, FP = (1−spec) × (1−prev) × n. If the resulting cells are not near-integers or do not sum to the analyzed n, the numbers are internally inconsistent — flag it.
- If indeterminates exist, decide whether the denominator the authors used excludes them. Recompute sensitivity/specificity with indeterminates counted as wrong and see how far the estimate moves; a large swing that the paper never shows is a flag.

## Title and Abstract
- **Item 1 — Title/keywords**: Identifies the article as a study of diagnostic accuracy using at least one measure (e.g., sensitivity, specificity, AUC). Flag titles that overclaim ("diagnostic value", "predicts") without an accuracy framing.
- **Item 2 — Abstract**: Structured summary of design, methods (setting, participants, index test, reference standard), results (key accuracy estimates **with confidence intervals**), and conclusions. Flag abstracts that report a point estimate (e.g., "sensitivity 92%") with no CI and no denominator.

## Introduction
- **Item 3 — Background**: Scientific and clinical background, including the intended use and clinical role of the index test (triage, replacement, add-on).
- **Item 4 — Objectives/hypotheses**: Study objectives and hypotheses. A confirmatory study should state a pre-specified target accuracy or comparison; a study with no stated hypothesis is exploratory and its estimates are hypothesis-generating — say so.

## Methods — Design
- **Item 5 — Design timing/sampling**: Whether data collection was planned **before** the index test and reference standard were performed (prospective) or **after** (retrospective). Retrospective and registry-based designs are higher-risk for selection and verification bias — note it.
- **Item 6 — Eligibility criteria**: Inclusion/exclusion criteria. Watch for criteria that exclude diagnostically difficult or borderline patients.
- **Item 7 — Recruitment**: How participants were identified (symptoms, prior test results, registry). A sample recruited **on the basis of already knowing the diagnosis** (case-control "diagnostic" design with healthy controls vs. clear cases) inflates accuracy — flag as a major design limitation, not a minor reporting gap.
- **Item 8 — Sampling**: Consecutive, random, or convenience sampling, and whether sampling was a planned subset. Convenience sampling without justification is a limitation.
- **Item 9 — Data collection**: Whether index/reference data were collected with knowledge of the clinical information that would be available in practice.

## Methods — Test Methods
- **Item 10a — Index test detail**: Index test described in **enough detail to permit replication** (device, version, reagents, software, operator, settings).
- **Item 10b — Reference standard detail**: Reference standard described in enough detail to permit replication, and justified as an acceptable definition of the target condition. Flag a reference standard that is itself imperfect without acknowledgement (imperfect-gold-standard bias).
- **Item 11 — Rationale for reference standard**: Why this reference standard is appropriate. If a **composite** or **consensus-panel** reference standard is used, confirm the components and adjudication rules are stated.
- **Item 12a — Index test cutoff**: Definition of and rationale for the positivity cutoff/categories, and **whether it was pre-specified**. A cutoff chosen to maximize Youden's J / accuracy **in the same dataset** is optimistically biased — see Red flags.
- **Item 12b — Reference standard cutoff**: Same for the reference standard, distinguishing pre-specified vs. data-derived.
- **Item 13a — Blinding (index readers)**: Whether index-test readers were blinded to the reference-standard result/clinical information.
- **Item 13b — Blinding (reference readers)**: Whether reference-standard readers were blinded to the index-test result. Unblinded reference reading causes review bias — flag if blinding is unreported in a subjective test (imaging, pathology, clinical adjudication).

## Methods — Analysis
- **Item 14 — Estimation of accuracy**: Methods for estimating/comparing accuracy measures. Confirm CIs are reported and the method is appropriate (e.g., exact/Wilson for proportions; clustered methods if multiple lesions per patient).
- **Item 15 — Handling indeterminate results**: How indeterminate index-test or reference-standard results were handled. Silently dropping indeterminates inflates accuracy — this must be stated and ideally shown in a sensitivity analysis.
- **Item 16 — Missing data**: How missing data on index test and reference standard were handled. Complete-case analysis without comment when the flow diagram shows substantial loss is a flag.
- **Item 17 — Variability analyses**: Any analyses of variability in accuracy by subgroup, site, reader, or spectrum, and whether pre-specified or exploratory.
- **Item 18 — Sample size**: How the intended sample size was determined. Absence is common but should be noted; a study powered for sensitivity but reporting specificity as primary is a flag.

## Results
- **Item 19 — Flow diagram**: A flow diagram is **strongly expected**. Confirm it shows numbers at each stage: eligible → enrolled → received index test → received reference standard → analyzed, with reasons for exclusions. A missing or non-reconciling flow diagram is a major reporting gap.
- **Item 20 — Baseline/clinical characteristics**: Demographic and clinical characteristics of the study population, and especially the **distribution of disease severity / alternative diagnoses** (spectrum). Narrow spectrum limits generalizability.
- **Item 21a — Index test distribution**: Distribution of severity of the target condition among those with it.
- **Item 21b — Reference distribution**: Distribution of alternative diagnoses among those without the target condition.
- **Item 22 — Time interval**: Time interval and any clinical interventions **between** index test and reference standard. A long or variable interval allows the condition to change (disease-progression bias) — flag if unreported or implausibly long.
- **Item 23 — Cross-tabulation (the 2x2)**: Cross-tabulation of index-test results (including indeterminates) by the reference standard. This is the core deliverable. Confirm the raw TP/FP/FN/TN are recoverable.
- **Item 24 — Accuracy estimates with CIs**: Estimates of diagnostic accuracy and their precision (e.g., 95% CIs). Point estimates without CIs are not acceptable for a confirmatory claim.
- **Item 25 — Adverse events**: Any adverse events from index test or reference standard.

## Discussion
- **Item 26 — Limitations**: Study limitations, including sources of bias and applicability concerns. A discussion that does not mention spectrum, verification, or the imperfect reference standard when those apply is inadequate.
- **Item 27 — Implications**: Implications for practice, including the intended clinical role, at the observed prevalence. Watch for predictive values (PPV/NPV) generalized to a population with very different prevalence.

## Other Information
- **Item 28 — Registration**: Registration number and registry. Diagnostic studies are less consistently registered than RCTs, but a registered study with discrepancies between protocol and report is a serious flag.
- **Item 29 — Protocol**: Where the full study protocol can be accessed.
- **Item 30 — Funding/role**: Sources of funding and the role of funders, and conflicts — especially **the test manufacturer** funding or supplying readers/analysis.

## Named biases — what causes them and where to look
- **Spectrum bias**: study population is sicker/healthier or less ambiguous than real patients. Look at items 6–8, 20, 21. Symptom: implausibly high sens AND spec.
- **Partial / workup verification**: only some get the reference standard. Look at item 19 flow and item 12/15. Symptom: inflated sensitivity.
- **Differential verification**: positives and negatives get different reference standards. Look at item 10b/11. Symptom: inflated specificity or sensitivity depending on which arm got the weaker standard.
- **Incorporation bias**: index test feeds the reference definition. Look at item 11 adjudication rules.
- **Review / observer bias**: readers not blinded. Look at items 13a/13b. Symptom: subjective test, no blinding statement.
- **Disease progression bias**: long interval between tests. Look at item 22.
- **Optimistic-cutoff (overfitting) bias**: cutoff chosen in-sample. Look at items 12a, 14, 18.
- **Imperfect-gold-standard bias**: reference standard itself errs but is treated as truth. Look at items 10b, 11, 26.
- **Clustering**: multiple lesions/eyes/samples per patient analyzed as independent. Look at item 14 and the analyzed denominator vs. number of patients.

## Per-metric "what to flag"
- **Sensitivity/specificity**: missing CIs; denominators that differ from the flow diagram; no statement of the cutoff used.
- **PPV/NPV**: reported without stating the sample prevalence, or transported to a different-prevalence population.
- **Likelihood ratios**: good practice — but check CIs and that they are computed at a stated cutoff.
- **AUC/ROC**: AUC alone with no operating point; ROC built across cutoffs then the "best" cutoff's sens/spec reported as the result without validation.
- **Agreement (kappa, % agreement)**: reported as if it were accuracy — agreement against an imperfect comparator is not diagnostic accuracy; flag the conflation.
- **Diagnostic odds ratio / single composite metric**: a single number that hides the sens/spec trade-off; ask for the underlying pair.

## Decision rules
- **Can you rebuild the 2x2?** If no (no table, no TP/FP/FN/TN, and not derivable from n/sens/spec/prevalence) → major. If yes but only via assumptions → minor + request.
- **Was the cutoff pre-specified?** Data-derived optimal cutoff with no external/split validation → treat reported sensitivity/specificity as optimistic; major if framed as confirmatory.
- **Did everyone get the same reference standard?** If positives and negatives were verified by **different** reference standards (e.g., biopsy for test-positives, follow-up for test-negatives) → differential verification bias → major.
- **Did everyone get a reference standard at all?** If only a subset (often test-positives) was verified → partial/workup verification bias → major unless appropriately corrected and stated.
- **Were readers blinded?** Subjective index or reference test without stated blinding → review bias → major; objective automated test without blinding → minor.
- **Is prevalence in the sample representative?** PPV/NPV reported and then exported to clinical practice without re-anchoring to real-world prevalence → flag; prefer likelihood ratios for transportability.
- **Indeterminates handled?** Dropped silently → major; reported and analyzed in sensitivity analysis → acceptable.

## Red flags to flag
- **2x2 table cannot be reconstructed** — no cross-tabulation, no raw counts, and estimates not derivable from reported n, sensitivity, specificity, and prevalence. Every downstream number is unverifiable. (Major)
- **Accuracy estimates reported without confidence intervals** — bare point estimates ("sensitivity 95%") with no CI and/or no denominator. (Major for primary estimates; minor for secondary.)
- **Data-derived optimal cutoff presented as validated performance** — threshold chosen to maximize Youden index/accuracy in the same sample, then reported as the test's sensitivity/specificity with no split-sample or external validation. Optimistic bias. (Major if confirmatory framing.)
- **Differential verification** — test-positive patients verified by one (stronger) reference standard and test-negatives by another (weaker, e.g., clinical follow-up). Biases accuracy. (Major)
- **Partial / workup verification** — only a selected subset (often those with positive index or symptoms) received the reference standard; unverified patients excluded rather than corrected. Inflates sensitivity. (Major)
- **Case-control "two-gates" design** — clear-cut diseased cases vs. healthy controls instead of a clinically relevant consecutive cohort. Spectrum effect grossly inflates both sensitivity and specificity. (Major)
- **No / non-reconciling flow diagram** — cannot trace participants from eligible to analyzed, or the numbers do not add up across stages. (Major)
- **Indeterminate results silently dropped** — "uninterpretable", "equivocal", or "technical failure" results excluded from the denominator without statement or sensitivity analysis. (Major)
- **Reference standard is imperfect but treated as gold** — e.g., a reference test with known limited sensitivity used as ground truth without acknowledging incorporation/imperfect-standard bias. (Major if it could reverse conclusions; minor if acknowledged.)
- **Incorporation bias** — the index test result (or its components) is part of the reference standard / adjudication, so the index test is partly validating itself. (Major)
- **No blinding between index and reference readers** for a subjective test (imaging, cytology, clinical adjudication). Review bias. (Major)
- **Spectrum not described** — no information on disease severity or the mix of alternative diagnoses among non-diseased, so generalizability cannot be judged. (Minor–major depending on claims.)
- **Prevalence/PPV mismatch** — PPV/NPV from a high-prevalence referral sample presented as the test's real-world performance in screening or primary care. Use/expect likelihood ratios for transport. (Major if it drives the clinical claim.)
- **Long or unstated interval between index test and reference standard** — condition could change between tests (disease progression/regression bias). (Minor–major by context.)
- **Multiple targets/lesions per patient analyzed as independent** — clustering ignored, CIs falsely narrow (e.g., per-lesion analysis reported as per-patient accuracy). (Major for inference.)
- **Selective threshold/outcome reporting vs. protocol/registration** — the reported primary accuracy measure, cutoff, or population differs from the pre-specified one without explanation. (Major)
- **Overlapping/duplicated data** — same cohort reported across multiple papers without disclosure, risking double-counting in any pooled reading. (Major)
- **Manufacturer-conflicted analysis** — funder/manufacturer supplied the device, performed the reading, or controlled the analysis, with readers not independent. (Note; escalate if combined with other flags.)
- **AUC reported as the only metric** — single AUC without sensitivity/specificity at a usable, pre-specified clinical cutoff, so the result is not actionable. (Minor–major depending on the intended clinical role.)

## Severity guidance (summary)
- **Major** (can change validity or direction of the conclusion): unreconstructable 2x2; verification bias (partial or differential); case-control two-gates design; incorporation bias; data-derived cutoff sold as validated; silently dropped indeterminates; primary measure differs from pre-specification; unblinded subjective reading; clustering ignored for the primary inference.
- **Minor** (reporting completeness / clarity; unlikely to reverse conclusions): missing CIs on secondary estimates; spectrum or interval underdescribed but inferable; sample-size justification absent; AUC-only when a cutoff is secondary; registration/protocol location not stated.
- **Context-dependent**: prevalence/PPV transportability and funder role — escalate when they underpin the headline claim or co-occur with a major flag.

## Special cases
- **Comparative accuracy (two index tests)**: confirm both tests were applied to the **same** patients (paired design) or that randomization/comparability is justified; the comparison must be a formal test of the difference with a CI, not two separate single-test estimates eyeballed side by side. Flag if only one test was applied to test-positives.
- **Multiple readers / AI-vs-reader**: confirm reader variability is reported and whether the unit of analysis is reader-case; flag pooled estimates that ignore reader clustering.
- **Screening / very low prevalence**: a test with high specificity can still produce mostly false positives at low prevalence — confirm PPV is reported at the realistic prevalence, not the enriched study prevalence.
- **Risk-score / continuous biomarker reported as a test**: confirm a clinically usable cutoff is pre-specified; "AUC 0.84" is not by itself an actionable accuracy claim.
- **Machine-learning index test**: confirm train/validation/test separation; in-sample accuracy with no held-out or external set is optimistic — treat as a development study, not a validation.

## Minimum acceptable reporting (reject/major if absent)
A diagnostic-accuracy report that lacks all of the following cannot be properly appraised: (1) a stated reference standard and target condition; (2) a reconstructable 2x2 / cross-tabulation; (3) sensitivity and specificity (or equivalent) with CIs; (4) the cutoff and whether it was pre-specified; (5) a participant flow account. Missing one of (1)-(5) is typically major.

## Reviewer note to authors (template)
"The reported [sensitivity/specificity/PPV] cannot be independently verified because [the 2x2 cross-tabulation / raw TP-FP-FN-TN counts] are not provided (STARD item 23) and the estimates lack confidence intervals (item 24). In addition, [partial verification / a data-derived cutoff / unblinded reference reading] suggests the estimates are likely [optimistic/biased]; please provide the cross-tabulation, report CIs, and clarify whether the cutoff was pre-specified."
