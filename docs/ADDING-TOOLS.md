<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright 2026 ToolZen Contributors -->

# Adding a tool

A tool is one profile in the registry. Do not copy its processor into a workflow or an AI planner.

## 1. Define the schema once

Add `src/tools/<id>/process.ts` for the pure function and `validate.ts` for the field schema plus any semantic checks. The field schema is the machine-readable parameter list used by the page, the AI catalog, and workflow proposals.

The processor must not import `@tauri-apps/*`, `fetch`, or a provider class.

## 2. Describe capabilities and permissions

Use `localTextCapabilities` for a small in-memory tool, or write an `ExecutionCapabilities` object. Set `technicalRemoteSupport` only when a future remote worker could honestly run the same pure operation. Setting it does not enable cloud execution.

`derivePermissionRequests` must describe the actual input. Harmless in-memory tools return `tool.execute` with `sensitivity: "harmless"` and a `tool-input` scope. A future file or cloud tool must return the real path or destination. Do not accept a caller-supplied "already allowed" flag.

## 3. Register a local handler

In `src/tools/register-handlers.ts`:

```ts
provider.register("your-id", (input) => yourPureFunction(input as YourInput));
```

The page calls `getExecutionManager().execute`. It does not call the processor directly.

## 4. Attach the page

Add the profile to `src/tools/catalog.ts` and map the page component in `src/tools/registry.ts`.

## 5. Future Rust tools

Leave the tool profile free of Tauri imports. Register the native command through `registerNativeLocalHandler` in a separate adapter module:

```ts
registerNativeLocalHandler(localExecutionProvider, {
  toolId: "pdf-merge",
  command: "execute_pdf_merge",
  invoke,
});
```

No native tool is registered in this release. `prepare_native_request` in Rust rejects cloud mode.

## 6. Unavailable tools

If the tool is not implemented, set `availability: "unavailable"` and a reason. Do not register a handler that returns fake output. The registry page for unknown implemented ids is the unavailable page, which has no run button.

## 7. Tests

Add validation tests, including rejected input. If the tool is sensitive, add a permission denial test and a grant that matches only the real scope. Workflow and AI code should keep using the registry id rather than a second implementation.
