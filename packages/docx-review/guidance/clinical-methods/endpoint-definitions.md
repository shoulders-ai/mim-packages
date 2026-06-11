---
id: endpoint-definitions
category: clinical-methods
name: Endpoint Definitions & Switching
applies_to: "Clinical trials"
---

# Endpoint Definitions & Switching

Use this chapter whenever a clinical-trial report names a primary, secondary, composite, or surrogate endpoint — your job is to confirm each endpoint is *operationally defined* (what is measured, on whom, when, and how it is derived), that the *primary* endpoint and its analysis are clearly distinguished from secondary/exploratory ones, and above all that the endpoint reported in the paper is the same endpoint that was pre-specified in the protocol, statistical analysis plan (SAP), and public registry. Outcome switching — promoting, demoting, redefining, re-timing, or silently dropping endpoints relative to what was pre-specified — is one of the highest-yield, most defensible findings a reviewer can raise, because it is verifiable against fixed external documents.

This chapter is about *what the endpoints are and whether they were switched*. For how the treatment-effect question (population, intercurrent-event handling, summary measure) is framed around an endpoint, see the **Estimands & Intercurrent Events (ICH E9 R1)** chapter; for outcome-reporting completeness in the trial flow, see **CONSORT 2010** item 7 (outcomes) and item 17 (pre-specified vs exploratory).

## Core principle: an endpoint is not a definition until you can compute it

A reportable endpoint definition must let an independent statistician reproduce the value for a single patient. Anchor every endpoint to these components:

1. **The measurement** — the specific instrument, scale, assay, or event (e.g., "HbA1c by central lab", "investigator-assessed PFS per RECIST 1.1", "PHQ-9 total score").
2. **The metric / how it is derived** — change from baseline, percent change, time-to-event, responder yes/no, AUC, slope, last value, etc. ("HbA1c" is not an endpoint; "change from baseline in HbA1c" is.)
3. **The timepoint or window** — exact visit/time (week 24; 90 days post-randomisation) and the analysis window/visit-mapping rules.
4. **The analysis population** — which set the endpoint is summarised on (cross-check with CONSORT numbers analysed and the estimand population attribute).
5. **The direction and threshold** — what counts as improvement; for responder/categorical endpoints, the exact cut-off (e.g., "≥50% reduction in seizure frequency").

### Checklist — is each endpoint defined?
- [ ] Is there an explicit, labelled list of primary and secondary endpoints (not endpoints scattered through prose)?
- [ ] For the **primary** endpoint, are all five components above present and unambiguous?
- [ ] Is the **metric/derivation** stated (change vs absolute vs percent; time-to-event vs proportion)?
- [ ] Is the **timepoint/window** fixed, with visit-mapping rules for off-schedule assessments?
- [ ] For responder/categorical endpoints, is the **threshold** pre-specified (and not chosen post hoc to maximise effect)?
- [ ] Are **assessment method and assessor** stated (central vs local, blinded vs unblinded adjudication)?
- [ ] Is exactly **one** primary endpoint (or a clearly justified, multiplicity-controlled set) designated — not several "co-primary"/"key" endpoints used interchangeably?

## Primary vs secondary vs exploratory — the hierarchy must be explicit

- [ ] Is a single primary endpoint (or pre-specified co-primary set with stated multiplicity handling) clearly identified?
- [ ] Is the **testing hierarchy / alpha allocation** stated for secondary endpoints (fixed-sequence, gatekeeping, Hochberg, etc.)? Without it, every "significant" secondary is uncontrolled.
- [ ] Are exploratory/post-hoc analyses **labelled as such** and kept out of confirmatory claims (CONSORT item 17)?
- [ ] Does the **abstract/conclusion** lead with the primary endpoint result, not a secondary or subgroup that happened to be positive?

**Decision rule:** If the trial's headline claim rests on a secondary or exploratory endpoint while the primary endpoint was null or not clearly reported, treat this as a major finding regardless of statistical significance.

## Composite endpoints

A composite combines multiple component events into one (e.g., MACE = CV death + MI + stroke; or "death or hospitalisation for heart failure"). Composites are legitimate but are a common site of inflated or misleading effects.

### Checklist — composites
- [ ] Are **all components listed**, with each component's own definition and ascertainment?
- [ ] Is the **counting rule** stated — first event vs all events; how ties/same-day events are handled; whether recurrent events count?
- [ ] Are component results **reported separately**, not just the aggregate? (A composite driven entirely by its softest, most frequent component is a known trap.)
- [ ] Are components of **comparable clinical importance and frequency**? (Combining death with a soft, common, subjective component lets the soft component dominate while the headline implies a mortality benefit.)
- [ ] Is the **direction consistent** across components (no component trending the wrong way that is masked by the aggregate)?
- [ ] Was the composite (and its components) **pre-specified**, or assembled/altered after seeing the data?

### Decision rules — composites
- If the composite is significant but the **hard/serious components individually are not**, the conclusion must be framed around the composite, not around the serious component. Flag any text implying a mortality or hard-outcome benefit that the data do not support.
- If a **component was added, removed, or redefined** versus the registry/protocol, treat as outcome switching (see below).
- If **recurrent vs first-event** counting differs between protocol and paper, or is unstated, flag — it changes both the estimate and the analysis method.

## Surrogate endpoints

A surrogate is a biomarker or intermediate measure used in place of a clinical outcome (e.g., HbA1c for diabetes complications, LDL for CV events, tumour response/PFS for overall survival, viral load for clinical progression).

### Checklist — surrogates
- [ ] Is the endpoint explicitly acknowledged as a **surrogate** for a clinical outcome, not presented as the clinical benefit itself?
- [ ] Is there a **stated basis for validity** (regulatory acceptance, prior trial-level meta-analytic validation), or at least an acknowledgement that the surrogate is unvalidated for this context/population?
- [ ] Does the **interpretation/conclusion stay within the surrogate** (e.g., "improved PFS") rather than asserting an unmeasured clinical benefit ("prolongs life", "prevents complications")?
- [ ] For accelerated/conditional-approval-style claims, is the **confirmatory clinical outcome** named or planned?

**Decision rule:** Surrogate endpoints are acceptable *as surrogates*. The flaggable error is interpretive over-reach — claiming the patient-relevant outcome when only the surrogate was measured. Severity scales with how strongly the claim outruns the data.

## Patient-reported & assessor-dependent endpoints (extra scrutiny)
- [ ] For PROs: is the **instrument validated**, the **scoring/handling of missing items** defined, and the **minimal clinically important difference (MCID)** pre-specified rather than chosen post hoc?
- [ ] For subjective/clinical-judgement endpoints: is assessment **blinded or independently adjudicated**? Open-label trials with subjective primary endpoints are especially vulnerable to bias — flag if blinding/adjudication is absent.
- [ ] Is the **direction of better** (higher vs lower score) stated for each scale?

## Detecting outcome switching (the core integrity check)

Outcome switching = any discrepancy between the endpoints (and their definitions/timepoints/analysis) as **pre-specified** and as **reported**, without transparent, dated, justified disclosure. Your evidence comes from comparing fixed documents:

- **Registry entry** (ClinicalTrials.gov / EudraCT-CTIS / ISRCTN / WHO ICTRP) — including its version history, which records when outcomes were edited.
- **Protocol** and its amendments (with dates).
- **Statistical analysis plan (SAP)** and its version date relative to database lock / unblinding.
- The **manuscript / clinical study report** methods and results.

### What "switching" looks like — check each
- [ ] **Promotion**: a pre-specified secondary endpoint is reported as primary.
- [ ] **Demotion**: the pre-specified primary endpoint is reported as a secondary, or buried.
- [ ] **Omission**: a pre-specified (especially primary) endpoint is not reported at all.
- [ ] **Addition**: a new endpoint not pre-specified is introduced and reported as if confirmatory.
- [ ] **Redefinition**: same endpoint name, but changed metric (absolute→percent change), threshold (responder cut-off moved), components (composite altered), or analysis population.
- [ ] **Re-timing**: the analysis timepoint/window differs from pre-specification (e.g., registered at 12 months, reported at 6 months where the effect is larger).
- [ ] **Re-analysis**: the planned statistical method/test changed in a way that affects the result, without disclosure.
- [ ] **Registry timing**: outcomes were **registered or edited after enrolment began** (or after results would be known) — prospective registration is the expectation; retrospective edits are a red flag.

### Decision rules — switching
- A discrepancy that is **disclosed, dated, and justified** (e.g., a protocol amendment before unblinding, with reasons, reflected in the registry history) is acceptable to note as a limitation, not necessarily a fault — but confirm the change predates unblinding/analysis.
- A discrepancy that is **undisclosed** is always flaggable. Lead with the exact registered/protocol wording vs the paper's wording.
- The **most damaging pattern**: the change moves the result from null to positive, or makes the headline claim possible. Always check the *direction* of the benefit conferred by the switch and state it.

## Cross-document anchoring (how to make the finding undeniable)
- Quote the **registered primary outcome** verbatim, then the **paper's primary outcome** verbatim, side by side.
- Cite the **registry version/edit date** relative to the **enrolment start** and **completion** dates.
- Compare **protocol/SAP version date** to the **database-lock / unblinding date** — a SAP finalised after unblinding cannot establish pre-specification.
- Cross-check the **CONSORT numbers analysed** against the endpoint's stated analysis population (a switched population is also an endpoint problem).
- When the registry/protocol is not accessible, state that the endpoint's pre-specification **could not be verified** and request the registry ID and SAP — do not assume good or bad faith.

## Severity guidance

**MAJOR (request major revision / question the conclusion):**
- Pre-specified **primary endpoint changed, omitted, demoted, or redefined** without disclosure, especially where the switch enables the positive conclusion.
- Headline/abstract claim rests on a **secondary, exploratory, or post-hoc endpoint** while the primary was null or unreported.
- **Composite presented to imply a hard-outcome (e.g., mortality) benefit** that is driven by a soft component with no individual significance.
- **Surrogate endpoint reported as if it were the clinical outcome** (claims of survival/complication prevention from a biomarker alone).
- **Responder threshold / analysis timepoint chosen post hoc** to maximise the effect, with no pre-specification.
- Trial **registered or outcomes edited after enrolment/unblinding** with material endpoint differences.

**MINOR (request clarification / revision):**
- Endpoint definition incomplete (metric, timepoint, or threshold implied but not explicit) yet reconstructable.
- Secondary endpoint **multiplicity not addressed** but no confirmatory claim made on it.
- Composite components not reported individually, though the composite is pre-specified and clinically coherent.
- A pre-specified change is real and benign but **disclosure is buried** rather than clearly stated.
- Surrogate used appropriately but its **validation status not discussed**.

## Red flags to flag

Raise these as specific, anchorable findings (quote the offending text and the contradicting source):

- **Primary endpoint in the paper differs from the registered/pre-specified primary endpoint** — promotion of a secondary, demotion of the primary, or a silently changed definition (cross-check registry, protocol, SAP).
- **Pre-specified primary endpoint not reported at all** — listed in the registry/protocol but absent from results.
- **Endpoint re-timed** — analysis timepoint differs from the registered timepoint (e.g., effect shown at the window where it is largest).
- **Responder threshold or cut-off appears chosen post hoc** — e.g., "≥30% improvement" with no pre-specification, where a different threshold would null the result.
- **Headline conclusion built on a secondary, subgroup, or exploratory endpoint** while the primary was non-significant or unmentioned.
- **Composite driven by its softest/most frequent component** — aggregate significant, hard components individually not, with text implying a serious-outcome benefit.
- **Composite components changed** versus registry/protocol — a component added, removed, or redefined.
- **Surrogate over-interpreted** — biomarker/intermediate endpoint (PFS, response rate, LDL, HbA1c, viral load) described as a patient-relevant clinical benefit (survival, complications prevented).
- **Endpoint not operationally defined** — named (e.g., "improvement in symptoms") but no metric, timepoint, threshold, or instrument given; not reproducible.
- **"Co-primary" / multiple "key" endpoints used interchangeably** with no designated single primary and no multiplicity control — lets the author select the winner.
- **No multiplicity / alpha-control plan for secondary endpoints**, yet secondary "significant" results are claimed.
- **Retrospective registration or post-enrolment outcome edits** — registry version history shows outcomes added/changed after enrolment started.
- **Undisclosed change of analysis method** for an endpoint (e.g., log-rank planned, Cox with covariates reported, or test changed) affecting the result.
- **Analysis population for the endpoint differs from the pre-specified set** (ties into "ITT claimed but per-protocol denominators used" — see Estimands chapter).
- **Abstract overstates the endpoint** — abstract names a benefit the body shows only on a different, softer, or non-primary endpoint.
- **Registry ID / protocol / SAP not provided**, making pre-specification unverifiable — request them and note the gap.

## What to look for in the text (anchor phrases)
- Good: a labelled "Endpoints" or "Outcomes" section with a single primary endpoint fully defined (measurement, metric, timepoint, population, threshold) and a stated testing hierarchy.
- Good: "The primary endpoint, as registered (NCT########), was [verbatim], assessed at [timepoint] in the [population]."
- Good: composite with all components listed, counting rule stated, and components reported individually.
- Good: explicit disclosure — "The primary endpoint was changed from X to Y by protocol amendment dated [pre-unblinding date] because [reason]; the registry was updated accordingly."
- Weak/flag: endpoints only described in prose, no hierarchy, no multiplicity statement.
- Weak/flag: "the primary endpoint was met" with the endpoint not matching the registry, or with no registry citation.
- Weak/flag: a composite reported only in aggregate; a surrogate described in clinical-outcome language.
- Cross-check anchors: registry primary outcome + edit history vs paper; protocol/SAP date vs unblinding/database-lock date; CONSORT numbers analysed vs endpoint population.

## Quick decision tree
```
Is each endpoint operationally defined (measurement, metric, timepoint, population, threshold)?
  NO  -> MINOR (reconstructable) / MAJOR (primary not reproducible)
  YES -> Is the primary endpoint clearly singular with multiplicity control for secondaries?
           NO  -> MINOR/MAJOR (headline rests on uncontrolled secondary?)
           YES -> Does paper's primary endpoint == registered/protocol/SAP primary?
                    NO, undisclosed  -> MAJOR: outcome switching
                    NO, disclosed pre-unblinding + justified -> note as limitation
                    YES -> Composite? -> components listed + reported individually + hard
                                          components support the claim?  NO -> MAJOR
                        -> Surrogate? -> interpretation stays within the surrogate?
                                          NO -> MAJOR (over-interpretation)
                        -> Otherwise -> Aligned. Pass.
  At every node also check: timepoint, threshold, and analysis population match pre-specification.
```

## Notes for the reviewer
- The strongest, least disputable findings are **cross-document mismatches**: registry (with its edit history) vs paper, protocol/SAP vs methods, methods vs results. Lead with those and quote verbatim.
- Do not invent registry IDs, item numbers, or amendment dates. If you cannot verify pre-specification, say so explicitly and request the documents rather than asserting switching.
- Distinguish a *legitimate, disclosed, pre-unblinding* change from *outcome switching*. The fault is concealment and post-hoc optimisation, not change per se.
- Keep endpoint-definition critique separate from estimand critique: this chapter asks "what is the endpoint and was it switched?"; the Estimands chapter asks "what treatment-effect question is built around it and does the analysis estimate it?"
