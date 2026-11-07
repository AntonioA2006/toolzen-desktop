// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import type { WorkflowDefinition } from "./types";

/** Code-defined template. It is not inserted into the database and is not usage history. */
export function jsonThenBase64Template(now: string): WorkflowDefinition {
  return {
    metadata: {
      id: "format-json-then-base64",
      name: "Format JSON, then encode Base64",
      description: "Runs the JSON Formatter and Base64 tools through the shared execution manager.",
      createdAt: now,
      updatedAt: now,
      tags: ["template", "developer"],
    },
    version: {
      version: 1,
      parameters: [
        {
          id: "source",
          name: "JSON source",
          required: true,
          schema: { type: "string", description: "JSON text to format.", minLength: 1, maxLength: 1_000_000 },
        },
      ],
      execution: { defaultMode: "local" },
      errorPolicy: { maxAttempts: 1, retryOn: [], fallbackToCloud: false },
      outputMappings: [{ id: "encoded", nodeId: "output", port: "value", name: "encoded" }],
      nodes: [
        {
          id: "start",
          kind: "trigger",
          name: "Manual start",
          inputs: [],
          outputs: [],
          requirements: { mode: "local", requiresInternet: false },
          config: { kind: "trigger", trigger: "manual" },
        },
        {
          id: "format",
          kind: "processing",
          name: "Format JSON",
          toolId: "json-formatter",
          inputs: [
            { port: "source", source: { type: "workflow-parameter", parameterId: "source" } },
            { port: "indent", source: { type: "literal", value: 2 } },
          ],
          outputs: [
            { id: "formatted", schema: { type: "string", description: "Formatted JSON." } },
            { id: "byteLength", schema: { type: "integer", description: "UTF-8 size.", minimum: 0 } },
          ],
          requirements: { mode: "local", requiresInternet: false },
          config: { kind: "processing" },
        },
        {
          id: "encode",
          kind: "processing",
          name: "Encode Base64",
          toolId: "base64",
          inputs: [
            { port: "text", source: { type: "node-output", nodeId: "format", port: "formatted" } },
            { port: "action", source: { type: "literal", value: "encode" } },
            { port: "alphabet", source: { type: "literal", value: "standard" } },
          ],
          outputs: [{ id: "text", schema: { type: "string", description: "Base64 text." } }],
          requirements: { mode: "local", requiresInternet: false },
          config: { kind: "processing" },
        },
        {
          id: "output",
          kind: "output",
          name: "Encoded result",
          inputs: [{ port: "value", source: { type: "node-output", nodeId: "encode", port: "text" } }],
          outputs: [{ id: "value", schema: { type: "string", description: "Workflow output." } }],
          requirements: { mode: "local", requiresInternet: false },
          config: { kind: "output" },
        },
      ],
      connections: [
        { id: "c1", fromNodeId: "start", fromPort: "next", toNodeId: "format", toPort: "in" },
        { id: "c2", fromNodeId: "format", fromPort: "next", toNodeId: "encode", toPort: "in" },
        { id: "c3", fromNodeId: "encode", fromPort: "next", toNodeId: "output", toPort: "in" },
      ],
    },
  };
}

export function duplicateWorkflow(source: WorkflowDefinition, newId: string, now: string): WorkflowDefinition {
  return {
    metadata: {
      ...source.metadata,
      id: newId,
      name: `${source.metadata.name} copy`,
      createdAt: now,
      updatedAt: now,
    },
    version: {
      ...source.version,
      version: 1,
      nodes: source.version.nodes.map((node) => ({ ...node, inputs: [...node.inputs], outputs: [...node.outputs] })),
      connections: source.version.connections.map((connection) => ({ ...connection })),
      parameters: source.version.parameters.map((parameter) => ({ ...parameter })),
      outputMappings: source.version.outputMappings.map((mapping) => ({ ...mapping })),
      errorPolicy: { ...source.version.errorPolicy, retryOn: [...source.version.errorPolicy.retryOn] },
    },
  };
}
