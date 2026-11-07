// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { localExecutionProvider, type LocalExecutionProvider } from "@/services/execution";
import { runBase64, type Base64Input } from "./base64/process";
import { formatJson, type JsonFormatterInput } from "./json-formatter/process";
import { generateUuids, type UuidGeneratorInput } from "./uuid-generator/process";

let registered = false;

export function registerLocalToolHandlers(provider: LocalExecutionProvider = localExecutionProvider): void {
  if (registered && provider === localExecutionProvider) return;
  provider.register("json-formatter", (input) => formatJson(input as JsonFormatterInput));
  provider.register("uuid-generator", (input) => generateUuids(input as UuidGeneratorInput));
  provider.register("base64", (input) => runBase64(input as Base64Input));
  if (provider === localExecutionProvider) registered = true;
}
