---
id: prisma
category: reporting-standards
name: PRISMA 2020 (Systematic Reviews)
applies_to: "Systematic reviews and meta-analyses"
conflicts_with: [consort, strobe]
---

# PRISMA 2020 Reviewer Checklist (Systematic Reviews & Meta-Analyses)

Use this chapter when the document under review is a systematic review or meta-analysis (the abstract/methods claim a systematic search, explicit eligibility criteria, and a structured synthesis) — not a narrative review, scoping review, or single trial. If the manuscript calls itself a "systematic review" but lacks a reproducible search and pre-specified protocol, that mismatch is itself your first finding.

PRISMA 2020 is a reporting standard, not a quality scale. Your job is to verify each element is reported well enough that the review could be reproduced and its conclusions trusted. Flag missing, vague, or internally inconsistent items. Anchor every finding to the specific sentence, table, or figure.

## How to use this checklist
- Work section by section. For each item, decide: Reported adequately / Reported but inadequate / Not reported.
- Tie methods claims to results: anything described in Methods must appear in Results/flow diagram, and vice versa.
- Treat the registered protocol (PROSPERO or similar) as ground truth. Compare it against the manuscript and flag any silent deviation.

---

## 1. Title and Abstract
- [ ] Title identifies the report as a "systematic review" (and "meta-analysis" if quantitative synthesis is performed).
- [ ] Structured abstract reports: objectives, eligibility criteria, information sources, risk-of-bias method, synthesis method, results (number of studies and participants, main effect estimate with CI), limitations, registration.
- **Flag** if the abstract states a conclusion (e.g. "treatment X is effective") that the body's certainty rating (GRADE) does not support.

## 2. Rationale and Objectives
- [ ] Rationale described in the context of existing knowledge.
- [ ] Objectives or questions stated as an explicit, structured question. Look for **PICO** elements: Population, Intervention, Comparator, Outcome (and Study design / Timeframe where relevant).
- **Decision rule:** if the eligibility criteria, search, and outcomes cannot be mapped back to a clear PICO, treat the review question as under-specified (major if it drives selection decisions).

## 3. Eligibility Criteria
- [ ] Inclusion and exclusion criteria are explicit and operationalized (study designs, populations, interventions, comparators, outcomes, language, publication status, date limits).
- [ ] How studies were grouped for synthesis is specified (e.g. by intervention class, dose, population).
- **Flag** post-hoc-looking criteria — restrictions that appear designed to exclude inconvenient studies (e.g. an unusual date cutoff, a single-language restriction, exclusion of a specific trial design) without justification.

## 4. Information Sources
- [ ] All databases searched are named (e.g. MEDLINE/PubMed, Embase, CENTRAL/Cochrane Central) **with the date each was last searched**.
- [ ] Trial registries (ClinicalTrials.gov, WHO ICTRP, EU CTR) searched — critical for clinical-trial reviews to detect unpublished/ongoing studies and publication bias.
- [ ] Other sources: reference-list checking, citation tracking, contact with authors/manufacturers, preprint servers, grey literature, regulatory documents (FDA/EMA reviews).
- **Decision rule:** a single-database search (PubMed only) is a major limitation for any clinical-trial systematic review. CENTRAL and Embase omission should be flagged.
- **What to look for in the text:** an explicit sentence of the form "We searched [databases] from [start date] to [last-search date]." If the date range or last-search date is missing, the review's currency cannot be judged — flag it.

## 5. Search Strategy
- [ ] The full search strategy for **at least one database** is presented verbatim (typically in a supplement), including all line numbers, terms, and limits — enough to reproduce it.
- [ ] Controlled vocabulary (MeSH/Emtree) and free-text terms combined appropriately; both intervention and population concepts covered.
- **Flag (major)** if only a list of keywords or a prose description is given instead of an actual reproducible strategy. "We searched PubMed for relevant terms" is not a search strategy.
- **Flag** date of last search older than ~12 months before submission without an update note — the evidence base may have moved.

## 6. Selection Process
- [ ] Number of reviewers screening; whether title/abstract and full-text screening were done independently and in duplicate; how disagreements were resolved.
- [ ] Whether automation tools were used and how.
- **Decision rule:** single-reviewer screening with no verification is a methodological weakness (minor-to-major depending on the field and consistency).

## 7. Data Collection Process
- [ ] Independent, duplicate data extraction described; process for resolving discrepancies; whether study authors were contacted for missing data.
- [ ] Any automation/AI extraction tools described and validated.

## 8. Data Items
- [ ] All outcomes for which data were sought are listed, with definitions; which results were collected (e.g. all time points, all measures) and how multiple/compatible results were handled.
- [ ] Other variables extracted (funding source, population characteristics, intervention details) are listed.
- **Flag** "outcome cherry-picking": review collects only the outcomes favorable to the conclusion, or selects one time point among many without rule.

## 9. Risk-of-Bias Assessment (within studies)
- [ ] A named, appropriate tool is used. For RCT evidence this should be **Cochrane RoB 2**; for non-randomized studies, **ROBINS-I**. Older "Cochrane risk of bias tool" or Jadad/Newcastle-Ottawa should be flagged if used as the sole instrument when a current tool applies.
- [ ] Assessment done independently and in duplicate; domains specified; per-study, per-domain judgments reported (ideally a traffic-light figure), not just an overall sentence.
- [ ] Risk-of-bias results are actually **used** downstream — in synthesis, sensitivity analysis, or certainty rating.
- **Flag (major)** if risk of bias is assessed but never referenced again ("assessed and discarded"), or if high-risk studies dominate a pooled estimate presented as definitive.
- **What to look for:** for RCTs, RoB 2 produces a per-domain judgment (randomization process, deviations from intended interventions, missing outcome data, measurement of the outcome, selection of the reported result) and an overall "Low / Some concerns / High" call. For ROBINS-I, the overall scale is "Low / Moderate / Serious / Critical / No information." A review that reports only a numeric score (e.g. a star count) without these domain judgments is using an outdated or inappropriate instrument — flag it.

## 10. Effect Measures and Synthesis Methods
- [ ] Effect measure specified per outcome (RR, OR, HR, risk difference, MD, SMD) and is appropriate to the data type.
- [ ] Methods to prepare data for synthesis described (handling of missing SDs, conversions, unit-of-analysis issues such as cluster or crossover trials).
- [ ] If meta-analysis: model stated (**fixed-effect vs random-effects**) and justified; pooling method named (e.g. inverse-variance, Mantel-Haenszel, DerSimonian-Laird or REML for random effects).
- [ ] Heterogeneity assessed and **quantified** (I-squared, tau-squared, Cochran's Q), not just asserted; thresholds interpreted sensibly (I-squared is not a substitute for inspecting the forest plot).
- [ ] Subgroup/meta-regression/sensitivity analyses described and flagged as pre-specified vs post-hoc.
- **Decision rule:** if substantial clinical or statistical heterogeneity exists, a fixed-effect model and/or a single pooled estimate presented as the headline result is a flag. Pooling clinically incomparable studies ("mixing apples and oranges") is a major flag.
- **Decision rule:** very few studies (typically <5–10) in a random-effects meta-analysis makes the between-study variance estimate unreliable — note imprecision; meta-analysis of 2 small trials should be interpreted cautiously, not as definitive.

## 11. Reporting-Bias / Publication-Bias Assessment
- [ ] Methods to assess risk of bias due to missing results described (e.g. comparison against registries/protocols, selective-outcome assessment).
- [ ] If ≥10 studies, a funnel plot and/or a test for small-study effects (Egger's) is reported; with <10 studies these tests are underpowered and should not be over-interpreted.
- **Flag** absence of any publication-bias consideration in a review pooling published trials only.

## 12. Certainty Assessment (across studies)
- [ ] Certainty/confidence in the body of evidence rated **per outcome**, using a named framework — almost always **GRADE** (High / Moderate / Low / Very low).
- [ ] The five GRADE downgrade domains are addressed where relevant: risk of bias, inconsistency, indirectness, imprecision, publication bias (and upgrade factors for observational data).
- [ ] A Summary-of-Findings table is present for the main outcomes.
- **Flag (major)** confident clinical conclusions resting on Low/Very-low certainty evidence, or a GRADE rating asserted without showing the domain judgments.

## 13. Results — Study Selection & Flow Diagram
- [ ] A **PRISMA flow diagram** is present showing: records identified per source, duplicates removed, records screened, records excluded, full texts assessed, full texts excluded **with reasons (counted by reason)**, and studies included.
- [ ] **The numbers add up at every stage** and reconcile with the text and the count of included studies.
- [ ] A list of excluded full-text studies with reasons is provided (usually a supplement).
- **Flag (major)** arithmetic that does not reconcile (e.g. "screened 1,000, excluded 600, assessed 300" leaves 100 unaccounted), or full-text exclusions given without counted reasons.

## 14. Results — Study Characteristics & Risk of Bias
- [ ] A characteristics-of-included-studies table (design, population, intervention/comparator, outcomes, sample sizes, funding).
- [ ] Risk-of-bias judgments presented for each included study.

## 15. Results — Syntheses
- [ ] For each synthesis: number of studies and participants, the forest plot (for meta-analyses), the pooled estimate **with 95% CI**, and heterogeneity statistics.
- [ ] Results of all pre-specified subgroup/sensitivity analyses reported (including those that were "negative").
- [ ] Narrative synthesis (where meta-analysis was not appropriate) follows a structured, transparent method (e.g. SWiM) rather than vote-counting by statistical significance.
- **Flag** vote-counting ("7 of 10 studies showed benefit") used to claim an overall effect — it ignores effect size and precision.
- **Check the forest plot directly:** verify the pooled diamond matches the reported summary estimate, that each study's weight is plausible (one study carrying ~90% of the weight means the "meta-analysis" is effectively a single trial), and that the scale (RR/OR/MD) matches the methods. A diamond crossing the line of no effect contradicts a "significant benefit" claim — flag the inconsistency.

## 16. Discussion, Registration, Support
- [ ] Limitations of the evidence and of the review process discussed; implications for practice and research.
- [ ] **Registration:** registry name and number (PROSPERO) provided; protocol accessible; **any amendment to the registered protocol disclosed with rationale.**
- [ ] Funding source and role of funder; competing interests; data/code availability.

---

## Red flags to flag

Raise these explicitly, anchored to the exact location. Listed roughly major → minor.

- **Protocol/registration deviation (silent).** Primary outcome, eligibility, or analysis in the manuscript differs from the PROSPERO/registered protocol with no disclosure. (Major) Compare the registry record directly.
- **Outcome switching.** The outcome emphasized in the abstract/conclusion is not the pre-specified primary outcome, or a secondary/new outcome is promoted to headline because it was significant. (Major)
- **Search not reproducible.** No verbatim search strategy for any database; only keywords or a prose summary. (Major)
- **Inadequate sources.** Single-database search; trial registries not searched in a clinical-trial review; no grey-literature/unpublished-data effort. (Major to moderate)
- **Flow-diagram numbers don't reconcile** with each other, the text, or the included-study count; or full-text exclusions lack counted reasons. (Major)
- **Wrong or absent risk-of-bias tool.** RCTs assessed without RoB 2, non-randomized studies without ROBINS-I, or no formal assessment at all. (Major)
- **Risk of bias assessed but not used** — never feeds synthesis, sensitivity analysis, or GRADE. (Moderate)
- **Inappropriate pooling.** Clinically heterogeneous studies, mixed study designs, or incompatible comparators combined into one estimate; or RCTs and observational studies pooled together without separation. (Major)
- **Heterogeneity ignored.** High I-squared with a fixed-effect model or a single confident pooled estimate; heterogeneity not quantified or not explored. (Major)
- **Conclusions outrun the evidence.** Strong recommendation from Low/Very-low GRADE certainty, or from very few small high-risk trials. (Major)
- **Selective outcome / time-point reporting.** Only favorable outcomes or one of several time points synthesized, without a pre-specified rule. (Major)
- **Vote-counting** used to declare an overall effect instead of effect sizes and CIs. (Moderate)
- **Publication bias unconsidered** despite reliance on published trials; or funnel-plot/Egger over-interpreted with <10 studies. (Moderate)
- **Double-counting / unit-of-analysis errors** — multi-arm trials entered multiple times against a shared control; multiple correlated outcomes treated as independent. (Major)
- **Single-reviewer screening/extraction** with no verification. (Moderate)
- **Out-of-date search** (last search well over a year before submission) with no update. (Moderate)
- **GRADE/certainty asserted without domain judgments**, or no Summary-of-Findings table. (Moderate)
- **Spin in the abstract** — positive framing of a non-significant or low-certainty result. (Moderate)
- **Funder/competing-interest conflicts** undisclosed, especially industry-sponsored reviews of the sponsor's own product. (Moderate)
- **No list of excluded full-text studies** with reasons. (Minor to moderate)
- **Overlapping reviews / data not deduplicated** — the same trial appears under multiple publications (companion papers, pooled and individual reports) and is counted more than once. (Major)
- **Title omits "systematic review"/"meta-analysis"** or abstract is unstructured. (Minor)

## Severity quick-guide
- **Major** = threatens the validity or reproducibility of the conclusions: silent protocol deviations, outcome switching, non-reproducible/inadequate search, inappropriate pooling, flow numbers that don't reconcile, wrong/absent RoB tool, conclusions beyond the certainty of evidence.
- **Minor** = reporting completeness issues that don't change the conclusions: missing title label, unstructured abstract, missing excluded-studies list, formatting of the flow diagram.
- When unsure, escalate items that affect what a reader would *do* with the review (clinical recommendations, pooled effect direction/size) and downgrade items that only affect tidiness.
- **Phrasing for findings:** state the requirement, the deviation, and the location, e.g. "Methods name RoB 2, but the included-studies table reports Jadad scores only (Table 2) — the stated risk-of-bias tool was not applied." Avoid generic "PRISMA item X not met"; reviewers and authors act on concrete, anchored statements.

## Cross-standard note
This chapter governs the *review-level* reporting. The underlying primary studies still carry their own standards — when you scrutinize an individual included RCT use CONSORT, and for included observational studies use STROBE. Do not apply CONSORT/STROBE item-by-item to the systematic review itself.

If the document is a protocol for a planned review (rather than a completed one), the relevant standard is PRISMA-P; in that case expect no results/flow diagram and judge only the planned methods.
