// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

use std::fs;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::time::Duration;

use serde::{Deserialize, Serialize};
use serde_json::Value;

const MAX_FILE_BYTES: usize = 25 * 1024 * 1024;
const MAX_FILES: usize = 20;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineFile {
    pub name: String,
    pub bytes_base64: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineJob {
    pub tool_id: String,
    pub options: Value,
    pub files: Vec<EngineFile>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EngineOutput {
    pub file_name: String,
    pub mime: String,
    pub bytes_base64: String,
}

pub fn run_engine(job: EngineJob) -> Result<EngineOutput, String> {
    if job.files.is_empty() || job.files.len() > MAX_FILES {
        return Err("The file count is outside the limit for this tool.".into());
    }
    let decoded = decode_files(&job.files)?;
    let dir = temp_dir()?;
    let result = dispatch(&job.tool_id, &job.options, &dir, &decoded);
    let _ = fs::remove_dir_all(&dir);
    result
}

fn dispatch(tool: &str, options: &Value, dir: &Path, files: &[(String, Vec<u8>)]) -> Result<EngineOutput, String> {
    match tool {
        "merge-pdf" => {
            if files.len() < 2 {
                return Err("Merge requires at least two PDFs.".into());
            }
            let inputs = write_inputs(dir, files, "pdf")?;
            let output = dir.join("out.pdf");
            let mut args = vec!["--empty".into(), "--pages".into()];
            args.extend(inputs.iter().map(|path| path.display().to_string()));
            args.push("--".into());
            args.push(output.display().to_string());
            run_bin("qpdf", &args, dir, 30)?;
            pdf_out(&output, "merged.pdf")
        }
        "extract-pdf-pages" | "split-pdf" => {
            let spec = page_spec(options)?;
            let input = write_one(dir, files, "pdf")?;
            let output = dir.join("out.pdf");
            run_bin("qpdf", &["--empty".into(), "--pages".into(), input.display().to_string(), spec, "--".into(), output.display().to_string()], dir, 30)?;
            pdf_out(&output, "pages.pdf")
        }
        "delete-pdf-pages" => Err("Delete PDF pages needs the reference keep-set calculation. It is not wired, so nothing was written.".into()),
        "rotate-pdf" => {
            let angle = options.get("rotation").and_then(Value::as_i64).unwrap_or(0);
            if !matches!(angle, 90 | 180 | 270) {
                return Err("Rotation must be 90, 180, or 270.".into());
            }
            let pages = options.get("pages").and_then(Value::as_str).unwrap_or("").trim().to_string();
            let arg = if pages.is_empty() { format!("--rotate={angle}") } else { format!("--rotate={angle}:{pages}") };
            let input = write_one(dir, files, "pdf")?;
            let output = dir.join("out.pdf");
            run_bin("qpdf", &[input.display().to_string(), arg, "--".into(), output.display().to_string()], dir, 30)?;
            pdf_out(&output, "rotated.pdf")
        }
        "protect-pdf" => protect(dir, files, options, true),
        "unlock-pdf" => protect(dir, files, options, false),
        "compress-pdf" => {
            let input = write_one(dir, files, "pdf")?;
            let output = dir.join("out.pdf");
            run_bin(
                "gs",
                &[
                    "-dSAFER".into(),
                    "-dNOPAUSE".into(),
                    "-dBATCH".into(),
                    "-dQUIET".into(),
                    "-sDEVICE=pdfwrite".into(),
                    "-dCompatibilityLevel=1.4".into(),
                    "-dPDFSETTINGS=/ebook".into(),
                    format!("-sOutputFile={}", output.display()),
                    input.display().to_string(),
                ],
                dir,
                120,
            )?;
            pdf_out(&output, "compressed.pdf")
        }
        "pdf-to-jpg" => raster(dir, files),
        "word-to-pdf" | "pdf-to-word" => office(dir, files, tool),
        "image-to-text" => ocr(dir, files),
        "watermark-pdf" | "crop-pdf" => Err(format!("{tool} is in the catalogue, but this desktop build does not run that engine step yet. Nothing was written.")),
        _ => Err("That tool has no local engine.".into()),
    }
}

fn protect(dir: &Path, files: &[(String, Vec<u8>)], options: &Value, encrypt: bool) -> Result<EngineOutput, String> {
    let password = options.get("password").and_then(Value::as_str).unwrap_or("").to_string();
    if password.len() < 4 || password.len() > 128 {
        return Err("Use a password between 4 and 128 characters.".into());
    }
    let input = write_one(dir, files, "pdf")?;
    let output = dir.join("out.pdf");
    if encrypt {
        let job = dir.join("job.json");
        let body = serde_json::json!({
            "inputFile": input.display().to_string(),
            "outputFile": output.display().to_string(),
            "encrypt": { "userPassword": password, "ownerPassword": password, "256bit": {} }
        });
        fs::write(&job, body.to_string()).map_err(|error| error.to_string())?;
        run_bin("qpdf", &[format!("--job-json-file={}", job.display())], dir, 30)?;
        pdf_out(&output, "protected.pdf")
    } else {
        let pw = dir.join("password.txt");
        fs::write(&pw, &password).map_err(|error| error.to_string())?;
        run_bin("qpdf", &[format!("--password-file={}", pw.display()), "--decrypt".into(), input.display().to_string(), "--".into(), output.display().to_string()], dir, 30)?;
        pdf_out(&output, "unlocked.pdf")
    }
}

fn raster(dir: &Path, files: &[(String, Vec<u8>)]) -> Result<EngineOutput, String> {
    let input = write_one(dir, files, "pdf")?;
    run_bin("pdftoppm", &["-jpeg".into(), "-r".into(), "150".into(), "-f".into(), "1".into(), "-l".into(), "1".into(), input.display().to_string(), dir.join("page").display().to_string()], dir, 90)?;
    let jpeg = dir.join("page-1.jpg");
    let bytes = fs::read(&jpeg).map_err(|_| "pdftoppm did not write a JPEG. Nothing was returned.".to_string())?;
    Ok(EngineOutput { file_name: "page-1.jpg".into(), mime: "image/jpeg".into(), bytes_base64: base64_encode(&bytes) })
}

fn office(dir: &Path, files: &[(String, Vec<u8>)], tool: &str) -> Result<EngineOutput, String> {
    let ext = if tool == "word-to-pdf" { "docx" } else { "pdf" };
    let input = write_one(dir, files, ext)?;
    let target = if tool == "word-to-pdf" { "pdf" } else { "docx" };
    run_bin("libreoffice", &["--headless".into(), "--nologo".into(), "--nofirststartwizard".into(), "--norestore".into(), "--convert-to".into(), target.into(), "--outdir".into(), dir.display().to_string(), input.display().to_string()], dir, 150)?;
    let produced = fs::read_dir(dir).map_err(|error| error.to_string())?.filter_map(|entry| entry.ok()).map(|entry| entry.path()).find(|path| path.extension().and_then(|ext| ext.to_str()) == Some(target));
    let path = produced.ok_or_else(|| "LibreOffice did not produce an output file.".to_string())?;
    let bytes = fs::read(&path).map_err(|error| error.to_string())?;
    let mime = if target == "pdf" { "application/pdf" } else { "application/vnd.openxmlformats-officedocument.wordprocessingml.document" };
    Ok(EngineOutput { file_name: format!("converted.{target}"), mime: mime.into(), bytes_base64: base64_encode(&bytes) })
}

fn ocr(dir: &Path, files: &[(String, Vec<u8>)]) -> Result<EngineOutput, String> {
    let input = write_one(dir, files, "img")?;
    let output = Command::new("tesseract")
        .args([input.as_os_str(), std::ffi::OsStr::new("stdout"), std::ffi::OsStr::new("-l"), std::ffi::OsStr::new("eng")])
        .current_dir(dir)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .map_err(|_| "tesseract is not installed. No text was extracted.".to_string())?;
    if !output.status.success() {
        return Err(stderr_message("tesseract", &output.stderr));
    }
    Ok(EngineOutput { file_name: "text.txt".into(), mime: "text/plain".into(), bytes_base64: base64_encode(&output.stdout) })
}

fn run_bin(binary: &str, args: &[String], dir: &Path, timeout_seconds: u64) -> Result<(), String> {
    let mut child = Command::new(binary)
        .args(args)
        .current_dir(dir)
        .stdout(Stdio::null())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|_| format!("{binary} is not installed. Nothing was processed."))?;
    let started = std::time::Instant::now();
    loop {
        if started.elapsed() > Duration::from_secs(timeout_seconds) {
            let _ = child.kill();
            return Err(format!("{binary} exceeded {timeout_seconds} seconds and was stopped."));
        }
        match child.try_wait() {
            Ok(Some(status)) => {
                if status.success() {
                    return Ok(());
                }
                let mut stderr = String::new();
                if let Some(mut pipe) = child.stderr.take() {
                    use std::io::Read;
                    let _ = pipe.read_to_string(&mut stderr);
                }
                return Err(stderr_message(binary, stderr.as_bytes()));
            }
            Ok(None) => std::thread::sleep(Duration::from_millis(30)),
            Err(error) => return Err(error.to_string()),
        }
    }
}

fn stderr_message(binary: &str, stderr: &[u8]) -> String {
    let text = String::from_utf8_lossy(stderr);
    let trimmed = text.trim();
    if trimmed.is_empty() {
        format!("{binary} failed. Nothing was saved.")
    } else {
        format!("{binary} failed. {trimmed}")
    }
}

fn page_spec(options: &Value) -> Result<String, String> {
    let raw = options.get("pages").and_then(Value::as_str).unwrap_or("").trim().to_string();
    if raw.is_empty() || raw.len() > 200 || raw.contains("..") || raw.chars().any(|ch| !(ch.is_ascii_digit() || ch == ',' || ch == '-' || ch == ' ')) {
        return Err("Page range format is not valid.".into());
    }
    Ok(raw.replace(' ', ""))
}

fn decode_files(files: &[EngineFile]) -> Result<Vec<(String, Vec<u8>)>, String> {
    files
        .iter()
        .map(|file| {
            let bytes = base64_decode(&file.bytes_base64)?;
            if bytes.len() > MAX_FILE_BYTES {
                return Err("A file is larger than 25 MB.".into());
            }
            let name = Path::new(&file.name).file_name().and_then(|name| name.to_str()).unwrap_or("input.bin");
            Ok((name.to_string(), bytes))
        })
        .collect()
}

fn write_inputs(dir: &Path, files: &[(String, Vec<u8>)], ext: &str) -> Result<Vec<PathBuf>, String> {
    files
        .iter()
        .enumerate()
        .map(|(index, (_, bytes))| {
            let path = dir.join(format!("in-{index:02}.{ext}"));
            fs::write(&path, bytes).map_err(|error| error.to_string())?;
            Ok(path)
        })
        .collect()
}

fn write_one(dir: &Path, files: &[(String, Vec<u8>)], ext: &str) -> Result<PathBuf, String> {
    if files.len() != 1 {
        return Err("This tool accepts one file.".into());
    }
    write_inputs(dir, files, ext)?.into_iter().next().ok_or_else(|| "Missing file.".into())
}

fn pdf_out(path: &Path, name: &str) -> Result<EngineOutput, String> {
    let bytes = fs::read(path).map_err(|_| "The engine did not write a PDF.".to_string())?;
    if !bytes.starts_with(b"%PDF") {
        return Err("The engine output is not a PDF. Nothing was saved.".into());
    }
    Ok(EngineOutput { file_name: name.into(), mime: "application/pdf".into(), bytes_base64: base64_encode(&bytes) })
}

fn temp_dir() -> Result<PathBuf, String> {
    let dir = std::env::temp_dir().join(format!("toolzen-engine-{}", std::process::id()));
    let dir = dir.join(format!("{}", std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map_err(|error| error.to_string())?.as_nanos()));
    fs::create_dir_all(&dir).map_err(|error| error.to_string())?;
    Ok(dir)
}

fn base64_encode(bytes: &[u8]) -> String {
    const TABLE: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut out = String::new();
    for chunk in bytes.chunks(3) {
        let b0 = chunk[0] as u32;
        let b1 = *chunk.get(1).unwrap_or(&0) as u32;
        let b2 = *chunk.get(2).unwrap_or(&0) as u32;
        let n = (b0 << 16) | (b1 << 8) | b2;
        out.push(TABLE[((n >> 18) & 63) as usize] as char);
        out.push(TABLE[((n >> 12) & 63) as usize] as char);
        out.push(if chunk.len() > 1 { TABLE[((n >> 6) & 63) as usize] as char } else { '=' });
        out.push(if chunk.len() > 2 { TABLE[(n & 63) as usize] as char } else { '=' });
    }
    out
}

fn base64_decode(value: &str) -> Result<Vec<u8>, String> {
    fn val(byte: u8) -> Result<u8, String> {
        match byte {
            b'A'..=b'Z' => Ok(byte - b'A'),
            b'a'..=b'z' => Ok(byte - b'a' + 26),
            b'0'..=b'9' => Ok(byte - b'0' + 52),
            b'+' => Ok(62),
            b'/' => Ok(63),
            _ => Err("File data is not valid base64.".into()),
        }
    }
    let bytes = value.as_bytes();
    let mut out = Vec::new();
    let mut index = 0;
    while index < bytes.len() {
        if bytes[index] == b'=' { break; }
        let b0 = val(bytes[index])?;
        let b1 = val(*bytes.get(index + 1).ok_or("File data is not valid base64.")?)?;
        let b2 = bytes.get(index + 2).copied().unwrap_or(b'=');
        let b3 = bytes.get(index + 3).copied().unwrap_or(b'=');
        let n = ((b0 as u32) << 18) | ((b1 as u32) << 12) | (if b2 == b'=' { 0 } else { val(b2)? as u32 } << 6) | if b3 == b'=' { 0 } else { val(b3)? as u32 };
        out.push(((n >> 16) & 255) as u8);
        if b2 != b'=' { out.push(((n >> 8) & 255) as u8); }
        if b3 != b'=' { out.push((n & 255) as u8); }
        index += 4;
    }
    Ok(out)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn tiny_pdf() -> Vec<u8> {
        let path = std::env::temp_dir().join(format!("toolzen-src-{}.pdf", std::process::id()));
        let status = Command::new("gs")
            .args(["-q", "-o", path.to_str().unwrap(), "-sDEVICE=pdfwrite", "-c", "showpage"])
            .status()
            .expect("gs");
        assert!(status.success());
        fs::read(&path).unwrap()
    }

    #[test]
    fn merge_two_pdfs_with_qpdf() {
        let bytes = tiny_pdf();
        let file = |name: &str| EngineFile { name: name.into(), bytes_base64: base64_encode(&bytes) };
        let output = run_engine(EngineJob {
            tool_id: "merge-pdf".into(),
            options: Value::Object(Default::default()),
            files: vec![file("a.pdf"), file("b.pdf")],
        })
        .expect("merge");
        let merged = base64_decode(&output.bytes_base64).unwrap();
        assert!(merged.starts_with(b"%PDF"));
        let merged_path = std::env::temp_dir().join(format!("toolzen-merged-{}.pdf", std::process::id()));
        fs::write(&merged_path, &merged).unwrap();
        let pages = Command::new("qpdf").args(["--show-npages", merged_path.to_str().unwrap()]).output().unwrap();
        assert_eq!(String::from_utf8_lossy(&pages.stdout).trim(), "2");
    }

    #[test]
    fn missing_office_engine_does_not_invent_a_pdf() {
        let error = run_engine(EngineJob {
            tool_id: "word-to-pdf".into(),
            options: Value::Object(Default::default()),
            files: vec![EngineFile { name: "a.docx".into(), bytes_base64: base64_encode(b"not a document") }],
        })
        .unwrap_err();
        assert!(error.contains("not installed") || error.contains("failed") || error.contains("did not produce"));
    }
}
