// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import type { ExecutionCapabilities, ExecutionOutcome, ExecutionRequest } from "./types";

/**
 * Vendor-neutral cloud provider contract.
 * This release has no concrete provider, no network client, and no successful execute path.
 * A future provider subclasses this type and is registered with ExecutionManager.
 * Registration does not require tool definitions to change.
 */
export abstract class CloudExecutionProvider {
  abstract readonly id: string;
  readonly mode = "cloud" as const;

  abstract isAvailable(): boolean;

  abstract supports(capabilities: ExecutionCapabilities): boolean;

  abstract execute(request: ExecutionRequest<unknown>): Promise<ExecutionOutcome<unknown>>;
}

/** Interfaces only. None of these types perform I/O. */
export interface CloudApiClient {
  readonly providerId: string;
}

export interface CloudAuthProvider {
  readonly providerId: string;
}

export interface RemoteJobRequest {
  toolId: string;
  region: string | null;
  resourceClass: "cpu" | "gpu" | null;
}

export interface RemoteJobHandle {
  jobId: string;
  providerId: string;
}

export interface RemoteJobStatus {
  jobId: string;
  state: "queued" | "running" | "succeeded" | "failed" | "cancelled";
}

export interface RemoteJobManager {
  submit(job: RemoteJobRequest): Promise<RemoteJobHandle>;
  cancel(jobId: string): Promise<void>;
  getStatus(jobId: string): Promise<RemoteJobStatus>;
}

export interface FileUploadManager {
  readonly providerId: string;
}

export interface ResultDownloader {
  readonly providerId: string;
}

export interface StatusTracker {
  readonly providerId: string;
}

export interface QuotaReader {
  readonly providerId: string;
}

export interface CloudProviderConfig {
  providerId: string;
  region: string | null;
  resourceClass: "cpu" | "gpu" | null;
}
