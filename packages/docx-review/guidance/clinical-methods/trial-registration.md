---
id: trial-registration
category: clinical-methods
name: Trial Registration Consistency
applies_to: "Registered clinical trials"
---

# Trial Registration Consistency

Use this chapter whenever a report describes a clinical trial that is (or should be) prospectively registered, to verify that the registry record and the report agree on identifiers, primary outcomes, eligible population, and key dates — the most common and most defensible source of selective-reporting findings. Your job is a cross-document audit: open the registry entry, the protocol/SAP, and the manuscript/CSR side by side and reconcile them. Lead with discrepancies you can quote from both sources.

## Why registration matters (the standard)

Prospective registration of clinical trials is required by the ICMJE (as a condition of publication in member journals), the WHO (which maintains the WHO Trial Registration Data Set and the ICTRP), the Declaration of Helsinki, the FDA Amendments Act (FDAAA, for applicable U.S. trials on ClinicalTrials.gov), and the EU Clinical Trials Regulation (CTIS/EudraCT for EU trials). The purpose is to fix the primary outcome, population, and analysis intent *before* results are known, so that selective outcome reporting and outcome switching can be detected. Your review exists to perform that detection.

A registration is only useful if it was made **prospectively** (before enrolment of the first participant) and if the registered content matches what was actually done. Retrospective registration and silent post-hoc changes to the registry are themselves findings.

## Step 0 — Locate and validate the identifier(s)

- [ ] Is a trial registration number present in the report (abstract, methods, and/or a dedicated registration statement)? ICMJE expects it in the abstract.
- [ ] Is the **registry named** alongside the number (e.g., "ClinicalTrials.gov", "EudraCT", "ISRCTN", "ANZCTR", a WHO primary registry)?
- [ ] Does the identifier match the expected format for that registry?
  - ClinicalTrials.gov: `NCT` + 8 digits (e.g., NCT01234567)
  - EudraCT: `YYYY-NNNNNN-NN` (e.g., 2019-001234-12)
  - EU CTIS: an EU CT number `YYYY-NNNNNN-NN-NN`
  - ISRCTN: `ISRCTN` + 8 digits
  - WHO UTN (Universal Trial Number): `U` + 4-4-4-4 digits — a cross-registry identifier, not a registry of record on its own
- [ ] Does the identifier **resolve** to a real record, and does that record describe *this* trial (same intervention, sponsor, indication)? A well-formed but wrong/recycled number is a red flag.
- [ ] If multiple identifiers are given (e.g., NCT + EudraCT), do they describe the same trial and agree with each other?

Decision rule: A required, applicable trial with **no registration number at all** is a MAJOR finding (ICMJE non-compliance, potential FDAAA/EU-CTR violation). A number that does not resolve, or resolves to a different trial, is MAJOR until corrected.

## Step 1 — Prospective vs. retrospective registration

- [ ] Find the **registration date** (date first posted/registered) in the registry record.
- [ ] Find the **first-enrolment / study start date** (in the report and the registry).
- [ ] Compare: registration date should be **on or before** first enrolment.

Decision rule:
- Registered before first enrolment → prospective. Good.
- Registered after first enrolment but before primary completion → **retrospective registration**; MINOR-to-MAJOR depending on lag and whether results were already accruing. Must be disclosed; if the paper claims "prospectively registered," the false claim escalates it.
- Registered after primary completion / after results known → MAJOR (registration is decorative; selective reporting cannot be excluded).

Anchor phrase to check: a claim like "the trial was prospectively registered" that the registry dates contradict.

## Step 2 — Primary outcome consistency (the core check)

This is where outcome switching hides. Reconcile the **registered primary outcome** against the **reported primary outcome** on every dimension:

- [ ] **Identity** — same outcome construct? (e.g., registry says "overall survival"; paper's primary is "progression-free survival".)
- [ ] **Metric / definition** — same way of measuring it? (e.g., "mean change from baseline in HbA1c" vs. "proportion achieving HbA1c < 7%".)
- [ ] **Timepoint** — same assessment time? (e.g., registered at week 24; reported at week 12 or week 52.)
- [ ] **Number of primary outcomes** — same count? (Registry lists one primary; paper presents three "co-primary" outcomes, or vice versa.)
- [ ] **Direction / hierarchy** — was a registered *secondary* outcome promoted to primary, or a registered *primary* demoted to secondary / dropped entirely?
- [ ] **Analysis population / metric of effect** — does the contrast reported (HR, OR, RD, mean difference) match what was pre-specified, if specified?

Decision rules:
- Any change to a primary outcome's identity, definition, timepoint, or count that is **not disclosed** in the report → MAJOR (this is outcome switching, the canonical selective-reporting problem; see COMPare/OuTCoMES work and CONSORT item 6 on changes to outcomes).
- A change that **is** transparently disclosed with a reason and a date that predates unblinding/analysis → MINOR (still note it; assess whether the reason is credible).
- A change disclosed but with a reason that is vague ("for clarity") or post-hoc (after data review) → MAJOR.
- A registered primary outcome that simply **does not appear** in the results → MAJOR (silent dropping); demand it or an explanation.

Tip: Registries keep a **history of changes** (ClinicalTrials.gov "Study Record Versions" / archive; EudraCT/CTIS versioning). Check whether the registry primary outcome was itself **edited after enrolment started** — especially after the expected primary completion date. A registry edited late to match the paper is outcome switching laundered through the registry; it is MAJOR and highly anchorable (cite the version history dates).

## Step 3 — Population / eligibility consistency

- [ ] Do the **inclusion and exclusion criteria** in the report match the registry (age range, sex, disease stage/severity, key biomarkers, prior-therapy requirements)?
- [ ] Does the **target/registered enrolment** roughly match the **actual enrolled N**? Large unexplained shortfalls or overruns warrant a note (underpowering, or undisclosed expansion).
- [ ] Does the registered **number of arms / allocation** match the report (e.g., registry shows 3 arms; paper reports 2)? A missing arm is a red flag for a buried comparison.
- [ ] Does the registered **phase, masking, and allocation** (randomised/blinded) match the report?
- [ ] Does the **age range / key restriction** match? (e.g., registry "18–75"; paper enrolls and analyses patients up to 85.)

Decision rule: Material eligibility changes (a narrowed/widened population, a dropped arm, a changed allocation ratio) that are undisclosed → MAJOR. Minor wording differences with the same clinical meaning → not a finding.

## Step 4 — Dates and timeline coherence

- [ ] **Study start (first enrolment)** — consistent between report and registry?
- [ ] **Primary completion date** — consistent? Is it before the results were generated?
- [ ] **Recruitment period** in the paper falls within the registered enrolment window?
- [ ] For results: was the analysis/SAP **finalised before unblinding/database lock**? Cross-check the SAP version date against the database-lock date. An SAP dated *after* lock is a red flag for data-driven analysis choices.
- [ ] If results are posted on the registry (e.g., ClinicalTrials.gov results section, required under FDAAA), do the **registry results** agree with the publication on primary-outcome values and Ns?

Decision rule: Timelines that imply the protocol/SAP/registry was changed after results could be known → MAJOR if it affects a primary outcome or population. Inconsistent but immaterial dates → MINOR, request correction.

## Step 5 — Secondary outcomes and harms (lighter touch)

- [ ] Are the **secondary outcomes** in the paper drawn from the registered set, or do new, unregistered outcomes appear without being labelled exploratory/post-hoc?
- [ ] Are registered secondary outcomes **omitted** without explanation (selective reporting at the secondary level)?
- [ ] Are **harms / serious adverse events** reported consistent with the registry's safety outcomes and (if applicable) the registry results section?

Decision rule: Unregistered outcomes presented as if pre-specified → MAJOR if they carry a headline claim, otherwise MINOR (must be labelled exploratory). Wholesale silent omission of registered secondaries → MAJOR for selective reporting.

## Cross-document reconciliation table (fill this in)

Build this for every review; it makes findings concrete and anchorable:

| Attribute | Registry record | Protocol / SAP | Report (methods/results) | Match? |
|---|---|---|---|---|
| Registration number | | | | |
| Registry named | | n/a | | |
| Registration date | | n/a | | |
| First enrolment date | | | | |
| Primary outcome (identity) | | | | |
| Primary outcome metric/definition | | | | |
| Primary outcome timepoint | | | | |
| Number of primary outcomes | | | | |
| Eligibility (key criteria) | | | | |
| Number of arms / allocation | | | | |
| Target vs. actual N | | | | |
| Primary completion date | | | | |
| Effect measure / population | | | | |

Any row that does not match is a candidate finding. Quote both cells in your comment.

## Red flags to flag

Raise these as specific, anchorable findings. Quote the registry text and the contradicting report text, and cite the registry version/date where the change occurred.

- **No registration number** for an applicable trial — absent from abstract and methods (ICMJE/FDAAA/EU-CTR non-compliance).
- **Malformed or non-resolving identifier** — wrong format, or an NCT/EudraCT number that resolves to a different trial (or to nothing).
- **Registry not named** — a bare number with no registry, so it cannot be verified.
- **Retrospective registration presented as prospective** — registration date after first enrolment while the text claims "prospectively registered".
- **Primary endpoint in results differs from the registered/pre-specified endpoint** — different outcome, definition, metric, or timepoint, undisclosed (outcome switching).
- **Registered secondary promoted to primary** (or registered primary demoted/dropped) without a disclosed, pre-unblinding reason.
- **Registered primary outcome missing from the results** entirely (silent omission).
- **Registry edited after enrolment/primary completion to match the paper** — check the registry version history; late edits to the primary outcome are outcome switching laundered through the registry.
- **Change in number of primary outcomes** — single registered primary becomes "co-primary" set (or vice versa), altering the multiplicity story.
- **Population/eligibility mismatch** — registered inclusion/exclusion or age range differs from who was actually enrolled and analysed, undisclosed.
- **Dropped or hidden arm** — registry lists more arms than the report presents; a comparison appears to have been buried.
- **Allocation/masking/phase mismatch** — registry says double-blind/randomised but the report describes open-label/single-arm (or vice versa).
- **Target N vs. actual N gap** — large unexplained shortfall (underpowering risk) or overrun (undisclosed expansion).
- **SAP/protocol dated after database lock or unblinding** — analysis plan finalised once results could be known.
- **Registry results vs. publication discrepancy** — for trials with posted results, the primary-outcome value, CI, or analysed N differs from the paper.
- **Unregistered outcomes presented as pre-specified** — new endpoints carry headline claims without being labelled post-hoc/exploratory.
- **Abstract registration statement absent** while present (or different) in the body — internal inconsistency in the report itself.
- **Selective recruitment-window reporting** — recruitment dates in the paper fall outside the registered enrolment window.

## Severity guidance

**MAJOR (request major revision / question the conclusion):**
- Applicable trial with no registration number, or a non-resolving/wrong number.
- Undisclosed change to the primary outcome's identity, definition, timepoint, or count (outcome switching).
- Registered primary outcome silently dropped from the results.
- Registry record edited late (after enrolment/primary completion) to match the paper, especially the primary outcome.
- Registration after results were known, or a false claim of prospective registration.
- Undisclosed change to eligible population, number of arms, or allocation that affects interpretation.
- SAP finalised after unblinding/lock with a material effect on the reported primary result.

**MINOR (request clarification / revision):**
- Outcome/population change that **is** transparently disclosed with a credible, pre-unblinding reason and date.
- Retrospective registration with short lag, clearly disclosed, results not yet accrued.
- Immaterial date or wording inconsistencies between registry and report.
- Registration number present but missing from the abstract only.
- Unregistered secondary/exploratory outcomes that are correctly labelled as exploratory.

## What to look for in the text (anchor phrases)

- Good: "This trial was registered at ClinicalTrials.gov (NCT01234567) on [date], before enrolment of the first participant. The primary outcome was [X] at [timepoint], as registered."
- Good: an explicit disclosure: "The primary outcome was changed from [A] to [B] on [date], prior to database lock, because [reason]." (Then verify the date.)
- Weak/flag: "The trial was registered (NCT…)" with no date and no mention of prospectivity.
- Weak/flag: a primary outcome in the methods/results that you cannot find in the registry's primary-outcome field.
- Weak/flag: "The statistical analysis plan was finalised" with a date later than the database-lock/unblinding date.
- Cross-check anchors: registry primary-outcome field vs. paper primary outcome; registry **version history** dates vs. enrolment/primary-completion dates; registered N / arms vs. CONSORT flow diagram; SAP version date vs. database-lock date; registry results section vs. published primary-outcome estimate.

## Quick decision tree

```
Is the trial an applicable/registered clinical trial?
  NO  -> chapter not applicable
  YES -> Is a resolvable registration number + registry named present?
           NO  -> MAJOR: not (verifiably) registered
           YES -> Was registration prospective (before first enrolment)?
                    NO  -> retrospective: MINOR if disclosed, MAJOR if claimed prospective
                    YES -> Does the reported primary outcome match the registered one
                           (identity, definition, timepoint, count)?
                             NO  -> disclosed w/ credible pre-unblinding reason? MINOR : MAJOR
                             YES -> Does population / arms / allocation match?
                                      NO  -> material & undisclosed? MAJOR : MINOR
                                      YES -> Do dates/SAP timing exclude data-driven choices?
                                               NO  -> MAJOR (analysis post-results)
                                               YES -> Registry results == publication?
                                                        NO  -> MAJOR/MINOR by magnitude
                                                        YES -> Consistent. Pass.
  At every node also check the registry CHANGE HISTORY for late edits.
```

## Notes for the reviewer

- The strongest, least disputable findings are **cross-document mismatches**: registry vs. paper, registry version-history vs. enrolment dates, SAP date vs. lock date. Lead with those and quote both sides.
- Do not invent registry field names or item numbers; anchor to the actual field you read (e.g., the registry "Primary Outcome Measures" field) and the actual sentence in the report.
- Distinguish *transparency* failures (a change that was real but undisclosed) from *legitimacy* failures (a change made after results were known). The first is fixable by disclosure; the second usually cannot be remedied and undermines the primary result.
- When the registry record itself was changed, always cite the **version and date** of the change — that is the anchor that makes outcome switching undeniable.
