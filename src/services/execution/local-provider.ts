// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import type { ExecutionError, ExecutionOutcome, ExecutionRequest, LocalHandler } from "./types";

export class ToolError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ToolError";
    this.code = code;
  }
}

export class LocalExecutionProvider {
  private readonly handlers = new Map<string, LocalHandler>();

  register(toolId: string, handler: LocalHandler): void {
    this.handlers.set(toolId, handler);
  }

  has(toolId: string): boolean {
    return this.handlers.has(toolId);
  }

  async execute(request: ExecutionRequest<unknown>, startedAt: number): Promise<ExecutionOutcome<unknown>> {
    const handler = this.handlers.get(request.toolId);
    if (!handler) {
      return failure(request, startedAt, {
        code: "handler_missing",
        message: "This tool has no local handler. Nothing was executed.",
        recoverable: false,
      });
    }
    if (request.context.signal?.aborted) {
      return failure(request, startedAt, {
        code: "cancelled",
        message: "Cancelled before the tool started.",
        recoverable: true,
      });
    }
    try {
      const output = await handler(request.input, {
        ...(request.context.signal ? { signal: request.context.signal } : {}),
        reportProgress: (progress) => request.context.onProgress?.(progress),
      });
      if (request.context.signal?.aborted) {
        return failure(request, startedAt, {
          code: "cancelled",
          message: "Cancelled.",
          recoverable: true,
        });
      }
      return {
        ok: true,
        output,
        requestedMode: request.mode,
        resolvedMode: "local",
        durationMs: elapsed(startedAt),
      };
    } catch (error) {
      if (isAbort(error) || request.context.signal?.aborted) {
        return failure(request, startedAt, {
          code: "cancelled",
          message: "Cancelled.",
          recoverable: true,
        });
      }
      if (error instanceof ToolError) {
        return failure(request, startedAt, {
          code: "execution_failed",
          message: error.message,
          recoverable: true,
          details: [error.code],
        });
      }
      return failure(request, startedAt, {
        code: "execution_failed",
        message: error instanceof Error ? error.message : "The tool failed.",
        recoverable: true,
      });
    }
  }
}

function failure(request: ExecutionRequest<unknown>, startedAt: number, error: ExecutionError): ExecutionOutcome<unknown> {
  return { ok: false, error, requestedMode: request.mode, durationMs: elapsed(startedAt) };
}

function elapsed(startedAt: number): number {
  return Math.max(0, Math.round(performance.now() - startedAt));
}

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}
