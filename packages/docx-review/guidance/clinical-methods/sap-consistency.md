---
id: sap-consistency
category: clinical-methods
name: SAP-Results Consistency
applies_to: "Clinical trials and CSRs"
---

# SAP-Results Consistency

Use this chapter whenever you can compare what a trial *said it would analyse* (protocol, statistical analysis plan / SAP, registry entry) against what it *actually reported* (CSR, manuscript, tables/figures) — your job is to detect undisclosed deviations between pre-specification and results, and to make sure every analysis is correctly labelled as pre-specified or post-hoc. This is one of the highest-yield, least-disputable forms of review: mismatches between source documents are factual, anchorable, and bear directly on the credibility of the trial's conclusions.

## Why this matters (the reviewer's mental model)

Pre-specification protects against analytic flexibility ("researcher degrees of freedom" / "the garden of forking paths"). When the analysis is fixed before the data are unblinded, a single declared p-value means what it claims. When choices are made *after* seeing the data — which endpoint, which timepoint, which population, which subgroup, which model, which covariates — the false-positive rate is uncontrolled and the reported precision is fictional. Your task is not to forbid post-hoc analysis (it is legitimate and often valuable) but to ensure (a) deviations from pre-specification are *disclosed* and *justified*, and (b) post-hoc analyses are *clearly labelled* and not presented with confirmatory weight.

## Source documents to obtain and the precedence order

Anchor every finding to specific text in specific documents. The canonical sources, in rough precedence for "what was pre-specified":

1. **Trial registry entry** (ClinicalTrials.gov / EudraCT-CTIS / ISRCTN / WHO ICTRP) — primary/secondary outcomes, timepoints, and their *history of changes* (registries timestamp edits; use the change log). Note the date the record was first posted relative to first enrolment.
2. **Original protocol** (and dated amendments) — design, endpoints, analysis populations, hypotheses.
3. **SAP** (and version history) — the definitive specification of analyses. Critically, **check the SAP version date against the database-lock / unblinding date.** A SAP finalised after unblinding is not pre-specification.
4. **CSR** (ICH E3 structured report) and its appendices (protocol, SAP, sample tables).
5. **Manuscript / abstract** — usually the most compressed and most prone to selective emphasis.

Decision rule: if these documents disagree, the disagreement *is* the finding. State which says what, with version dates.

## Core cross-checks (run all of these)

### 1. Primary endpoint
- [ ] Is the primary endpoint in the results identical (variable + timepoint + metric + direction) to the registry, protocol, and SAP?
- [ ] If multiple co-primary endpoints were pre-specified, are **all** reported, and is the multiplicity rule for declaring success applied as written?
- [ ] Was the primary endpoint changed *after* enrolment began? Check the registry change log and protocol amendment dates against first-patient-in.
- [ ] Decision rule: a changed primary endpoint with a change date *after* unblinding/interim data review, undisclosed, is **MAJOR**. Changed *before* unblinding and disclosed with rationale may be acceptable — still flag for transparency.

### 2. Analysis population / denominators
- [ ] Does the named analysis set (ITT / mITT / full analysis set / per-protocol / safety / as-treated) match the SAP definition?
- [ ] Do the *denominators in the result tables* match the claimed set? Cross-check randomised N (CONSORT flow) against analysed N for the primary outcome.
- [ ] Is the mITT definition pre-specified, or constructed post-hoc to exclude inconvenient patients? An mITT that drops patients with no post-baseline measurement is common and often acceptable *if pre-specified*; one that drops patients by outcome is a red flag.
- [ ] Decision rule: "ITT" claimed but the primary analysis denominator is smaller than randomised, with exclusions not matching a pre-specified rule, is **MAJOR** (see Red flags).

### 3. Statistical model and covariates
- [ ] Does the analysis model (e.g., ANCOVA, MMRM, Cox PH, logistic regression) match the SAP?
- [ ] Are the **adjustment covariates** exactly those pre-specified? Added covariates that strengthen the result, or removed covariates, are post-hoc model changes.
- [ ] Were stratification factors used in randomisation also used in the analysis as pre-specified?
- [ ] Was the test one-sided vs two-sided as written? A silent switch to one-sided (halving the p-value) is a red flag.
- [ ] For time-to-event: does the censoring rule match the SAP? Changed censoring can manufacture or erase significance.

### 4. Multiplicity and the testing hierarchy
- [ ] Is there a pre-specified hierarchy / gatekeeping / alpha-splitting scheme for primary and key secondary endpoints?
- [ ] Is it actually followed? A claim of significance on a secondary endpoint *after* the primary failed, when the hierarchy says testing stops at the first non-significant step, is invalid.
- [ ] Are secondary/exploratory endpoints adjusted for multiplicity as pre-specified, or are raw p-values presented as if confirmatory?
- [ ] Decision rule: claiming a "positive" secondary result downstream of a broken gatekeeping rule is **MAJOR**.

### 5. Interim analyses and stopping
- [ ] Were interim analyses pre-specified with an alpha-spending function (e.g., O'Brien-Fleming, Pocock)?
- [ ] If the trial stopped early for benefit, was a pre-specified stopping boundary crossed? Early stopping for benefit tends to overestimate effect size — check that this is acknowledged.
- [ ] Were unplanned interim looks performed (e.g., "after a review of emerging data")? Unplanned looks inflate type I error.

### 6. Subgroups
- [ ] Are reported subgroups pre-specified in the SAP, or generated after seeing the data?
- [ ] Is each subgroup claim supported by a pre-specified **interaction test**, not just separate within-subgroup p-values?
- [ ] Is a significant subgroup in an otherwise null trial being promoted to the headline? This is the classic post-hoc salvage pattern.
- [ ] Decision rule: a subgroup finding presented as a primary conclusion without pre-specification and without an interaction test is **MAJOR** when it drives the paper's claim; **MINOR** when properly labelled exploratory.

### 7. Endpoint set completeness ("outcome reporting bias")
- [ ] Is **every** pre-specified outcome (primary AND secondary) reported somewhere, even if non-significant?
- [ ] Build an outcome inventory: list every outcome in registry/protocol/SAP, then tick which appear in results. Silently dropped outcomes — especially secondaries that presumably failed — are reporting bias.
- [ ] Are there reported outcomes that appear in *no* pre-specification source (newly introduced, unlabelled as post-hoc)?
- [ ] Decision rule: a pre-specified primary or key secondary outcome that is *absent* from results with no explanation is **MAJOR**; minor secondaries omitted is **MINOR** but still flag.

### 8. Effect estimates and direction
- [ ] Do effect sizes, CIs, and p-values in the abstract match the corresponding result table exactly? Abstract/body mismatches are common and anchorable.
- [ ] Does the conclusion's claimed magnitude match the primary estimand's summary measure, not a more favourable secondary one?

## Pre-specified vs post-hoc: the labelling test

For every analysis presented, you should be able to assign it to one bucket. The report should make this assignment explicit.

| Signal it is PRE-SPECIFIED | Signal it is POST-HOC |
|---|---|
| Appears verbatim in SAP/protocol dated before unblinding | First appears in CSR/manuscript only |
| Named in registry before first enrolment | Introduced by an amendment dated after data review |
| Has a pre-assigned alpha / position in the hierarchy | "We additionally explored…", "A further analysis showed…" |
| Covariates/population match SAP | Convenient covariate set; population trimmed to fit |
| Phrased as a hypothesis to test | Phrased as a description of an observed pattern |

Anchor phrases that *should* be present for honest post-hoc work: "post hoc", "exploratory", "not pre-specified", "hypothesis-generating", "should be interpreted with caution". Their **absence** around an analysis that the SAP does not contain is itself a finding.

Decision rule: post-hoc analyses are legitimate. The defect is not their existence but (a) failing to label them, or (b) presenting them with confirmatory language ("demonstrated", "established", "significant benefit") and multiplicity-naive p-values.

## Severity guidance

**MAJOR (challenge the conclusion / request major revision):**
- Primary endpoint, population, or its timepoint differs from the pre-specified one without disclosure.
- "ITT" claimed but per-protocol denominators / outcome-dependent exclusions used for the primary analysis.
- A pre-specified primary or key secondary outcome is missing from results with no explanation (outcome reporting bias).
- A post-hoc or non-pre-specified analysis is presented as the trial's confirmatory conclusion.
- Broken testing hierarchy: significance claimed on a secondary endpoint downstream of a failed gatekeeping step.
- SAP finalised/amended after unblinding in the direction of the favourable result, with no clear timeline.
- Changed statistical model, covariates, censoring rule, or test sidedness that materially changes the result, undisclosed.

**MINOR (request clarification / revision):**
- Deviation from SAP that is disclosed and justified but not flagged in the abstract.
- Minor secondary outcomes omitted from the main paper (acceptable if in a supplement/registry results).
- Post-hoc analyses correctly labelled but slightly over-emphasised in the discussion.
- Covariate or model wording in the methods does not exactly match the SAP but the analysis is equivalent.
- Subgroup analyses pre-specified and interaction-tested but reported without the interaction p-value.

## Red flags to flag

Raise each as a specific, anchorable finding — quote the pre-specifying text and the contradicting reported text, with document names and version dates.

- **Endpoint switching** — primary endpoint in the results/abstract differs from the registered/pre-specified primary endpoint (changed variable, timepoint, or definition; a former secondary promoted to primary), undisclosed. Cross-check registry change log + protocol amendments vs first-patient-in.
- **ITT claimed but per-protocol denominators used** — randomised N stated, but the primary analysis denominator is smaller and the exclusions do not match a pre-specified rule (analysed < randomised, unexplained).
- **Outcome reporting bias / disappearing outcomes** — a pre-specified outcome (especially a secondary that likely failed) is absent from the results entirely, with no statement of why.
- **Post-hoc dressed as confirmatory** — an analysis that appears in no pre-specification source is presented with "significant", "demonstrated", "established" and an unadjusted p-value, no "exploratory"/"post hoc" caveat.
- **Subgroup salvage** — an overall-null trial headlines a significant subgroup that was not pre-specified and/or has no significant interaction test.
- **Broken testing hierarchy** — a secondary endpoint declared "significant" after the primary (or a higher-ranked secondary) failed, in violation of the SAP's gatekeeping/alpha-spending scheme.
- **Population redefinition** — mITT/FAS/per-protocol definition in the results differs from the SAP, or appears constructed after the data to exclude specific patients.
- **Model/covariate creep** — adjustment covariates, the analysis model, censoring rules, or test sidedness differ from the SAP in a direction that improves the result, undisclosed.
- **Timepoint shift** — the endpoint is the right variable but reported at a different timepoint than pre-specified (e.g., week 12 instead of pre-specified week 24).
- **SAP after the fact** — SAP/amendment version date is after database lock, unblinding, or an interim look, with the new specification yielding the favourable result.
- **One-sided switch** — a two-sided pre-specified test silently reported one-sided (or alpha changed) to reach significance.
- **Unplanned interim looks** — analyses performed "after reviewing emerging data" with no pre-specified spending function; or early stopping for benefit without a pre-specified boundary, and overestimation not acknowledged.
- **Abstract/body discrepancy** — effect size, CI, p-value, or the qualitative conclusion in the abstract does not match the corresponding result table.
- **Newly invented outcome** — an outcome reported that appears in no registry/protocol/SAP source and is not labelled post-hoc.
- **Vague pre-specification claim** — "all analyses were pre-specified" stated, but the SAP is not provided/accessible and the registry contradicts it.

## What to look for in the text (anchor phrases)

- Good: "The primary analysis followed the SAP version X.Y (dated DD-MM-YYYY, finalised prior to unblinding)." Then verify that date precedes database lock.
- Good: a deviations section — "The following analyses deviated from the SAP and the reasons were…" — and post-hoc analyses labelled "post hoc / exploratory / hypothesis-generating".
- Good: a CONSORT-style flow with randomised N reconciling to analysed N per outcome.
- Weak/flag: "Standard statistical methods were used" with no SAP reference and no statement of pre-specification.
- Weak/flag: confirmatory verbs ("demonstrated a significant benefit") attached to an analysis the SAP does not contain.
- Cross-check anchors: registry primary outcome (and its edit history) vs paper primary outcome; SAP version date vs database-lock date; randomised N vs analysed N; SAP testing hierarchy vs the order/claims of significance in the results; full outcome list in protocol/SAP vs outcomes actually tabulated.

## Quick decision tree
```
Comparing pre-specification to reported results.
  Can you obtain registry + protocol/SAP?
    NO  -> Flag: pre-specification not verifiable; downgrade confidence in confirmatory claims.
    YES -> For the PRIMARY endpoint:
             Same variable + timepoint + metric + population + model as SAP?
               NO, undisclosed   -> MAJOR (endpoint/population/model switch)
               NO, disclosed     -> MINOR/transparency note; check change date vs unblinding
               YES               -> continue
           Is every pre-specified outcome reported?
               NO  -> MAJOR (primary/key secondary) / MINOR (minor secondary) reporting bias
               YES -> continue
           Is each reported analysis labelled pre-specified vs post-hoc?
               NO  -> MAJOR if post-hoc drives the conclusion; else MINOR
               YES -> continue
           Is the testing hierarchy / multiplicity rule followed as written?
               NO  -> MAJOR (invalid significance claim)
               YES -> Do abstract numbers match the result tables?
                        NO  -> Flag discrepancy
                        YES -> Consistent. Pass.
  At every node, check SAP version date vs database-lock/unblinding date.
```

## Notes for the reviewer
- The strongest, least disputable findings are **cross-document mismatches**: registry vs paper, SAP vs methods, methods vs results, abstract vs tables. Lead with those and quote both sides.
- Pre-specification is about *timing and disclosure*, not about banning flexibility. Do not flag a well-labelled exploratory analysis as a defect; flag the unlabelled or mis-weighted one.
- When the SAP is not available, say so explicitly — an inability to verify pre-specification is itself a limitation that weakens confirmatory claims, and reviewers should request the SAP.
- Do not invent item numbers or attribute requirements to a standard you are unsure of; describe the requirement (pre-specify, disclose deviations, label post-hoc) accurately and anchor to the trial's own documents.
