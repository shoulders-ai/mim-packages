---
id: spirit
category: reporting-standards
name: SPIRIT 2013 (Protocols)
applies_to: "Clinical trial protocols and statistical analysis plans"
---

# SPIRIT 2013 — Protocol & SAP Review

Use this chapter when reviewing a clinical trial **protocol** or a **statistical analysis plan (SAP)** (or a manuscript whose registered protocol/SAP you can inspect) — SPIRIT 2013 is the protocol-content standard (the protocol counterpart to CONSORT). Your job is not to assess results; it is to verify that everything needed to run, analyze, and later report the trial without bias is **pre-specified, unambiguous, and internally consistent**.

How to read this chapter: each section gives the checklist items to confirm, then **decision rules** (when to flag). The **Red flags** section near the end is the fast triage list — start there if you are time-boxed. Every flag should be anchored to a specific page/section/sentence in the document.

## Fast triage workflow (do this first)
If you have limited time, run these six checks before anything else; they catch most of the high-severity problems:
1. Find the **primary endpoint**. Confirm it has metric + aggregation + timepoint, appears identically in objectives/outcomes/SAP, and matches the **registry**.
2. Find the **primary analysis population**. Confirm it is named (ITT/mITT/PP) and matched to the framework.
3. Find the **sample size** paragraph. Try to reproduce N from the stated inputs.
4. Find the **framework** statement (superiority vs non-inferiority) and, if non-inferiority/equivalence, the **margin**.
5. Find the **interim analysis** plan. If interim looks exist, confirm a stopping rule + alpha-spending method.
6. Find the **missing-data** plan and the **publication/dissemination** clause.
If any of these six is absent or inconsistent, you almost certainly have a MAJOR finding.

## Core review stance
- A protocol/SAP is a *pre-commitment device*. The reviewer's central question is always: **could the trialists, after seeing the data, change a definition or analysis without anyone noticing?** Anything left vague is a degree of freedom that biases the eventual results.
- Cross-check the protocol against the trial registry record (ClinicalTrials.gov / EudraCT / ISRCTN / a national registry) **whenever a registration number is given**. Discrepancies between protocol, SAP, and registry are major findings.
- Note version control: a protocol without a **version number and date** cannot be audited against amendments. Flag.

## Administrative & registration items
1. **Title** identifies the design (e.g., randomised, parallel-group, double-blind, phase).
2. **Trial registration**: registration number AND registry name present. Confirm the protocol was registered **before** enrolment where dates are visible.
3. **Protocol version**: number + date present; amendment history described.
4. **Funding and roles**: funder named; role of sponsor/funder in design, conduct, analysis, interpretation, and the decision to publish stated. Flag if the sponsor controls the analysis or has veto over publication.
5. **Roles and responsibilities**: sponsor, steering committee, data monitoring committee (DMC/DSMB), and trial coordinating centre identified; who has access to the final dataset stated.

## Background and objectives
6. **Rationale**: justification including a reference to systematic review of existing evidence (SPIRIT expects evidence that the trial is needed).
7. **Objectives / hypotheses**: specific, with a clear statement of whether the trial is **superiority, non-inferiority, or equivalence** — this determines the entire analysis framework.
   - *Decision rule*: if the objective is non-inferiority/equivalence, a **margin** must be pre-specified and justified. No margin = major flag.

## Trial design
8. **Design type** (parallel, crossover, factorial, cluster, adaptive) and **allocation ratio** stated.
9. **Framework explicitly named** (superiority vs non-inferiority vs equivalence vs exploratory). Do not let the reader infer it.

## Participants, interventions, outcomes (the "PIO" core)
10. **Eligibility**: inclusion AND exclusion criteria, plus settings/sites and who is eligible to deliver interventions.
11. **Interventions**: each arm described with enough detail to replicate; dose, route, schedule; criteria for modifying/discontinuing; adherence strategies and concomitant care permitted/prohibited.
12. **Outcomes — the highest-yield section.** Confirm for **each** primary and secondary outcome:
    - the specific **measurement variable** (e.g., systolic BP);
    - the **analysis metric** (change from baseline, final value, time-to-event, proportion meeting threshold);
    - the **method of aggregation** (mean, proportion, hazard);
    - the **timepoint** of interest.
    - *Decision rule*: SPIRIT requires all four to be specified. A "primary outcome: blood pressure" with no metric/timepoint is **inadequately pre-specified — major flag**, because it leaves room to pick the most favourable analysis later.
    - *Decision rule*: there should be **exactly one primary outcome** (or a clearly justified co-primary structure with multiplicity handled). Multiple unranked primary outcomes = flag.

## Sample size and recruitment
13. **Sample size justification**: assumed effect size, event rate / variance, alpha, power, allocation ratio, and any inflation for dropout. The numbers must reconcile arithmetically.
    - *Decision rule*: if you cannot reproduce the target N from the stated inputs, flag. If the assumed effect size is implausibly large (powering only for an unrealistic effect), flag as a design weakness.
14. **Recruitment**: strategies to reach target sample; timeline.

## Allocation, blinding (bias-control items)
15. **Sequence generation**: method (e.g., computer-generated), randomisation type (simple/block/stratified), and any restriction (block size — ideally concealed). Stratification factors listed.
16. **Allocation concealment**: mechanism (central randomisation, sequentially numbered opaque sealed envelopes, etc.) ensuring the sequence is concealed until assignment.
17. **Implementation**: who generates the sequence, who enrols, who assigns.
18. **Blinding**: who is blinded (participants, providers, outcome assessors, analysts) and how; procedure for emergency unblinding.
    - *Decision rule*: if the trial claims "double-blind" but the mechanism is not described, or assessors of a subjective primary outcome are unblinded, flag (subjective outcomes + unblinded assessment = high risk of bias).

## Data collection, management, monitoring
19. **Data collection methods**; plans to promote retention and complete follow-up, including how outcomes will be obtained for participants who discontinue or deviate.
20. **Data management**: entry, coding, range/consistency checks.
21. **Data monitoring (DMC)**: whether a DMC exists, its charter, independence, and whether interim analyses are planned.
22. **Interim analyses and stopping rules**: if interim looks are planned, the **stopping guideline and alpha-spending / group-sequential method must be pre-specified**. Interim analyses with no multiplicity control = major flag.
23. **Harms**: how adverse events are defined, collected, and reported.
24. **Auditing**: frequency and process, independence from sponsor.

## Statistical methods / SAP (review with extra rigour)
This is where most exploitable degrees of freedom live. Confirm:
25. **Analysis populations defined explicitly**:
    - **ITT (intention-to-treat)** = all randomised, analysed by assigned group.
    - **mITT (modified ITT)** = a *named, justified* subset (e.g., received ≥1 dose). The exclusions must be defined a priori; "mITT" with post-hoc-flavoured exclusions is a red flag.
    - **Per-protocol (PP)** = completers without major deviations; deviation criteria defined a priori.
    - **Safety population** = as-treated.
    - *Decision rule*: the **primary analysis population for the primary endpoint must be stated** and should normally be ITT/mITT for superiority trials, and *both* ITT and PP for non-inferiority trials (non-inferiority claimed on ITT alone is anti-conservative).
26. **Primary analysis method** specified for the primary endpoint (model, covariates adjusted for, and these covariates should match the stratification factors).
27. **Missing data**: a pre-specified handling strategy (multiple imputation, mixed model for repeated measures, etc.) AND **sensitivity analyses** under plausible alternative assumptions. "Complete-case only" with no sensitivity analysis = flag, especially with non-trivial expected dropout.
28. **Multiplicity**: handling for multiple endpoints, timepoints, groups, and interim looks (hierarchical testing, Bonferroni/Holm, alpha-spending). Unaddressed multiplicity with many secondary endpoints = flag.
29. **Subgroup analyses**: pre-specified, with interaction tests, and labelled as confirmatory vs exploratory. A long list of subgroups with no interaction tests is a fishing-expedition flag.
30. **Estimand (where applicable)**: per ICH E9(R1), confirm the protocol/SAP frames the estimand — treatment effect, population, endpoint, **intercurrent-event handling strategy** (treatment policy, hypothetical, composite, while-on-treatment, principal stratum), and population-level summary. Absence of any intercurrent-event strategy in a recent protocol is a flag; do not penalise older protocols for the exact terminology but do check the underlying logic.

### SAP-specific deep checks (when a standalone SAP is provided)
A SAP is the operational expansion of the protocol's statistics section; hold it to a higher standard of completeness.
- **Finalisation timing**: the SAP should be **dated and signed off before database lock / unblinding**. An undated SAP, or one finalised after unblinding, is a MAJOR concern — it can be reverse-engineered from the data.
- **Analysis sets** spelled out with exact inclusion/exclusion logic, not just labels, including how protocol deviations are classified and who adjudicates them (and whether that adjudication is blinded).
- **Primary model fully specified**: the exact test/model (e.g., ANCOVA on change from baseline adjusting for stratification factors; Cox PH; mixed model for repeated measures), the link/distribution, handling of the baseline covariate, and the effect measure reported (difference in means / hazard ratio / risk difference) with the CI method.
- **Testing strategy / hierarchy**: an explicit ordered hypothesis-testing sequence (gatekeeping) when secondary endpoints will carry confirmatory claims; the total family-wise alpha and how it is split.
- **Sensitivity vs supplementary vs exploratory analyses** clearly distinguished. Sensitivity analyses probe robustness of the primary estimand to assumptions (especially missing data and intercurrent events); supplementary analyses use a different estimand; exploratory analyses make no confirmatory claim.
- **Pre-specified vs post-hoc**: every analysis should be labelled. Anything not in the SAP that appears in results must be declared post-hoc.
- **Derived variables and timepoint windows**: definitions for visit windows, baseline definition, and how out-of-window measurements are handled — these are quiet sources of analytic flexibility.
- **Handling of multiplicity across timepoints** (repeated assessments) and across treatment comparisons (≥3 arms).
- **Software and reproducibility**: named statistical software and version; whether analysis code is to be retained.

## Ethics and dissemination
31. Ethics approval; consent process; confidentiality; declaration of interests; **data access**; **dissemination policy** including intention to publish regardless of results and authorship criteria.
    - *Decision rule*: a dissemination clause that lets the sponsor suppress unfavourable results is a serious flag.
32. **Ancillary and post-trial care**; provisions for ancillary studies and biological specimens (informed consent for future use).

## Internal-consistency cross-checks (always run these)
- Endpoint in **objectives** == endpoint in **outcomes** == endpoint in **SAP primary analysis** == endpoint in **registry**.
- Sample-size assumptions (effect size, event rate) consistent with the outcome definition and analysis model.
- Stratification factors in randomisation == covariates adjusted for in the primary model.
- Analysis population named in SAP == population implied by the flow/denominators if a results draft is attached.
- Framework (superiority/non-inferiority) consistent across title, objectives, sample size, and analysis.

---

## Red flags to flag
List the specific, anchorable problem; cite page/section. Severity in brackets.

- **Primary endpoint differs between protocol, SAP, and/or registry** — e.g., registered primary outcome is 12-month mortality but SAP primary is 6-month biomarker. [MAJOR]
- **Primary endpoint underspecified** — outcome named without metric, aggregation, and timepoint (all four SPIRIT elements). [MAJOR]
- **Multiple unranked primary endpoints** with no multiplicity control. [MAJOR]
- **Outcome switching / silent re-prioritisation** — a former secondary endpoint elevated to primary, or vice versa, without documented amendment and rationale. [MAJOR]
- **ITT claimed but per-protocol denominators used**, or "mITT" used to exclude randomised participants post hoc without an a-priori definition. [MAJOR]
- **Primary analysis population not stated** for the primary endpoint. [MAJOR]
- **Non-inferiority / equivalence trial with no pre-specified margin**, or margin not clinically justified, or non-inferiority assessed on ITT only. [MAJOR]
- **Interim analyses planned with no stopping rule / no alpha-spending method**. [MAJOR]
- **No missing-data strategy and no sensitivity analyses** where meaningful dropout is expected. [MAJOR]
- **Registration absent, or registration date after first enrolment** (prospective registration violated). [MAJOR]
- **Sample size not reproducible** from stated inputs, or no justification at all. [MAJOR]
- **Sponsor controls analysis or holds publication veto** / dissemination clause permits suppressing results. [MAJOR]
- **Subjective primary outcome assessed by unblinded assessors** with no mitigation. [MAJOR]
- **Estimand / intercurrent-event handling absent** in a recent protocol (treatment discontinuations, rescue medication, death not addressed). [MAJOR for recent protocols; MINOR if older and logic is otherwise sound]
- **Stratification factors not used as covariates** in the primary model (or vice versa) without explanation. [MINOR]
- **Unaddressed multiplicity across many secondary endpoints/timepoints**. [MINOR–MAJOR depending on whether secondary claims will be made]
- **Subgroup analyses with no interaction tests and no confirmatory/exploratory labelling**. [MINOR]
- **Protocol lacks version number/date or amendment history** — cannot be audited. [MINOR]
- **Eligibility, intervention dose/schedule, or outcome assessment timing too vague to replicate**. [MINOR–MAJOR]
- **Allocation concealment mechanism not described** (only "randomised" stated). [MAJOR for the bias risk, even if randomisation method is given]
- **No independent DMC for a trial with serious safety concerns or interim looks**. [MAJOR]
- **Block size disclosed in an unblinded, predictable way** enabling allocation prediction. [MINOR]
- **Selective reporting set-up** — protocol pre-specifies far more outcomes than will plausibly be reported, with no analysis plan for many. [MINOR]

## Severity calibration
- **MAJOR** = anything that creates an exploitable analytic degree of freedom or undermines the trial's ability to give an unbiased answer on its primary question: endpoint/population/framework definition gaps, registry discrepancies, multiplicity/interim-analysis gaps, missing-data gaps on the primary endpoint, publication-control concerns.
- **MINOR** = items that weaken rigour or replicability but do not by themselves bias the primary result: covariate/stratification mismatches, missing version control, vague secondary details, exploratory-analysis labelling.
- When unsure, escalate any issue touching the **primary endpoint, primary analysis population, or pre-specification of the confirmatory analysis** to MAJOR — these are the load-bearing pre-commitments SPIRIT exists to protect.

## What to write in a finding
For each flag, give: (1) the SPIRIT concern in one phrase; (2) the exact location (section/page and the quoted wording or its absence); (3) why it matters (the bias or ambiguity it permits); (4) the concrete fix (what to pre-specify). Avoid generic comments — anchor every point.

Example finding wording:
> *Primary analysis population not pre-specified (SAP §6.1).* The SAP names ITT, mITT, and per-protocol sets but does not state which is primary for the primary endpoint. This permits choosing the population that yields significance after seeing the data. **Fix:** state the single primary analysis population (e.g., "the primary analysis of the primary endpoint will use the ITT set") and reserve PP for sensitivity.
