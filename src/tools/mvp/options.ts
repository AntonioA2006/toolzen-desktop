// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import type { MessageKey } from "@/lib/i18n";
import { parsePageSpec } from "@/tools/mvp/pages";
import type { ToolOptionField } from "@/tools/mvp/specs";

/** Client checks that match the engines. Does not add controls the tool never had. */
export function optionProblem(field: ToolOptionField, value: string): MessageKey | null {
  const raw = value.trim();
  if (raw === "") return field.required ? "err_required" : null;
  if (field.name === "pages") return parsePageSpec(raw).ok ? null : "err_pages";
  if (field.kind !== "integer") return null;
  if (!/^-?\d+$/.test(raw)) return "err_integer";
  const number = Number(raw);
  if (field.name === "rotation") return number === 90 || number === 180 || number === 270 ? null : "err_rotation";
  if (field.name === "width" || field.name === "height") return number >= 1 ? null : "err_dimension";
  if (field.name === "x" || field.name === "y" || field.name.endsWith("_mm")) return number >= 0 ? null : "err_origin";
  return null;
}

export function integerBounds(name: string): { min?: number; max?: number; step: number } {
  if (name === "rotation") return { min: 90, max: 270, step: 90 };
  if (name === "width" || name === "height") return { min: 1, step: 1 };
  if (name === "x" || name === "y" || name.endsWith("_mm")) return { min: 0, step: 1 };
  return { step: 1 };
}
