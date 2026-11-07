// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import {
  Binary,
  Braces,
  Clock3,
  CodeXml,
  FileText,
  Fingerprint,
  FolderClosed,
  Home,
  Image,
  Info,
  Repeat2,
  Search,
  Settings,
  Star,
  Timer,
  Type,
  type LucideIcon,
} from "lucide-react";
import type { ToolIconName } from "./categories";

export const TOOL_ICONS: Record<ToolIconName, LucideIcon> = {
  braces: Braces,
  fingerprint: Fingerprint,
  binary: Binary,
  "file-text": FileText,
  image: Image,
  type: Type,
  code: CodeXml,
  folder: FolderClosed,
  repeat: Repeat2,
  timer: Timer,
  home: Home,
  star: Star,
  clock: Clock3,
  settings: Settings,
  info: Info,
  search: Search,
};

export function ToolIcon({ name, className }: { name: ToolIconName; className?: string }) {
  const Icon = TOOL_ICONS[name];
  return <Icon className={className} aria-hidden="true" strokeWidth={1.75} />;
}
