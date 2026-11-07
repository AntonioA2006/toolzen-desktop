// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { useState } from "react";
import { ResultBlock, ToolWorkspace } from "@/components/tools/tool-workspace";
import { Button } from "@/components/ui/button";
import { Label, Select, TextArea } from "@/components/ui/field";
import { useToolRunner } from "@/hooks/use-tool-runner";
import { jsonFormatterTool } from "./definition";
import type { JsonFormatterOutput } from "./process";

export function JsonFormatterPage() {
  const [source, setSource] = useState("");
  const [indent, setIndent] = useState<2 | 4>(2);
  const runner = useToolRunner(jsonFormatterTool.meta.id);
  const output = runner.output as JsonFormatterOutput | null;

  return (
    <ToolWorkspace tool={jsonFormatterTool}>
      <form
        className="grid gap-4 lg:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          void runner.run({ source, indent });
        }}
      >
        <div>
          <Label htmlFor="json-source">JSON</Label>
          <TextArea id="json-source" value={source} onChange={(event) => setSource(event.target.value)} spellCheck={false} />
          <div className="mt-3 flex items-end gap-3">
            <div>
              <Label htmlFor="json-indent">Indent</Label>
              <Select id="json-indent" value={String(indent)} onChange={(event) => setIndent(event.target.value === "4" ? 4 : 2)}>
                <option value="2">2 spaces</option>
                <option value="4">4 spaces</option>
              </Select>
            </div>
            <Button type="submit" variant="primary" disabled={runner.status === "running"}>
              {runner.status === "running" ? "Formatting" : "Format"}
            </Button>
          </div>
        </div>
        <ResultBlock title="Formatted JSON" value={output?.formatted ?? null} error={runner.error} />
      </form>
      {runner.note ? <p className="text-xs text-faint">{runner.note}</p> : null}
    </ToolWorkspace>
  );
}
