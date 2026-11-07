// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import type { AiCompletionRequest, AiCompletionResult, AiModelDescriptor, AiProvider, AiProviderKind } from "./types";

/**
 * Fail-closed provider. complete() does not call a model or the network.
 * It is not registered with the running app.
 */
export class UnavailableAiProvider implements AiProvider {
  readonly displayName: string;

  constructor(
    readonly id: string,
    readonly kind: AiProviderKind,
    displayName = "Unavailable AI provider",
  ) {
    this.displayName = displayName;
  }

  isOperational(): boolean {
    return false;
  }

  listModels(): readonly AiModelDescriptor[] {
    return [];
  }

  complete(_request: AiCompletionRequest): Promise<AiCompletionResult> {
    return Promise.resolve({
      ok: false,
      error: {
        code: "ai_provider_unavailable",
        message: "No AI provider is operational in this release. No model or network request was made.",
      },
    });
  }
}

export class AiProviderRegistry {
  private readonly providers = new Map<string, AiProvider>();

  register(provider: AiProvider): void {
    this.providers.set(provider.id, provider);
  }

  get(id: string): AiProvider | undefined {
    return this.providers.get(id);
  }

  list(): readonly AiProvider[] {
    return [...this.providers.values()];
  }
}
