// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { useState } from "react";
import { ResultBlock, ToolWorkspace } from "@/components/tools/tool-workspace";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { useToolRunner } from "@/hooks/use-tool-runner";
import { uuidGeneratorTool } from "./definition";
import type { UuidGeneratorOutput } from "./process";

export function UuidGeneratorPage() {
  const [count, setCount] = useState(1);
  const [uppercase, setUppercase] = useState(false);
  const [hyphens, setHyphens] = useState(true);
  const runner = useToolRunner(uuidGeneratorTool.meta.id);
  const output = runner.output as UuidGeneratorOutput | null;

  return (
    <ToolWorkspace tool={uuidGeneratorTool}>
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void runner.run({ count, uppercase, hyphens });
        }}
      >
        <div className="grid max-w-xl gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="uuid-count">Count</Label>
            <Input id="uuid-count" type="number" min={1} max={100} value={count} onChange={(event) => setCount(Number(event.target.value))} />
          </div>
          <label className="flex items-end gap-2 pb-2 text-sm">
            <input type="checkbox" checked={uppercase} onChange={(event) => setUppercase(event.target.checked)} />
            Uppercase
          </label>
          <label className="flex items-end gap-2 pb-2 text-sm">
            <input type="checkbox" checked={hyphens} onChange={(event) => setHyphens(event.target.checked)} />
            Hyphens
          </label>
        </div>
        <div>
          <Button type="submit" variant="primary" disabled={runner.status === "running"}>
            {runner.status === "running" ? "Generating" : "Generate"}
          </Button>
        </div>
      </form>
      <ResultBlock title="UUIDs" value={output ? output.uuids.join("\n") : null} error={runner.error} />
      {runner.note ? <p className="text-xs text-faint">{runner.note}</p> : null}
    </ToolWorkspace>
  );
}
