// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { useState } from "react";
import { getExecutionManager } from "@/services/execution";
import type { AutoResolution } from "@/services/execution/types";
import { usePreferencesStore } from "@/stores/preferences-store";

export function useToolRunner(toolId: string) {
  const mode = usePreferencesStore((state) => state.preferences.executionMode);
  const [status, setStatus] = useState<"idle" | "running" | "success" | "error">("idle");
  const [output, setOutput] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function run(input: unknown) {
    setStatus("running");
    setError(null);
    const outcome = await getExecutionManager().execute({
      toolId,
      input,
      mode,
      context: { origin: { type: "tool-ui", toolId } },
    });
    if (outcome.ok) {
      setStatus("success");
      setOutput(outcome.output);
      setNote(outcome.autoResolution ? autoCopy(outcome.autoResolution, outcome.durationMs) : `Completed locally in ${outcome.durationMs} ms.`);
      return;
    }
    setStatus("error");
    setOutput(null);
    setNote(null);
    setError(outcome.error.message);
  }

  return { status, output, error, note, run };
}

function autoCopy(resolution: AutoResolution, durationMs: number): string {
  if (resolution === "local-no-cloud-provider") return `Automatic resolved to local because no cloud provider exists (${durationMs} ms).`;
  if (resolution === "local-tool-is-local-only") return `Automatic stayed local because this tool is local-only (${durationMs} ms).`;
  if (resolution === "local-cloud-consent-missing") return `Automatic stayed local because cloud consent is missing (${durationMs} ms).`;
  return `Completed in ${durationMs} ms.`;
}
