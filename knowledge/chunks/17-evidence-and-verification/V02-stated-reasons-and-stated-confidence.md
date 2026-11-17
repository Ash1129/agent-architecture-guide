---
id: V02
title: A model's stated reasons and stated confidence are not measurements
topic: evidence-and-verification
sources: [turpin-2023-unfaithful-explanations, xiong-2024-llm-uncertainty]
last_verified: 2026-11-17
---

## Claims

- Turpin et al. added features to prompts that pushed models toward a
  particular answer, for example reordering the options in the examples so
  the answer was always "(A)". The models' step-by-step explanations
  systematically failed to mention those features.
  [turpin-2023-unfaithful-explanations Abstract]
- When pushed toward wrong answers, the models often wrote explanations that
  justified those answers, and accuracy fell by as much as 36% across 13
  tasks (GPT-3.5 and Claude 1.0). [turpin-2023-unfaithful-explanations Abstract]
- On a social-bias task, explanations justified answers in line with
  stereotypes without mentioning that influence. The authors conclude that
  such explanations can be plausible and still misrepresent the real reason
  for the answer. [turpin-2023-unfaithful-explanations Abstract]
- Xiong et al. tested ways of getting a confidence figure from a model
  without access to its internals. Models asked to state their confidence
  tend to be overconfident. [xiong-2024-llm-uncertainty Abstract]
- Calibration and the ability to predict failures improve as models get more
  capable, but remain far from ideal. [xiong-2024-llm-uncertainty Abstract]
- Prompts modelled on how people express doubt, agreement among several
  sampled answers, and better ways of combining them each reduce
  overconfidence. No one technique wins everywhere, and all of them struggle
  on hard tasks such as those needing professional knowledge.
  [xiong-2024-llm-uncertainty Abstract]
- Methods with access to the model's internals predict failures only a
  little better (AUROC 0.605 against 0.522). [xiong-2024-llm-uncertainty Abstract]

## What this means for the guide

- An explanation written by a model after the fact is a second output, not a
  record of why the first one came out as it did. Where a decision must be
  explained or audited, the reasons shown should be the checks that actually
  ran: each rule, the values it looked at and where they came from. A model
  may reword those reasons; it should not supply them.
- "How sure are you?" is not a safe switch for sending work to a person. Send
  work to a person on things code can see: a value that is missing or fails
  its check, sources that disagree, repeated reads that disagree.
- If a confidence score is used anyway, treat it as a measurement to be
  tested: compare it with labeled cases, set the cut-off from that
  comparison, and re-check after any change of model or prompt.
- Both results are from models that have since been replaced, and the second
  paper finds that newer models do better. The direction is established; the
  size of the effect on a current model has to be measured on the task.
