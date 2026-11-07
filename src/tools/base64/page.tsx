// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { useState } from "react";
import { ResultBlock, ToolWorkspace } from "@/components/tools/tool-workspace";
import { Button } from "@/components/ui/button";
import { Label, Select, TextArea } from "@/components/ui/field";
import { useToolRunner } from "@/hooks/use-tool-runner";
import { base64Tool } from "./definition";
import type { Base64Output } from "./process";

export function Base64Page() {
  const [text, setText] = useState("");
  const [action, setAction] = useState<"encode" | "decode">("encode");
  const [alphabet, setAlphabet] = useState<"standard" | "url">("standard");
  const runner = useToolRunner(base64Tool.meta.id);
  const output = runner.output as Base64Output | null;

  return (
    <ToolWorkspace tool={base64Tool}>
      <form
        className="grid gap-4 lg:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault();
          void runner.run({ text, action, alphabet });
        }}
      >
        <div>
          <Label htmlFor="base64-text">{action === "encode" ? "Text" : "Base64"}</Label>
          <TextArea id="base64-text" value={text} onChange={(event) => setText(event.target.value)} spellCheck={false} />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="base64-action">Action</Label>
              <Select id="base64-action" value={action} onChange={(event) => setAction(event.target.value === "decode" ? "decode" : "encode")}>
                <option value="encode">Encode</option>
                <option value="decode">Decode</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="base64-alphabet">Alphabet</Label>
              <Select id="base64-alphabet" value={alphabet} onChange={(event) => setAlphabet(event.target.value === "url" ? "url" : "standard")}>
                <option value="standard">Standard</option>
                <option value="url">URL-safe</option>
              </Select>
            </div>
          </div>
          <Button className="mt-3" type="submit" variant="primary" disabled={runner.status === "running"}>
            {runner.status === "running" ? "Working" : action === "encode" ? "Encode" : "Decode"}
          </Button>
        </div>
        <ResultBlock title="Result" value={output?.text ?? null} error={runner.error} />
      </form>
      {runner.note ? <p className="text-xs text-faint">{runner.note}</p> : null}
    </ToolWorkspace>
  );
}
