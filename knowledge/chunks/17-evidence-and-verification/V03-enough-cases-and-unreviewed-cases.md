---
id: V03
title: How many cases a target rate needs, and what unreviewed cases hide
topic: evidence-and-verification
sources: [eypasch-1995-rule-of-three, nist-2012-ehandbook-prc, lakkaraju-2017-selective-labels]
last_verified: 2026-11-17
---

## Claims

- When an event has not occurred in n cases, the upper limit of the 95%
  confidence interval for its rate is about 3/n (for n over 30). The authors
  offer it as a reminder for anyone reporting a zero complication rate.
  [eypasch-1995-rule-of-three Abstract]
- For a proportion, the NIST handbook prefers the Wilson interval: it behaves
  well across sample sizes and rates, and its lower limit cannot fall below
  zero, which the common p ± z√(p(1−p)/n) expression can.
  [nist-2012-ehandbook-prc §7.2.4.1]
- With very few failures or a very small sample, intervals based on the
  normal distribution may not be accurate enough, and an exact interval from
  the binomial distribution is used; it is not symmetric about the observed
  rate. [nist-2012-ehandbook-prc §7.2.4.1]
- The handbook's example: 4 defectives in 20 gives an exact 90% interval of
  roughly 0.07 to 0.40 around the observed 0.20.
  [nist-2012-ehandbook-prc §7.2.4.1, exact intervals example]
- Lakkaraju et al. describe the **selective labels problem**: in many
  settings the outcome is seen only for cases a person said yes to. Whether a
  defendant returns to court is known only if bail was granted; whether a
  startup succeeds, only if it was funded.
  [lakkaraju-2017-selective-labels Abstract; §1]
- Evaluating a model only on the cases that have outcomes can give a biased
  estimate, because those cases are not a random sample of all cases.
  [lakkaraju-2017-selective-labels §1]
- The people deciding often see things that are never recorded. A model
  trained on their labeled cases can "falsely but confidently learn" a
  pattern that holds only because of what they saw.
  [lakkaraju-2017-selective-labels §1]
- The usual remedy, getting outcomes for a random part of the unlabeled
  cases, is often impractical or unethical where the decision is
  consequential for the person. [lakkaraju-2017-selective-labels §1 and footnote 1]
- Their alternative, contraction, compares model and people using
  decision-makers who say yes at different rates to similar pools of cases.
  [lakkaraju-2017-selective-labels §1]

## What this means for the guide

- A target stated as a rate needs a test set large enough to show it. Twenty
  cases with no errors leave room for an error rate of up to about 15%;
  showing "under 5%" takes about 60 cases with no errors, "under 1%" about
  300, and more whenever errors do occur. A result should be quoted with its
  interval and the number of cases behind it.
- The count that matters is per kind of case. A rare kind, or a rare kind of
  fault, needs its own cases; a rate over the whole set says little about it.
- When people review only what the system sends them, nothing is learned
  about what it let through: that lane's error rate is unknown, and rules
  tuned on reviewers' corrections learn from one side only.
- Where looking again harms nobody (re-checking a case the system passed),
  send a random share of passed cases to a person, unmarked. That measures
  the unreviewed lane and gives corrections from both sides. Where it would
  mean changing a real decision at random, do not; say the rate is unknown.
