// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import type { ExecutionManager } from "@/services/execution/manager";
import type { PermissionManager } from "@/services/permissions/manager";
import type { ToolRegistry } from "@/tools/types";
import { executeWorkflow } from "@/services/workflows/execute";
import type { WorkflowRunResult } from "@/services/workflows/types";
import { approvalMatches } from "./planner";
import type { PlanApproval, WorkflowProposal } from "./types";

export async function executeApprovedProposal(input: {
  proposal: WorkflowProposal;
  approval: PlanApproval;
  manager: ExecutionManager;
  permissions: PermissionManager;
  registry: ToolRegistry;
  signal?: AbortSignal;
}): Promise<{ ok: true; run: WorkflowRunResult; explanation: string } | { ok: false; message: string }> {
  if (!approvalMatches(input.proposal, input.approval)) {
    return { ok: false, message: "Approval does not match this proposal. Nothing was executed." };
  }

  for (const operation of input.proposal.operations) {
    input.permissions.grant({
      kind: "ai.execute-tool",
      scope: { type: "ai-tool", toolId: operation.toolId, proposalId: input.proposal.id },
      note: input.approval.statement,
    });
  }

  const run = await executeWorkflow(input.proposal.definition, {
    manager: input.manager,
    registry: input.registry,
    proposalId: input.proposal.id,
    ...(input.signal ? { signal: input.signal } : {}),
  });

  return { ok: true, run, explanation: explainRun(run) };
}

function explainRun(run: WorkflowRunResult): string {
  if (run.history.nodeResults.length === 0) return run.errorMessage ?? "The plan did not run.";
  const parts = run.history.nodeResults
    .filter((result) => result.kind === "processing")
    .map((result) => {
      const mode = result.resolvedMode ? ` (${result.resolvedMode})` : "";
      if (result.status === "succeeded") return `${result.toolId ?? result.nodeId} succeeded${mode}.`;
      if (result.status === "skipped") return `${result.toolId ?? result.nodeId} was skipped.`;
      return `${result.toolId ?? result.nodeId} ${result.status}${result.errorCode ? `: ${result.errorCode}` : ""}.`;
    });
  return parts.join(" ") || run.errorMessage || "The plan finished without tool steps.";
}
