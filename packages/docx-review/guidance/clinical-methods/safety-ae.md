---
id: safety-ae
category: clinical-methods
name: Safety & Adverse-Event Reporting
applies_to: "Clinical trials and CSRs"
---

# Safety & Adverse-Event Reporting

Use this chapter when reviewing the safety sections of a clinical-trial report, CSR, or manuscript — i.e. any document that presents adverse events (AEs), serious adverse events (SAEs), deaths, laboratory toxicity, or exposure for one or more treatment arms. Your job is to confirm that harms are reported completely, by arm, with correct denominators, with traceable severity grading, and without selective or favourable presentation. Treat under-reporting of harms as a serious finding, not a stylistic one.

The four questions that govern almost every flag in this chapter:
1. **Who is counted?** (safety population definition and denominators)
2. **Counted how?** (patients with ≥1 event vs. event counts; severity grading source)
3. **Counted against what?** (denominator per arm; person-time for exposure-adjusted rates)
4. **Counted symmetrically across arms?** (same rules, same thresholds, same cut-off for every arm)

---

## 1. Safety population & denominators

Decision rule: the safety population is **as-treated** — every randomized subject who received ≥1 dose (full or partial) of study treatment, analysed by the treatment actually received, not by randomized assignment. This differs from ITT/mITT (efficacy) and per-protocol populations. Confirm this is stated explicitly and used consistently.

Checklist:
- [ ] Safety population is defined explicitly and matches "received ≥1 dose, analysed as treated."
- [ ] N for the safety population is given **per arm** and reconciles with the CONSORT/participant-flow diagram.
- [ ] Subjects who received the wrong treatment are analysed under the arm they actually received (as-treated), and any such reassignments are stated.
- [ ] Every AE table uses the **safety population N as its denominator**, not the randomized or ITT N, unless a different denominator is justified.
- [ ] Denominators (N=) are printed in or directly above every safety table — not left implicit.
- [ ] Percentages are computed as (subjects with event ÷ arm safety N) × 100, and the N used is identifiable.

Decision rule on denominator consistency: if any AE table's implied denominator differs from the stated safety N for that arm, the discrepancy must be explained (e.g. a sub-population such as "patients with ≥1 post-baseline lab value"). Unexplained denominator drift is a flag.

---

## 2. Patient-level vs. event-level counting

Decision rule: AE incidence tables count **subjects with at least one event**, so a subject is counted once per AE term per arm even with multiple episodes; row percentages are subject-based. Event counts (E) are a separate, additional presentation, not a substitute. Mixing the two inflates apparent rates.

Checklist:
- [ ] Each table states whether the unit is **number of subjects (n)** or **number of events (E)**; ideally both n (%) and E are shown for key tables.
- [ ] Subject-level percentages never exceed 100% and a subject is not double-counted within a single preferred term.
- [ ] When a subject has multiple severities of the same term, they are counted **once at the worst (maximum) severity** — confirm the "by maximum severity" convention is stated.
- [ ] System Organ Class (SOC) subtotals count each subject once within the SOC, even with multiple preferred terms in that SOC (so SOC n ≤ sum of PT n's).

---

## 3. Coding & severity grading (MedDRA / CTCAE)

Decision rule: AEs are coded with **MedDRA** (verbatim term → Preferred Term [PT] → System Organ Class [SOC]); the MedDRA version must be stated. **Severity grade** (intensity) and **seriousness** are distinct axes — never conflate them. In oncology and many other settings severity is graded by **CTCAE** (Grades 1–5: 1 mild, 2 moderate, 3 severe, 4 life-threatening, 5 death); the CTCAE version must be stated.

Checklist:
- [ ] MedDRA version is reported (e.g. "MedDRA v26.x"); coding dictionary named.
- [ ] Severity scale is named and versioned (CTCAE vX.X, or a defined mild/moderate/severe scale).
- [ ] **Severity vs. seriousness** are reported as separate columns/sections. A mild event can be serious (met a seriousness criterion); a severe (Grade 3) event is not automatically "serious."
- [ ] Seriousness uses the regulatory ICH criteria: death, life-threatening, hospitalization/prolongation of hospitalization, persistent/significant disability or incapacity, congenital anomaly/birth defect, or other important medical event. Confirm the SAE definition matches these.
- [ ] **Causality / relatedness** assessment is described (who assessed, what categories), and treatment-related (drug-related) AE tables are clearly distinguished from all-cause AE tables.
- [ ] Reporting period (treatment-emergent window) is defined: typically first dose through a stated number of days after last dose. **Treatment-emergent AE (TEAE)** definition is explicit.

Severity guidance (major vs. minor findings):
- **Major**: missing MedDRA or CTCAE version; severity and seriousness conflated such that grade-3+ rates or SAE rates cannot be separated; "by maximum severity" rule absent so high-grade counts are uninterpretable.
- **Minor**: dictionary version stated but coding-decision conventions (e.g. handling of unverified terms) not described; verbatim-to-PT mapping examples not provided.

---

## 4. AE / SAE / death tables by arm

Decision rule: a complete safety presentation includes, **per arm with denominators**, at minimum: any AE, treatment-related AE, Grade ≥3 (severe) AE, SAE, AE leading to dose modification/interruption, AE leading to discontinuation, and deaths. Each broken out by SOC and PT.

Checklist:
- [ ] An **overall safety summary table** ("overview of adverse events") gives per-arm n (%) for each of the categories above.
- [ ] AEs are tabulated by SOC and PT, by arm, sorted by frequency (commonly decreasing frequency in the experimental/total arm).
- [ ] A frequency threshold for the detailed common-AE table is stated (e.g. "PTs occurring in ≥5% (or ≥10%) of any arm") **and** a complete listing or appendix covers events below threshold — the threshold must not be the only place harms appear.
- [ ] Grade ≥3 (or severe) events are tabulated separately by arm.
- [ ] **SAEs** are listed by arm (typically all SAEs individually listed, with PT, severity, seriousness criterion, causality, outcome).
- [ ] **Deaths** are reported by arm with cause and timing; on-treatment vs. post-treatment deaths distinguished; treatment-related deaths identified.
- [ ] AEs leading to **discontinuation, interruption, and dose reduction** are tabulated separately by arm.
- [ ] AEs of special interest (AESI), if pre-specified, are reported as their own tables.
- [ ] Laboratory abnormalities: shift tables (baseline grade → worst post-baseline grade) and/or treatment-emergent toxicity grades by arm; not only mean changes.
- [ ] Numbers reconcile across tables (e.g. SAE n ≤ any-AE n; death n ≤ SAE n where deaths are SAEs; discontinuation-due-to-AE n consistent with disposition/flow diagram).

---

## 5. Exposure & exposure-adjusted rates

Decision rule: when arms differ in duration of exposure (different follow-up, early discontinuation, longer-treated experimental arm), **crude n (%) incidence is misleading** and exposure-adjusted rates should be reported. Exposure-adjusted incidence/event rate = events ÷ total person-time at risk, usually expressed per 100 patient-years (or per 100 patient-months).

Checklist:
- [ ] **Exposure is summarized per arm**: duration of treatment (mean/median, range), cumulative person-time (patient-years), dose intensity / number of cycles, and number discontinued early.
- [ ] If exposure differs materially between arms, **exposure-adjusted rates are presented** (EAIR for first event; EAER for recurrent events) alongside crude rates — not crude rates alone.
- [ ] The **person-time definition is stated**: for incidence (EAIR) the at-risk time is censored at first event; for event rate (EAER) full exposure time is used. Confirm the right denominator for the right rate.
- [ ] Units are explicit (per 100 patient-years vs. per patient-year) and consistent across tables.
- [ ] If a confidence interval is given for a rate, the method (e.g. Poisson/exact) is stated.
- [ ] Conclusions of "comparable safety" are not drawn from crude percentages when exposure is unequal.

Severity guidance:
- **Major**: experimental arm has substantially longer exposure, yet only crude n (%) is reported and used to claim similar/lower rates.
- **Minor**: exposure-adjusted rates given but person-time censoring rule (incidence vs. event) not specified.

---

## 6. Symmetry, completeness & narrative consistency

Checklist:
- [ ] The **same cut-off / data-lock date** and the same TEAE window apply to all arms.
- [ ] The same frequency threshold and severity rules are applied identically across arms (no lower threshold used to surface comparator harms or hide experimental harms).
- [ ] Harms text in the abstract and discussion **matches the tables** — selected favourable AEs are not highlighted while the table shows higher overall toxicity.
- [ ] Deaths and SAEs mentioned in the narrative appear in the tables and vice versa.
- [ ] Any pre-specified safety endpoint (e.g. a defined AESI or DLT rate) is reported regardless of result.
- [ ] Discontinuations, deaths, and SAEs reconcile with the participant-flow / disposition diagram.

---

## Red flags to flag

Raise these as specific, anchorable findings; quote the table title, arm, and number wherever possible.

- **Wrong denominator**: safety percentages computed against the ITT/randomized N (or against completers) rather than the as-treated safety population, inflating or deflating rates. ("Safety N stated as X but AE table denominator implies Y.")
- **Missing per-arm denominators**: AE tables show n or % with no N= for one or more arms, so rates cannot be verified.
- **Crude rates with unequal exposure**: longer-exposed (usually experimental) arm compared to comparator on crude n (%) only, with no exposure-adjusted rate, then claimed "comparable safety."
- **Severity conflated with seriousness**: Grade 3–4 events reported as "serious" or SAE counts presented as severity counts, so neither axis is interpretable.
- **No MedDRA / CTCAE version**: coding dictionary or severity scale unnamed or unversioned, making grades and PTs non-reproducible.
- **Maximum-severity rule absent**: severity tables where a subject can appear at multiple grades for one term, inflating high-grade counts.
- **Selective threshold reporting**: only AEs ≥10% (or some high threshold) shown, with no complete listing/appendix, so rarer but serious harms are invisible. A threshold applied to one arm's frequencies only is worse.
- **Deaths buried or under-reported**: deaths not tabulated by arm, cause not given, treatment-related deaths not identified, or post-treatment deaths silently excluded.
- **Discontinuations/SAEs not reconciling**: AE-related discontinuation or death counts that disagree with the disposition/flow diagram.
- **Treatment-related vs. all-cause swap**: discussion/abstract cites only *treatment-related* AE rates (lower) to characterise tolerability while the all-cause table shows materially higher rates — or the two are not distinguishable.
- **Event vs. subject counting muddled**: percentages computed from event counts (can exceed 100%) or subject and event units mixed within one table.
- **Asymmetric reporting period**: different cut-off dates, follow-up durations, or TEAE windows across arms.
- **Narrative spin**: abstract/conclusion states "well tolerated" / "favourable safety profile" while tables show higher SAE, Grade ≥3, discontinuation, or death rates in the experimental arm.
- **Missing exposure summary**: no per-arm treatment duration or patient-years reported, so exposure-adjusted interpretation is impossible.
- **AESI / pre-specified safety endpoint dropped**: a safety endpoint named in the protocol/methods does not appear in results.
- **Lab toxicity only as means**: laboratory safety presented as mean changes with no shift tables or treatment-emergent grade counts, hiding outlier toxicity.
- **Rounding/total errors**: SOC subtotals less than the largest PT within them, SAE n exceeding any-AE n, or percentages that do not match the stated n and N.

---

## Quick reviewer worksheet

For each arm, confirm you can fill this in from the document:

| Item | Arm A | Arm B |
|---|---|---|
| Safety population N (as-treated) | | |
| Person-time (patient-years) / median exposure | | |
| Any AE, n (%) | | |
| Treatment-related AE, n (%) | | |
| Grade ≥3 (severe) AE, n (%) | | |
| SAE, n (%) | | |
| AE leading to discontinuation, n (%) | | |
| Deaths (all-cause / treatment-related) | | |
| Exposure-adjusted rate (per 100 PY) for key AEs | | |

If any cell cannot be filled from the document for any arm, that is a reportable gap. If a cell can be filled but its denominator or counting rule is ambiguous, flag the ambiguity.
