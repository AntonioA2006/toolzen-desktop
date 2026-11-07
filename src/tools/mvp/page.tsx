// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { useState } from "react";
import { ToolWorkspace } from "@/components/tools/tool-workspace";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/field";
import { useToolRunner } from "@/hooks/use-tool-runner";
import { translate } from "@/lib/i18n";
import { usePreferencesStore } from "@/stores/preferences-store";
import { useSessionStore } from "@/stores/session-store";
import { readinessOf } from "./status";
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
  const locale = usePreferencesStore((state) => state.preferences.language);
  const readiness = readinessOf(spec.id);
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
          <Label htmlFor={`${spec.id}-files`}>{translate(locale, "files")}</Label>
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
        <Button type="submit" variant="primary" disabled={runner.status === "running" || readiness === "unavailable"}>
          {runner.status === "running" ? translate(locale, "working") : translate(locale, "run")}
        </Button>
        {readiness !== "ready" ? <p className="text-sm text-subtle">{translate(locale, readiness === "partial" ? "statusPartial" : "statusUnavailable")}. {profile?.meta.unavailableReason}</p> : null}
      </form>
      {runner.error ? <p className="text-sm text-danger">{explainError(locale, runner.error)}</p> : null}
      {output ? <Download output={output} locale={locale} /> : <p className="text-sm text-subtle">{translate(locale, "noResult")}</p>}
      {runner.note ? <p className="text-xs text-faint">{runner.note}</p> : null}
    </ToolWorkspace>
  );
}

function Download({ output, locale }: { output: LocalOutput; locale: "en" | "es" }) {
  const href = `data:${output.mime};base64,${output.bytesBase64}`;
  return (
    <a className="text-sm font-medium text-[var(--tz-blue-600)] underline" href={href} download={output.fileName}>
      {translate(locale, "download")} {output.fileName}
    </a>
  );
}

function explainError(locale: "en" | "es", message: string): string {
  if (message.includes("not_in_this_build") || message.includes("not wired") || message.includes("not_in_build")) return translate(locale, "err_not_in_build");
  if (message === "pages" || message.includes("Page range") || message.includes("page")) return translate(locale, "err_pages");
  if (message.includes("preview did not") || message.includes("not installed")) return translate(locale, "err_preview");
  if (message.includes("not a PDF") || message === "not_pdf") return translate(locale, "err_not_pdf");
  if (message === "delete_all") return translate(locale, "err_delete_all");
  if (message === "pdf_unreadable") return translate(locale, "err_pdf_unreadable");
  if (message === "file_count" || message.includes("file count")) return translate(locale, "err_file_count");
  return message || translate(locale, "err_generic");
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
