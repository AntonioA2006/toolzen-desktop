// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

use serde::{Deserialize, Serialize};

/// Native boundary types for a future Rust tool adapter.
/// No command in this module performs cloud I/O or pretends a tool ran.
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub enum ExecutionMode {
    Local,
    Cloud,
    Auto,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct NativeExecutionRequest {
    pub tool_id: String,
    pub mode: ExecutionMode,
    pub payload_json: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct PreparedLocalRequest {
    pub tool_id: String,
    pub resolved_mode: ExecutionMode,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct NativeExecutionError {
    pub code: String,
    pub message: String,
}

pub fn prepare_native_request(request: NativeExecutionRequest) -> Result<PreparedLocalRequest, NativeExecutionError> {
    if !crate::db::valid_identifier(&request.tool_id) {
        return Err(error("invalid_tool", "The tool id is not valid. Nothing was executed."));
    }
    if request.payload_json.len() > 1_000_000 {
        return Err(error("input_too_large", "The payload is too large. Nothing was executed."));
    }
    match request.mode {
        ExecutionMode::Cloud => Err(error(
            "cloud_unavailable",
            "Cloud execution is not available on the native boundary. Local execution was not used as a fallback.",
        )),
        ExecutionMode::Local | ExecutionMode::Auto => Ok(PreparedLocalRequest {
            tool_id: request.tool_id,
            resolved_mode: ExecutionMode::Local,
        }),
    }
}

fn error(code: &str, message: &str) -> NativeExecutionError {
    NativeExecutionError { code: code.to_string(), message: message.to_string() }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn cloud_mode_is_rejected_without_fallback() {
        let result = prepare_native_request(NativeExecutionRequest {
            tool_id: "json-formatter".into(),
            mode: ExecutionMode::Cloud,
            payload_json: "{}".into(),
        });
        assert!(matches!(result, Err(error) if error.code == "cloud_unavailable"));
    }

    #[test]
    fn auto_resolves_to_local() {
        let result = prepare_native_request(NativeExecutionRequest {
            tool_id: "json-formatter".into(),
            mode: ExecutionMode::Auto,
            payload_json: "{}".into(),
        })
        .expect("auto should stay local");
        assert_eq!(result.resolved_mode, ExecutionMode::Local);
    }
}
