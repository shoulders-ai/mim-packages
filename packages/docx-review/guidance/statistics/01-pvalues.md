---
id: 01-pvalues
category: statistics
name: P-Value Usage
applies_to: "Statistical methods and inference"
---

# P-Value Usage Guidance for AI-Assisted Statistical Review

## 1. CORE DEFINITIONS & CONCEPTS

### Definition of P-Value
**Exact Definition**: The probability of observing the sample data, or more extreme data, assuming the null hypothesis is true.

**Critical Understanding**:
- P-values are statements about the **probability of data**, NOT about the probability of hypotheses or theories
- P-values describe the probability of observing data as extreme or more extreme, not a single point
- The "or more extreme" component creates an interval (tail of distribution) for which probability can be calculated

### Null Hypothesis vs Null Model
- **Null Hypothesis (H₀)**: A point prediction that the mean difference in the population is exactly 0 (or some specified value)
- **Null Model**: A distribution of expected data patterns when H₀ is true, accounting for random variation in sampling
- The null model is centered on the null hypothesis value but includes expected variation based on sample size and standard deviation

### Statistical Significance vs Practical Significance
- **Statistical Significance**: Whether an observed effect can be distinguished from random noise
- **Practical Significance**: Whether the size of the effect has worthwhile real-world consequences
- These are orthogonal concepts - a statistically significant effect is NOT necessarily practically important

### Two Philosophical Frameworks

**Fisherian Approach (Significance Testing)**:
- P-value as a continuous measure of compatibility between observed data and null hypothesis
- "A rational and well-defined measure of reluctance to the acceptance of the hypotheses they test"
- Lower p-value = greater reluctance to accept null hypothesis
- Only specifies H₀, not H₁ (alternative hypothesis)
- P-value describes incompatibility with a single hypothesis

**Neyman-Pearson Approach (Statistical Hypothesis Testing)**:
- Specifies both H₀ and H₁
- Goal: Guide researcher behavior/decisions about which hypothesis to act upon
- Binary decision: p < α or p > α
- The exact value of p below α doesn't matter (p=0.006 and p=0.000001 lead to same decision)
- Making a scientific claim is considered an "act" or "decision"
- Claims serve as auxiliary hypotheses for future research

## 2. P-VALUE DISTRIBUTIONS & EXPECTATIONS

### When Null Hypothesis is True (No Effect)
- P-values are **uniformly distributed** (for continuous test statistics)
- Every p-value between 0 and 1 is equally likely
- 5% of p-values fall below 0.05 when α = 0.05
- 1% of p-values fall below 0.01 when α = 0.01
- This uniform distribution is ONLY for continuous distributions (t-test), not discrete (chi-squared)

### When Alternative Hypothesis is True (True Effect Exists)
- P-value distribution is **right-skewed** (more small p-values)
- Shape determined by **statistical power**
- Higher power → steeper distribution → more very small p-values
- Higher power → most p-values fall well below 0.01, not just below 0.05

### Sample Size Effects on Null Model
- Larger sample size → narrower distribution around null value
- Standard Error = √(σ₁²/n₁ + σ₂²/n₂)
- With n=50 per group (SD=1): 95% of observations fall between ±0.392
- With n=5000 per group (SD=1): 95% of observations fall between ±0.0392
- Critical values move closer to zero as sample size increases

## 3. LINDLEY'S PARADOX

### Key Phenomenon
With very high statistical power (e.g., 99%), p-values just below 0.05 (e.g., p=0.04) can be MORE LIKELY when H₀ is true than when H₁ is true.

### Why This Matters
- A p-value can be statistically significant (p<0.05) but provide evidence FOR the null hypothesis
- Different statistical philosophies reach different conclusions in this scenario
- Neyman-Pearson: Can make claim with 5% error rate
- Likelihood/Bayesian: Data favors null hypothesis over alternative

### Practical Implication
- P-values just below 0.05 (between 0.04-0.05) provide weak support at best for alternative hypothesis
- At best, p-values between 0.04-0.05 are ~4 times more likely under H₁ than H₀
- Consider replication or interpret cautiously when p is close to α

### Prevention Strategy
Lower α as function of sample size to prevent frequentist rejection when evidence favors null hypothesis.

## 4. COMMON MISTAKES & MISCONCEPTIONS

### Misconception 1: Non-Significant P-Value Means Null is True
**INCORRECT Statements**:
- "Because p > 0.05, we can conclude there is no effect"
- "There was no difference (p > 0.05)"
- "The observed difference is not due to chance"

**Why Wrong**:
- P-values are statements about probability of data, not probability of hypotheses
- Non-significant result could be Type 2 error (false negative)
- True effect may exist but study lacked power to detect it

**CORRECT Statements**:
- "The observed difference was not statistically different from 0"
- "There was no statistically significant difference"
- "We cannot reject the null hypothesis"
- "Given our sample size of N per group and α=0.05, only observed differences more extreme than X could be statistically significant. Our observed difference was Y, hence we could not reject H₀"

**Alternative Approaches for Absence Claims**:
- Use equivalence testing
- Use Bayes factors
- Use Bayesian estimation
- NHST cannot prove absence of effect

### Misconception 2: Significant P-Value Means Null is False
**INCORRECT Statements**:
- "p < 0.05, therefore there is an effect"
- "There is a difference between groups, p < 0.05"

**Why Wrong**:
- Significant result could be Type 1 error (false positive)
- P-value doesn't quantify probability that hypothesis is true/false
- When H₀ is true, surprising observations still occur at rate α

**CORRECT Statements**:
- "We can reject the null hypothesis (with 5% long-run error rate)"
- "We can accept the alternative hypothesis (acknowledging 5% Type 1 error rate)"
- "Either an exceptionally rare chance has occurred, or the null hypothesis is false" (Fisher)
- "We can act as if the null hypothesis is false, and we would not be wrong more than 5% of the time in the long run" (Neyman-Pearson)

### Misconception 3: Significant = Practically Important
**Why Wrong**:
- "Significant" means "surprising under null," not "important"
- With large samples, tiny effects can be statistically significant
- Practical importance requires cost-benefit analysis

**Example**:
- n=10,000 per group: differences > 0.03 can be significant
- 12 cents saved per person may not make individual happier
- But 18 million people × 12 cents = €2 million for charity

**Key Point**: Statistical significance is orthogonal to practical importance. Whether effect matters depends on context and cost-benefit analysis, not p-value.

### Misconception 4: If P < 0.05, Probability of Type 1 Error is 5%
**Why Wrong**:
- 5% is the **prospective** error rate across all future studies where H₀ is true
- For a **specific** observed result where H₀ is known to be true, 100% of significant results are Type 1 errors
- Cannot calculate probability H₀ is true without subjective prior probability

**Distinction**:
- **Before collecting data**: "If H₀ is true, no more than 5% of future significant results will be Type 1 errors"
- **After observing p<0.05**: Cannot determine probability this specific result is Type 1 error without knowing if H₀ is true

### Misconception 5: 1-P is Probability of Replication
**Why Wrong**:
- Replication probability cannot be calculated from single p-value
- Replication probability depends on:
  - Whether true effect exists
  - Statistical power of replication study
  - Many other unknown factors

**Correct Understanding**:
- If H₁ is true: Replication probability = statistical power (e.g., 80% with 80% power)
- If H₀ is true: Replication probability = α (e.g., 5% with α=0.05)
- Only way to know if effect replicates is to replicate it

## 5. REPORTING REQUIREMENTS

### Always Report Exact P-Values
- Never report only "p < 0.05" or "p > 0.05"
- Exact p-values facilitate:
  - Re-use for secondary analyses
  - Comparison to different α levels by other researchers

### Proper Language for Significant Results
**After significant NHST** (acknowledging uncertainty):
> "We claim there is a non-zero effect, while acknowledging that if scientists make claims using this methodological procedure, they will be misled, in the long run, at most α% of the time, which we deem acceptable. We will, for the foreseeable future, and until new data or information emerges that proves us wrong, assume this claim is correct."

**Shorter version**:
- "p = .xx, which corroborates our prediction, at an alpha level of y%"
- State that result "corroborates" prediction, not "proves" theory

### Proper Language for Non-Significant Results
**After non-significant NHST**:
> "We cannot claim there is a non-zero effect, while acknowledging that if scientists refrain from making claims using this methodological procedure, they will be misled, in the long run, at most β% of the time, which we deem acceptable."

**Shorter version**:
- "p = .xx, which does not corroborate our prediction, at a statistical power of y% for our effect size of interest"

**Important**: After non-significant result, perform equivalence test to make claims about absence of effect.

### Language Modifications for Minimum Effect Tests
If using minimum effect test instead of testing against zero, replace "non-zero" with "minimum effect of X" in above statements.

### Avoid Certainty Language
**Never use**:
- "prove"
- "show" (in absolute sense)
- "it is known"
- "the null hypothesis is true"
- "the alternative hypothesis is true"

**Acknowledge**:
- Any single claim can be an error
- All knowledge is provisional
- Claims are tentative, subject to revision with new data

### Basic Statements
Claims based on NHST are **Popperian basic statements**:
- Describe an observation that has been made
- Describe an event that has occurred
- NOT about belief in truth of hypothesis
- NOT about probability of theory being true
- Can **corroborate** a prediction from theory
- Multiple corroborations increase "verisimilitude" (truth-likeness) of theory

## 6. DECISION RULES & THRESHOLDS

### Type 1 and Type 2 Errors
**Type 1 Error (False Positive)**:
- Claiming effect exists when H₀ is true
- Controlled by α (alpha level)
- Set before data collection
- Maximum rate at which researchers will be misled in long run

**Type 2 Error (False Negative)**:
- Failing to detect effect when H₁ is true
- Controlled by β (beta level)
- Related to power: Power = 1 - β
- Depends on sample size, effect size, and α

### Critical Values
- **Critical value**: Threshold distinguishing significant from non-significant results
- Determined by α, sample size, and test type
- For two-sided t-test with large sample: critical t ≈ 1.96 (for α=0.05)
- For smaller samples: critical t increases (e.g., 2.00-2.15)

### Alpha Level Selection
**Traditional**: α = 0.05
- No more than 5% of results will be false positives when H₀ is true
- Arbitrary convention, not sacred

**Adjustments**:
- Lower α when sample size is very large to avoid Lindley's paradox
- Lower α as function of sample size: prevents frequentist rejection when evidence favors null
- α = 0.01 for stricter control
- Justify chosen α in study design

### Statistical Power
**Definition**: Probability of finding significant result if H₁ is true
**Range**: 0 to 1

**Implications**:
- With 50% power: p-value distribution moderately right-skewed
- With 80% power: most p-values < 0.01 when effect exists
- With 99% power: very few p-values between 0.04-0.05
- Higher power through larger sample size or larger effect size

## 7. VERIFICATION CHECKLIST

### Check 1: Proper Definition Usage
- [ ] Authors define p-value correctly as probability of data given H₀
- [ ] No statements claiming p-value is probability of hypothesis/theory
- [ ] No claims that p-value is probability H₀ is true
- [ ] No claims that p-value is probability H₁ is true

### Check 2: Reporting Completeness
- [ ] Exact p-values reported (not just "p < 0.05")
- [ ] Alpha level stated in methods or with each result
- [ ] Statistical power reported or justifiable sample size
- [ ] Effect sizes reported alongside p-values
- [ ] Test assumptions mentioned

### Check 3: Language Accuracy for Significant Results
- [ ] Avoid "proves," "demonstrates conclusively," "shows definitively"
- [ ] Use "corroborates," "consistent with," "supports"
- [ ] Acknowledge possibility of Type 1 error
- [ ] Don't claim "alternative hypothesis is true"
- [ ] Can say "reject null hypothesis" or "accept alternative hypothesis" with error rate caveat

### Check 4: Language Accuracy for Non-Significant Results
- [ ] Never state "null hypothesis is true"
- [ ] Never state "there is no effect"
- [ ] Use "no statistically significant difference"
- [ ] Use "cannot reject null hypothesis"
- [ ] Acknowledge possibility of Type 2 error
- [ ] Consider whether equivalence test was performed

### Check 5: Practical Significance
- [ ] Authors distinguish statistical from practical significance
- [ ] Cost-benefit analysis provided if claiming importance
- [ ] Effect size discussed, not just p-value
- [ ] With large samples, authors address whether tiny effects matter
- [ ] Context provided for interpreting magnitude of effect

### Check 6: Multiple Testing
- [ ] If multiple tests conducted, authors address multiple comparisons
- [ ] Alpha adjustment described if applicable (Bonferroni, etc.)
- [ ] Exploratory vs confirmatory analyses distinguished

### Check 7: Replication Claims
- [ ] No claims that 1-p = probability of replication
- [ ] If discussing replication, reference statistical power
- [ ] Acknowledge replication depends on many factors beyond p-value

### Check 8: High-Power Studies
- [ ] With very high power, check if p-values near 0.05 are over-interpreted
- [ ] Consider if Lindley's paradox applies
- [ ] Check if authors use lower α for high-power studies
- [ ] With p between 0.04-0.05 and high power, expect cautious interpretation

### Check 9: Large Sample Studies
- [ ] Check if statistically significant effects are practically trivial
- [ ] Verify authors discuss practical importance
- [ ] Critical values should be very small (close to zero)
- [ ] Cost-benefit analysis for small effects in large samples

### Check 10: Philosophical Consistency
- [ ] Identify if Fisherian or Neyman-Pearson approach used
- [ ] Check interpretation matches stated framework
- [ ] If Fisherian: p-value as continuous measure
- [ ] If Neyman-Pearson: binary decision with error rates

## 8. WHEN TO USE/NOT USE P-VALUES

### Appropriate Uses
✓ Testing whether observed data pattern is surprising under null hypothesis
✓ Controlling long-run error rates when making ordinal claims
✓ Distinguishing signal from noise in data
✓ Making tentative claims with known error rates
✓ First line of defense against confirmation bias
✓ As auxiliary hypotheses for future research

### Inappropriate Uses
✗ Quantifying evidence for/against hypothesis (use likelihood or Bayes factor)
✗ Proving hypothesis is true or false
✗ Determining practical importance (need cost-benefit analysis)
✗ Concluding absence of effect from p > α (use equivalence test)
✗ Calculating probability of replication
✗ Replacing judgment about theory with mechanical procedure

### Alternative/Complementary Approaches

**For absence claims**:
- Equivalence testing
- Bayesian estimation with credible intervals
- Bayes factors

**For evidence quantification**:
- Likelihood ratios
- Bayes factors
- Support intervals

**For practical importance**:
- Effect size estimation with confidence intervals
- Cost-benefit analysis
- Minimal clinically important difference (MCID)

## 9. ASSUMPTIONS & MODEL VALIDITY

### Test Assumptions
- P-value validity depends on assumptions being reasonably met
- For t-test: normality of distributions (robust to violations with larger samples)
- Statistical tests remain useful when violations have small impact
- Authors should check and report assumption violations

### Null Model Requirements
- Standard deviation known or estimated
- Sample size determines degrees of freedom
- Distribution type (t, F, chi-square) depends on test
- Continuous vs discrete distributions affect p-value distribution

### When Assumptions Violated
- P-values may not control Type 1 error rate at nominal α
- Consider robust alternatives or non-parametric tests
- Report assumption checks and any corrections applied

## 10. CONTEXT-SPECIFIC GUIDANCE

### Confirmatory vs Exploratory
**Confirmatory (pre-registered)**:
- Alpha set in advance
- Single planned test or corrected for multiple tests
- Strong claims possible with significant result

**Exploratory**:
- Multiple tests increase family-wise error rate
- Results generate hypotheses, don't confirm them
- Require replication before strong claims
- Consider exploratory results as preliminary

### Replication Studies
- Original study's p-value doesn't predict replication
- Power of replication study is what matters
- Direct vs conceptual replication have different implications
- Multiple successful replications increase confidence

### Meta-Analysis Context
- Individual p-values less important than effect sizes
- Focus on consistency of effects across studies
- Publication bias affects p-value distribution
- Examine p-curve for evidential value

## 11. INTEGRATION WITH OTHER STATISTICAL CONCEPTS

### Effect Sizes
- Always report effect size WITH p-value
- P-value tells if effect ≠ 0, effect size tells how large
- Effect size needed for practical significance assessment
- Confidence intervals provide range of plausible values

### Confidence Intervals
- Provide more information than p-value alone
- Show magnitude and precision of estimate
- Can be used to assess practical significance
- 95% CI excludes zero ↔ p < 0.05 (typically)

### Statistical Power
- Power determines shape of p-value distribution
- Inadequate power → most real effects won't be detected
- Power analysis should precede data collection
- Post-hoc power calculations generally not informative

### Sample Size Justification
- Sample size should be justified before data collection
- Based on desired power, effect size of interest, and α
- Larger samples → narrower distributions → smaller critical values
- Resource constraints may limit achievable power

## 12. RED FLAGS TO WATCH FOR

### Interpretation Red Flags
🚩 "The null hypothesis is true" after p > α
🚩 "The alternative hypothesis is true" after p < α
🚩 "Proves" or "demonstrates" with any p-value
🚩 "No effect" or "no difference" without equivalence test
🚩 "Probability of replication is 1-p"
🚩 "Only 5% chance this is due to chance" after p < 0.05
🚩 P-value described as "probability hypothesis is true"
🚩 Conflating statistical and practical significance

### Reporting Red Flags
🚩 Only "p < 0.05" reported, not exact value
🚩 No alpha level stated anywhere
🚩 No effect sizes reported
🚩 No sample size justification
🚩 Multiple tests without correction
🚩 No discussion of assumptions
🚩 Cherry-picking significant results
🚩 HARKing (Hypothesizing After Results Known)

### Design Red Flags
🚩 Very large sample with claims about trivial effects
🚩 Very small sample without power justification
🚩 P-value near α (0.04-0.05) in high-power study interpreted strongly
🚩 Multiple outcomes tested but only significant ones reported
🚩 Post-hoc subgroup analyses without correction
🚩 Stopping rules based on p-values without adjustment

## 13. SUMMARY OF KEY PRINCIPLES

1. **P-values are about data probability, not hypothesis probability**
2. **P < α allows claiming effect exists (with α% error rate); p > α doesn't allow claiming no effect**
3. **Statistical significance ≠ practical importance**
4. **Exact p-values should always be reported**
5. **All claims are provisional and subject to error**
6. **Replication probability ≠ 1-p**
7. **Different philosophical frameworks interpret p-values differently**
8. **P-value distribution shape determined by statistical power**
9. **When H₀ true, p-values uniformly distributed (continuous tests)**
10. **High power can make p≈0.04 more likely under H₀ than H₁**
11. **Sample size affects what differences are considered "surprising"**
12. **P-values control error rates, not prove truth**
13. **Language matters: "corroborate" not "prove"**
14. **Equivalence tests needed for absence claims**
15. **Science built on provisional claims, not absolute certainty**

---

## NOTES FOR AI REVIEWERS

### Verification Workflow
1. Extract all p-values from paper
2. Check each for proper reporting (exact value, context, interpretation)
3. Identify claims made based on p-values
4. Verify claims use appropriate language (no certainty, acknowledge errors)
5. Check for distinction between statistical and practical significance
6. Look for equivalence tests if claiming absence of effects
7. Verify alpha and power reported
8. Check for multiple testing issues
9. Assess if language matches Fisherian or Neyman-Pearson framework
10. Flag any misconceptions from Section 4

### Priority Issues
**Critical** (must flag):
- Claiming hypothesis is true/false based on p-value
- Claiming "no effect" from p > α without equivalence test
- Missing exact p-values
- Conflating statistical and practical significance

**Important** (should flag):
- Certainty language (prove, demonstrate)
- No error rate acknowledgment
- Missing alpha or power
- Multiple testing without correction

**Minor** (may flag):
- Imprecise language that's technically correct but could be clearer
- Missing effect sizes
- No cost-benefit analysis for practical claims
