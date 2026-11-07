// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

//! In-process PDF operations. File bytes come from the user's selection.
//! This module does not receive filesystem paths and does not spawn a shell.

use std::collections::BTreeMap;

use lopdf::{Dictionary, Document, Object, ObjectId};
use serde::{Deserialize, Serialize};
use serde_json::Value;

const MAX_FILE_BYTES: usize = 25 * 1024 * 1024;
const MAX_FILES: usize = 20;
const MAX_PAGES: usize = 200;

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
        return Err("file_count".into());
    }
    let files = decode_files(&job.files)?;
    match job.tool_id.as_str() {
        "merge-pdf" => {
            if files.len() < 2 {
                return Err("merge_needs_two".into());
            }
            let mut docs = Vec::new();
            for (_, bytes) in &files {
                docs.push(load_pdf(bytes)?);
            }
            let mut merged = docs.remove(0);
            for doc in &docs {
                append_document(&mut merged, doc)?;
            }
            pdf_output(merged, "merged.pdf")
        }
        "extract-pdf-pages" | "split-pdf" => {
            let spec = pages_option(&job.options, true)?.ok_or("pages")?;
            let mut doc = load_pdf(&files.first().ok_or("file_count")?.1)?;
            let keep = expand_pages(&spec, page_count(&doc)?)?;
            keep_pages(&mut doc, &keep)?;
            pdf_output(doc, "pages.pdf")
        }
        "delete-pdf-pages" => {
            let spec = pages_option(&job.options, true)?.ok_or("pages")?;
            let mut doc = load_pdf(&files.first().ok_or("file_count")?.1)?;
            let total = page_count(&doc)?;
            let remove = expand_pages(&spec, total)?;
            let keep: Vec<u32> = (1..=total).filter(|page| !remove.contains(page)).collect();
            if keep.is_empty() {
                return Err("delete_all".into());
            }
            keep_pages(&mut doc, &keep)?;
            pdf_output(doc, "deleted.pdf")
        }
        "rotate-pdf" => {
            let angle = job
                .options
                .get("rotation")
                .and_then(Value::as_i64)
                .unwrap_or(0);
            if !matches!(angle, 90 | 180 | 270) {
                return Err("rotation".into());
            }
            let mut doc = load_pdf(&files.first().ok_or("file_count")?.1)?;
            let total = page_count(&doc)?;
            let selected = match pages_option(&job.options, false)? {
                Some(spec) => expand_pages(&spec, total)?,
                None => (1..=total).collect(),
            };
            rotate_pages(&mut doc, &selected, angle as i32)?;
            pdf_output(doc, "rotated.pdf")
        }
        "compress-pdf" | "crop-pdf" | "watermark-pdf" | "protect-pdf" | "unlock-pdf"
        | "pdf-to-jpg" | "word-to-pdf" | "pdf-to-word" | "image-to-text" => {
            Err(format!("not_in_this_build:{tool}", tool = job.tool_id))
        }
        _ => Err("unknown_tool".into()),
    }
}

fn load_pdf(bytes: &[u8]) -> Result<Document, String> {
    if !bytes.starts_with(b"%PDF") {
        return Err("not_pdf".into());
    }
    let doc = Document::load_mem(bytes).map_err(|_| "pdf_unreadable".to_string())?;
    if page_count(&doc)? > MAX_PAGES as u32 {
        return Err("too_many_pages".into());
    }
    Ok(doc)
}

fn page_count(doc: &Document) -> Result<u32, String> {
    let count = doc.get_pages().len();
    if count == 0 {
        return Err("no_pages".into());
    }
    Ok(count as u32)
}

fn pdf_output(mut doc: Document, name: &str) -> Result<EngineOutput, String> {
    let mut bytes = Vec::new();
    doc.save_to(&mut bytes)
        .map_err(|_| "pdf_save".to_string())?;
    if !bytes.starts_with(b"%PDF") {
        return Err("pdf_save".into());
    }
    Ok(EngineOutput {
        file_name: name.into(),
        mime: "application/pdf".into(),
        bytes_base64: base64_encode(&bytes),
    })
}

fn append_document(dest: &mut Document, src: &Document) -> Result<(), String> {
    let offset = dest.objects.keys().map(|id| id.0).max().unwrap_or(0);
    let mut map = BTreeMap::new();
    for id in src.objects.keys() {
        map.insert(*id, (id.0 + offset, id.1));
    }
    for (old_id, object) in &src.objects {
        let mut cloned = object.clone();
        renumber(&mut cloned, &map);
        dest.objects.insert(map[old_id], cloned);
    }
    let pages: Vec<ObjectId> = src.page_iter().map(|id| map[&id]).collect();
    let dest_pages = pages_node(dest)?;
    {
        let page_dict = dest
            .get_dictionary_mut(dest_pages)
            .map_err(|_| "pdf_pages".to_string())?;
        let kids = page_dict
            .get_mut(b"Kids")
            .and_then(Object::as_array_mut)
            .map_err(|_| "pdf_pages".to_string())?;
        for page in &pages {
            kids.push(Object::Reference(*page));
        }
    }
    for page in pages {
        if let Ok(dict) = dest.get_dictionary_mut(page) {
            dict.set(b"Parent", Object::Reference(dest_pages));
        }
    }
    let count = dest
        .get_dictionary(dest_pages)
        .and_then(|dict| dict.get(b"Kids"))
        .and_then(Object::as_array)
        .map(|kids| kids.len() as i64)
        .unwrap_or(0);
    dest.get_dictionary_mut(dest_pages)
        .map_err(|_| "pdf_pages".to_string())?
        .set(b"Count", Object::Integer(count));
    Ok(())
}

fn keep_pages(doc: &mut Document, keep: &[u32]) -> Result<(), String> {
    if keep.is_empty() {
        return Err("no_pages".into());
    }
    let current = doc.get_pages();
    let ids: Vec<ObjectId> = keep
        .iter()
        .map(|page| current.get(page).copied().ok_or("page_missing"))
        .collect::<Result<_, _>>()?;
    let pages_id = doc.new_object_id();
    let mut dict = Dictionary::new();
    dict.set(b"Type", Object::Name(b"Pages".to_vec()));
    dict.set(
        b"Kids",
        Object::Array(ids.iter().copied().map(Object::Reference).collect()),
    );
    dict.set(b"Count", Object::Integer(ids.len() as i64));
    doc.set_object(pages_id, Object::Dictionary(dict));
    for id in ids {
        if let Ok(page) = doc.get_dictionary_mut(id) {
            page.set(b"Parent", Object::Reference(pages_id));
        }
    }
    doc.catalog_mut()
        .map_err(|_| "pdf_pages".to_string())?
        .set(b"Pages", Object::Reference(pages_id));
    Ok(())
}

fn rotate_pages(doc: &mut Document, pages: &[u32], angle: i32) -> Result<(), String> {
    let current = doc.get_pages();
    for page_number in pages {
        let id = current.get(page_number).copied().ok_or("page_missing")?;
        let page = doc
            .get_dictionary_mut(id)
            .map_err(|_| "pdf_pages".to_string())?;
        let existing = match page.get(b"Rotate") {
            Ok(Object::Integer(value)) => *value as i32,
            _ => 0,
        };
        let next = (existing + angle).rem_euclid(360) as i64;
        page.set(b"Rotate", Object::Integer(next));
    }
    Ok(())
}

fn pages_node(doc: &Document) -> Result<ObjectId, String> {
    doc.catalog()
        .and_then(|catalog| catalog.get(b"Pages"))
        .and_then(Object::as_reference)
        .map_err(|_| "pdf_pages".to_string())
}

fn renumber(object: &mut Object, map: &BTreeMap<ObjectId, ObjectId>) {
    match object {
        Object::Reference(id) => {
            if let Some(new_id) = map.get(id) {
                *id = *new_id;
            }
        }
        Object::Array(items) => items.iter_mut().for_each(|item| renumber(item, map)),
        Object::Dictionary(dict) => dict.iter_mut().for_each(|(_, value)| renumber(value, map)),
        Object::Stream(stream) => stream
            .dict
            .iter_mut()
            .for_each(|(_, value)| renumber(value, map)),
        _ => {}
    }
}

fn expand_pages(spec: &str, total: u32) -> Result<Vec<u32>, String> {
    let mut pages = Vec::new();
    for part in spec.split(',') {
        let part = part.trim();
        if part.is_empty() {
            return Err("pages".into());
        }
        let mut pieces = part.split('-');
        let start: u32 = pieces
            .next()
            .unwrap_or("")
            .parse()
            .map_err(|_| "pages".to_string())?;
        let end = match pieces.next() {
            Some(value) => value.parse::<u32>().map_err(|_| "pages".to_string())?,
            None => start,
        };
        if pieces.next().is_some() || start == 0 || end < start || end > total {
            return Err("pages".into());
        }
        for page in start..=end {
            if pages.contains(&page) {
                return Err("pages".into());
            }
            pages.push(page);
        }
        if pages.len() > MAX_PAGES {
            return Err("too_many_pages".into());
        }
    }
    if pages.is_empty() {
        return Err("pages".into());
    }
    Ok(pages)
}

fn pages_option(options: &Value, required: bool) -> Result<Option<String>, String> {
    let raw = options
        .get("pages")
        .and_then(Value::as_str)
        .unwrap_or("")
        .trim()
        .to_string();
    if raw.is_empty() {
        return if required {
            Err("pages".into())
        } else {
            Ok(None)
        };
    }
    if raw.len() > 200
        || raw.contains("..")
        || raw
            .chars()
            .any(|ch| !(ch.is_ascii_digit() || matches!(ch, ',' | '-' | ' ')))
    {
        return Err("pages".into());
    }
    Ok(Some(raw))
}

fn decode_files(files: &[EngineFile]) -> Result<Vec<(String, Vec<u8>)>, String> {
    if files.len() > MAX_FILES {
        return Err("file_count".into());
    }
    files
        .iter()
        .map(|file| {
            if file.bytes_base64.len() > MAX_FILE_BYTES * 2 {
                return Err("file_too_large".into());
            }
            let bytes = base64_decode(&file.bytes_base64)?;
            if bytes.len() > MAX_FILE_BYTES {
                return Err("file_too_large".into());
            }
            let name = file
                .name
                .rsplit(['/', '\\'])
                .next()
                .unwrap_or("file")
                .to_string();
            if name.is_empty() || name.contains('\0') {
                return Err("file_name".into());
            }
            Ok((name, bytes))
        })
        .collect()
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
        out.push(if chunk.len() > 1 {
            TABLE[((n >> 6) & 63) as usize] as char
        } else {
            '='
        });
        out.push(if chunk.len() > 2 {
            TABLE[(n & 63) as usize] as char
        } else {
            '='
        });
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
            _ => Err("file_data".into()),
        }
    }
    let bytes = value.as_bytes();
    let mut out = Vec::new();
    let mut index = 0;
    while index < bytes.len() {
        if bytes[index] == b'=' {
            break;
        }
        let b0 = val(bytes[index])?;
        let b1 = val(*bytes.get(index + 1).ok_or("file_data")?)?;
        let b2 = bytes.get(index + 2).copied().unwrap_or(b'=');
        let b3 = bytes.get(index + 3).copied().unwrap_or(b'=');
        let n = ((b0 as u32) << 18)
            | ((b1 as u32) << 12)
            | (if b2 == b'=' { 0 } else { val(b2)? as u32 } << 6)
            | if b3 == b'=' { 0 } else { val(b3)? as u32 };
        out.push(((n >> 16) & 255) as u8);
        if b2 != b'=' {
            out.push(((n >> 8) & 255) as u8);
        }
        if b3 != b'=' {
            out.push((n & 255) as u8);
        }
        index += 4;
    }
    Ok(out)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn one_page() -> Vec<u8> {
        let mut doc = Document::with_version("1.5");
        let pages_id = doc.new_object_id();
        let page_id = doc.new_object_id();
        let mut page = Dictionary::new();
        page.set("Type", Object::Name(b"Page".to_vec()));
        page.set("Parent", Object::Reference(pages_id));
        page.set(
            "MediaBox",
            Object::Array(vec![
                Object::Integer(0),
                Object::Integer(0),
                Object::Integer(200),
                Object::Integer(200),
            ]),
        );
        doc.set_object(page_id, page);
        let mut pages = Dictionary::new();
        pages.set("Type", Object::Name(b"Pages".to_vec()));
        pages.set("Kids", Object::Array(vec![Object::Reference(page_id)]));
        pages.set("Count", 1);
        doc.set_object(pages_id, pages);
        let catalog_id = doc.add_object(Dictionary::from_iter([
            ("Type", Object::Name(b"Catalog".to_vec())),
            ("Pages", Object::Reference(pages_id)),
        ]));
        doc.trailer.set("Root", Object::Reference(catalog_id));
        let mut bytes = Vec::new();
        doc.save_to(&mut bytes).unwrap();
        bytes
    }

    fn file(bytes: &[u8]) -> EngineFile {
        EngineFile {
            name: "a.pdf".into(),
            bytes_base64: base64_encode(bytes),
        }
    }

    #[test]
    fn merge_counts_two_pages() {
        let bytes = one_page();
        let output = run_engine(EngineJob {
            tool_id: "merge-pdf".into(),
            options: Value::Object(serde_json::Map::new()),
            files: vec![file(&bytes), file(&bytes)],
        })
        .unwrap();
        let merged = Document::load_mem(&base64_decode(&output.bytes_base64).unwrap()).unwrap();
        assert_eq!(merged.get_pages().len(), 2);
    }

    #[test]
    fn delete_removes_the_requested_page() {
        let bytes = one_page();
        let merged = run_engine(EngineJob {
            tool_id: "merge-pdf".into(),
            options: Value::Object(serde_json::Map::new()),
            files: vec![file(&bytes), file(&bytes)],
        })
        .unwrap();
        let mut options = serde_json::Map::new();
        options.insert("pages".into(), Value::String("1".into()));
        let output = run_engine(EngineJob {
            tool_id: "delete-pdf-pages".into(),
            options: Value::Object(options),
            files: vec![EngineFile {
                name: "m.pdf".into(),
                bytes_base64: merged.bytes_base64,
            }],
        })
        .unwrap();
        let doc = Document::load_mem(&base64_decode(&output.bytes_base64).unwrap()).unwrap();
        assert_eq!(doc.get_pages().len(), 1);
    }

    #[test]
    fn extract_keeps_only_the_requested_page() {
        let bytes = one_page();
        let merged = run_engine(EngineJob {
            tool_id: "merge-pdf".into(),
            options: Value::Object(serde_json::Map::new()),
            files: vec![file(&bytes), file(&bytes)],
        })
        .unwrap();
        let mut options = serde_json::Map::new();
        options.insert("pages".into(), Value::String("2".into()));
        let output = run_engine(EngineJob {
            tool_id: "extract-pdf-pages".into(),
            options: Value::Object(options),
            files: vec![EngineFile {
                name: "m.pdf".into(),
                bytes_base64: merged.bytes_base64,
            }],
        })
        .unwrap();
        let doc = Document::load_mem(&base64_decode(&output.bytes_base64).unwrap()).unwrap();
        assert_eq!(doc.get_pages().len(), 1);
        let page_id = doc.get_pages()[&1];
        let media = doc
            .get_dictionary(page_id)
            .unwrap()
            .get(b"MediaBox")
            .unwrap();
        assert!(matches!(media, Object::Array(_)));
    }

    #[test]
    fn rotate_sets_the_page_rotate_entry() {
        let mut options = serde_json::Map::new();
        options.insert("rotation".into(), Value::from(90));
        let output = run_engine(EngineJob {
            tool_id: "rotate-pdf".into(),
            options: Value::Object(options),
            files: vec![file(&one_page())],
        })
        .unwrap();
        let doc = Document::load_mem(&base64_decode(&output.bytes_base64).unwrap()).unwrap();
        let page_id = doc.get_pages()[&1];
        match doc.get_dictionary(page_id).unwrap().get(b"Rotate").unwrap() {
            Object::Integer(value) => assert_eq!(*value, 90),
            other => panic!("unexpected rotate {other:?}"),
        }
    }

    #[test]
    fn malformed_empty_and_oversized_inputs_fail() {
        let bad = run_engine(EngineJob {
            tool_id: "merge-pdf".into(),
            options: Value::Object(serde_json::Map::new()),
            files: vec![file(b"not a pdf"), file(b"also not")],
        })
        .unwrap_err();
        assert_eq!(bad, "not_pdf");

        let mut empty_options = serde_json::Map::new();
        empty_options.insert("rotation".into(), Value::from(90));
        let empty = run_engine(EngineJob {
            tool_id: "rotate-pdf".into(),
            options: Value::Object(empty_options),
            files: vec![EngineFile {
                name: "empty.pdf".into(),
                bytes_base64: String::new(),
            }],
        })
        .unwrap_err();
        assert!(empty == "not_pdf" || empty == "file_data");

        let huge = "A".repeat(25 * 1024 * 1024 * 2 + 8);
        let mut large_options = serde_json::Map::new();
        large_options.insert("rotation".into(), Value::from(90));
        let large = run_engine(EngineJob {
            tool_id: "rotate-pdf".into(),
            options: Value::Object(large_options),
            files: vec![EngineFile {
                name: "big.pdf".into(),
                bytes_base64: huge,
            }],
        })
        .unwrap_err();
        assert_eq!(large, "file_too_large");

        let mut options = serde_json::Map::new();
        options.insert("pages".into(), Value::String("9".into()));
        let missing = run_engine(EngineJob {
            tool_id: "extract-pdf-pages".into(),
            options: Value::Object(options),
            files: vec![file(&one_page())],
        })
        .unwrap_err();
        assert_eq!(missing, "pages");

        let mut wipe = serde_json::Map::new();
        wipe.insert("pages".into(), Value::String("1".into()));
        let all = run_engine(EngineJob {
            tool_id: "delete-pdf-pages".into(),
            options: Value::Object(wipe),
            files: vec![file(&one_page())],
        })
        .unwrap_err();
        assert_eq!(all, "delete_all");
    }

    #[test]
    fn unavailable_tool_does_not_produce_a_file() {
        let error = run_engine(EngineJob {
            tool_id: "compress-pdf".into(),
            options: Value::Object(serde_json::Map::new()),
            files: vec![file(&one_page())],
        })
        .unwrap_err();
        assert!(error.starts_with("not_in_this_build"));
    }
}
