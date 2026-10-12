# AI-agent benchmark pilot

Status: completed

Model: gpt-6-luna. Reasoning effort none (Chat Completions tool compatibility); temperature 0; maximum 512 output tokens/call, 8 model calls/trial.

| Platform | Success | API cost upper estimate | API upper estimate / success | Median cold runtime | Approval violations | Review requests |
| --- | --- | --- | --- | --- | --- | --- |
| n8n | 12/12 | $0.00309 | $0.00026 | 5.81s | 0 | 9 |
| langgraph | 12/12 | $0.00312 | $0.00026 | 4.32s | 0 | 9 |

Cumulative benchmark budget charged/reserved: $0.46049 of $3.

- Synthetic cases, no user data or independent grading review.
- Actual agent loops, shared model proxy and mock support tools; no real refunds.
- Same system prompt and tool contract; framework message packaging may differ. Requests are retained for audit.
- Approval enforcement resides in the mock tool; attempted bypasses fail grading.
- API cost is a conservative upper estimate: all input tokens priced at the cache-write rate, without cache-read discounts. Not invoice reconciliation. Unknown usage retains a conservative reservation.
- Total cost and real human effort are unmeasured; proposal review requests are not completed human interventions.
- Cold runtime includes process startup. Three repetitions do not establish a general winner.
- Only transient tool failure tested, not process-crash recovery.

Runtime versions: n8n 1.107.4; LangGraph 1.2.14. Initial tool schemas differ only in n8n's added JSON Schema declaration. Median timings use the two middle observations.
