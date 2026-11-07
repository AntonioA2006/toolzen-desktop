// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("inline-flex items-center rounded-md border border-line bg-muted px-1.5 py-0.5 text-[11px] font-medium text-subtle", className)}
      {...props}
    />
  );
}
