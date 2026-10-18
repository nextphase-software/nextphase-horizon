# Resolved dependencies — 0001-W4

Generated from `cargo metadata --format-version 1 --locked` using Cargo.lock.
All 115 external packages are listed, including dev, build and target-specific
transitives. Registry license expressions are verified by `cargo deny check licenses`.

The only new direct external dependency is **wasm-bindgen-test 0.3.79**
(**MIT OR Apache-2.0**), a dev-dependency of the unpublished `horizon-parity`
proof crate. It adds 23 transitive/direct resolved packages in total; existing
resolved package versions are unchanged. All workspace crates remain AGPL-3.0-only.
The existing direct dependencies remain serde 1.0.229, serde_json 1.0.154,
schemars 1.2.3, num-bigint 0.5.1, num-traits 0.2.19, sha2 0.11.1 and test-only
jsonschema 0.58.6 (default features disabled).

Development tools: cargo-deny 0.20.2 and wasm-bindgen-cli 0.2.129 (both
MIT OR Apache-2.0), Rust 1.99.1, and Node.js 24.22.0 (MIT with bundled-component
notices). Node runs the WebAssembly test harness only; no Node package or
TypeScript dependency is added. The runner must match the locked wasm-bindgen
0.2.129. The WebAssembly test harness's host/float facilities are outside the
pure calculation engine; the engine's purity and arithmetic checks remain active.

| Package | Version | License expression |
| --- | --- | --- |
| `ahash` | 0.8.12 | MIT OR Apache-2.0 |
| `aho-corasick` | 1.1.5 | Unlicense OR MIT |
| `allocator-api2` | 0.2.21 | MIT OR Apache-2.0 |
| `async-trait` | 0.1.92 | MIT OR Apache-2.0 |
| `autocfg` | 1.5.1 | Apache-2.0 OR MIT |
| `bit-set` | 0.8.0 | Apache-2.0 OR MIT |
| `bit-vec` | 0.8.0 | Apache-2.0 OR MIT |
| `bitflags` | 2.13.2 | MIT OR Apache-2.0 |
| `block-buffer` | 0.12.1 | MIT OR Apache-2.0 |
| `borrow-or-share` | 0.2.4 | MIT-0 |
| `bumpalo` | 3.20.3 | MIT OR Apache-2.0 |
| `bytecount` | 0.6.9 | Apache-2.0/MIT |
| `cast` | 0.3.0 | MIT OR Apache-2.0 |
| `cc` | 1.8.0 | MIT OR Apache-2.0 |
| `cfg-if` | 1.0.5 | MIT OR Apache-2.0 |
| `const-oid` | 0.10.2 | Apache-2.0 OR MIT |
| `cpufeatures` | 0.3.1 | MIT OR Apache-2.0 |
| `crypto-common` | 0.2.2 | MIT OR Apache-2.0 |
| `data-encoding` | 2.11.1 | MIT |
| `digest` | 0.11.3 | MIT OR Apache-2.0 |
| `dyn-clone` | 1.0.20 | MIT OR Apache-2.0 |
| `email_address` | 0.2.9 | MIT |
| `equivalent` | 1.0.3 | Apache-2.0 OR MIT |
| `fancy-regex` | 0.19.2 | MIT |
| `find-msvc-tools` | 0.1.14 | MIT OR Apache-2.0 |
| `fluent-uri` | 0.4.1 | MIT |
| `foldhash` | 0.2.0 | Zlib |
| `fraction` | 0.17.0 | MIT OR Apache-2.0 |
| `futures-core` | 0.3.34 | MIT OR Apache-2.0 |
| `futures-task` | 0.3.34 | MIT OR Apache-2.0 |
| `futures-util` | 0.3.34 | MIT OR Apache-2.0 |
| `getrandom` | 0.3.4 | MIT OR Apache-2.0 |
| `hashbrown` | 0.17.1 | MIT OR Apache-2.0 |
| `heck` | 0.5.0 | MIT OR Apache-2.0 |
| `hybrid-array` | 0.4.15 | MIT OR Apache-2.0 |
| `itoa` | 1.0.18 | MIT OR Apache-2.0 |
| `js-sys` | 0.3.106 | MIT OR Apache-2.0 |
| `jsonschema` | 0.58.6 | MIT |
| `jsonschema-regex` | 0.58.6 | MIT |
| `jsonschema-value` | 0.58.6 | MIT |
| `libc` | 0.2.190 | MIT OR Apache-2.0 |
| `libm` | 0.2.16 | MIT |
| `lock_api` | 0.4.14 | MIT OR Apache-2.0 |
| `memchr` | 2.8.3 | Unlicense OR MIT |
| `micromap` | 0.3.0 | MIT |
| `minicov` | 0.3.8 | Apache-2.0/MIT |
| `nu-ansi-term` | 0.50.3 | MIT |
| `num` | 0.4.3 | MIT OR Apache-2.0 |
| `num-bigint` | 0.4.8 | MIT OR Apache-2.0 |
| `num-bigint` | 0.5.1 | MIT OR Apache-2.0 |
| `num-cmp` | 0.1.0 | MIT/Apache-2.0 |
| `num-complex` | 0.4.6 | MIT OR Apache-2.0 |
| `num-integer` | 0.1.47 | MIT OR Apache-2.0 |
| `num-iter` | 0.1.46 | MIT OR Apache-2.0 |
| `num-rational` | 0.4.2 | MIT OR Apache-2.0 |
| `num-traits` | 0.2.19 | MIT OR Apache-2.0 |
| `once_cell` | 1.21.4 | MIT OR Apache-2.0 |
| `oorandom` | 11.1.5 | MIT |
| `outref` | 0.5.2 | MIT |
| `parking_lot` | 0.12.5 | MIT OR Apache-2.0 |
| `parking_lot_core` | 0.9.12 | MIT OR Apache-2.0 |
| `percent-encoding` | 2.3.2 | MIT OR Apache-2.0 |
| `pin-project-lite` | 0.2.17 | Apache-2.0 OR MIT |
| `proc-macro2` | 1.0.107 | MIT OR Apache-2.0 |
| `quote` | 1.0.47 | MIT OR Apache-2.0 |
| `r-efi` | 5.3.0 | MIT OR Apache-2.0 OR LGPL-2.1-or-later |
| `redox_syscall` | 0.5.18 | MIT |
| `ref-cast` | 1.0.27 | MIT OR Apache-2.0 |
| `ref-cast-impl` | 1.0.27 | MIT OR Apache-2.0 |
| `referencing` | 0.58.6 | MIT |
| `regex` | 1.13.1 | MIT OR Apache-2.0 |
| `regex-automata` | 0.4.18 | MIT OR Apache-2.0 |
| `regex-syntax` | 0.8.11 | MIT OR Apache-2.0 |
| `rustversion` | 1.0.23 | MIT OR Apache-2.0 |
| `same-file` | 1.0.6 | Unlicense/MIT |
| `schemars` | 1.2.3 | MIT |
| `schemars_derive` | 1.2.3 | MIT |
| `scopeguard` | 1.2.0 | MIT OR Apache-2.0 |
| `serde` | 1.0.229 | MIT OR Apache-2.0 |
| `serde_core` | 1.0.229 | MIT OR Apache-2.0 |
| `serde_derive` | 1.0.229 | MIT OR Apache-2.0 |
| `serde_derive_internals` | 0.30.0 | MIT OR Apache-2.0 |
| `serde_json` | 1.0.154 | MIT OR Apache-2.0 |
| `sha2` | 0.11.1 | MIT OR Apache-2.0 |
| `shlex` | 2.0.1 | MIT OR Apache-2.0 |
| `slab` | 0.4.12 | MIT |
| `smallvec` | 1.16.3 | MIT OR Apache-2.0 |
| `strum` | 0.28.0 | MIT |
| `strum_macros` | 0.28.0 | MIT |
| `syn` | 2.0.119 | MIT OR Apache-2.0 |
| `syn` | 3.0.9 | MIT OR Apache-2.0 |
| `tokio` | 1.53.3 | MIT |
| `typenum` | 1.20.1 | MIT OR Apache-2.0 |
| `unicode-general-category` | 1.1.0 | Apache-2.0 |
| `unicode-ident` | 1.0.27 | (MIT OR Apache-2.0) AND Unicode-3.0 |
| `uuid-simd` | 0.8.0 | MIT |
| `version_check` | 0.9.5 | MIT/Apache-2.0 |
| `vsimd` | 0.8.0 | MIT |
| `walkdir` | 2.5.0 | Unlicense/MIT |
| `wasip2` | 1.0.4+wasi-0.2.12 | Apache-2.0 WITH LLVM-exception OR Apache-2.0 OR MIT |
| `wasm-bindgen` | 0.2.129 | MIT OR Apache-2.0 |
| `wasm-bindgen-futures` | 0.4.79 | MIT OR Apache-2.0 |
| `wasm-bindgen-macro` | 0.2.129 | MIT OR Apache-2.0 |
| `wasm-bindgen-macro-support` | 0.2.129 | MIT OR Apache-2.0 |
| `wasm-bindgen-shared` | 0.2.129 | MIT OR Apache-2.0 |
| `wasm-bindgen-test` | 0.3.79 | MIT OR Apache-2.0 |
| `wasm-bindgen-test-macro` | 0.3.79 | MIT OR Apache-2.0 |
| `wasm-bindgen-test-shared` | 0.2.129 | MIT OR Apache-2.0 |
| `winapi-util` | 0.1.11 | Unlicense OR MIT |
| `windows-link` | 0.2.1 | MIT OR Apache-2.0 |
| `windows-sys` | 0.61.2 | MIT OR Apache-2.0 |
| `wit-bindgen` | 0.57.1 | Apache-2.0 WITH LLVM-exception OR Apache-2.0 OR MIT |
| `zerocopy` | 0.8.63 | BSD-2-Clause OR Apache-2.0 OR MIT |
| `zerocopy-derive` | 0.8.63 | BSD-2-Clause OR Apache-2.0 OR MIT |
| `zmij` | 1.0.23 | MIT |

## Approved license exception

The maintainer explicitly approved MIT-0 for `borrow-or-share 0.2.4` only on
2026-10-16. `deny.toml` records an exception for that exact package/version;
MIT-0 is not added to the general allow-list. The dependency is reached through
`jsonschema 0.58.6 → referencing 0.58.6 → fluent-uri 0.4.1` and is test-only.
Development and build dependencies are explicitly included in license checks.
