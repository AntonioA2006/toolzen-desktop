<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright 2026 ToolZen Contributors -->

# AI assistant architecture

## Implemented now

There is no assistant UI, no model call, and no network client. The settings checkbox for AI retention only stores a preference. The default is off. Turning it on does not create messages.

What exists:

- `AiProvider` with `isOperational`, `listModels`, and `complete`
- `UnavailableAiProvider`, which returns `ai_provider_unavailable` and does not call `fetch`
- `AiProviderRegistry`, so another provider can be registered without changing tools
- `AiModelDescriptor`, message drafts, and completion request types
- `buildToolCatalog`, which reads each tool's existing field schema, purpose, permissions, and capabilities
- `toolCallToIntentStep`, which checks the registry and does not execute
- `proposeWorkflowFromIntent`, a deterministic compiler from a structured list of tool ids and parameters
- `executeApprovedProposal`, which checks the plan hash and the accepted node list, grants `ai.execute-tool` for that proposal id and tool id, then runs the workflow through `ExecutionManager`

A structured intent is not a chatbot. Free-text interpretation is not implemented. The proposal summary is assembled from tool metadata.

## Future providers

The provider kinds are `local-model`, `user-configured`, and `toolzen-hosted`. A future provider implements `AiProvider` and is registered. Tool profiles, the catalog, and the execution manager stay as they are. The product must still choose to call `complete`. This release never does.

Hosted ToolZen AI, local models, and user-supplied endpoints are contracts only. There is no API key storage, billing, or upload code.

## Intended future turn

1. A provider, if one exists and the product has enabled it, turns an intent into tool ids and parameters.
2. The catalog supplies purpose, parameters, outputs, requirements, and permissions from the registry.
3. The planner builds a workflow proposal and shows the operations.
4. The user approves that plan hash and those node ids. A mismatched hash or a short statement does not run.
5. Execution uses the shared manager and permission grants bound to the proposal id and tool id.
6. The explanation is built from actual node statuses and error codes.

AI tool execution is sensitive even when the underlying tool is harmless. Direct use of JSON Formatter in the page does not ask for that grant. An AI plan does.

The assistant has no shell permission and no general filesystem permission. A tool call cannot widen Tauri capabilities.

## Conversations

Tables exist for conversations and messages. Inserts fail unless the global retention preference and the conversation flag are both true. There is no seeded conversation. A future product should state the retention window before storing text. `aiRetentionDays` can be stored; no deleter runs yet.
