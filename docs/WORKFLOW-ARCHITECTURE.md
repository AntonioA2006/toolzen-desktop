<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright 2026 ToolZen Contributors -->

# Workflow architecture

## Implemented now

The workflow foundation is a typed model plus validator, planner, executor, duplication helper, and one code-defined template. Nothing inserts that template into the database. There is no workflow page and no canvas.

A definition contains metadata, a monotonic version, nodes, connections, parameters, output mappings, an execution config, and an error policy. `fallbackToCloud` is the literal `false`.

Node kinds: `trigger`, `input`, `processing`, `transformation`, `conditional`, `output`, `utility`.

The executor implements:

- Manual trigger only
- Sequential connections
- Conditional ports `true` and `false`
- Data passed in memory through literal values, workflow parameters, and node output ports
- Processing nodes that call `ExecutionManager` with the registry tool id
- Retry of the same mode for listed error codes
- Cancellation between nodes
- Progress callbacks
- A history record with status, error code, duration, mode, and attempts

History persistence rejects payloads that include input or output contents. The in-memory return value can include outputs for the caller that just ran the workflow. That return value is not the stored history.

`pick` transformations and annotation utilities are graph machinery. They are not tools and they are not a second implementation of JSON, UUID, or Base64.

## Separate interfaces

| Interface | Module |
| --- | --- |
| Definition | `src/services/workflows/types.ts` |
| Validation | `validate.ts` |
| Planning | `plan.ts` |
| Execution | `execute.ts` |
| Result collection | history object built in `execute.ts` |
| Persistence | `upsertWorkflow` and `appendWorkflowExecution` operations |

## Triggers

| Trigger | Status |
| --- | --- |
| `manual` | Implemented. It is the only start the planner accepts. |
| `file-selection` | Documented. Planner returns `trigger_not_implemented`. |
| `folder-monitoring` | Documented. Not implemented. Would require `filesystem.monitor`. |
| `scheduled` | Documented. Not implemented. |
| `app-event` | Documented. Not implemented. |

## Future per-node mode

A node carries `requirements.mode`. A future cloud node can say `cloud` without rewriting the tool. The manager still demands a destination grant and will not silently run the node locally. Mixed graphs are representable. This release's tools declare local support only, so a node set to `cloud` fails with `mode_unsupported`.

## Future editor

When a visual editor is built, use XYFlow for nodes, edges, pan, and zoom. Keep node configuration, run status, and history as the model above. Do not add XYFlow until that editor exists.

Workflows are not tied to a machine path. Definitions store tool ids and parameters, not file bytes.
