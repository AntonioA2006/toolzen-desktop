// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
