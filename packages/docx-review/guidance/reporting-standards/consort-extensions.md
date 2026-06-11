---
id: consort-extensions
category: reporting-standards
name: CONSORT Extensions
applies_to: "Cluster, crossover, non-inferiority/equivalence, pilot, and harms RCTs"
---

# CONSORT Extensions

Use this chapter when the trial under review is NOT a simple parallel-group superiority RCT — i.e. when `study_design` indicates the unit of randomisation is a group (cluster), participants receive multiple interventions in sequence (crossover), the hypothesis is non-inferiority or equivalence rather than superiority, the study is a pilot/feasibility study, or harms reporting is a focus. Apply the base CONSORT 2010 chapter first, then layer the relevant extension items below. A design can trigger more than one extension (e.g. a cluster non-inferiority trial).

How to use: identify the design, jump to that section, and check each item. Each section ends with design-specific red flags. The combined "Red flags to flag" section at the end is the fast triage list.

---

## 0. Design triage (do this first)

- Confirm the design label in the abstract/methods matches what was actually done. Authors frequently mislabel.
- A **non-inferiority/equivalence** design is defined by its hypothesis and margin, not by the word "non-inferiority" appearing once. If a margin is specified, treat as NI/equivalence regardless of how the title reads.
- A **pilot/feasibility** study is defined by its objective (assessing feasibility/procedures), NOT merely by being small. A small trial powered for a clinical outcome is an underpowered definitive trial, not a pilot — flag mislabelling.
- **Cluster** = randomisation unit is a group (clinic, ward, GP practice, village). If individuals are randomised but treated in groups, that is individual randomisation with clustering in delivery, not a cluster RCT — different analysis implications.
- **Crossover** = each participant receives ≥2 interventions in a randomised sequence with washout(s).

---

## 1. Cluster randomised trials (CONSORT cluster extension)

Cluster trials randomise groups but usually measure outcomes on individuals. The core review concern is whether clustering is handled correctly in design, sample size, and analysis.

### Design and rationale
- [ ] Rationale for using a cluster design is stated (e.g. intervention is delivered at group level, contamination risk).
- [ ] The unit of randomisation (cluster) and the unit of analysis/observation (usually individual) are both clearly defined and distinguished.
- [ ] Whether clusters were identified/recruited before or after randomisation is stated; whether participants were identified before or after cluster randomisation.

### Sample size
- [ ] Sample size accounts for clustering: an intracluster correlation coefficient (ICC) is stated with its source, and either a design effect or an explicit inflation of the sample is shown.
- [ ] Number of clusters AND average (or actual) cluster size are both reported — not just total N.
- [ ] If cluster sizes vary substantially, the coefficient of variation of cluster size is addressed.

### Randomisation and blinding
- [ ] Method of randomising clusters described; if stratified or matched (common with few clusters), the method and how it is handled in analysis is described.
- [ ] Who enrolled clusters, who enrolled individual participants, and the sequencing relative to randomisation (to assess identification/recruitment bias).

### Participant flow and results
- [ ] Flow diagram reports BOTH the number of clusters and the number of individuals at each stage (randomised, received intervention, lost, analysed).
- [ ] Analysis accounts for clustering (e.g. mixed/multilevel model, GEE, cluster-level summary, or robust SEs). A standard individual-level analysis ignoring clustering is a major error.
- [ ] Observed ICC for the primary outcome is reported.
- [ ] Baseline characteristics reported at both the cluster level and the individual level where relevant.

### Cluster red flags
- ITC/clustering ignored in sample size OR in analysis (individual-level test treating clustered data as independent) — **major**: invalidates p-values/CIs.
- Very few clusters per arm (e.g. <4-6) with no acknowledgement that few clusters undermine randomisation balance and inference — **major**.
- Participants identified/recruited AFTER clusters were randomised and after allocation was known, with no blinding of recruiters → identification/selection bias — **major**.
- N reported only as total individuals, no cluster count or cluster size — **major** (cannot judge the design).
- Differential cluster-level attrition (whole clusters dropping out) not reported or not addressed — **major**.

---

## 2. Crossover trials (CONSORT crossover extension)

Each participant is their own control across periods. Review focuses on carryover, period effects, washout, and using the correct paired analysis.

### Design
- [ ] Rationale for a crossover design (stable chronic condition, treatment with no cure/no lasting carryover) is justified — crossover is inappropriate for conditions that change or are cured.
- [ ] Number of periods, sequence of interventions, and the randomised allocation of participants to sequences are described.
- [ ] Length and rationale of the washout period(s) are stated and justified against the pharmacokinetics/biology of the intervention.

### Analysis
- [ ] A paired/within-person analysis appropriate to the crossover structure is used (e.g. paired comparison, mixed model with period and sequence terms) — NOT an unpaired between-group comparison that discards the crossover.
- [ ] Carryover and period effects are assessed or explicitly addressed; if a test for carryover is used, note its known low power (do not over-rely on a non-significant carryover test as proof of no carryover).
- [ ] Handling of dropouts between periods is described (incomplete pairs); how partial data are used.

### Flow and results
- [ ] Flow accounts for participants per sequence and per period, including who completed each period.
- [ ] Results presented as within-person differences with paired CIs.

### Crossover red flags
- Data analysed as if a parallel trial (unpaired between-arm comparison), discarding the within-person structure — **major**.
- No washout, or washout too short relative to drug half-life / biological effect, with carryover not discussed — **major**.
- Crossover used for an unstable or curable condition where the disease state differs between periods — **major** (design inappropriate).
- Significant period or carryover effect detected but ignored in interpretation — **major**.
- Sequence assignment not randomised, or sequence allocation not reported — **moderate to major**.

---

## 3. Non-inferiority and equivalence trials (CONSORT NI/equivalence extension)

These do NOT aim to show a difference. The central review concern is the margin, the analysis populations, assay sensitivity, and whether conclusions match the CIs.

### Margin and hypothesis
- [ ] The non-inferiority (or equivalence) margin is explicitly pre-specified.
- [ ] The justification for the margin is given on BOTH clinical grounds (what loss of effect is acceptable) AND statistical/historical grounds (the effect of the active comparator vs placebo it must preserve). A margin asserted with no justification is a major problem.
- [ ] The hypothesis direction is clear: non-inferiority is one-sided; equivalence is two-sided (margin on both sides).
- [ ] The reference/active comparator is an appropriate, currently effective standard treatment at an adequate dose.

### Sample size and analysis
- [ ] Sample size calculation uses the NI/equivalence framework (the margin, the assumed true difference, one-sided alpha for NI).
- [ ] BOTH intention-to-treat (ITT) and per-protocol (PP) analyses are reported, because in NI trials ITT is anti-conservative (tends to push toward no difference / inflate non-inferiority). Conclusions should hold in both populations.
- [ ] The conclusion is based on the position of the CONFIDENCE INTERVAL relative to the margin, not on a non-significant p-value for superiority. "No significant difference" does NOT establish non-inferiority.

### Assay sensitivity and integrity
- [ ] Evidence/argument for assay sensitivity (that the trial could have detected a difference if one existed) — e.g. the comparator's effect is established in this setting and the trial was conducted to high standards.
- [ ] Sloppiness that biases toward no difference (poor adherence, measurement noise, dropouts) is acknowledged, since it spuriously favours non-inferiority.

### Interpretation
- [ ] Interpretation states which conclusion the CI supports: non-inferior, inferior, inconclusive, or (if also pre-specified) superior. A trial may switch to superiority testing if the CI excludes zero, but only if pre-specified.
- [ ] If equivalence: the CI must lie entirely WITHIN both margins (−Δ to +Δ).

### NI/equivalence red flags
- Non-inferiority margin not pre-specified, or set after seeing data — **major** (results uninterpretable).
- Margin asserted with no clinical/statistical justification, or implausibly wide so almost any result "passes" — **major**.
- Non-inferiority concluded from a non-significant superiority test ("no significant difference, therefore non-inferior") — **major**: classic absence-of-evidence error.
- Conclusion relies on ITT only, with PP not reported (or vice versa), so the anti-conservative direction is not checked — **major**.
- Comparator is sub-therapeutic dose, outdated, or placebo dressed as active control — **major** (no assay sensitivity).
- CI crosses the margin but the abstract/conclusion still claims non-inferiority — **major** (spin; anchor the exact CI vs the stated margin).
- High dropout/poor adherence not flagged as biasing toward non-inferiority — **moderate**.

---

## 4. Pilot and feasibility trials (CONSORT pilot/feasibility extension)

Pilots assess whether a future definitive trial is feasible. They should report feasibility objectives and progression criteria, NOT primarily hypothesis tests of clinical effectiveness.

### Objectives and design
- [ ] The study is explicitly identified as a pilot or feasibility study in the title/abstract.
- [ ] Feasibility/pilot objectives are stated (e.g. recruitment rate, retention, adherence, acceptability, data completeness, willingness to randomise).
- [ ] If progression criteria to a main trial are used, they are pre-specified (e.g. traffic-light thresholds for recruitment/retention).

### Sample size and outcomes
- [ ] The rationale for the sample size is given on feasibility grounds (e.g. estimating recruitment, or precision of an estimate) — NOT a power calculation for a clinical effect.
- [ ] Primary outcomes are feasibility metrics. Any clinical outcomes are framed as exploratory/descriptive.

### Analysis and interpretation
- [ ] Feasibility outcomes reported descriptively (rates, proportions, with CIs for precision where appropriate).
- [ ] Interpretation addresses whether/how to proceed to a definitive trial and what modifications are needed.
- [ ] Effect sizes for clinical outcomes are NOT used to make efficacy claims and are not the basis for powering on the observed (pilot) effect.

### Pilot red flags
- Pilot used to make an efficacy/effectiveness claim or hypothesis-test a clinical endpoint — **major** (misuse of design).
- Mislabelled: an underpowered definitive trial called a "pilot" to excuse the small N — **major**.
- Future-trial sample size powered on the pilot's observed effect size — **major** (pilot effect estimates are imprecise; this biases the main trial).
- No feasibility objectives or progression criteria stated — **moderate to major**.
- Statistical significance of a clinical outcome emphasised in abstract/conclusion — **major** (spin).

---

## 5. Harms reporting (CONSORT-Harms extension)

Applies whenever harms/safety/adverse events are reported (most CRO clinical-trial reports). Equal rigour is expected for harms as for benefits.

### Reporting completeness
- [ ] Harms/adverse events are addressed in the title or abstract if balanced reporting is claimed; at minimum harms are not buried.
- [ ] How adverse events were defined and ascertained is described: solicited vs unsolicited (spontaneous), the data collection method/instrument, and the recall/observation period.
- [ ] The grading/severity scale (e.g. CTCAE) and the attribution/causality method are stated.
- [ ] Pre-specified vs emergent harms are distinguished.

### Denominators and presentation
- [ ] For EACH arm: the denominator at risk and the number of participants WITH each event AND/OR the number of events (these differ — clarify which).
- [ ] Both serious adverse events (SAEs) and non-serious AEs are reported, with the threshold for tabulation stated (e.g. all events ≥ some frequency).
- [ ] Withdrawals/discontinuations DUE to harms are reported per arm with reasons.
- [ ] Absolute numbers given, not only percentages or only relative measures.

### Analysis and interpretation
- [ ] Analysis approach for harms stated (typically the safety/as-treated population; note this differs from the efficacy ITT population — confirm which is used and that it is appropriate for harms).
- [ ] Balanced interpretation weighing harms against benefits; harms not dismissed as "not statistically significant" when the trial was not powered for them.

### Harms red flags
- Harms mentioned only in passing or only "no serious adverse events occurred" with no tables or denominators — **major**.
- Per-arm denominators for harms missing or inconsistent with the flow diagram — **major**.
- Ascertainment method not described, so reader cannot judge under-reporting (solicited vs spontaneous unstated) — **moderate to major**.
- Discontinuations due to adverse events not reported per arm — **moderate**.
- Harms downplayed as "non-significant" in an underpowered safety comparison — **major** (absence of evidence misused).
- Only relative risk/percentages given for rare serious events, hiding small absolute numbers — **moderate**.
- Severity grading or causality attribution method unstated — **moderate**.

---

## Red flags to flag (fast triage, all extensions)

Anchor each to the exact sentence/table/number in the document.

- **ITT claimed but per-protocol denominators used** (numbers analysed do not match randomised counts) — major.
- **Primary endpoint in results differs from the registered/pre-specified endpoint** (check registry/protocol vs results) — major.
- **Non-inferiority margin not pre-specified or unjustified**, or NI concluded from a non-significant difference — major.
- **For NI trials, only ITT or only PP reported** (the anti-conservative direction unchecked) — major.
- **Conclusion contradicts the CI** relative to the NI/equivalence margin (CI crosses margin but claims non-inferiority) — major.
- **Clustering ignored** in sample size or analysis for a cluster trial — major.
- **Cluster trial reports only total N**, no number of clusters or cluster size — major.
- **Crossover analysed as parallel** (unpaired), or washout absent/too short with no carryover discussion — major.
- **Pilot used to claim efficacy**, or an underpowered definitive trial mislabelled as a pilot — major.
- **Main trial powered on a pilot's observed effect** — major.
- **Harms lack per-arm denominators / tables**, or ascertainment method undescribed — major to moderate.
- **Discontinuations due to harms not reported** per arm — moderate.
- **Design mislabelled** in title/abstract vs methods (e.g. "non-inferiority" with no margin; "pilot" powered for an outcome) — major.

### Severity quick rule
- **Major** = the error changes what the reader concludes, invalidates the inference, or hides safety information (wrong analysis for the design, missing margin, CI/conclusion mismatch, clustering ignored, harms denominators missing). These should block acceptance until resolved.
- **Minor** = reporting gaps that do not change conclusions but reduce reproducibility/transparency (ICC not reported but clustering analysed correctly; washout length stated but rationale thin; severity scale named but not referenced). Request revision.

If you cannot locate a margin, an ICC, a cluster count, or harms denominators after a focused search of methods/results/flow diagram/tables, state that it is "not reported" rather than assuming it was done.
