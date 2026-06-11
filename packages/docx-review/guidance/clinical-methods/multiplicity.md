---
id: multiplicity
category: clinical-methods
name: Multiplicity & Multiple Endpoints
applies_to: "Trials with multiple endpoints, arms, subgroups, or interim looks"
---

# Multiplicity & Multiple Endpoints

Use this chapter whenever a trial tests more than one hypothesis against the same data — multiple endpoints, multiple treatment arms or doses, subgroups, repeated/interim analyses, or multiple analysis populations — because each added test inflates the chance of a false positive unless the trial pre-specifies how the overall (family-wise) Type I error is controlled. The regulatory frame is ICH E9 (Statistical Principles for Clinical Trials), the FDA Multiple Endpoints guidance (2022), and the EMA guideline on multiplicity. The reviewer's core question is simple: **does the trial make any confirmatory claim that is not protected by a pre-specified, valid multiplicity strategy, and does the strategy in the report match the one in the protocol/SAP?**

## How to use this chapter
1. First identify every confirmatory claim the report makes (efficacy on primary, key secondaries, doses, subgroups).
2. For each claim, find the pre-specified test that supports it and the alpha it was tested at.
3. Confirm the sum of the strategy controls family-wise error rate (FWER) at the one-sided 2.5% / two-sided 5% level (or the trial's justified level) across the **confirmatory family**.
4. Anything claimed as confirmatory that falls outside that protected scheme is a flag.

---

## Section 1 — Define the confirmatory family (do this before judging corrections)

**Checklist**
- [ ] The protocol/SAP names a **primary endpoint** (single, or co-primary/composite explicitly defined).
- [ ] The set of hypotheses that carry confirmatory claims (the "family") is explicitly stated.
- [ ] Exploratory and supportive analyses are labeled as such and excluded from the alpha budget.
- [ ] The overall family-wise alpha is stated (conventionally one-sided 0.025 / two-sided 0.05).

**Decision rules**
- Confirmatory claims (label, marketing, primary conclusion of a manuscript) MUST sit inside an FWER-controlled family.
- Exploratory analyses may be reported without correction **only if** clearly framed as hypothesis-generating, not as evidence of efficacy.
- "Secondary endpoints" are NOT automatically exploratory. A secondary used to support a claim must be in the alpha-controlled hierarchy or carry its own correction.

**Severity**
- Confirmatory claim with no family defined / no FWER control: **major**.
- Family defined but one analysis ambiguously labeled: **minor to major** depending on whether a claim rides on it.

---

## Section 2 — Co-primary, composite, and multiple primary endpoints

**Checklist**
- [ ] If **multiple primary** endpoints where success = ANY positive: alpha is split/adjusted across them (union-intersection → correction required).
- [ ] If **co-primary** endpoints where success = ALL must be positive: each tested at full alpha (intersection-union → no alpha penalty, but POWER drops — verify the sample size accounts for needing all to succeed).
- [ ] Composite endpoints: components pre-defined, and the claim is about the composite, not cherry-picked components.

**Decision rules**
- Success-if-any: requires correction (Bonferroni, Holm, or a gatekeeping/graphical scheme). No correction = inflated Type I error.
- Success-if-all (co-primary): no correction needed, but the trial must be powered for the joint requirement; otherwise the trial is underpowered by design.
- A win on one component of a composite does NOT license a claim about that component alone.

**Severity**
- Success-if-any primaries with no correction: **major**.
- Co-primary design powered as if only one endpoint needed: **major** (overclaims feasibility / underpowered).

---

## Section 3 — Hierarchical (fixed-sequence) testing

**Checklist**
- [ ] The testing order of primary → key secondary endpoints is **pre-specified** in the protocol/SAP, not chosen after seeing results.
- [ ] Each step is tested at full alpha only because the prior step succeeded ("gatekeeping").
- [ ] Testing **stops** at the first non-significant step; everything after it is non-confirmatory.
- [ ] The report does not make confirmatory claims on endpoints that lie below a broken gate.

**Decision rules**
- In a fixed sequence, once an endpoint fails to reach significance, **all subsequent endpoints in the chain lose confirmatory status** — even if their nominal p < 0.05.
- The order must come from the SAP. A sequence that conveniently puts the only significant secondary first is a red flag for post-hoc ordering.
- Truncated Hochberg / fallback / graphical (Bretz et al.) procedures can recycle alpha — acceptable if pre-specified and correctly described.

**Severity**
- Claiming a "significant" secondary that sits after a failed gate: **major** (the p-value is uninterpretable as confirmatory).
- Hierarchy order not pre-specified / appears reordered post-hoc: **major**.

---

## Section 4 — Alpha-splitting and adjustment methods

**Checklist**
- [ ] The correction method is named (Bonferroni, Holm, Hochberg, Dunnett, gatekeeping, graphical, Hommel).
- [ ] The method matches the dependence structure (Bonferroni/Holm = any dependence; Hochberg/Hommel assume positive dependence).
- [ ] The split adds up: sub-alphas sum to (or are controlled at) the family alpha.
- [ ] If alpha is unequally split, the allocation was pre-specified, not tuned to results.

**Quick reference**
- **Bonferroni**: alpha / k. Valid always; conservative.
- **Holm**: step-down; uniformly more powerful than Bonferroni; valid under any dependence.
- **Hochberg / Hommel**: step-up; more powerful but assume positive dependence among tests.
- **Dunnett**: many-arms-vs-one-control comparisons; accounts for correlation.
- **Graphical / gatekeeping (Bretz, Maurer)**: alpha recycled from rejected hypotheses to others; flexible, must be fully pre-specified.

**Decision rules**
- A nominal p of 0.04 against an adjusted threshold of, e.g., 0.0167 is **NOT** a positive result — check the comparison is made against the adjusted boundary, not 0.05.
- Unequal alpha splits are legitimate only if pre-specified (e.g., 0.04 to primary, 0.01 to key secondary).

**Severity**
- p compared to 0.05 when an adjusted threshold applies: **major**.
- Method assumes positive dependence (Hochberg) where independence/negative dependence plausible: **minor to major**.

---

## Section 5 — Multiple treatment arms / dose-finding

**Checklist**
- [ ] Each dose-vs-control (or arm-vs-control) comparison contributing a claim is in the multiplicity scheme.
- [ ] Multi-arm comparisons use a method that accounts for shared control (e.g., Dunnett) or a pre-specified split.
- [ ] The control group is not "reused" to manufacture several independent-looking significant comparisons without adjustment.
- [ ] If a "best dose" is selected post-hoc and then claimed, selection is acknowledged and the inference adjusted.

**Severity**
- Multiple active arms each declared "significant vs control" at unadjusted 0.05: **major**.
- Post-hoc "winning dose" presented as a pre-specified result: **major**.

---

## Section 6 — Subgroup analyses

**Checklist**
- [ ] Subgroups are pre-specified, with the **number** of subgroups disclosed.
- [ ] A **test for interaction** (subgroup × treatment) is reported — not just within-subgroup p-values.
- [ ] Subgroup findings are framed as exploratory unless the subgroup was a pre-specified, alpha-controlled hypothesis.
- [ ] Forest plots show all subgroups examined, not a selected few.

**Decision rules**
- A "significant benefit in subgroup X" claim requires a significant **interaction test**, not merely p < 0.05 within X and p > 0.05 elsewhere (the classic spurious subgroup claim).
- The more subgroups tested, the higher the chance one is "significant" by chance — at 10 subgroups, ~40% chance of a false positive at 0.05 uncorrected.

**Severity**
- Confirmatory/label-style claim from an unadjusted, post-hoc subgroup: **major**.
- Subgroup claim based on within-group p-values with no interaction test: **major**.
- Pre-specified subgroup reported as exploratory but over-interpreted in the discussion: **minor to major**.

---

## Section 7 — Interim analyses & repeated looks

**Checklist**
- [ ] The number and timing of interim analyses are pre-specified.
- [ ] An alpha-spending function or group-sequential boundary is named (O'Brien-Fleming, Pocock, Lan-DeMets).
- [ ] The final analysis uses the **adjusted** critical value, not 0.05.
- [ ] Stopping rules (efficacy/futility) and the actual stopping point are reported.
- [ ] If the trial stopped early for benefit, the report acknowledges likely **overestimation** of the effect.

**Decision rules**
- Unplanned repeated looks inflate Type I error sharply (≈8% at 2 looks, ≈14% at 5 looks, uncorrected) — any "we analyzed when data accrued" without a spending plan is a flag.
- A group-sequential trial that reports the final p against 0.05 (ignoring spent alpha) has not controlled error.

**Severity**
- Interim looks with no pre-specified spending function: **major**.
- Final analysis judged against 0.05 despite interim looks: **major**.
- Early stop for benefit with no caution about inflated effect: **minor to major**.

---

## Section 8 — Analysis population consistency (multiplicity's quiet cousin)

Switching populations or definitions is a common way multiplicity sneaks in. Check that the population and endpoint that "won" are the pre-specified ones.

**Checklist**
- [ ] Primary analysis population (ITT/full analysis set) matches the SAP.
- [ ] ITT denominators include all randomized patients in assigned groups.
- [ ] Per-protocol and ITT are not swapped to obtain significance.
- [ ] Missing-data handling is pre-specified, not selected to favor the result.

---

## Red flags to flag

Raise these as anchored findings (quote the exact sentence/table and the contradicting source):

- **Primary endpoint in the results differs from the registered/pre-specified primary endpoint** (outcome switching). Anchor: registry/protocol primary vs reported primary. **Major.**
- **A secondary or subgroup is elevated to the headline conclusion** after the primary failed. **Major.**
- **"Significant" endpoint sits below a failed gate** in the testing hierarchy yet is claimed as confirmatory. **Major.**
- **No multiplicity adjustment described** despite multiple primary endpoints, doses, or key secondaries carrying claims. **Major.**
- **p-value compared to 0.05 when an adjusted threshold applies** (split alpha, sequential boundary). **Major.**
- **Testing order not pre-specified**, or appears reordered to put the only significant endpoint first. **Major.**
- **Subgroup benefit claimed without a significant interaction test**; or number of subgroups examined not disclosed. **Major.**
- **Multiple arms each "significant vs control" at unadjusted 0.05**, control group reused without adjustment. **Major.**
- **Interim/repeated looks with no alpha-spending function**, or final analysis ignoring spent alpha. **Major.**
- **Post-hoc "winning dose"** presented as if pre-specified. **Major.**
- **Composite endpoint positive, then a single component claimed** as separately established. **Major.**
- **Co-primary design powered as if one endpoint sufficed** (success-if-all but sample size for success-if-one). **Major.**
- **ITT claimed but per-protocol denominators used**, or population switched to reach significance. **Major.**
- **"Trend toward significance" / "approached significance"** language used to rescue an endpoint that failed its adjusted threshold. **Minor to major.**
- **Number of statistical tests performed not reported**, making the true multiplicity un-auditable. **Minor.**
- **Exploratory analyses described with confirmatory language** ("demonstrated", "established") in abstract or conclusions. **Minor to major.**
- **Method named but mismatched to dependence** (e.g., Hochberg assuming positive dependence where not plausible). **Minor to major.**

---

## Severity summary

- **Major** — anything that turns an unprotected or post-hoc result into a confirmatory claim: outcome switching, claims below a failed gate, missing FWER control on a confirmatory family, comparing to 0.05 when adjusted thresholds apply, unadjusted multi-arm/subgroup claims, unplanned interim looks driving conclusions, population switching.
- **Minor** — incomplete reporting that does not by itself invalidate a claim: number of tests not stated, exploratory results mildly over-interpreted, correction method named but suboptimal where the conclusion still holds.
- **Context-dependent** — early stopping caution, dependence-assumption mismatches, and labeling ambiguities escalate to major if a headline claim actually rides on them.

## What "good" looks like (the wording to expect)
- "The family-wise type I error rate was controlled at one-sided 0.025 using a pre-specified [graphical/fixed-sequence/Hochberg] procedure across the primary and key secondary endpoints."
- "Endpoints were tested in the following fixed sequence...; testing stopped at the first non-significant comparison and subsequent endpoints are reported descriptively."
- "Interim analyses were conducted at [X%] information with an O'Brien-Fleming alpha-spending function; the final analysis was tested against the adjusted boundary of [value]."
- "Subgroup analyses were pre-specified and exploratory; treatment-by-subgroup interaction was tested and is reported in [Table/Figure]."

If the report instead presents multiple p < 0.05 values against a flat 0.05 with no stated strategy, treat every confirmatory claim beyond the first protected endpoint as unsupported and flag it.
