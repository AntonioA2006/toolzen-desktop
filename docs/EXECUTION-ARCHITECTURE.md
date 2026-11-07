<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright 2026 ToolZen Contributors -->

# Execution architecture

## Local-first rule

The initial mode of every shipped tool is local. `ExecutionManager` is constructed with no cloud provider. `AUTO` therefore runs locally. The result records why: the tool is local-only, no provider exists, or cloud consent is missing.

`CLOUD` never falls through to a local run. A local error never causes a second attempt on a cloud provider. Workflow retry repeats the same mode.

## Contracts

| Type | Role |
| --- | --- |
| `ExecutionMode` | `local`, `cloud`, or `auto` |
| `ExecutionRequest` | Tool id, input, mode, abort signal, progress callback, origin |
| `ExecutionContext.origin` | `tool-ui`, `workflow`, or `ai-plan`. Origin selects extra permission checks. It is not an allow flag. |
| `ExecutionResult` / `ExecutionOutcome` | Output or a coded error, requested mode, resolved mode, duration |
| `ExecutionProgress` | Optional fraction or indeterminate message |
| `ExecutionCapabilities` | Modes, internet, cancellation, progress, file input, formats, size, memory, CPU, GPU, remote support |
| `LocalExecutionProvider` | Runs a handler registered by tool id |
| `CloudExecutionProvider` | Abstract contract. No concrete class performs network I/O. |
| `ExecutionManager` | Validates, authorizes, chooses a provider, normalizes the outcome |

Cloud-only interfaces (`CloudApiClient`, `CloudAuthProvider`, `RemoteJobManager`, `FileUploadManager`, `ResultDownloader`, `StatusTracker`, `QuotaReader`, `CloudProviderConfig`) have no implementations.

## Registration without editing tools

Pure TypeScript tools register with `localExecutionProvider.register`. Future Rust tools call `registerNativeLocalHandler` from an adapter module. The tool profile stays unchanged. Adding a cloud provider means passing a `CloudExecutionProvider` subclass into the manager. Existing tool ids stay valid.

## Capabilities

The manager rejects unknown tools, unavailable tools, schema failures, oversized input, missing file selections, unsupported modes, missing handlers, and denied permissions. Cancellation checks the abort signal before and after the handler.

## Privacy boundary for a future cloud provider

A cloud call requires a `cloud.upload` grant whose scope names the provider id and destination. The grant is not a boolean on the request. The user must be told what leaves the device, that the transfer can be cancelled, and how long the remote side keeps it. This release does not implement that transfer. The selector in Settings disables Cloud and describes Automatic as local.

## Rust boundary

`src-tauri/src/execution.rs` mirrors the mode enum. `prepare_native_request` accepts local and auto as local preparation and rejects cloud. It is not wired to a tool command, so it cannot pretend a native tool ran.
