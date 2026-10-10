# Initial findings from seven published cases

Evaluated 2026-10-10. These are source-backed adaptations, not reproduced
customer deployments or an independently reviewed benchmark. The generated
[report](../../outputs/guide-eval/external/latest.md) records inputs, assumptions,
checks and actual outputs; JSON alongside it preserves the full blueprints.

## Result

11 of 12 structural checks pass. One review-boundary check fails. All seven
cases still require substantive review; 14 case-specific criteria remain open.
No rules were tuned to obtain this result. The structural checks mostly test
consistency with encoded answers; they do not show that the interview would
extract the right answers from a source or that the proposed platform is best.

| Case | Guide output under stated assumptions | Initial assessment |
| --- | --- | --- |
| [Bordr](https://n8n.io/case-studies/bordr/) | Automation / n8n | Appropriate broad category for the scoped fixed order workflows. Recipient checks, duplicate handling and personal-data controls still need review. |
| [Oversee](https://n8n.io/case-studies/oversee/) | Workflow / n8n; autonomy 3 | Fails our explicit human-decision boundary: the graph contains review but also permits completion without it. |
| [Adyen](https://airflow.apache.org/use-cases/adyen/) | Automation / Airflow | Fits the broad dependency problem. Generic dependency nodes do not establish safe backfills, ownership controls or rollback behavior. |
| [Adobe](https://airflow.apache.org/use-cases/adobe/) | Automation / Airflow | Fits the scoped dependency-driven jobs. Isolation, concurrency and mixed triggering modes remain untested. |
| [Remote](https://www.langchain.com/blog/customers-remote) | Agent / Cowork | Broad approach passes. The manual-trigger assumption steers the platform; this does not establish suitability for an embedded migration service with sandboxed execution. |
| [Kensho](https://www.langchain.com/blog/customers-kensho) | Multi-agent / LangGraph | Broad structure aligns with distinct retrieval responsibilities. Routing accuracy, citations, access controls and aggregation need evaluation. |
| [Discord](https://discord.com/blog/how-discord-uses-open-source-tools-for-scalable-data-orchestration-transformation) | Automation / Airflow | Category passes. Dagster/dbt and the source's asset, partition and self-service criteria expose a catalog/questionnaire coverage gap. |

## Priority findings

1. **Explicit human decision ownership needs an input.** Oversee's source says
   staff receive the investigation report and choose the next action. Our rubric
   requires every completion to pass through a human. The current questions have
   no direct way to encode that requirement; task prose is not interpreted by the
   deterministic rules. This is a requirement-representation mismatch, not proof
   that automatic report generation is unsafe or that live actions occurred.
   Clarify whether “completion” means report preparation or resolution before
   using this check as a release gate. Retain the failure until that review.
2. **One agent can still need a custom service architecture.** Remote's described
   sandbox, recoverable execution and schema checks are stronger constraints
   than “one role, manual trigger, developers available.” A product-embedded
   execution requirement and sandbox requirements would make the guide's choice
   better informed. A different brand from the case study is not itself a failure.
3. **Data orchestration needs more discriminating questions.** Adyen, Adobe and
   Discord currently collapse to similar answers. Partition semantics,
   self-service operations, backfills, existing infrastructure and data quality
   gates could distinguish their requirements. Discord provides evidence of an
   alternative, not proof that Airflow cannot meet its needs.

## Suggested next evaluation work

- Review the Oversee completion boundary before changing autonomy rules.
- Add sensitivity variants for unknown trigger, deployment restrictions and
  operator skills; report changes instead of choosing assumptions that match a
  published stack.
- Define expected capabilities for embedded code execution and asset-oriented
  orchestration before expanding the catalog or altering platform selection.
- Obtain independent review of those expectations, then freeze a fresh set of
  cases before tuning rules. Keep these exploratory cases out of a claimed
  held-out score.

Claims are limited to what the linked publications describe. ROI, reliability
and vendor superiority claims have not been independently verified. This work
does not execute any customer's workflow or test the live external platforms.

## Assumption research follow-up (dataset v2)

The [field-by-field evidence ledger](assumption-evidence.md) covers every one of
the 37 original assumptions: 7 supported mappings, 6 corrected values, 10 with
partial support and 14 unresolved. Same-company evidence and analogous cases
are labeled separately; the remaining unknowns have not been promoted to facts.

The corrected inputs preserve the 11/12 structural result and the unresolved
Oversee review boundary. Adyen now carries high aggregate volume, explicit risk
flags and controlled-deployment requirements; its recommended autonomy falls
from 4 to 3. Remote and Kensho use clear quality criteria. Discord uses high
aggregate volume. No production rules changed.

We also ran 44 hypothetical one-field variations on uncertain inputs. Seventeen
changed the decision summary (approach, main platform, tools, autonomy or hosting).
This is sensitivity evidence, not 44 extra customer cases, an accuracy score or
a test of all combinations. An unchanged summary does not imply unchanged
blueprint details. Original v1 inputs and reports are preserved under
`outputs/guide-eval/external/baseline-v1/`; latest outputs use dataset v2.

## Step 2: explicit requirements (dataset v3)

Added an optional requirements question; historical answers remain valid and
missing requirements mean unassessed, not confirmed absent. Three source-backed
cases now encode constraints that the old questionnaire could not represent:

- Oversee: report preparation ends at a human decision; explicit approval caps
  autonomy at 2 even at high volume. All completion paths pass a human node.
- Remote: embedded service and sandbox requirements select a developer-built
  LangGraph agent without inventing specialist roles. A sandbox must still be
  implemented separately; neither the framework nor the starter supplies one.
- Discord: asset operations trigger an explicit catalog limitation and a
  comparison of partition/backfill behavior, quality gates, lineage and migration.
  Dagster and dbt remain comparison candidates, not newly validated catalog tools.

The external structural result is now 12/12; the synthetic regression gate
remains 24/24. This is development-set improvement after requirements were added,
not a held-out accuracy gain. Fourteen manual criteria remain open. Across the
same 44 hypothetical probes, 14 decision summaries change (previously 17).
The v2 inputs and report are preserved in `outputs/guide-eval/external/baseline-v2/`.

New general regression tests cover share-link persistence, invalid input,
legacy compatibility, approval at high volume, fixed-action preparation, a
single embedded agent across trigger types, absent developer ownership and
catalog limitations. Implementation controls still require live testing.

Technical basis: [LangGraph persistence](https://docs.langchain.com/oss/python/langgraph/persistence)
provides explicit state/recovery mechanisms; it is not evidence of a secure code
sandbox. [Discord's engineering account](https://discord.com/blog/how-discord-uses-open-source-tools-for-scalable-data-orchestration-transformation)
provides the data-operations comparison criteria. Platform preference is a
provisional guide design choice, not a claim of benchmark superiority.

Validation: 217 tests passed, TypeScript and production build passed. Browser
verification on the production preview confirmed that selecting explicit
approval persists in the result URL and changes autonomy from 4 to 2. The
production requirements screen and result were visually inspected. No live
n8n/Airflow/LangGraph deployment was exercised for these changes.
