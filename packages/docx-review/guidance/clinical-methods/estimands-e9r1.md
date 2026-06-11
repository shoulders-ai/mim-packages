---
id: estimands-e9r1
category: clinical-methods
name: Estimands & Intercurrent Events (ICH E9 R1)
applies_to: "Any trial reporting inferential outcomes"
---

# Estimands & Intercurrent Events (ICH E9 R1)

Use this chapter whenever a trial reports an inferential treatment-effect estimate (any primary or key secondary efficacy comparison, superiority/non-inferiority/equivalence). Your job is to check that the question the trial set out to answer (the **estimand**) is stated precisely, that **intercurrent events** are handled by a named strategy, and that the **analysis actually estimates that estimand**. ICH E9(R1) is an addendum to ICH E9 that defines a structured framework for this; treat its language as the standard the report should align with.

## What an estimand is (the precise treatment-effect question)

An estimand is the description of the treatment effect that the trial is designed to estimate. It is NOT the analysis method and NOT the endpoint alone. Per ICH E9(R1), a fully specified estimand has **five attributes**. Every inferential estimand in the report should let you fill in all five:

1. **Treatment (condition of interest)** — the intervention(s) being compared, including comparator/control, and the treatment regimen (dose, duration, permitted background/concomitant therapy, rescue rules).
2. **Population** — the patients targeted by the scientific question, defined by inclusion/exclusion (the *targeted* population, which may differ from the analysis set actually used).
3. **Variable (endpoint)** — the outcome measured per patient (e.g., change from baseline in HbA1c at week 24; time to first MACE; responder yes/no).
4. **Population-level summary** — the measure used to compare treatments (e.g., difference in means, odds ratio, hazard ratio, risk difference, restricted mean survival time).
5. **Intercurrent event (ICE) handling** — for each anticipated ICE, the strategy used to account for it (see five strategies below). This is the attribute most often missing or mishandled.

### Checklist — estimand specification
- [ ] Is at least one estimand stated for the primary objective, in words, with all five attributes identifiable?
- [ ] Treatment: is the comparator and the regimen (incl. rescue/concomitant meds) defined, not just the drug name?
- [ ] Population: is the *targeted* population stated, distinct from the analysis set?
- [ ] Variable: is the endpoint, timepoint, and direction unambiguous?
- [ ] Population-level summary: is the contrast measure named (mean diff / OR / HR / RD / RMST)?
- [ ] ICE handling: is a strategy named **for each anticipated ICE type** (not just dropout)?
- [ ] Is the estimand the same one across protocol/SAP, methods, and results (no silent substitution)?

## Intercurrent events (ICEs) — what they are

An ICE is an event occurring *after* treatment initiation that affects either the interpretation or the existence of the outcome measurement. ICEs are NOT the same as missing data — they are events with clinical meaning; missing data is a separate downstream problem. Common ICEs in clinical trials:

- Treatment discontinuation (for adverse events, lack of efficacy, or other)
- Use of rescue / prohibited concomitant medication
- Treatment switching / crossover to the other arm
- Death (when the variable is not survival itself)
- Major protocol deviations affecting the outcome
- Surgery or procedure that alters the measured variable

Anchor your check: the report should *enumerate the anticipated ICEs* and assign a strategy to each. "We used a mixed model for repeated measures" is an analysis, not an ICE strategy.

## The five intercurrent-event strategies (ICH E9 R1)

For each ICE, exactly one of these five strategies should be declared. Learn the wording so you can match it to what the analysis actually did.

| Strategy | The question it answers | What the analysis does | Typical clue words |
|---|---|---|---|
| **Treatment policy** | Effect of being *assigned* the regimen, regardless of what happens after (closest to classic ITT) | Use the outcome value regardless of the ICE; keep following patients after discontinuation/switch | "regardless of", "irrespective of adherence", "as randomised" |
| **Hypothetical** | Effect *if* the ICE had not occurred (e.g., if no rescue had been available) | Model/impute the outcome under the counterfactual scenario | "had they not...", "in the absence of rescue", "if discontinuation had not occurred" |
| **Composite** | Treat the ICE itself as part of the outcome (failure) | Define a responder/failure variable where the ICE = unfavourable outcome | "non-responder imputation", "ICE counted as failure", "composite endpoint" |
| **While on treatment** | Effect only during the period the patient is on treatment | Use outcome measured up to the ICE (e.g., last on-treatment value, or time on treatment) | "while on treatment", "on-treatment period", "until discontinuation" |
| **Principal stratum** | Effect in the subpopulation who would (not) experience the ICE under either assignment | Estimate effect within a latent principal stratum (e.g., adherers) | "principal stratum", "compliers", "patients who would tolerate" |

### Decision rules — strategy ↔ analysis alignment
- **Treatment policy → data after the ICE must be collected and used.** If patients who discontinued/switched were not followed, or their post-ICE data were discarded, a treatment-policy estimand cannot be estimated. FLAG.
- **Hypothetical → there must be an explicit counterfactual and an imputation/modelling assumption** (e.g., MMRM that implicitly assumes outcomes as if on treatment, or multiple imputation under a stated assumption). A bare "MMRM on observed data" is usually a hypothetical estimand even when the report claims "ITT" — say so.
- **Composite → the ICE must be encoded in the variable itself** (responder definition). Check the responder/failure rule actually counts the ICE as failure.
- **While on treatment → the timepoint of the variable changes** (it is no longer "value at week 24" for everyone). Confirm the summary respects variable time on treatment.
- **Principal stratum → requires strong, stated identifying assumptions** and is rarely the primary estimand; treat unjustified use as a concern.

## Estimand–analysis alignment (the core review task)

The single most important check: does the **analysis estimate the stated estimand**? Mismatches are the dominant error and are anchorable.

### Alignment checklist
- [ ] Does the analysis set match the **targeted population** (and is the chosen "ITT/mITT/PP" set consistent with the population attribute)?
- [ ] Does the handling of each ICE in the analysis match the **named strategy** for that ICE?
- [ ] Does the model's treatment of post-ICE / missing data match the strategy (e.g., treatment policy needs post-ICE data; hypothetical needs a stated missingness assumption like MAR)?
- [ ] Is the reported contrast the **population-level summary** named in the estimand (not a different measure, e.g., estimand says risk difference but results report odds ratio)?
- [ ] Are **sensitivity analyses** present that probe the main estimand's assumptions (e.g., tipping-point / delta-adjusted MI for a hypothetical estimand)?
- [ ] Are **supplementary estimands** (different ICE strategies) clearly labelled as such and not used to swap the primary conclusion?

### "ITT" claims — read them critically
The label "intention-to-treat" is necessary but no longer sufficient. ITT primarily addresses the *population* attribute (analyse as randomised, all randomised). It does NOT by itself specify ICE handling. A report can say "ITT" and still apply a hypothetical strategy (by discarding post-discontinuation data) — which is fine if stated, but the report must say which estimand it targets. Do not accept "ITT analysis" as a complete description of the estimand.

## Missing data vs. intercurrent events
- ICEs are addressed by **strategy** (the five above), chosen *before* thinking about missing data.
- After the strategy is set, some data may still be **missing** (e.g., a patient under treatment-policy is lost to follow-up). Missing data is handled by an estimation method (MMRM, multiple imputation, etc.) under a stated assumption (MAR, MNAR).
- FLAG when a report conflates the two — e.g., calls dropout "missing data" and applies LOCF without naming an ICE strategy. The choice of imputation silently fixes the estimand, often a hypothetical one, without saying so.

## Non-inferiority / equivalence trials — extra rigor
- For NI/equivalence, a **treatment-policy** estimand can bias toward "no difference" (non-adherence dilutes effects, making arms look similar). Both ITT and per-protocol estimands are typically expected; check both are reported and concordant.
- FLAG if NI is claimed solely on a treatment-policy/ITT analysis with substantial non-adherence and no per-protocol corroboration.

## Severity guidance

**MAJOR (request major revision / question the conclusion):**
- No estimand stated and ICE handling cannot be reconstructed for the primary endpoint.
- Analysis does not estimate the stated estimand (e.g., treatment-policy declared but post-ICE data discarded; estimand summary differs from reported contrast).
- Primary endpoint or population in the results differs from the registered/pre-specified one without disclosure.
- ICE handling changed after unblinding/data review with no audit trail and a material effect on the result.
- "ITT" claimed but per-protocol denominators/exclusions actually used for the primary analysis.

**MINOR (request clarification / revision):**
- All five attributes present but ICE strategy named only generically ("appropriate methods").
- Sensitivity analyses absent but main assumptions plausible and stated.
- Supplementary estimands underlabelled but not used to change the primary claim.
- Population-level summary defensible but not explicitly named.

## Red flags to flag

Raise these as specific, anchorable findings (quote the offending text and the contradicting text):

- **No estimand framework at all** for an inferential outcome — endpoint and analysis given, but the treatment-effect *question* (ICE handling, population-level summary) never stated.
- **ICE strategy missing** — discontinuation, rescue medication, or treatment switching occurs in the trial but no strategy is named for it.
- **Strategy/analysis mismatch** — e.g., "treatment policy / regardless of adherence" stated, but patients who discontinued were not followed and their data excluded (cannot be treatment policy).
- **Hidden hypothetical estimand** — "ITT" claimed while all post-discontinuation data are dropped and MMRM run on remaining data, with the counterfactual never acknowledged.
- **ITT claimed but per-protocol denominators used** — randomised N stated, but the primary analysis silently excludes non-adherers / protocol deviators (check Ns: analysed < randomised without a treatment-policy/missing-data justification).
- **Endpoint switching** — primary endpoint in the results/abstract differs from the registered/pre-specified primary endpoint (cross-check ClinicalTrials.gov/EudraCT/registry entry, protocol, and SAP). A former secondary promoted to primary, or a changed timepoint/definition, with no disclosure.
- **Population switching** — the targeted population in the methods differs from who was actually analysed (e.g., "all randomised" claimed, full analysis set smaller, exclusions unexplained).
- **Summary measure swap** — estimand names one contrast (e.g., risk difference) but results report another (e.g., odds ratio), changing interpretation/magnitude.
- **LOCF / single imputation used as if it were a strategy** — no ICE strategy named; LOCF quietly imposes an unstated (and usually indefensible) assumption.
- **Composite estimand claimed but ICE not encoded** — "non-responder imputation" stated but the responder definition does not actually count the ICE as failure.
- **Principal stratum without identifying assumptions** — "effect in adherers/compliers" reported as if a per-protocol subset, with no acknowledgement of the latent-stratum assumptions.
- **Sensitivity analyses that change the estimand rather than stress its assumptions** — a different ICE strategy presented as "sensitivity," used to rescue the primary conclusion.
- **Post-hoc estimand change after unblinding** — SAP amended after database lock / interim look, with the new estimand giving the favourable result and no clear timeline.
- **Concomitant/rescue medication ignored** — rescue therapy allowed by protocol but not addressed in any estimand (silently makes the estimate a treatment-policy effect without saying so).
- **Abstract overstates** — abstract states an unqualified treatment effect while the body shows the estimate depends on a specific (often hypothetical) ICE strategy.

## What to look for in the text (anchor phrases)
- Good: an explicit "Estimand:" subsection or table listing treatment, population, variable, summary, and ICE handling per ICE.
- Good: "Intercurrent events were handled using a [treatment policy / hypothetical / composite / while-on-treatment / principal stratum] strategy."
- Weak/flag: "The primary analysis was performed on the ITT population using MMRM" with no ICE strategy named.
- Weak/flag: "Missing data were imputed using LOCF" as the only statement about post-baseline events.
- Cross-check anchors: registry primary outcome vs. paper primary outcome; protocol/SAP version date vs. database-lock date; randomised N vs. analysed N in the CONSORT flow diagram.

## Quick decision tree
```
Inferential effect reported?
  NO  -> chapter not applicable
  YES -> Is an estimand (5 attributes) stated for it?
           NO  -> MAJOR: estimand not specified
           YES -> Is an ICE strategy named for each anticipated ICE?
                    NO  -> MAJOR/MINOR depending on whether ICEs occurred
                    YES -> Does the analysis match the named strategy?
                             NO  -> MAJOR: estimand-analysis mismatch
                             YES -> Does reported summary = estimand summary?
                                      NO  -> MAJOR: summary swap
                                      YES -> Are sensitivity analyses present?
                                               NO  -> MINOR
                                               YES -> Aligned. Pass.
  At every node also cross-check: registered vs. reported endpoint/population.
```

## Notes for the reviewer
- E9(R1) is a *framework*, not a checklist of numbered items — do not invent item numbers. Anchor findings to the named attribute/strategy and to specific text.
- The strongest, least disputable findings are **cross-document mismatches**: registry vs. paper, protocol/SAP vs. methods, methods vs. results. Lead with those.
- When in doubt about which strategy is "correct," focus the critique on *transparency and alignment* (is the estimand stated, and does the analysis estimate it?) rather than prescribing a strategy.
