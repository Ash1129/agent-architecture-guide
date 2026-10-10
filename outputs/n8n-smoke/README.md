# Local n8n smoke test

Tested on October 10, 2026 with the locally installed n8n 1.107.4 and Node.js 22.17.1.

## Results

| Check | Result | Evidence |
| --- | --- | --- |
| Generated rules-only workflow imports and executes | Passed | `SmokeGenerated.json`, `import-SmokeGenerated.log`, `execute-SmokeGenerated.log` |
| Generated IF separates `match` from `no match` | Passed | `execute-SmokeRouting.log`: A takes Matching action; B takes Default action |
| Retry after destination commit with a failed response, followed by full replay | Passed | Three mock write requests, one stored record in `report.json` |
| Automatic webhook failure invokes Error Trigger | Passed | Three failing requests, one error-handler alert in `report.json` |

## Defects found and corrected

1. CLI import failed because the workflow export omitted `active`. Both full workflows and Hermes handoff exports now include `active: false`. The full workflow was imported and executed live; the handoff received the same metadata fix but was not executed against Hermes.
2. IF used substring matching, so `no match` incorrectly followed the `match` branch. It now compares normalized exact labels. `routing-before-fix.json` preserves the observed wrong routing; the final execution log records correct routing.

## Scope

The first test imports the application's generated rules-only workflow, adding only a database ID. The routing test replaces the placeholder decision-table code with two synthetic records while retaining the generated IF and connections. Retry and error-handler tests use separate purpose-built workflows, not protections automatically present in the application export.

All HTTP actions target synthetic localhost endpoints. The mock write destination supplies idempotency; n8n itself does not make arbitrary external actions replay-safe. No AI model, MCP connection, real app credential, human approval, parallel merge or Wait-node resume was exercised. This does not establish compatibility with another n8n version or every export topology.

The test used a separate temporary n8n user folder and database. Both local services were stopped and that folder was removed. Existing workflows and credentials were not modified. Code nodes used the installed version's in-process execution mode (`N8N_RUNNERS_ENABLED=false`), not external task runners.

## Reproduce

From the repository root, with `n8n` and `node` on PATH:

```sh
node scripts/smoke/n8n.mjs
```

The script binds ephemeral loopback ports, requires permission to start local services, and refreshes the JSON fixtures, logs and `report.json` in this folder. It does not install or update n8n. The initial owner and database are created only in its temporary user folder. The current default n8n installation is not used as the test database.

The test uses n8n's documented [server CLI workflow import and execution](https://docs.n8n.io/deploy/host-n8n/configure-n8n/use-the-command-line.md), verified against the installed CLI's help and implementation because version-specific commands differ.

Application regression check: `npm run check` passed typecheck, all 190 tests, and the production build. The build reports a bundle-size advisory.
