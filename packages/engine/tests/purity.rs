// SPDX-License-Identifier: AGPL-3.0-only
//! Runs in the test host; the engine itself contains no host facilities.
#![allow(clippy::disallowed_methods, clippy::disallowed_types)]
use std::{fs, path::Path};
fn source_files(directory: &Path) -> Vec<std::path::PathBuf> {
    let mut files = Vec::new();
    for entry in fs::read_dir(directory).unwrap() {
        let path = entry.unwrap().path();
        if path.is_dir() {
            files.extend(source_files(&path));
        } else if path.extension().is_some_and(|e| e == "rs") {
            files.push(path);
        }
    }
    files
}
fn forbidden(source: &str) -> bool {
    let compact: String = source.chars().filter(|c| !c.is_whitespace()).collect();
    [
        "std::fs",
        "std::net",
        "std::io",
        "std::env",
        "std::process",
        "std::thread",
        "std::time",
        "std::random",
        "std::os",
        "std::sync",
        "usestdas",
        "std::{",
        "HashMap",
        "HashSet",
        "RandomState",
        "staticmut",
        "externcrate",
        "extern\"",
        "include!",
        "include_str!",
        "include_bytes!",
        "println!",
        "print!",
        "eprintln!",
        "eprint!",
        "dbg!",
        "rand::",
        "getrandom::",
        "unsafe{",
    ]
    .iter()
    .any(|s| compact.contains(s))
}
#[test]
fn no_host_facilities_in_engine_sources() {
    for path in source_files(&Path::new(env!("CARGO_MANIFEST_DIR")).join("src")) {
        assert!(
            !forbidden(&fs::read_to_string(&path).unwrap()),
            "host facility in {}",
            path.display()
        );
    }
}
#[test]
fn boundary_check_rejects_host_facilities_even_through_aliases() {
    for snippet in [
        "use std::fs as files;",
        "std :: time :: Instant::now()",
        "use std::{env};",
        "extern \"C\" {}",
        "println!(\"x\");",
        "include_str!(\"x\");",
    ] {
        assert!(forbidden(snippet));
    }
    assert!(!forbidden("use std::collections::BTreeSet;"));
}
