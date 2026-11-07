// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

//! Save dialog. The path is chosen inside this process. Callers cannot pass a path.

use std::path::Path;

use serde::Serialize;

const MAX_OUTPUT_BYTES: usize = 25 * 1024 * 1024;

#[derive(Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct SaveResult {
    pub saved: bool,
}

pub fn save_output(suggested_name: String, bytes_base64: String) -> Result<SaveResult, String> {
    let bytes = decode_output_bytes(&bytes_base64)?;
    let name = suggested_file_name(&suggested_name);
    let Some(path) = rfd::FileDialog::new().set_file_name(&name).save_file() else {
        return Ok(SaveResult { saved: false });
    };
    if path.as_os_str().is_empty() {
        return Ok(SaveResult { saved: false });
    }
    commit_output(&path, &bytes)?;
    Ok(SaveResult { saved: true })
}

pub fn suggested_file_name(raw: &str) -> String {
    let base = raw
        .rsplit(['/', '\\'])
        .next()
        .unwrap_or("output.bin")
        .chars()
        .filter(|ch| !ch.is_control() && *ch != '\0')
        .take(180)
        .collect::<String>();
    let trimmed = base.trim().trim_start_matches('.').to_string();
    if trimmed.is_empty() {
        "output.bin".into()
    } else {
        trimmed
    }
}

pub fn decode_output_bytes(value: &str) -> Result<Vec<u8>, String> {
    if value.len() > MAX_OUTPUT_BYTES * 2 {
        return Err("file_too_large".into());
    }
    let bytes = base64_decode(value)?;
    if bytes.len() > MAX_OUTPUT_BYTES {
        return Err("file_too_large".into());
    }
    Ok(bytes)
}

pub fn commit_output(path: &Path, bytes: &[u8]) -> Result<(), String> {
    if path.as_os_str().is_empty() || path.is_dir() {
        return Err("save_path".into());
    }
    if let Some(parent) = path.parent() {
        if !parent.as_os_str().is_empty() && !parent.exists() {
            return Err("save_path".into());
        }
    }
    std::fs::write(path, bytes).map_err(|_| "save_failed".to_string())?;
    let written = std::fs::read(path).map_err(|_| "save_failed".to_string())?;
    if written != bytes {
        return Err("save_failed".into());
    }
    Ok(())
}

fn base64_decode(value: &str) -> Result<Vec<u8>, String> {
    fn val(byte: u8) -> Result<u8, String> {
        match byte {
            b'A'..=b'Z' => Ok(byte - b'A'),
            b'a'..=b'z' => Ok(byte - b'a' + 26),
            b'0'..=b'9' => Ok(byte - b'0' + 52),
            b'+' => Ok(62),
            b'/' => Ok(63),
            _ => Err("file_data".into()),
        }
    }
    let bytes = value.as_bytes();
    if !bytes.len().is_multiple_of(4) {
        return Err("file_data".into());
    }
    let mut out = Vec::new();
    for chunk in bytes.chunks(4) {
        let (a, b, c, d) = (chunk[0], chunk[1], chunk[2], chunk[3]);
        let pad = (c == b'=') as usize + (d == b'=') as usize;
        let av = val(a)?;
        let bv = val(b)?;
        let cv = if c == b'=' { 0 } else { val(c)? };
        let dv = if d == b'=' { 0 } else { val(d)? };
        out.push((av << 2) | (bv >> 4));
        if pad < 2 {
            out.push((bv << 4) | (cv >> 2));
        }
        if pad < 1 {
            out.push((cv << 6) | dv);
        }
    }
    Ok(out)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn names_drop_directories_and_cancel_writes_nothing() {
        assert_eq!(suggested_file_name("../secret/pages.pdf"), "pages.pdf");
        assert_eq!(suggested_file_name("..\\pages.pdf"), "pages.pdf");
        assert_eq!(suggested_file_name(""), "output.bin");
        let missing =
            std::env::temp_dir().join(format!("toolzen-save-missing-{}-nope", std::process::id()));
        let err = commit_output(&missing.join("nested.pdf"), b"abc").unwrap_err();
        assert_eq!(err, "save_path");
        assert!(!missing.exists());
    }

    #[test]
    fn commit_writes_the_same_bytes_and_rejects_oversize() {
        let path =
            std::env::temp_dir().join(format!("toolzen-save-{}-out.bin", std::process::id()));
        let _ = std::fs::remove_file(&path);
        commit_output(&path, b"%PDF-ok").unwrap();
        assert_eq!(std::fs::read(&path).unwrap(), b"%PDF-ok");
        let _ = std::fs::remove_file(&path);
        let huge = "A".repeat(25 * 1024 * 1024 * 2 + 4);
        assert_eq!(decode_output_bytes(&huge).unwrap_err(), "file_too_large");
        assert_eq!(decode_output_bytes("YQ==").unwrap(), b"a");
    }
}
