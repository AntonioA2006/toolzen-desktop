// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { useState } from "react";
import { ToolWorkspace } from "@/components/tools/tool-workspace";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { useToolRunner } from "@/hooks/use-tool-runner";
import { useSessionStore } from "@/stores/session-store";
import { findProfile } from "@/tools/catalog";
import { bytesToBase64, type LocalFile, type LocalOutput } from "./images";
import { mvpTool, type MvpToolSpec } from "./specs";

export function MvpToolPage() {
  const routeTool = useRouteTool();
  if (!routeTool) return <p className="text-sm text-subtle">That tool is not in this release.</p>;
  return <MvpForm spec={routeTool} />;
}

function MvpForm({ spec }: { spec: MvpToolSpec }) {
  const profile = findProfile(spec.id);
  const runner = useToolRunner(spec.id);
  const [files, setFiles] = useState<File[]>([]);
  const [options, setOptions] = useState<Record<string, string>>({});
  const output = runner.output as LocalOutput | null;

  if (!profile) return null;

  return (
    <ToolWorkspace tool={profile}>
      <form
        className="grid max-w-2xl gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void submit(spec, files, options, runner.run);
        }}
      >
        <div>
          <Label htmlFor={`${spec.id}-files`}>Files</Label>
          <Input
            id={`${spec.id}-files`}
            type="file"
            accept={spec.accept}
            multiple={spec.maxFiles > 1}
            onChange={(event) => setFiles([...(event.target.files ?? [])])}
          />
          <p className="mt-1 text-xs text-faint">
            {spec.minFiles === spec.maxFiles ? `${spec.minFiles} file` : `${spec.minFiles} to ${spec.maxFiles} files`}. Maximum 25 MB each. Engine: {spec.engineBinary}.
          </p>
        </div>
        {spec.options.map((field) => (
          <div key={field.name}>
            <Label htmlFor={`${spec.id}-${field.name}`}>{field.label}</Label>
            <Input
              id={`${spec.id}-${field.name}`}
              type={field.kind === "integer" ? "number" : field.name === "password" ? "password" : "text"}
              required={field.required}
              value={options[field.name] ?? ""}
              onChange={(event) => setOptions((current) => ({ ...current, [field.name]: event.target.value }))}
            />
          </div>
        ))}
        <Button type="submit" variant="primary" disabled={runner.status === "running"}>
          {runner.status === "running" ? "Working" : "Run locally"}
        </Button>
      </form>
      {runner.error ? <p className="text-sm text-danger">{runner.error}</p> : null}
      {output ? <Download output={output} /> : <p className="text-sm text-subtle">No file yet. A result appears only after the engine finishes.</p>}
      {runner.note ? <p className="text-xs text-faint">{runner.note}</p> : null}
    </ToolWorkspace>
  );
}

function Download({ output }: { output: LocalOutput }) {
  const href = `data:${output.mime};base64,${output.bytesBase64}`;
  return (
    <a className="text-sm font-medium text-[var(--tz-blue-600)] underline" href={href} download={output.fileName}>
      Download {output.fileName}
    </a>
  );
}

async function submit(spec: MvpToolSpec, files: File[], options: Record<string, string>, run: (input: unknown) => Promise<void>) {
  const parsed: Record<string, unknown> = {};
  for (const field of spec.options) {
    const raw = options[field.name] ?? "";
    if (!field.required && raw.trim() === "") continue;
    parsed[field.name] = field.kind === "integer" ? Number(raw) : raw;
  }
  const encoded: LocalFile[] = [];
  for (const file of files) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    encoded.push({ name: file.name, type: file.type, bytesBase64: bytesToBase64(bytes) });
  }
  await run({ files: encoded, options: parsed });
}

function useRouteTool(): MvpToolSpec | undefined {
  const route = useSessionStore((state) => state.route);
  if (route.name !== "tool") return undefined;
  return mvpTool(route.toolId);
}
