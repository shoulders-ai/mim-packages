---
id: analysis-populations
category: clinical-methods
name: Analysis Populations
applies_to: "Clinical trials"
---

# Analysis Populations

Use this chapter whenever you review a clinical-trial report, CSR, or manuscript that defines or relies on analysis sets (ITT, mITT, per-protocol, safety, as-treated) — verify each set is defined, justified, and used consistently with reported denominators and the pre-specified plan.

The core reviewer question is always the same: **Does the population actually analysed match the population that was claimed and pre-specified, and are the denominators in every table internally consistent?** Most analysis-population problems are anchorable as a mismatch between a definition, a denominator, and a claim.

## 1. Definitions a reviewer must confirm exist and are correct

For each set, check the protocol/SAP defines it and the report uses it as defined. The standard reference frame is ICH E9 (Statistical Principles for Clinical Trials), Section 5.2 ("Analysis Sets") and CONSORT 2010 Item 16 (numbers analysed). Use the definitions below as the audit standard.

- **ITT (Intention-to-Treat) / Full Analysis Set (FAS)**: All randomised participants analysed in the group to which they were **randomised**, regardless of treatment actually received, adherence, eligibility errors, or withdrawal. ICH E9 calls the practical, slightly-reduced version the Full Analysis Set, derived from ITT by pre-specified, justified, non-outcome-related exclusions. "Analysed as randomised" is the defining property.
- **Modified ITT (mITT)**: ITT minus a *pre-specified* subset, e.g. "received at least one dose" or "had at least one post-baseline efficacy assessment." There is **no single standard definition** — mITT is only acceptable if the exclusion rule is pre-specified, justified, and not related to outcome or post-randomisation behaviour that could differ by arm. Treat every mITT as a custom definition requiring scrutiny.
- **Per-Protocol (PP) / Per-Protocol Set (PPS)**: The subset who completed treatment without major protocol deviations (adequate exposure, eligible, no prohibited meds, key assessments available). PP is a **post-randomisation, often outcome-correlated** selection and is therefore susceptible to bias. Appropriate as a *supportive/secondary* analysis, especially for non-inferiority/equivalence.
- **Safety Set / Safety Population**: All participants who received **at least one dose** of study treatment, analysed by the treatment **actually received** (not as randomised). This is the standard denominator for all adverse-event, lab, and exposure reporting.
- **As-Treated (AT)**: Participants grouped by the treatment they **actually received** regardless of randomisation. Used mainly for safety and for sensitivity analyses; not a primary efficacy set in superiority trials.

Quick reference table:

| Set | Who is included | Grouped by | Primary use |
|-----|-----------------|-----------|-------------|
| ITT / FAS | All randomised | Randomised arm | Primary efficacy (superiority) |
| mITT | Pre-specified subset of ITT | Randomised arm | Secondary/primary if justified |
| Per-protocol | Completers w/o major deviations | Randomised arm (usually) | Supportive; co-primary for NI |
| Safety | Received ≥1 dose | Treatment received | All safety/AE reporting |
| As-treated | Received ≥1 dose | Treatment received | Safety, sensitivity analyses |

## 2. Appropriateness — decision rules by trial type

- **Superiority trial → primary analysis MUST be ITT/FAS.** ITT preserves randomisation and is conservative (dilutes effect toward null), so it cannot manufacture a false positive. If the primary efficacy claim rests on PP or "evaluable patients," flag as **major**.
- **Non-inferiority / equivalence trial → ITT is NOT automatically conservative.** Here ITT can bias toward "no difference" (i.e. toward concluding non-inferiority). Both ITT and PP should be reported and the conclusion should hold in **both**. If only one is reported, or the two disagree and the disagreement is not discussed, flag (**major** if the NI conclusion depends on the choice).
- **Safety claims → must use the safety/as-treated set, by treatment received.** A safety section using the randomised (ITT) grouping for AEs is a methodological error — flag.
- **mITT as primary** is acceptable only with a pre-specified, outcome-independent exclusion rule. The classic acceptable rule is "received ≥1 dose"; a classic *unacceptable* one is "had a post-baseline measurement" when missingness is plausibly differential by arm.
- **Choice of set must be pre-specified.** The protocol/SAP must name the primary analysis set *before* unblinding. A set introduced for the first time in the results is a red flag.

Decision rule for the reviewer:
```
Is the primary endpoint efficacy in a superiority trial?
  YES → primary set must be ITT/FAS. PP-only primary = MAJOR.
Is it a non-inferiority/equivalence trial?
  YES → require BOTH ITT and PP; conclusion must agree in both.
Is the claim about harms/AEs?
  YES → must use safety set, grouped by treatment received.
Is mITT used?
  YES → is the exclusion rule pre-specified, justified, outcome-independent?
        NO → flag (severity scales with how many excluded & whether differential).
```

### Worked example — spotting a mislabelled population
> Methods: "The primary efficacy analysis was performed on the intention-to-treat population."
> Results, Table 2 header: treatment n=178, placebo n=181 (sum 359).
> Flow diagram: 400 randomised (200 per arm); 41 "discontinued/non-evaluable" excluded.
> **Reviewer action:** 400 randomised but 359 analysed = 41 dropped → this is a *per-protocol/evaluable* analysis labelled "ITT." Check whether exclusions differ by arm (22 vs 19). Flag as **Major**: "ITT claimed but per-protocol denominators used; 41/400 randomised participants excluded post-randomisation. Request true ITT analysis (all 400, as randomised) with a stated missing-data method, or correct the population label."

## 3. Denominator consistency — the highest-yield checks

This is where most real, anchorable problems live. Work numerically.

- [ ] **Reconcile the flow.** Randomised N should equal the ITT/FAS N (or differ only by clearly stated, justified, pre-specified exclusions). Trace: screened → randomised → each analysis set → analysed for primary outcome. Numbers must add up.
- [ ] **CONSORT flow diagram present and arithmetic-correct?** Each box should reconcile (randomised = sum of arms; analysed + excluded = randomised). Recompute the additions yourself.
- [ ] **Per-arm denominators stated for every results table?** "Numbers analysed" (CONSORT Item 16) must appear per group per outcome, not just a single overall N.
- [ ] **Same N across tables, or differences explained?** If the efficacy table denominator differs from the baseline table denominator, there must be a stated reason. Silent denominator drift is a flag.
- [ ] **Percentages match their stated denominator?** Recompute a few: numerator/denominator should reproduce the reported %. A % that implies a different N than the table header is anchorable.
- [ ] **Excluded-after-randomisation participants counted and reasons given?** Any post-randomisation exclusion from the ITT set needs a count and a reason; exclusions correlated with outcome or arm are a serious bias signal.
- [ ] **Missing data handled, not silently dropped?** If the analysed N is below the randomised N, confirm whether completers-only (implicit PP) is being passed off as ITT. "ITT" with shrinking denominators across timepoints often means observed-cases analysis mislabelled as ITT.

## 4. Cross-document consistency (protocol / SAP / registry / report)

- [ ] Population definitions in the report match the protocol/SAP verbatim in intent.
- [ ] The **primary endpoint and primary analysis set** in the report match the **pre-registered** entry (ClinicalTrials.gov / EudraCT / ISRCTN) and the SAP dated before unblinding.
- [ ] Any change to analysis-set definitions is disclosed, dated, justified, and ideally pre-unblinding.
- [ ] Number randomised in the report matches the registry's enrolment and the protocol's target.

## 5. Red flags to flag

Each item below is phrased so it can be anchored to specific text/numbers in the document.

**Major (can change the conclusion or indicate bias):**
- "ITT" or "intention-to-treat" claimed in the methods/abstract, but the analysed denominators match the per-protocol/evaluable set (i.e. **ITT claimed but per-protocol denominators used**).
- Primary efficacy conclusion in a **superiority** trial rests on per-protocol / "evaluable" / completers analysis rather than ITT.
- **Primary endpoint or primary analysis population in the results differs from the registered/pre-specified one** without disclosure.
- Post-randomisation exclusions from the ITT set that are **outcome-related or differ by arm** (e.g. more "non-compliant" exclusions in one arm).
- mITT used as primary with an exclusion rule that is **not pre-specified** or is plausibly **differential by arm** (e.g. "patients with a post-baseline visit," when dropout differs between arms).
- Non-inferiority/equivalence conclusion based on **ITT only** (or PP only), with no confirmation that both agree.
- Numbers don't reconcile: randomised ≠ analysed + excluded, or arm totals don't sum to the randomised N, and no explanation.
- Adverse events / safety reported on the **randomised (ITT) grouping** rather than treatment actually received.
- Denominator drift: analysed N shrinks across timepoints while still labelled "ITT," with no missing-data method stated (completers analysis mislabelled).

**Minor (clarity/reporting; flag but rarely changes conclusions):**
- Analysis sets named but **not explicitly defined** in methods (reader must infer).
- "mITT" used without stating the exact exclusion rule.
- Percentages whose denominator is ambiguous or not labelled per arm.
- FAS vs ITT terms used interchangeably without noting the distinction.
- CONSORT flow diagram absent though numbers are recoverable from text.
- Number analysed per outcome not given per arm (only overall).

**Sensitivity / context-dependent:**
- ITT and PP results materially diverge and the divergence is reported but not **discussed/interpreted** → flag for interpretation (severity depends on whether it affects the conclusion).
- A single "all patients" denominator used for both efficacy and safety → likely conflation of FAS and safety set; query.

## 6. Severity guidance

- **Major** = the analysis-population issue could change the trial's conclusion, masks a bias, or contradicts the pre-specified/registered plan. Examples: PP passed off as ITT in a superiority trial; primary set/endpoint switched from registration; outcome-related differential exclusions; safety on the wrong grouping when it affects the harms profile.
- **Minor** = reporting/transparency gaps that a reader can recover or that don't plausibly alter conclusions. Examples: missing explicit definitions, FAS/ITT terminology slippage, missing flow diagram when counts are in text.
- **Escalate a minor to major** when the gap *prevents verification* — e.g. denominators cannot be reconciled at all, so you cannot confirm whether ITT was truly used. Inability to verify the population is itself a major concern.

## 7. Exact wording to look for

**Reassuring language (presence is good, but verify it matches the numbers):**
- "All randomised participants were analysed in the group to which they were assigned."
- "The full analysis set comprised all randomised patients; the safety set comprised all patients who received at least one dose."
- "The primary analysis was conducted on the intention-to-treat population, defined as…"
- "Both intention-to-treat and per-protocol analyses were performed and yielded consistent conclusions."
- "Missing data were handled by [multiple imputation / mixed model for repeated measures], without exclusion of randomised participants."

**Suspicious language (probe and reconcile against denominators):**
- "Evaluable patients," "patients who completed the study," "analysable population," "patients with available data" used as the **primary** efficacy denominator.
- "Modified intention-to-treat" with no stated exclusion rule, or a rule like "had at least one post-baseline assessment."
- "Patients who were non-compliant / ineligible / lost to follow-up were excluded from the analysis" (post-randomisation exclusion from ITT).
- "Per-protocol analysis" presented as the headline result in a superiority trial.
- A methods statement of ITT contradicted by results tables whose N is below randomised with no missing-data method.
- "Intention-to-treat" alongside footnotes such as "n = …" that vary table-to-table without explanation.

## 8. Reviewer write-up template

When raising an analysis-population finding, anchor it:
```
[Location: e.g. Table 2 / Section 9.4 / abstract]
Claim made: [e.g. "primary analysis was ITT"]
What the numbers show: [e.g. randomised n=420 but primary-outcome table n=380 per arm-sum]
Standard/expectation: [ICH E9 5.2 FAS; CONSORT Item 16; pre-registered endpoint]
Issue: [e.g. 40 post-randomisation exclusions not reconciled; ITT claim unsupported]
Severity: [Major/Minor] because [could/could not change conclusion]
Request: [e.g. provide reconciled CONSORT flow + reasons for exclusions; confirm ITT denominators]
```

## 9. Standards to cite (describe accurately; do not invent item numbers)

- **ICH E9 (1998), Statistical Principles for Clinical Trials**, Section 5.2 "Analysis Sets" — defines Full Analysis Set (ITT principle) and Per-Protocol Set, and requires pre-specification of analysis sets and justification of any exclusions. The governing reference for population choice.
- **ICH E9(R1) addendum (estimands and sensitivity analysis)** — frames the population as part of the estimand; useful when handling of intercurrent events and missing data is in question.
- **CONSORT 2010**, Item 16 ("Numbers analysed") — for each group, number of participants in each analysis and whether analysis was by original assigned groups (ITT); Item 13 (participant flow) — the flow diagram and post-randomisation losses/exclusions with reasons.
- **ICH E3** — CSR structure; analysis sets are defined and tabulated in the efficacy/safety sections; use to check the CSR has the expected population definitions.
- For non-inferiority/equivalence reporting expectations, the **CONSORT extension for non-inferiority and equivalence trials** describes the requirement to report and reconcile ITT and PP analyses.

When citing, state the requirement in your own words and reference the standard generically if you are not certain of the exact item number — accuracy over specificity.
