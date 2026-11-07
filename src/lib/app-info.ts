// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

export const APP_NAME = "ToolZen";
export const APP_VERSION = "0.1.1";
export const APP_IDENTIFIER = "com.toolszen.desktop";
export const LICENSE_SPDX = "Apache-2.0";
export const COPYRIGHT_NOTICE = "Copyright 2026 ToolZen Contributors";

export const ALLOWED_EXTERNAL_URLS = [
  "https://tools-zen.com/",
  "https://github.com/AntonioA2006/toolzen-desktop",
  "https://www.apache.org/licenses/LICENSE-2.0",
] as const;

export type AllowedExternalUrl = (typeof ALLOWED_EXTERNAL_URLS)[number];

export const REPOSITORY_URL: AllowedExternalUrl = "https://github.com/AntonioA2006/toolzen-desktop";
export const WEBSITE_URL: AllowedExternalUrl = "https://tools-zen.com/";
export const LICENSE_URL: AllowedExternalUrl = "https://www.apache.org/licenses/LICENSE-2.0";
