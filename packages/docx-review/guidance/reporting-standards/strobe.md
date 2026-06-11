---
id: strobe
category: reporting-standards
name: STROBE (Observational)
applies_to: "Cohort, case-control, and cross-sectional studies"
conflicts_with: [consort, prisma]
---

# STROBE Reviewer Tool (Observational Studies)

Use this chapter when the study is observational — a cohort, case-control, or cross-sectional design — and there is **no randomized allocation of the exposure/intervention**. If the authors randomized participants, use CONSORT instead; if it is a systematic review/meta-analysis, use PRISMA. STROBE is a *reporting* standard, not a quality/risk-of-bias instrument: judge whether the paper tells the reader enough to assess validity, then judge the validity itself.

## How to use this chapter
- First confirm the design (Section A). Several checklist items are design-specific; flag the right ones.
- Walk the checklist (Sections B-J). For each item decide: **Reported adequately / Inadequate / Missing**.
- Then run the **Red flags** list (Section K) — these are the substantive validity problems that change conclusions, not just reporting gaps.
- Assign severity (Section L) and write anchorable comments (Section M).

---

## A. Design triage (do this first)
- [ ] **Design named explicitly?** The abstract/methods should use a recognized term ("prospective cohort", "retrospective cohort", "matched case-control", "nested case-control", "cross-sectional"). *Decision rule:* if you cannot tell the design from the methods alone, that is a major reporting failure.
- [ ] **Direction of inference matches design.** Cross-sectional studies measure exposure and outcome simultaneously — they cannot establish temporality. Flag any cross-sectional study that uses causal/temporal language ("led to", "resulted in", "increased risk over time").
- [ ] **Cohort vs case-control selection logic.** Cohort: sampled on exposure, followed to outcome. Case-control: sampled on outcome (disease status), looking back at exposure. If the authors call it a cohort but sampling was by outcome status, the label is wrong.
- [ ] **Is it really a different design?** Watch for "prospective cohort" that is actually a single-arm interventional study, or a "registry analysis" that is a cross-sectional snapshot. Reclassify if needed.

---

## B. Title and Abstract
- [ ] Study design indicated in the **title or abstract** with a commonly used term.
- [ ] Abstract gives an **informative, balanced summary** — objectives, design, setting, participants, key results, and a conclusion supported by the data.
- [ ] **No spin in the abstract.** Flag conclusions stronger than the body supports, selective reporting of the one significant subgroup, or causal claims from a single observational dataset.

---

## C. Introduction
- [ ] **Background/rationale** explains the scientific context and why the study was needed.
- [ ] **Objectives / pre-specified hypotheses** stated, including any pre-specified exposures and outcomes. *Decision rule:* objectives that appear only in the results (and conveniently match the significant findings) are a red flag for post-hoc framing.

---

## D. Methods — Study design and setting
- [ ] **Design** described early in methods (not just abstract).
- [ ] **Setting, locations, and relevant dates** — recruitment, exposure, follow-up, and data-collection periods. For multi-site CRO studies, confirm sites and the calendar window are stated.
- [ ] **Data source era is appropriate.** If using historical EHR/claims data, the period must support the question (e.g., outcomes ascertained after a coding change should note the change).

## E. Methods — Participants (design-specific — flag the right items)
**Cohort**
- [ ] Eligibility criteria, **sources and methods of selection**, and methods of follow-up.
- [ ] For matched designs: matching criteria and number of exposed/unexposed per matched set.

**Case-control**
- [ ] Eligibility criteria and **sources/methods of case ascertainment and control selection**, plus the rationale for choice of cases and controls.
- [ ] For matched designs: matching criteria and number of controls per case.
- [ ] **Control source is appropriate** (controls drawn from the same source population that produced the cases). Flag hospital controls when cases are population-based, or vice versa.

**Cross-sectional**
- [ ] Eligibility criteria and **sources/methods of selection** of participants.

*Decision rule:* if you cannot reconstruct who got in, who was excluded, and why, the participant reporting is inadequate.

## F. Methods — Variables, measurement, bias, study size
- [ ] **All variables defined**: outcomes, exposures, predictors, potential confounders, and effect modifiers. Diagnostic criteria where applicable.
- [ ] **Measurement / data sources** given for each variable. If more than one group/source, comparability of assessment methods must be addressed.
- [ ] **Confounders are pre-specified and justified**, not assembled post-hoc. Flag a confounder set that looks chosen to produce a desired effect.
- [ ] **Efforts to address bias** described (selection, information, recall, misclassification).
- [ ] **Study size justification** — how the sample size was arrived at. Many observational studies are convenience samples; the paper should say so and acknowledge power limits rather than imply a powered design.

## G. Methods — Quantitative variables and statistical methods
- [ ] **Handling of quantitative variables** explained; if grouped, the rationale and cut-points are given. Flag data-driven cut-points (e.g., median split chosen after looking at the outcome) without justification.
- [ ] **Statistical methods** described for all analyses, including those used to control confounding (which variables entered the model and how).
- [ ] **Subgroup and interaction analyses** described and labeled pre-specified vs exploratory.
- [ ] **Missing data** approach stated (complete-case, imputation, etc.). Silence on missing data is a flag.
- [ ] Design-specific analytic handling addressed:
  - Cohort: how **loss to follow-up** was handled.
  - Case-control: how **matching** was accounted for in the analysis (conditional logistic / matched analysis).
  - Cross-sectional: how the **sampling strategy** (e.g., complex survey weights) was accounted for.
- [ ] **Sensitivity analyses** described where used.

---

## H. Results — Participants and descriptive data
- [ ] **Participant flow reported with numbers at each stage** — eligible, examined for eligibility, confirmed eligible, included, completing follow-up, analysed. A flow diagram is encouraged.
- [ ] **Reasons for non-participation/exclusion** given at each stage.
- [ ] **Characteristics of participants** (demographic, clinical, social) and **information on exposures and potential confounders**.
- [ ] **Number of participants with missing data** reported for each variable of interest. *Decision rule:* if the denominator changes between tables without explanation, missingness is being hidden.
- [ ] Cohort: **follow-up time summarized** (e.g., average and total person-time).

## I. Results — Outcome data and main results
- [ ] **Outcome events / summary measures reported** (cohort: numbers of events or summary measures over time; case-control: numbers in each exposure category; cross-sectional: numbers of outcome events or summary measures).
- [ ] **Unadjusted estimates AND confounder-adjusted estimates** both reported, with **precision (95% CI)** — not just p-values. The difference between crude and adjusted estimates is informative; flag if only the adjusted (or only the favorable) one is shown.
- [ ] **Confounders adjusted for are stated** and the reason for their inclusion is clear.
- [ ] **Category boundaries reported** when continuous variables were categorized.
- [ ] **Absolute risk** translated for a meaningful time period where relevant — not only relative measures (RR/OR/HR). An OR of 2.0 on a rare outcome is very different from on a common one.
- [ ] **Other analyses** reported (subgroups, interactions, sensitivity analyses), clearly separated into pre-specified vs exploratory.

---

## J. Discussion and Other information
- [ ] **Key results** summarized with reference to the stated objectives.
- [ ] **Limitations** discussed: sources of bias, imprecision, **direction and likely magnitude** of any bias (not a generic "limitations exist" sentence).
- [ ] **Interpretation** cautious, considering objectives, limitations, multiplicity, results from similar studies, and other evidence. Causal language must be justified, not assumed.
- [ ] **Generalisability (external validity)** addressed against the source population.
- [ ] **Funding** and the role of funders stated; for CRO/sponsor-run studies, confirm sponsor role in design, conduct, analysis, and the decision to publish.
- [ ] **Conflicts of interest** disclosed.
- [ ] **Ethics approval / consent / data-governance** stated, appropriate to the data type (especially for secondary EHR/claims data).

---

## K. Red flags to flag (substantive — these change conclusions)
Raise these explicitly and anchor each to the offending sentence/table:

- **Causal language from observational data.** "X reduces/causes/leads to Y" with no randomization, no triangulation, and no causal-inference framework. Major.
- **Cross-sectional design used to claim temporality or causation.** Exposure and outcome measured at the same time, yet the paper asserts that exposure preceded outcome. Major.
- **Outcome/exposure definition differs from the protocol or registration.** Primary outcome reported in results differs from the registered/pre-specified outcome, or is redefined to reach significance. Major.
- **Post-hoc subgroup presented as primary.** A subgroup or secondary outcome is significant and gets foregrounded as the headline finding without pre-specification. Major.
- **Confounder set looks curated.** Adjustment variables chosen to maximize/minimize the effect, key known confounders omitted, or a confounder that is actually on the causal pathway (a mediator) adjusted away — over-adjustment. Major.
- **Adjusting for a collider / selection variable**, inducing rather than removing bias. Major.
- **Inappropriate control group (case-control).** Controls not drawn from the population that gave rise to the cases. Major.
- **Selection bias unaddressed** — e.g., survivor/prevalent-user bias in a registry, healthy-worker effect, or differential recruitment by exposure. Major.
- **Immortal time bias (cohort).** Follow-up time during which the outcome could not occur is misallocated to the exposed group (common when exposure is defined by an event that requires survival). Major.
- **Differential loss to follow-up** related to exposure or outcome, not analyzed. Major.
- **Recall/information bias unaddressed** (case-control with retrospective self-report of exposure). Major to moderate depending on outcome.
- **Misclassification not discussed**, especially differential misclassification of exposure or outcome by group. Moderate to major.
- **Only relative effects reported**, no absolute risks / baseline rates, exaggerating clinical importance. Moderate.
- **Only adjusted (or only crude) estimates shown**, hiding the impact of adjustment. Moderate.
- **p-values without confidence intervals**, or "p < 0.05" treated as proof of effect. Moderate.
- **Multiplicity ignored** — many exposures/outcomes tested, significant ones reported, no acknowledgment of multiple comparisons. Moderate to major.
- **Missing data invisible** — denominators shift across tables, no missing-data method stated. Moderate to major.
- **Data-driven cut-points** for continuous variables chosen to optimize the result. Moderate.
- **Number of events too small** for the number of variables in the model (overfitting; events-per-variable far below conventional thresholds). Moderate to major.
- **Matching ignored in analysis (case-control)** — matched design analyzed with unconditional methods. Major (biases estimates).
- **Generalisability overreached** — narrow single-site or single-payer sample, broad population claims. Moderate.
- **Sponsor/CRO role opaque** — funder controlled analysis or publication decision, undisclosed. Major for integrity.
- **"Registry/real-world evidence" framed as equivalent to an RCT** for efficacy claims without acknowledging confounding by indication. Major.
- **Confounding by indication unaddressed** — sicker patients selectively receive the exposure (treatment), biasing the apparent effect. Major.

---

## L. Severity guidance
- **Major (must be resolved before acceptance / undermines conclusions):** design mislabeled; causal claims unsupported by design; primary outcome/exposure deviates from pre-specification; selection of cases/controls or cohort invalid; immortal time, collider, over-adjustment, or confounding by indication that plausibly reverses or inflates the headline effect; matched design analyzed unmatched; sponsor control of results undisclosed.
- **Moderate (revise; weakens confidence but may not overturn):** missing-data handling unstated, only one of crude/adjusted shown, no absolute risks, multiplicity unacknowledged, data-driven categorization, generalisability overreach, weak limitations section.
- **Minor (clarify/improve reporting):** design term absent from title only, follow-up time not summarized, incomplete variable definitions, flow numbers reconstructable but not in a diagram, formatting of estimates.

*Escalation rule:* a reporting gap becomes **major** when it prevents the reader from judging a threat to validity (e.g., undisclosed missingness on the primary exposure is no longer "minor").

---

## M. Writing the comment (anchor every flag)
Each flag should be specific and locatable:
1. **Quote or cite** the exact sentence/table/figure (page/section).
2. **Name the STROBE item or bias** it violates.
3. **State the consequence** for validity or interpretation.
4. **Propose the fix** (report the missing item, soften the claim, re-analyze, add sensitivity analysis).

*Example:* "Methods state a matched case-control design (Sec 2.2), but odds ratios are from unconditional logistic regression (Table 3). Matching must be preserved in the analysis (conditional logistic regression); the current estimates are likely biased. Major — re-analyze and report matched estimates."

*Example:* "Abstract concludes the exposure 'reduces mortality', but this is a cross-sectional study (Sec 2.1) with simultaneous measurement of exposure and outcome — temporality cannot be established. Major — restate as an association and add this to limitations."
