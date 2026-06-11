---
id: gcp-integrity
category: clinical-methods
name: GCP & Data Integrity
applies_to: "Clinical study reports and trial manuscripts"
---

# GCP & Data Integrity

Use this chapter when auditing a clinical study report (CSR), a trial manuscript, or any document that presents results from a regulated human trial — to confirm that the conduct described is consistent with ICH E6 Good Clinical Practice, that every number reconciles across tables/text/figures, that no value is impossible or internally contradictory, that what was pre-specified is what was reported, and that protocol deviations are disclosed rather than absorbed silently. Your job is forensic, not stylistic: treat unexplained numeric drift, post-hoc endpoint switching, and undisclosed deviations as integrity findings, not formatting nits.

The four questions that govern almost every flag in this chapter:
1. **Does it add up?** (numbers reconcile within and across tables, text, figures, and the flow diagram)
2. **Is it possible?** (no value is biologically, arithmetically, or logically impossible)
3. **Was it pre-specified?** (endpoints, analyses, populations, and thresholds match the registry/protocol/SAP, not the data)
4. **Was deviation disclosed?** (protocol deviations, amendments, and data-handling decisions are stated, dated, and reasoned)

What you can and cannot see from a document: you are not auditing source data or a trial master file. You assess **internal consistency** and **external consistency against public anchors** (the registry entry, the published protocol/SAP, prior reports). State which anchor you used; if no anchor is available, say so rather than assuming.

---

## 1. Registry, protocol & pre-specification anchors

Decision rule: the registered/pre-specified design is the reference truth. Pull the trial registration (ClinicalTrials.gov NCT, EudraCT/CTIS, ISRCTN, or other primary registry) and the protocol/SAP if available, and compare them against the document **before** reading the results narrative, so the results cannot anchor your expectations.

Checklist:
- [ ] Trial registration number is stated and resolvable; registry record exists.
- [ ] Registration was **prospective** (registered before first enrolment) — check the registration date vs. the stated start of enrolment.
- [ ] **Primary endpoint** in the document matches the registry/protocol primary endpoint exactly — same variable, same timepoint, same metric (e.g. change-from-baseline at week 12, not "response at any visit").
- [ ] Secondary/key-secondary endpoints match the pre-specified set; none are silently promoted to primary or demoted.
- [ ] The **analysis population** named for the primary analysis (ITT/mITT/per-protocol) matches the protocol/SAP.
- [ ] Pre-specified statistical methods, multiplicity strategy, and timepoint match the SAP.
- [ ] Any change to endpoints/analyses after trial start is **declared as a change**, dated, with a reason, and (ideally) made before unblinding — not presented as if original.
- [ ] Protocol amendments are listed with dates and rationale; amendments made after database lock or after interim looks get extra scrutiny.

Severity guidance:
- **Major**: primary endpoint differs from the registered/pre-specified one with no disclosure; retrospective registration presented as prospective; analysis population swapped without statement.
- **Minor**: registry record slightly stale (e.g. a secondary endpoint wording differs cosmetically) but substance matches and the difference is immaterial.

---

## 2. Numeric reconciliation across tables, text, figures & flow

Decision rule: every number that appears more than once must agree everywhere, and every total must equal the sum of its parts. Reconcile in this order — flow diagram → disposition table → baseline table → efficacy tables → safety tables → abstract/text — and carry forward the denominators.

Checklist:
- [ ] **Randomized N** in the flow diagram equals the randomized N in the text and the sum of per-arm randomized counts.
- [ ] Flow-diagram arithmetic closes: randomized = analyzed + (excluded/discontinued + lost), at every node, for every arm.
- [ ] **Analyzed N** for the primary endpoint matches the denominators actually used in the primary efficacy table.
- [ ] Per-arm Ns are consistent across baseline, efficacy, and disposition tables (or differences are explained by population/missingness, explicitly).
- [ ] **Percentages match their stated n/N**: recompute a sample of cells; flag any where round(n/N) ≠ printed %.
- [ ] Subgroup counts sum to the total; subgroup ns within a category sum to the arm N (allowing for stated missing).
- [ ] Event counts in text (e.g. "23 patients responded") equal the corresponding table cell.
- [ ] Figures (Kaplan–Meier numbers-at-risk, bar heights, forest-plot point estimates/CIs) agree with the tables they summarize.
- [ ] Abstract numbers (effect size, CI, p-value, primary N) match the main-text results exactly — not rounded differently or stale from an earlier draft.
- [ ] Means, SDs, and ranges are mutually compatible (e.g. a reported mean lies within the reported min–max; SD is plausible given the range — for non-extreme distributions, range is usually ≳ 2 SD and rarely ≫ 6 SD).
- [ ] Effect estimate, its CI, and the p-value are mutually consistent (a 95% CI excluding the null should accompany p < 0.05; a CI that includes the null should not accompany p < 0.05).

Decision rule on the n/CI/p triangle: if you can recompute the test statistic from n, the effect, and the SE/CI and it contradicts the stated p-value, that is a hard flag — recompute and quote both values.

Severity guidance:
- **Major**: randomized N or primary denominator does not reconcile across flow/text/tables; a p-value contradicts its own CI/effect; subtotals exceed totals.
- **Minor**: a single rounding inconsistency in a non-pivotal cell; an abstract figure rounded to fewer digits than the table but otherwise equal.

---

## 3. Impossible & contradictory values

Decision rule: scan for values that cannot be true regardless of the science. These are often data-handling or transcription errors, but in aggregate they signal weak quality control and warrant a hard look.

What to check:
- [ ] **Percentages outside 0–100%** (subject-level), or proportions whose numerator exceeds their denominator.
- [ ] **n exceeding N**: more events/patients in a cell than exist in the arm.
- [ ] Out-of-range physiology: negative ages/weights/counts; impossible vitals (e.g. heart rate of 0 in a live patient table, diastolic > systolic), gestational/lab values outside any plausible bound.
- [ ] **Sex/condition-incompatible events** (e.g. pregnancies in an all-male arm; prostate events in female participants).
- [ ] Timeline impossibilities: an AE/outcome dated before first dose in a treatment-emergent table; follow-up time exceeding the trial duration; a death followed by later on-treatment visits.
- [ ] **SD/SE of zero** for a continuous variable with a non-degenerate range, or implausibly tiny SDs across many variables.
- [ ] CIs that are inverted (lower > upper) or asymmetric in a way the stated method cannot produce.
- [ ] Survival/Kaplan–Meier curves that rise, numbers-at-risk that increase over time, or median survival outside the follow-up window.
- [ ] Contradictory statements: text says "no deaths occurred" while a safety table lists deaths; "double-blind" in title but an open-label procedure described in methods; "primary endpoint met" with a primary CI crossing the null.
- [ ] **Digit-preference / fabrication signals** (supportive, not conclusive): terminal-digit distributions far from uniform across many measured values; means too close to round numbers; baseline characteristics implausibly balanced across many variables (a too-good distribution of baseline p-values clustering near 1 can indicate non-random data).

Severity guidance:
- **Major**: any impossible value affecting a pivotal result (primary efficacy, safety totals, denominators); contradictory primary-endpoint conclusion.
- **Minor**: an isolated impossible value in a non-pivotal descriptive cell, likely a typo, that does not propagate.

---

## 4. Analysis-population integrity (ITT / mITT / PP)

Decision rule: the labelled population must match the denominator actually used. **ITT** = all randomized, analyzed by assigned arm, regardless of adherence/withdrawal. **mITT** = a pre-specified, justified subset (e.g. received ≥1 dose, ≥1 post-baseline measure) — legitimate only if defined a priori and reasonable. **Per-protocol (PP)** = adherent completers; it is a sensitivity analysis, not the basis for a primary efficacy claim in a superiority trial.

Checklist:
- [ ] The population used for the **primary analysis** is named and its definition stated.
- [ ] **ITT claim is honoured**: if "ITT" is stated, the denominator equals the randomized N for each arm; patients are analyzed under their assigned arm, not the treatment received.
- [ ] **mITT exclusions are pre-specified and symmetric** across arms; the number and reasons excluded from mITT are reported by arm.
- [ ] Post-randomization exclusions are listed with reasons and counts per arm (CONSORT participant flow) — exclusions correlated with arm or outcome are a strong bias signal.
- [ ] For non-inferiority/equivalence trials, both ITT and PP are reported and concordant (PP alone is not sufficient; ITT is anti-conservative for NI).
- [ ] Cross-overs and patients who received the wrong treatment are handled per the stated estimand (treatment-policy ITT keeps them in assigned arm).

Severity guidance:
- **Major**: "ITT" claimed but per-protocol/completer denominators are actually used; post-randomization exclusions are asymmetric and outcome-related; NI conclusion rests on PP only.
- **Minor**: mITT used and reasonable but the a-priori definition is not explicitly cited (substance is fine, documentation thin).

---

## 5. Selective reporting & outcome switching

Decision rule: compare the **reported** outcomes and analyses against the **pre-specified** set. Anything pre-specified but missing, or reported but not pre-specified, is a selective-reporting signal. Direction of switching matters: significant outcomes promoted and non-significant ones dropped is the classic pattern.

Checklist:
- [ ] Every pre-specified primary and secondary outcome is **reported regardless of result** (no silent omission of null secondaries).
- [ ] No outcome that was not pre-specified is presented as primary/confirmatory; genuinely new analyses are labelled **post hoc / exploratory**.
- [ ] The **timepoint** of the primary analysis matches pre-specification (not the best-looking visit chosen retrospectively).
- [ ] Subgroup and adjusted analyses are flagged as pre-specified vs. exploratory; pre-specified subgroups are reported even when null.
- [ ] Multiplicity handling matches the SAP; significant secondaries are not claimed without the pre-specified hierarchical/alpha control.
- [ ] Composite-endpoint definition matches pre-specification (components not added/removed to manufacture significance).
- [ ] "Spin": abstract/conclusion emphasis is proportionate to the primary result — a missed primary is not overshadowed by a favourable secondary or subgroup framed as the headline.

Severity guidance:
- **Major**: primary endpoint switched to a previously secondary/post-hoc outcome that reached significance; pre-specified primary missing from results; null primary spun as positive via a secondary.
- **Minor**: an exploratory analysis not explicitly labelled as such, where the primary is still clearly and correctly reported.

---

## 6. Protocol deviations & GCP conduct signals

Decision rule: GCP-compliant conduct is auditable from disclosures. Absence of any deviation reporting in a real-world multicentre trial is itself suspicious (zero deviations is rarely true). Look for what conduct details are stated, dated, and reasoned.

Checklist:
- [ ] **Protocol deviations** are reported (count, type, by arm/site where relevant), with important deviations distinguished from minor ones.
- [ ] Eligibility deviations (enrolled despite not meeting criteria) are disclosed and their handling in analysis stated.
- [ ] **Ethics/IRB approval** and the governing standard (Declaration of Helsinki, ICH E6 GCP) are stated.
- [ ] **Informed consent** procedure is described; for any vulnerable population, appropriate safeguards noted.
- [ ] Dates are coherent: ethics approval before enrolment; registration before enrolment (or lag disclosed); data-lock/cut-off date stated and consistent across analyses.
- [ ] Interim analyses / DSMB looks: if conducted, pre-specified, with alpha-spending stated; stopping decisions (efficacy/futility/harm) reasoned. Early stopping for benefit is noted as a potential overestimation bias.
- [ ] Data-handling decisions (outlier exclusion, imputation, unblinding events) are pre-specified and disclosed, not introduced post hoc to favour a result.
- [ ] Site/centre count and per-site enrolment are plausible; a single site contributing an implausible share, or impossibly fast enrolment, is a conduct red flag.
- [ ] Funding source and **conflicts of interest** disclosed; sponsor's role in design/analysis/reporting stated (sponsor-controlled analysis with no independent statistician is a risk factor, not a violation per se).

Severity guidance:
- **Major**: enrolment before ethics approval or before registration with no disclosure; deviations material to safety/eligibility undisclosed; post-hoc data exclusions that change the primary conclusion.
- **Minor**: deviation summary present but not broken down by arm/site; COI statement present but sponsor's specific role unstated.

---

## 7. Symmetry & cross-document consistency

Checklist:
- [ ] The **same data cut-off / database-lock date** governs every analysis in the document.
- [ ] Inclusion/exclusion rules, imputation rules, and thresholds are applied **identically across arms** (no rule that conveniently favours one arm).
- [ ] CSR ↔ manuscript ↔ registry results posting agree on primary N, primary estimate, CI, and p-value.
- [ ] Numbers in this document agree with any prior interim publication or the registry results section (or differences are explained).
- [ ] Conclusions are supported by the primary analysis on the pre-specified population — not by a sensitivity/subgroup/PP analysis.

---

## Red flags to flag

Raise these as specific, anchorable findings; quote the table title, arm, registry field, and exact numbers wherever possible.

- **Primary endpoint switched**: primary endpoint in results differs from the registered/pre-specified endpoint (different variable, timepoint, or metric) with no disclosure of the change.
- **ITT in name only**: ITT claimed but per-protocol/completer denominators are actually used (primary denominator < randomized N with no missingness explanation).
- **Asymmetric post-randomization exclusions**: exclusions that differ by arm and correlate with outcome, breaking randomization.
- **Pre-specified outcome missing**: a registered primary/secondary endpoint does not appear in results (selective omission, usually of a null).
- **Post-hoc dressed as confirmatory**: an unspecified analysis/subgroup/timepoint presented as primary or as the headline conclusion.
- **N does not reconcile**: randomized/analyzed N disagrees across flow diagram, text, and tables; flow-diagram arithmetic does not close.
- **p-value contradicts CI/effect**: a stated p-value is incompatible with the reported effect size and confidence interval on recomputation.
- **Percentage ≠ n/N**: printed percentages do not match the stated numerator and denominator.
- **Impossible value**: subject-level % outside 0–100, n > N, negative count, diastolic > systolic, AE dated before first dose, increasing numbers-at-risk, SD = 0 for a variable with spread.
- **Sex/condition-incompatible events**: events that cannot occur in the stated population (pregnancies in male arm, etc.).
- **Retrospective registration as prospective**: registration date after first enrolment, not disclosed.
- **Spin on a missed primary**: primary endpoint not met, but abstract/conclusion frames a secondary/subgroup as the result.
- **Composite tampering**: composite-endpoint components differ from the pre-specified definition.
- **Multiplicity ignored**: significant secondary endpoints claimed without the pre-specified alpha-control/testing hierarchy.
- **Zero deviations / no conduct disclosures**: a real multicentre trial reporting no protocol deviations, or omitting ethics approval, consent, and data-lock details.
- **Post-hoc data exclusions**: outliers/patients/sites removed without pre-specification in a way that changes the primary result.
- **Date incoherence**: enrolment before ethics approval; AEs outside the treatment-emergent window; follow-up exceeding trial duration; cut-off dates inconsistent across analyses.
- **Cross-document disagreement**: CSR, manuscript, and registry results posting report different primary estimates/Ns/p-values for the same analysis.
- **Digit-preference / too-perfect balance** (supportive signal): terminal-digit anomalies or baseline covariates implausibly balanced across many variables.
- **Early stopping unaccounted**: trial stopped early for benefit with no acknowledgement of effect-size overestimation, or interim looks without pre-specified alpha-spending.

---

## Severity calibration (quick rule)

- **Critical / Major** — anything that changes the credibility of the primary conclusion: endpoint switching, ITT-label violation, non-reconciling primary N, p–CI contradiction on the primary, undisclosed primary-altering exclusions, retrospective registration, conduct violations affecting safety/eligibility.
- **Minor** — documentation gaps that do not change the conclusion: cosmetic registry mismatch, an isolated non-pivotal typo, unlabelled-but-clearly-exploratory analysis, thin (but present) deviation/COI disclosure.
- When unsure whether a numeric discrepancy is a typo or a substantive error, **recompute and quote both numbers**, label the severity as "to confirm," and ask for the source value rather than asserting fabrication.

---

## Quick reviewer worksheet

Fill this from the document before writing findings:

| Anchor / value | From document | From registry/protocol | Match? |
|---|---|---|---|
| Registration number | | | |
| Prospective registration (date vs. enrolment) | | | |
| Primary endpoint (variable + timepoint) | | | |
| Primary analysis population | | | |
| Randomized N (per arm) | | | |
| Primary-analysis N (per arm) | | | |
| Primary effect estimate (CI, p) | | | |
| Multiplicity / testing hierarchy | | | |
| Protocol deviations reported? | | | |
| Data cut-off / lock date | | | |

Any row where the document and the anchor disagree, or where a document value cannot be filled, is a reportable finding. For numeric rows, recompute percentages and the effect–CI–p triangle and note any internal contradiction.
