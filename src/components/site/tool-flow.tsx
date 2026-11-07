// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors
// Structure and class names follow resources/views/components/tool-flow.blade.php at b600a8d.
// The server upload, 30-minute expiry, and automatic <a download> are not used.
// Saving opens the native dialog, or one revoked blob in the browser preview.

import { useState, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n";
import { translate } from "@/lib/i18n";
import { Glyph } from "./glyph";
import { SiteIcon } from "./icon";

export interface FlowFile {
  name: string;
  size: number;
}

export function ToolFlow({
  locale,
  icon,
  tone,
  copy,
  multiple,
  maxMb,
  files,
  accept,
  unavailable,
  partialNote,
  status,
  error,
  hasOutput,
  options,
  limits,
  onFiles,
  onSubmit,
  onSave,
  onReset,
}: {
  locale: Locale;
  icon: string;
  tone: string;
  copy: { drop: string; idle: string; ready: string; error: string; submit: string; formats: string };
  multiple: boolean;
  maxMb: number;
  files: readonly FlowFile[];
  accept: string;
  unavailable: boolean;
  partialNote: string | null;
  status: "idle" | "running" | "success" | "error";
  error: string | null;
  hasOutput: boolean;
  options: ReactNode;
  limits: readonly string[];
  onFiles: (list: FileList | null) => void;
  onSubmit: () => void;
  onSave: () => void;
  onReset: () => void;
}) {
  const [dragging, setDragging] = useState(false);
  const busy = status === "running";
  const ready = status === "success" && hasOutput;
  const failed = status === "error";
  const step = ready ? 3 : busy ? 2 : 1;
  const dropClass = `dropzone${dragging ? " is-dragging" : ""}${failed ? " is-error" : ""}`;

  return (
    <div className="tool-flow workspace">
      <div className="workspace-panel">
        <div className="workspace-head">
          <span className="workspace-status">
            <Glyph icon={icon} tone={tone} size="sm" />
            <span>{ready ? copy.ready : failed ? copy.error : busy ? translate(locale, "processing") : copy.idle}</span>
          </span>
          <ol className="stepper" aria-hidden="true">
            <li className={step === 1 ? "is-active" : "is-done"}><b>1</b> {translate(locale, "stepChoose")}</li>
            <li className={step === 2 ? "is-active" : step > 2 ? "is-done" : ""}><b>2</b> {translate(locale, "stepProcess")}</li>
            <li className={step === 3 ? "is-active" : ""}><b>3</b> {translate(locale, "stepSave")}</li>
          </ol>
        </div>
        <div className="workspace-grid has-aside">
          <div>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (!unavailable) onSubmit();
              }}
            >
              <div>
                <div
                  className={dropClass}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault();
                    setDragging(false);
                    if (!unavailable) onFiles(event.dataTransfer.files);
                  }}
                >
                  <span className="dropzone-art" aria-hidden="true">
                    <span className="dropzone-sheet dropzone-sheet-back" />
                    <span className="dropzone-sheet dropzone-sheet-back2" />
                    <span className="dropzone-sheet" />
                    <span className="dropzone-badge"><SiteIcon name="upload" className="size-5" /></span>
                  </span>
                  <p className="dropzone-title">{copy.drop}</p>
                  <p className="dropzone-hint">{multiple ? translate(locale, "dropMany") : translate(locale, "dropOne")}</p>
                  <span className="btn btn-blue dropzone-cta" aria-hidden="true">
                    <SiteIcon name="plus" className="size-4" />
                    {multiple ? translate(locale, "selectFiles") : translate(locale, "selectFile")}
                  </span>
                  <p className="dropzone-formats">{copy.formats} · {translate(locale, "upToMb").replace("{mb}", String(maxMb))}</p>
                  <input
                    className="file-input"
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    disabled={unavailable || busy}
                    onChange={(event) => onFiles(event.target.files)}
                  />
                </div>
                {files.length > 0 ? (
                  <>
                    <div className="file-head">
                      <p>{translate(locale, "fileSummary").replace("{count}", String(files.length))}</p>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => onFiles(null)}>
                        <SiteIcon name="trash" className="size-4" />
                        {translate(locale, "removeAll")}
                      </button>
                    </div>
                    <ul className="file-list">
                      {files.map((file, index) => (
                        <li className="file-card" key={`${file.name}-${index}`}>
                          <span className="glyph glyph-pdf glyph-sm" aria-hidden="true">{extension(file.name)}</span>
                          <span className="file-body">
                            <span className="file-name">{file.name}</span>
                            <span className="file-meta">
                              <span>{formatSize(file.size)}</span>
                              <i aria-hidden="true" />
                              <span>{index + 1}</span>
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
                {options}
                {partialNote ? <p className="field-help">{partialNote}</p> : null}
                <div className="submit-row">
                  <button className="btn btn-primary btn-lg btn-block" type="submit" disabled={unavailable || busy || files.length === 0}>
                    {busy ? translate(locale, "working") : copy.submit}
                    <SiteIcon name="arrow-right" className="size-5 icon-arrow" />
                  </button>
                </div>
                <ul className="trust-row">
                  <li>
                    <SiteIcon name="shield" className="size-4" />
                    {translate(locale, "localTrust")}
                  </li>
                </ul>
              </div>
            </form>
            {unavailable ? (
              <p className="alert alert-danger" role="alert">
                <SiteIcon name="alert" className="size-5" />
                {translate(locale, "err_not_in_build")}
              </p>
            ) : null}
            {failed && error ? (
              <p className="alert alert-danger" role="alert">
                <SiteIcon name="alert" className="size-5" />
                <span>{error}</span>
              </p>
            ) : null}
            {busy ? (
              <div className="state-panel">
                <span className="state-art" aria-hidden="true">
                  <span className="spinner" />
                  <Glyph icon={icon} tone={tone} />
                </span>
                <p className="state-title">{translate(locale, "processing")}</p>
                <div className="progress-bar is-indeterminate" role="progressbar" aria-busy="true" aria-label={translate(locale, "processing")}><span /></div>
              </div>
            ) : null}
            {ready ? (
              <section aria-live="polite">
                <div className="result-panel">
                  <Glyph icon="check-circle" tone="ocr" size="lg" />
                  <p className="state-title">{copy.ready}</p>
                  <p className="state-text">{translate(locale, "saveHint")}</p>
                  <div className="result-actions">
                    <button type="button" className="btn btn-primary btn-lg btn-block" onClick={onSave}>
                      <SiteIcon name="download" className="size-5" />
                      {translate(locale, "saveAs")}
                    </button>
                    <button type="button" className="btn btn-outline btn-block" onClick={onReset}>
                      <SiteIcon name="refresh" className="size-4" />
                      {translate(locale, "processAnother")}
                    </button>
                  </div>
                </div>
              </section>
            ) : null}
          </div>
          <aside className="workspace-aside">
            <section className="limits">
              <h2>{translate(locale, "limits")}</h2>
              <ul>
                {limits.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </section>
            <div className="info-card">
              <h2><SiteIcon name="clock" className="size-4" /> {translate(locale, "retentionTitle")}</h2>
              <p>{translate(locale, "localRetention")}</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function extension(name: string): string {
  const part = name.split(".").pop() ?? "file";
  return part.slice(0, 4).toUpperCase();
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
