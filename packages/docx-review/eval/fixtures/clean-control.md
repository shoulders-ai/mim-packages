# A Randomised Controlled Trial of a Pharmacist-Led Medication Review on 30-Day Hospital Readmission in Older Adults

## Abstract

**Background.** Unplanned hospital readmissions in older adults are frequently associated with medication-related problems. We evaluated whether a structured pharmacist-led medication review delivered before discharge reduces 30-day all-cause readmission compared with usual care.

**Methods.** We conducted a parallel-group, two-arm, individually randomised controlled trial at three teaching hospitals. Adults aged 65 years or older admitted to general medical wards and taking five or more regular medications were eligible. Participants were randomised 1:1 to the intervention (pharmacist-led medication review plus usual care) or usual care alone, using computer-generated permuted blocks of variable size stratified by site, with allocation concealed via a central web service. Outcome assessors were blinded to allocation. The primary outcome was all-cause readmission within 30 days of discharge, analysed by intention to treat with a log-binomial regression model adjusted for the stratification factor. We pre-specified a single primary outcome to avoid multiplicity; secondary outcomes were reported with 95% confidence intervals and interpreted as exploratory.

**Results.** Between March 2022 and August 2023 we randomised 642 participants (321 per arm). Primary outcome data were available for 318 intervention and 316 usual-care participants. Readmission occurred in 58/318 (18.2%) intervention participants and 79/316 (25.0%) usual-care participants (adjusted risk ratio 0.73, 95% CI 0.54 to 0.99; risk difference -6.8 percentage points, 95% CI -13.1 to -0.5). No serious adverse events were attributed to the intervention.

**Conclusions.** A pre-discharge pharmacist-led medication review modestly reduced 30-day all-cause readmission in older adults taking multiple medications. The estimate is compatible with a clinically relevant benefit, though the upper confidence bound approaches the null.

**Trial registration.** ISRCTN registry, ISRCTN44120987, registered 14 January 2022 (prospective).

---

## Introduction

Older adults discharged from hospital are at high risk of unplanned readmission, and a substantial fraction of these returns are precipitated by potentially preventable medication-related problems, including adverse drug events, prescribing errors, and poor adherence after discharge. Polypharmacy compounds this risk: each additional regular medication increases the opportunity for interactions, duplication, and confusion at care transitions.

Pharmacist-led medication review has been proposed as a low-risk, scalable intervention to address these problems at the point of discharge. Existing trials have produced mixed results, in part because interventions have been heterogeneous, outcome definitions inconsistent, and several studies underpowered for clinical endpoints. We therefore designed an adequately powered trial with a single, unambiguous primary outcome to test whether a standardised pharmacist-led review reduces early readmission.

Our pre-specified hypothesis, fixed before recruitment and recorded in the published protocol, was that the intervention would reduce 30-day all-cause readmission relative to usual care. We report the trial in accordance with the CONSORT 2010 statement.

---

## Methods

### Trial design

This was a parallel-group, two-arm, individually randomised controlled trial with 1:1 allocation, conducted at three teaching hospitals in the United Kingdom. The protocol was approved by the National Research Ethics Service (reference 21/LO/0337) and was published before recruitment began. There were no changes to eligibility criteria, outcomes, or the analysis plan after the trial commenced.

### Participants

Eligible participants were adults aged 65 years or older, admitted to a general medical ward, expected to be discharged to a community setting, and taking five or more regular prescribed medications at admission. We excluded patients admitted for end-of-life care, those unable to provide informed consent and without a personal consultee, and patients enrolled in another interventional trial. All participants, or their consultees, provided written informed consent before randomisation.

### Interventions

Intervention-arm participants received a structured medication review conducted by a clinical pharmacist within 48 hours before planned discharge, in addition to usual care. The review followed a standardised template covering indication, dose appropriateness, drug-drug and drug-disease interactions, renal dosing, and deprescribing of medications without a current indication. The pharmacist produced a written plan, communicated changes to the discharging physician, and provided a structured counselling session to the patient. Usual-care participants received standard discharge processes, which at all sites included routine pharmacist dispensing checks but no structured review or counselling.

### Outcomes

The primary outcome was all-cause hospital readmission within 30 days of the index discharge, ascertained from regional administrative records that capture admissions across all hospitals in the catchment area. Secondary outcomes were the number of potentially inappropriate medications at discharge, 90-day all-cause readmission, 30-day all-cause mortality, and patient-reported medication adherence at 30 days. Secondary outcomes were pre-specified as exploratory and were not used to draw confirmatory conclusions.

### Sample size

We powered the trial on the primary outcome. Assuming a 25% readmission rate under usual care, we calculated that 580 participants (290 per arm) would provide 80% power at a two-sided alpha of 0.05 to detect an absolute reduction of 8 percentage points (to 17%), corresponding to a risk ratio of 0.68. To allow for up to 10% loss of primary-outcome data, we set a recruitment target of 644 participants.

### Randomisation

The allocation sequence was generated by an independent statistician using computer-generated permuted blocks of variable size (4 and 6), stratified by site. Allocation was concealed using a central, password-protected web randomisation service that released the assignment only after a participant's eligibility and consent had been confirmed and recorded. The ward staff who enrolled and consented participants had no access to the sequence and could not predict upcoming allocations.

### Blinding

Because the intervention involved direct patient counselling, participants and treating pharmacists could not be blinded. Outcome assessors and the trial statistician were blinded to allocation: the primary outcome was extracted from administrative records by staff with no knowledge of group assignment, and the statistician analysed the data under masked group labels until the primary analysis was finalised.

### Statistical methods

The primary analysis was by intention to treat, including all randomised participants with available primary-outcome data in the arm to which they were allocated. We estimated the adjusted risk ratio for 30-day readmission using log-binomial regression with site as a covariate, reflecting the stratified randomisation. The corresponding risk difference and its 95% confidence interval were estimated using a generalised linear model with an identity link and robust standard errors. We pre-specified that a confidence interval excluding a risk ratio of 1.0 would be interpreted as evidence of an effect, and we did not perform interim analyses.

Because there was a single primary outcome, no adjustment for multiplicity was required for the confirmatory analysis. Secondary outcomes are reported with point estimates and 95% confidence intervals and are explicitly interpreted as hypothesis-generating; we did not compute p-values for secondary outcomes and we did not claim statistical significance for any secondary comparison. Missing primary-outcome data were expected to be minimal because of administrative ascertainment; we conducted a pre-specified complete-case primary analysis and a sensitivity analysis under a worst-case assumption (missing intervention participants counted as readmitted, missing usual-care participants counted as not readmitted). Analyses were performed in R version 4.3.1.

---

## Results

### Participant flow and recruitment

Between March 2022 and August 2023 we screened 1,184 patients, of whom 642 were eligible, consented, and randomised: 321 to the intervention arm and 321 to usual care. In the intervention arm, 318 had primary-outcome data available (3 withdrew consent for record linkage); in the usual-care arm, 316 had primary-outcome data (5 withdrew consent for record linkage). Recruitment stopped when the target was reached; the trial was not stopped early for benefit or harm. The two arms were balanced at baseline (Table 1).

### Baseline characteristics

**Table 1. Baseline characteristics by arm.**

| Characteristic | Intervention (n = 321) | Usual care (n = 321) |
|---|---|---|
| Age, mean (SD), years | 78.4 (7.1) | 78.9 (6.8) |
| Female, n (%) | 169 (52.6) | 174 (54.2) |
| Regular medications, median (IQR) | 8 (6-10) | 8 (6-11) |
| Charlson comorbidity index, mean (SD) | 4.2 (1.9) | 4.3 (2.0) |
| Previous admission within 12 months, n (%) | 142 (44.2) | 138 (43.0) |

### Primary outcome

All-cause readmission within 30 days occurred in 58 of 318 (18.2%) intervention participants and 79 of 316 (25.0%) usual-care participants. The adjusted risk ratio was 0.73 (95% CI 0.54 to 0.99), and the adjusted risk difference was -6.8 percentage points (95% CI -13.1 to -0.5). The confidence interval for the risk ratio excludes 1.0, though its upper bound (0.99) is close to the null, indicating that the data are also compatible with a small effect. The pre-specified worst-case sensitivity analysis yielded a risk ratio of 0.78 (95% CI 0.58 to 1.04), consistent in direction with the primary analysis and indicating that the result is not driven by the small amount of missing data.

### Secondary outcomes

Secondary outcomes are summarised in Table 2 and are interpreted as exploratory. Point estimates favoured the intervention for potentially inappropriate medications at discharge and 90-day readmission, with confidence intervals that included no difference for the latter. We draw no confirmatory conclusions from these comparisons.

**Table 2. Secondary outcomes by arm (exploratory).**

| Outcome | Intervention | Usual care | Estimate (95% CI) |
|---|---|---|---|
| Potentially inappropriate meds at discharge, mean | 1.1 | 2.0 | -0.9 (-1.3 to -0.5) |
| 90-day readmission, n (%) | 121 (38.1) | 134 (42.4) | RR 0.90 (0.74 to 1.09) |
| 30-day mortality, n (%) | 11 (3.5) | 13 (4.1) | RR 0.84 (0.38 to 1.85) |
| Self-reported adherence (0-100), mean | 84 | 79 | 5 (1 to 9) |

### Harms

No serious adverse events were attributed to the intervention. Across both arms, 24 deaths occurred within 30 days (11 intervention, 13 usual care); none were judged related to the intervention by the blinded clinical events committee.

---

## Discussion

In this adequately powered, multi-site randomised trial, a structured pharmacist-led medication review delivered before discharge reduced 30-day all-cause readmission in older adults taking multiple medications. The adjusted risk ratio of 0.73 corresponds to roughly seven fewer readmissions per hundred patients, an effect that is clinically meaningful if it is real.

The principal limitation is precision: the upper bound of the confidence interval (a risk ratio of 0.99) lies close to the null, so the data remain compatible with only a small benefit, and a confirmatory conclusion should be drawn cautiously. We did not adjust for multiplicity in the primary analysis because the trial had a single pre-specified primary outcome; this design choice protects the interpretation of the headline result but means the secondary outcomes, which we report as exploratory, cannot support confirmatory claims. The intervention could not be blinded to patients or treating pharmacists, but the primary outcome was objective and ascertained by blinded assessors from administrative records, which limits the scope for ascertainment bias. Finally, the trial was conducted in teaching hospitals with established clinical pharmacy services, and the effect may differ in settings with different baseline staffing.

Strengths include prospective registration, a published protocol with no post-hoc changes, concealed allocation, blinded outcome ascertainment, an intention-to-treat analysis, and a pre-specified sensitivity analysis that addressed the small amount of missing data without changing the direction of the result.

The findings are consistent with the hypothesis that addressing medication-related problems at discharge can reduce early readmission, while underscoring that the magnitude of benefit in routine practice remains uncertain. A confirmatory trial powered to exclude small effects, or to estimate the effect on a composite of readmission and mortality, would help resolve the residual uncertainty.

---

## Conclusions

A pre-discharge pharmacist-led medication review modestly reduced 30-day all-cause readmission among older adults taking five or more medications. The benefit is consistent in direction across the primary and sensitivity analyses but imprecise at its upper bound, and confirmation in an independent trial is warranted before routine adoption.

---

## Declarations

**Funding.** This trial was funded by the National Institute for Health and Care Research (grant HSDR-19-114). The funder had no role in study design, data collection, analysis, interpretation, or the decision to submit for publication.

**Competing interests.** The authors declare no competing interests.

**Data availability.** De-identified participant data and the statistical analysis code are available from the corresponding author on reasonable request, subject to a data-sharing agreement.

**Ethics approval.** The trial was approved by the National Research Ethics Service (reference 21/LO/0337). All participants or their consultees provided written informed consent.

---

## References

1. Beard JR, Officer A, de Carvalho IA, et al. The World report on ageing and health: a policy framework for healthy ageing. *Lancet*. 2016;387(10033):2145-2154.

2. Forster AJ, Murff HJ, Peterson JF, Gandhi TK, Bates DW. The incidence and severity of adverse events affecting patients after discharge from the hospital. *Ann Intern Med*. 2003;138(3):161-167.

3. Masnoon N, Shakib S, Kalisch-Ellett L, Caughey GE. What is polypharmacy? A systematic review of definitions. *BMC Geriatr*. 2017;17(1):230.

4. Schulz KF, Altman DG, Moher D; CONSORT Group. CONSORT 2010 Statement: updated guidelines for reporting parallel group randomised trials. *BMJ*. 2010;340:c332.

5. Zou G. A modified Poisson regression approach to prospective studies with binary data. *Am J Epidemiol*. 2004;159(7):702-706.

6. Spinewine A, Schmader KE, Barber N, et al. Appropriate prescribing in elderly people: how well can it be measured and optimised? *Lancet*. 2007;370(9582):173-184.

7. Ravn-Nielsen LV, Duckert ML, Lund ML, et al. Effect of an in-hospital multifaceted clinical pharmacist intervention on the risk of readmission: a randomized clinical trial. *JAMA Intern Med*. 2018;178(3):375-382.

8. R Core Team. *R: A Language and Environment for Statistical Computing*. Vienna, Austria: R Foundation for Statistical Computing; 2023.
