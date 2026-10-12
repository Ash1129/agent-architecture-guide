# AI-agent benchmark pilot

Status: INCOMPLETE: Runtime failed; inspect /var/folders/qy/kyrsp2bn37x8k7bfgdz_y_p00000gn/T/aag-agent-bench-xtcLkX/1-eligible-n8n.log. Partial results retained.

Model: gpt-4.1-mini-2025-04-14. Temperature 0; maximum 512 output tokens/call, 8 model calls/trial.

| Platform | Success | API spend | API cost / success | Median cold runtime | Approval violations | Review requests |
| --- | --- | --- | --- | --- | --- | --- |
| n8n | 0/1 | $0.00000 | unknown | 2.03s | 0 | 0 |
| langgraph | 0/0 | $0.00000 | unknown | unknown | 0 | 0 |

Cumulative benchmark budget charged/reserved: $0.00000 of $3.

- Synthetic cases, no user data or independent grading review.
- Actual agent loops, shared model proxy and mock support tools; no real refunds.
- Same system prompt and tool contract; framework message packaging may differ. Requests are retained for audit.
- Approval enforcement resides in the mock tool; attempted bypasses fail grading.
- API costs use token usage and published rates, not invoice reconciliation. Unknown usage retains a conservative reservation.
- Total cost and real human effort are unmeasured; proposal review requests are not completed human interventions.
- Cold runtime includes process startup. Three repetitions do not establish a general winner.
- Only transient tool failure tested, not process-crash recovery.
