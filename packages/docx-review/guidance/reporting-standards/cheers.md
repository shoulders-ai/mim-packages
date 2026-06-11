---
id: cheers
category: reporting-standards
name: CHEERS 2022 (Economic Evaluation)
applies_to: "Health-economic and cost-effectiveness evaluations"
---

# CHEERS 2022 Reviewer Checklist (Economic Evaluation)

Use this chapter when the document is a health-economic evaluation — a cost-effectiveness, cost-utility (cost-per-QALY), cost-benefit, cost-minimisation, or budget-impact analysis, or a decision-analytic model attached to a CRO clinical-trial report. CHEERS 2022 (Consolidated Health Economic Evaluation Reporting Standards) is a 28-item reporting checklist; your job is to confirm each required item is reported clearly and to flag items that are missing, vague, or internally inconsistent. CHEERS governs **reporting completeness and transparency**, not whether the analysis is methodologically correct — but reporting gaps almost always hide methodological problems, so probe them.

How to use: walk the 28 items in order, mark each Present / Inadequate / Missing, then run the "Red flags to flag" pass. Anchor every comment to specific text (a number, a sentence, a table cell). Do not accept "data on file" or "available on request" as a substitute for reporting a required item.

Reviewer wording to look for (and quote when present or note when absent): "perspective", "time horizon", "discount rate", "willingness-to-pay threshold", "ICER" / "incremental cost-effectiveness ratio", "QALY" / "EQ-5D" / "utility value set", "price year" / "cost year", "probabilistic sensitivity analysis" / "PSA", "cost-effectiveness acceptability curve" / "CEAC", "dominated" / "extendedly dominated", "extrapolation", "half-cycle correction", "Markov" / "partitioned survival" / "discrete event", "scenario analysis", "deterministic sensitivity analysis" / "tornado". When the document is cost-effective conclusion is asserted, locate the exact sentence and the threshold it is judged against; if no threshold is stated, that itself is a flag.

Two-reviewer split: the **biostatistician/methodologist** owns items 4-5, 10-22, 24 (model, parameters, extrapolation, uncertainty, ICER computation, dominance). The **editorial reviewer** owns items 1-3, 6-9, 23, 25-28 (framing, perspective/comparator/horizon clarity, results presentation, transparency, funding/COI). Items 7-9 (comparator, perspective, time horizon) should be checked by both — they are the most common source of structurally biased conclusions.

## Title and Abstract

1. **Title** — Identifies the study as an economic evaluation and names the interventions compared. Flag generic titles that hide that this is a CEA.
2. **Abstract** — Structured summary covering objective, perspective, comparators, time horizon, discount rate, main outcome, results (incremental costs, effects, ICER), and conclusions. Flag an abstract that states a conclusion ("cost-effective") without the ICER and the threshold it is judged against.

## Introduction

3. **Background and objectives** — Context for the study question and its policy/clinical relevance; the specific decision the analysis informs. Flag a missing or undefined **decision problem**.

## Methods

4. **Health economic analysis plan (HEAP)** — Whether an analysis plan was developed and where it can be accessed. Flag absence; a pre-specified HEAP is the economic analogue of a registered SAP and its absence raises post-hoc-tailoring risk.
5. **Study population** — Characteristics of the base-case population and subgroups. Must match the trial population if trial-based. Flag a model population that silently differs from the trial that supplied the efficacy data.
6. **Setting and location** — Relevant aspects of the system(s) in which the decision is made (country, payer, care setting). Flag results presented as generalisable across systems with no basis.
7. **Comparators** — Interventions compared and why they were chosen. The comparator must be **current standard of care / relevant practice**. Flag a weak, outdated, placebo, or "do nothing" comparator chosen to inflate the incremental benefit when an active standard exists.
8. **Perspective** — The stated analytic perspective (e.g., healthcare payer, health-system, societal). All costs and outcomes included must be consistent with it. Flag perspective stated as "societal" while productivity/informal-care costs are excluded, or payer perspective that smuggles in patient out-of-pocket costs selectively.
9. **Time horizon** — Stated and justified. Must be long enough to capture all meaningful differential costs and outcomes. Flag a short horizon for a chronic/curative intervention (truncates downstream benefit **or** harm — note which direction it favours).
10. **Discount rate** — Rate(s) for costs and outcomes, with justification (typically the jurisdiction's reference-case rate, e.g., 3% or 3.5%). Flag costs and outcomes discounted at different rates without justification, or zero discounting over a multi-year horizon.
11. **Selection of outcomes** — The outcomes used as the measure(s) of benefit (e.g., QALYs, life-years, natural units) and why. Flag a switch from the trial's primary clinical endpoint to a surrogate or modelled outcome without justification.
12. **Measurement of outcomes** — How outcomes were measured/valued; for trial-based studies, the source and method. Flag QALYs reported with no statement of the utility instrument (e.g., EQ-5D) or valuation source.
13. **Valuation of outcomes** — Population and methods used to value health states / preference weights (e.g., which value set/tariff). Flag utility values lifted from an unrelated population or a single unreferenced source.
14. **Measurement and valuation of resources and costs** — How resource use was measured and unit costs valued; the **price (cost) year** and currency. Flag missing cost year, mixed currencies without conversion method, or unit costs with no source.
15. **Currency, price date, and conversion** — Dates of estimates and any currency-conversion method. Flag costs combined across years with no inflation adjustment.
16. **Rationale and description of the model** — If a model is used: model type (Markov, decision tree, discrete-event, partitioned-survival), structure, cycle length, key assumptions, and why this structure fits the disease. A diagram and access to the model should be available. Flag a black-box model with no structure described, no cycle length, or no justification of structure against disease natural history.
17. **Analytics and assumptions** — Methods for analysing/computing results, including any data transformations, extrapolation, and adjustment for half-cycle/competing risks. Flag survival **extrapolation beyond trial follow-up** with no stated parametric function, no goodness-of-fit comparison, and no external validation.
18. **Characterising heterogeneity** — How differences across subgroups were handled. Flag subgroup CEA results presented as definitive when the trial was not powered for them.
19. **Characterising distributional effects** — How impacts are distributed across the population (equity), if addressed.
20. **Characterising uncertainty** — Methods to characterise **all** sources of uncertainty:
    - Deterministic / one-way and multi-way sensitivity analysis (tornado).
    - Probabilistic sensitivity analysis (PSA) with stated input distributions.
    - Cost-effectiveness acceptability curve(s) (CEAC) and/or scatterplot on the cost-effectiveness plane.
    - Scenario analyses for structural assumptions.
    Flag a base-case ICER reported with **no** sensitivity analysis, or PSA distributions assigned with no justification.
21. **Approach to engagement with patients/others, and stakeholders** — Whether and how patients/service recipients, the public, or other stakeholders were engaged in design.

## Results

22. **Study parameters** — All input values, ranges, references, and the distributions used, ideally in a table. This is the heart of reproducibility. Flag any headline parameter (efficacy estimate, key utility, key cost) that is not traceable to a cited source.
23. **Summary of main results** — Mean costs and outcomes per comparator and the **incremental** costs, incremental effects, and ICER(s). For >2 comparators, results should be ordered by cost and **dominated / extendedly-dominated** options identified. Flag pairwise ICERs that ignore dominance in a multi-option comparison.
24. **Effect of uncertainty** — How results change under sensitivity/scenario analyses and the probability of cost-effectiveness at relevant thresholds. Flag a CEAC presented without the willingness-to-pay value being used to draw conclusions.
25. **Effect of engagement with patients/others** — How any stakeholder engagement affected the analysis, if applicable.

## Discussion

26. **Study findings, limitations, generalisability, and current knowledge** — Interpretation in context; explicit limitations (structural, parameter, data); generalisability to other settings; how findings sit relative to existing evidence. Flag a discussion that lists no limitations, or claims generalisability the perspective/setting does not support.

## Other Relevant Information

27. **Source of funding** — Funding sources and the role of the funder in design, analysis, and reporting. Flag a manufacturer-funded evaluation favouring the funder's product with no statement of funder role.
28. **Conflicts of interest** — Author conflicts and how they were managed, per journal/relevant policy. Flag undeclared employment/equity links to the sponsor.

---

## Red flags to flag

Raise these explicitly and anchor to the offending text. Each is a concrete, anchorable reporting/consistency defect.

### Decision-problem and framing
- **Comparator does not reflect current standard of care** — placebo, "no treatment", or a superseded therapy used as the comparator when an active standard exists; inflates incremental benefit.
- **Perspective claimed broader than costs included** — "societal perspective" stated but productivity loss, informal care, and out-of-system costs omitted (or vice versa: selective inclusion of cost categories that favour the conclusion).
- **Time horizon too short for the disease** — lifetime effects of a chronic/curative therapy truncated; note whether truncation flatters or penalises the intervention.
- **Decision problem / target population shifts** — the modelled population differs from the trial population supplying efficacy (e.g., broader indication, healthier baseline) without justification.

### Model and extrapolation
- **Survival/benefit extrapolated far beyond trial follow-up** with no parametric function named, no goodness-of-fit comparison, and no external/clinical validation of the long-term curve.
- **Treatment effect assumed to persist indefinitely** (lifetime "waning = none") with no evidence — major when it drives the ICER.
- **Model structure unjustified or undisclosed** — no diagram, no cycle length, no state definitions; a structure that cannot represent the disease's natural history.
- **Half-cycle correction / competing risks / discounting omitted** in a multi-state model without comment.

### Inputs and sourcing
- **Headline parameter not traceable** — key efficacy, utility, or cost value with no citation ("assumption" or "data on file").
- **Utilities from a mismatched source** — preference weights borrowed from an unrelated population/condition, or a single unreferenced value applied to a pivotal health state.
- **Missing price (cost) year or currency** / costs combined across years without inflation adjustment.
- **Efficacy input inconsistent with the trial** — point estimate used in the model differs from the trial's reported primary-analysis estimate (e.g., per-protocol or responder-only effect plugged into a model that claims ITT).
- **Discount rate non-standard or asymmetric** — costs and outcomes discounted at different rates, or zero discounting over many years, with no justification.

### Uncertainty
- **No sensitivity analysis at all** — a base-case ICER with no one-way analysis, no PSA, no scenarios. Treat as major.
- **PSA present but distributions unjustified** — distribution choices/parameters not reported, or implausibly narrow distributions that suppress uncertainty.
- **Tornado/one-way analysis omits the driver** — the most influential or most uncertain parameter (often the extrapolation assumption) is not varied.
- **CEAC/threshold sleight of hand** — conclusion of "cost-effective" drawn against an unstated, non-standard, or cherry-picked willingness-to-pay threshold; or threshold quietly changed between abstract and results.

### Results and consistency
- **Dominance ignored** — in a >2-option comparison, pairwise ICERs reported without identifying dominated/extendedly-dominated options; can manufacture a favourable ICER.
- **ICER inconsistent across abstract / results / tables** — different incremental cost, effect, or ICER values in different places.
- **Conclusion stronger than the analysis** — "cost-effective" / "dominant" claimed when the base case is sensitive, the ICER straddles the threshold, or PSA probability is low.
- **Negative or near-zero incremental effect dressed as cost-effective** — tiny QALY gain producing an unstable ICER reported as a clean win.

### Governance
- **Sponsor/funder role undisclosed** and results uniformly favour the funder's product.
- **Conflicts of interest undeclared** — author employment/equity ties to the sponsor not stated.
- **No analysis plan (HEAP)** and analyses appear chosen post hoc to reach the favourable result.

---

## Severity guidance

**Major (can change the decision or invalidate the conclusion) — flag prominently:**
- No sensitivity analysis / no PSA, or uncertainty so under-reported the ICER's robustness cannot be judged.
- Comparator not reflecting current practice; perspective misaligned with included costs.
- Unjustified long-term extrapolation or assumed perpetual treatment effect that drives the ICER.
- Efficacy input inconsistent with the trial's primary analysis; population mismatch.
- Conclusion not supported by the base case (threshold misuse, dominance ignored, internally inconsistent ICERs).
- Time horizon truncating material differential costs/outcomes.
- Undisclosed funder role / conflicts on a favourable manufacturer-funded result.

**Minor (transparency/reproducibility gaps that should be fixed but rarely flip the conclusion):**
- Missing price year, currency, or cost-source citations that are otherwise plausible.
- No model diagram though structure is described in text.
- Missing HEAP reference where methods are otherwise fully reported and pre-specifiable.
- Subgroup/equity/stakeholder-engagement items (18, 19, 21, 25) not addressed when not central to the decision.
- Abstract omitting one structured element (e.g., discount rate) reported fully in the body.

When uncertain whether a gap is major or minor, ask: *does correcting or disclosing this item have a plausible chance of moving the ICER across the decision threshold or reversing a dominance claim?* If yes, treat it as major.

---

## Decision rules (fast triage)

Apply these in order; any "yes" warrants a flag with the noted severity.

1. **Is the conclusion "cost-effective" / "dominant" stated without a numeric ICER and a stated threshold?** → Major. The reader cannot evaluate the claim.
2. **Is there any sensitivity analysis (one-way + PSA)?** No → Major. Yes but distributions/ranges unreported → Inadequate (minor-to-major depending on how much rides on it).
3. **Does the model extrapolate beyond observed trial data?** If yes, are the parametric function, fit comparison, and a long-term validity check all reported? Any missing → Major (extrapolation is usually the single largest ICER driver).
4. **Does the comparator equal current standard of care in the relevant setting?** No, and not justified → Major.
5. **Are perspective, time horizon, discount rate, and price year all explicitly stated?** Any missing → at least minor; missing perspective or horizon is Major because it changes which costs/outcomes belong.
6. **Does the efficacy input match the trial's primary, pre-specified, ITT analysis?** Mismatch (per-protocol, responder-only, post-hoc subgroup, surrogate) without justification → Major.
7. **For >2 comparators, are dominated and extendedly-dominated options identified before the ICER is computed?** No → Major; an unsorted pairwise ICER can be meaningless.
8. **Are all headline parameters (efficacy, key utilities, key costs) traceable to a cited source?** Any "assumption"/"data on file" on a pivotal value → Major; on a minor value → minor.
9. **Do the ICER and incremental values agree across abstract, results text, and tables?** Any disagreement → flag and ask which is correct.
10. **Is the funder's role and are author conflicts disclosed?** No, on a sponsor-favourable result → Major.

## Quick reviewer checklist (tick list)

- [ ] Study identified as an economic evaluation; abstract carries ICER + threshold.
- [ ] Decision problem, population, setting defined and consistent with the efficacy source.
- [ ] Comparator = current standard of care (justified).
- [ ] Perspective stated; included cost/outcome categories match it exactly.
- [ ] Time horizon stated and long enough to capture differential costs/outcomes.
- [ ] Discount rate(s) stated (jurisdiction reference case); symmetric unless justified.
- [ ] Outcome measure (QALY/LY/natural unit) stated; utility instrument and value set named.
- [ ] Resource use measured; unit costs sourced; price year and currency stated.
- [ ] Model type, structure (diagram), cycle length, key assumptions reported and justified.
- [ ] Extrapolation method, fit, and external validation reported (if applicable).
- [ ] All parameters tabulated with values, ranges, distributions, and references.
- [ ] One-way/tornado + PSA + CEAC/scatterplot + structural scenarios reported.
- [ ] Incremental costs, effects, ICER reported; dominance handled for >2 options.
- [ ] Probability cost-effective at the relevant threshold reported.
- [ ] Limitations (structural, parameter, data) and generalisability discussed honestly.
- [ ] Funding source, funder role, and conflicts of interest disclosed.
- [ ] Conclusion matches the base case and survives the sensitivity analyses.
