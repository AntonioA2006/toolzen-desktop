// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

export const messages = {
  appName: "ToolZen",
  appDescription: "Local utilities for technical work. Processing stays on this device.",
} as const;

export type MessageKey = keyof typeof messages;
