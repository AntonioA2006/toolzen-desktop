// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { useState } from "react";
import { ToolFlow } from "@/components/site/tool-flow";
import { SiteIcon } from "@/components/site/icon";
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
  if (!routeTool) return <p className="empty-state">That tool is not in this release.</p>;
  return <MvpForm spec={routeTool} />;
}

function MvpForm({ spec }: { spec: MvpToolSpec }) {
  const runner = useToolRunner(spec.id);
  const locale = usePreferencesStore((state) => state.preferences.language);
  const navigate = usePreferencesStore((state) => state.navigate);
  const readiness = readinessOf(spec.id);
  const copy = toolCopy(locale, spec.id);
  const [files, setFiles] = useState<File[]>([]);
  const [options, setOptions] = useState<Record<string, string>>({});
  const [saveNote, setSaveNote] = useState<string | null>(null);
  const output = runner.output as LocalOutput | null;
  const tone = spec.category === "conversion" ? "conversion" : spec.category === "image" ? "image" : spec.category === "ocr" ? "ocr" : "pdf";
  const unavailable = readiness === "unavailable";

  return (
    <>
      <section className="page-hero page-hero-deep" aria-label={copy.short}>
        <div className="deco" aria-hidden="true">
          <span className="deco-grid" />
          <span className="deco-blob deco-blob-1" />
          <span className="deco-ring deco-ring-1" />
        </div>
        <div className="page-hero-inner">
          <nav className="crumbs" aria-label={translate(locale, "breadcrumbs")}>
            <button type="button" onClick={() => void navigate({ name: "home" })}>{translate(locale, "home")}</button>
            <span aria-hidden="true"> / </span>
            <span>{copy.short}</span>
          </nav>
          <span className="eyebrow eyebrow-on-dark">
            <SiteIcon name={spec.icon} className="size-4" />
            {tone === "conversion" ? translate(locale, "catConvert") : tone === "image" ? translate(locale, "catImage") : tone === "ocr" ? translate(locale, "catOcr") : "PDF"}
          </span>
          <h1>{copy.short}</h1>
          <p className="lead">{copy.blurb}</p>
          <ul className="chip-row">
            <li className="chip chip-on-dark"><SiteIcon name="no-account" className="size-4" /> {translate(locale, "chipNoAccount")}</li>
            <li className="chip chip-on-dark"><SiteIcon name="shield" className="size-4" /> {translate(locale, "chipOnDevice")}</li>
            <li className="chip chip-on-dark"><SiteIcon name="clock" className="size-4" /> {readiness === "partial" ? translate(locale, "statusPartial") : unavailable ? translate(locale, "statusUnavailable") : translate(locale, "statusReady")}</li>
          </ul>
        </div>
      </section>
      <div className="site-main">
        <ToolFlow
          locale={locale}
          icon={spec.icon}
          tone={tone}
          copy={copy}
          multiple={spec.maxFiles > 1}
          maxMb={Math.round(spec.maxFileBytes / (1024 * 1024))}
          files={files.map((file) => ({ name: file.name, size: file.size }))}
          accept={spec.accept}
          unavailable={unavailable}
          partialNote={readiness === "partial" ? translate(locale, "partialSplit") : null}
          status={runner.status}
          error={runner.error ? explainError(locale, runner.error) : null}
          hasOutput={output !== null}
          options={spec.options.length > 0 ? (
            <div className="options-panel">
              <p className="options-title"><SiteIcon name="sliders" className="size-4" /> {translate(locale, "optionsTitle")}</p>
              <div className={`field-row cols-${Math.min(spec.options.length, 4)}`}>
                {spec.options.map((field) => (
                  <div className="field" key={field.name}>
                    <label htmlFor={`${spec.id}-${field.name}`}>{optionLabel(locale, spec.id, field.name, field.label)}</label>
                    <input
                      className="field-control"
                      id={`${spec.id}-${field.name}`}
                      type={field.kind === "integer" ? "number" : field.name === "password" ? "password" : "text"}
                      required={field.required}
                      value={options[field.name] ?? ""}
                      onChange={(event) => setOptions((current) => ({ ...current, [field.name]: event.target.value }))}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          limits={[
            `${copy.formats}.`,
            translate(locale, "limitFiles").replace("{min}", String(spec.minFiles)).replace("{max}", String(spec.maxFiles)),
            translate(locale, "limitSize"),
            translate(locale, "limitLocal"),
          ]}
          onFiles={(list) => {
            setSaveNote(null);
            setFiles(list ? [...list] : []);
          }}
          onSubmit={() => {
            setSaveNote(null);
            void submit(spec, files, options, runner.run);
          }}
          onSave={() => {
            if (!output) return;
            void saveOutput(output.fileName, output.mime, output.bytesBase64).then((result) => {
              if (!result.saved) {
                setSaveNote(translate(locale, "saveCancelled"));
                return;
              }
              setSaveNote(isTauriRuntime() ? translate(locale, "saveDone") : translate(locale, "savePreview"));
            }).catch((error: unknown) => {
              setSaveNote(error instanceof Error ? error.message : translate(locale, "err_generic"));
            });
          }}
          onReset={() => {
            setFiles([]);
            setOptions({});
            setSaveNote(null);
          }}
        />
        {saveNote ? <p className="field-help" role="status">{saveNote}</p> : null}
      </div>
    </>
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
