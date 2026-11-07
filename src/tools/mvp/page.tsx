// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToolRunner } from "@/hooks/use-tool-runner";
import { optionLabel, toolCopy } from "@/lib/catalog-copy";
import { translate } from "@/lib/i18n";
import { saveOutput } from "@/services/output/save";
import { isTauriRuntime } from "@/services/runtime/tauri";
import { usePreferencesStore } from "@/stores/preferences-store";
import { useSessionStore } from "@/stores/session-store";
import { bytesToBase64, type LocalFile, type LocalOutput } from "./images";
import { mvpTool, type MvpToolSpec } from "./specs";
import { readinessOf } from "./status";

export function MvpToolPage() {
  const routeTool = useRouteTool();
  if (!routeTool) return <p className="empty">That tool is not in this release.</p>;
  return <MvpForm spec={routeTool} />;
}

function MvpForm({ spec }: { spec: MvpToolSpec }) {
  const runner = useToolRunner(spec.id);
  const locale = usePreferencesStore((state) => state.preferences.language);
  const readiness = readinessOf(spec.id);
  const copy = toolCopy(locale, spec.id);
  const [files, setFiles] = useState<File[]>([]);
  const [options, setOptions] = useState<Record<string, string>>({});
  const [dragging, setDragging] = useState(false);
  const [saveNote, setSaveNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const output = runner.output as LocalOutput | null;
  const unavailable = readiness === "unavailable";
  const canReorder = spec.maxFiles > 1;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <header>
        <p className={readiness === "ready" ? "status status-ok" : readiness === "partial" ? "status status-warn" : "status status-bad"}>{readiness === "ready" ? translate(locale, "statusReady") : readiness === "partial" ? translate(locale, "statusPartial") : translate(locale, "statusUnavailable")}</p>
        <h1 className="type-display mt-1">{copy.short}</h1>
        <p className="type-meta mt-1">{copy.blurb}</p>
      </header>
      <form
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (unavailable) return;
          setSaveNote(null);
          void submit(spec, files, options, runner.run);
        }}
      >
        <div
          className={`drop${dragging ? " is-over" : ""}`}
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            if (!unavailable) setFiles([...(event.dataTransfer.files ?? [])]);
          }}
        >
          <p className="type-title">{copy.drop}</p>
          <p className="type-meta">{copy.formats} · {translate(locale, "upToMb").replace("{mb}", String(Math.round(spec.maxFileBytes / (1024 * 1024))))}</p>
          <Button type="button" variant="primary" disabled={unavailable || runner.status === "running"} onClick={() => fileRef.current?.click()}>
            {spec.maxFiles > 1 ? translate(locale, "selectFiles") : translate(locale, "selectFile")}
          </Button>
          <input ref={fileRef} className="sr-only" type="file" accept={spec.accept} multiple={spec.maxFiles > 1} disabled={unavailable || runner.status === "running"} aria-label={translate(locale, "files")} onChange={(event) => setFiles([...(event.target.files ?? [])])} />
        </div>
        {files.length > 0 ? (
          <ul className="grid gap-1">
            {files.map((file, index) => (
              <li key={`${file.name}-${file.size}-${index}`} className="panel flex items-center gap-2 px-2 py-1.5">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{file.name}</span>
                  <span className="type-meta">{file.type || translate(locale, "unknownType")} · <span className="mono">{formatSize(file.size)}</span></span>
                </span>
                {canReorder ? (
                  <>
                    <Button type="button" size="sm" aria-label={translate(locale, "moveUp")} disabled={index === 0} onClick={() => setFiles(move(files, index, -1))}>{translate(locale, "moveUp")}</Button>
                    <Button type="button" size="sm" aria-label={translate(locale, "moveDown")} disabled={index === files.length - 1} onClick={() => setFiles(move(files, index, 1))}>{translate(locale, "moveDown")}</Button>
                  </>
                ) : null}
                <Button type="button" size="sm" onClick={() => setFiles(files.filter((_, item) => item !== index))}>{translate(locale, "removeFile")}</Button>
              </li>
            ))}
          </ul>
        ) : null}
        {spec.options.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {spec.options.map((field) => (
              <label key={field.name} className="block">
                <span className="field-label">{optionLabel(locale, spec.id, field.name, field.label)}</span>
                <input
                  className="field-input"
                  type={field.kind === "integer" ? "number" : field.name === "password" ? "password" : "text"}
                  required={field.required}
                  disabled={unavailable}
                  value={options[field.name] ?? ""}
                  onChange={(event) => setOptions((current) => ({ ...current, [field.name]: event.target.value }))}
                />
              </label>
            ))}
          </div>
        ) : null}
        {readiness === "partial" ? <p className="status status-warn">{translate(locale, "partialSplit")}</p> : null}
        {unavailable ? <p className="status status-bad" role="status">{translate(locale, "err_not_in_build")}</p> : null}
        <div className="flex flex-wrap gap-2">
          <Button type="submit" variant="primary" disabled={unavailable || runner.status === "running" || files.length < spec.minFiles}>
            {runner.status === "running" ? translate(locale, "working") : copy.submit}
          </Button>
          {files.length > 0 || output ? <Button type="button" onClick={() => { setFiles([]); setOptions({}); setSaveNote(null); }}>{translate(locale, "processAnother")}</Button> : null}
        </div>
      </form>
      {runner.error ? <p className="status status-bad" role="alert">{explainError(locale, runner.error)}</p> : null}
      {runner.status === "running" ? <p className="type-meta" role="status">{translate(locale, "processing")}</p> : null}
      {output ? (
        <section className="panel grid gap-2 p-3" aria-live="polite">
          <h2 className="type-title">{copy.ready}</h2>
          {runner.note ? <p className="type-meta">{runner.note}</p> : null}
          <p className="type-meta">{output.fileName}</p>
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              void saveOutput(output.fileName, output.mime, output.bytesBase64).then((result) => {
                setSaveNote(result.saved ? (isTauriRuntime() ? translate(locale, "saveDone") : translate(locale, "savePreview")) : translate(locale, "saveCancelled"));
              }).catch((error: unknown) => {
                setSaveNote(error instanceof Error ? error.message : translate(locale, "err_generic"));
              });
            }}
          >
            {translate(locale, "saveAs")}
          </Button>
          {saveNote ? <p className="type-meta" role="status">{saveNote}</p> : null}
        </section>
      ) : null}
    </div>
  );
}

function move(files: File[], index: number, delta: number): File[] {
  const next = index + delta;
  if (next < 0 || next >= files.length) return files;
  const copy = [...files];
  const [item] = copy.splice(index, 1);
  if (!item) return files;
  copy.splice(next, 0, item);
  return copy;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
    encoded.push({ name: file.name, type: file.type, bytesBase64: bytesToBase64(new Uint8Array(await file.arrayBuffer())) });
  }
  await run({ files: encoded, options: parsed });
}

function useRouteTool(): MvpToolSpec | undefined {
  const route = useSessionStore((state) => state.route);
  if (route.name !== "tool") return undefined;
  return mvpTool(route.toolId);
}
