# Resolved dependencies — 0003-W1

Generated from `cargo metadata --format-version 1 --locked` using Cargo.lock.
All 115 external packages are listed, including dev, build and target-specific
transitives. Registry license expressions are verified by `cargo deny check licenses`.

0003-W1 adds no dependency; Cargo.lock is unchanged.

The sole direct external dependency added by 0001-W4 was **wasm-bindgen-test 0.3.79**
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

## Web shell — 0002-W1 v2

`horizon-wasm` adds no new external Rust package: wasm-bindgen =0.2.129
(MIT OR Apache-2.0) was already locked. It depends only on horizon-app and
wasm-bindgen. Shared JSON helpers in horizon-app reuse its existing dependencies.

Node.js 24.22.0 (MIT with bundled-component notices), corepack 0.36.0 (MIT)
and pnpm 12.9.1 (MIT) are development tools. The exact direct versions are in
`apps/web/package.json`; all resolved JavaScript dependencies, including optional
platform bindings, are listed below. The inventory uses `pnpm licenses list --json`
and npm registry metadata for uninstalled platform variants, retrieved 2026-10-18.
The lockfile's separate pnpm bootstrap document is tool metadata, not an app
dependency; it resolves pnpm and its platform executables to 12.9.1 (MIT).

The production closure keeps the strict license list plus OFL-1.1 for the named
font. Exact build/test exceptions are authorized by [decision 0011's amendment](../decisions/0011-web-shell-stack.md#amendment--2026-10-18-javascript-licenses-for-shipped-code-and-for-build-and-test-tools)
and brief 0002-W1 v2. `licenses` checks both closures independently; no tool
exception applies to shipped code. The three type packages are pinned by v2:
@types/react 19.3.0, @types/react-dom 19.3.0 and @types/node 24.19.1 (all MIT).

| JavaScript package | Exact version | License |
| --- | --- | --- |
| `@apidevtools/json-schema-ref-parser` | 11.9.3 | MIT |
| `@asamuzakjp/css-color` | 7.1.7 | MIT |
| `@asamuzakjp/dom-selector` | 9.2.4 | MIT |
| `@axe-core/playwright` | 4.13.0 | MPL-2.0 |
| `@babel/code-frame` | 7.29.7 | MIT |
| `@babel/compat-data` | 7.29.7 | MIT |
| `@babel/core` | 7.29.7 | MIT |
| `@babel/generator` | 7.29.8 | MIT |
| `@babel/helper-compilation-targets` | 7.29.7 | MIT |
| `@babel/helper-globals` | 7.29.7 | MIT |
| `@babel/helper-module-imports` | 7.29.7 | MIT |
| `@babel/helper-module-transforms` | 7.29.7 | MIT |
| `@babel/helper-string-parser` | 7.29.7 | MIT |
| `@babel/helper-validator-identifier` | 7.29.7 | MIT |
| `@babel/helper-validator-option` | 7.29.7 | MIT |
| `@babel/helpers` | 7.29.10 | MIT |
| `@babel/parser` | 7.29.9 | MIT |
| `@babel/runtime` | 7.29.10 | MIT |
| `@babel/template` | 7.29.7 | MIT |
| `@babel/traverse` | 7.29.10 | MIT |
| `@babel/types` | 7.29.8 | MIT |
| `@bramus/specificity` | 2.4.3 | MIT |
| `@csstools/color-helpers` | 6.1.2 | MIT-0 |
| `@csstools/css-calc` | 3.4.3 | MIT |
| `@csstools/css-color-parser` | 4.2.6 | MIT |
| `@csstools/css-parser-algorithms` | 4.0.2 | MIT |
| `@csstools/css-syntax-patches-for-csstree` | 1.1.15 | MIT-0 |
| `@csstools/css-tokenizer` | 4.0.2 | MIT |
| `@eslint-community/eslint-utils` | 4.10.1 | MIT |
| `@eslint-community/regexpp` | 4.12.2 | MIT |
| `@eslint/config-array` | 0.21.2 | Apache-2.0 |
| `@eslint/config-helpers` | 0.4.2 | Apache-2.0 |
| `@eslint/core` | 0.17.0 | Apache-2.0 |
| `@eslint/eslintrc` | 3.3.7 | MIT |
| `@eslint/js` | 9.39.5 | MIT |
| `@eslint/object-schema` | 2.1.7 | Apache-2.0 |
| `@eslint/plugin-kit` | 0.4.1 | Apache-2.0 |
| `@exodus/bytes` | 1.16.0 | MIT |
| `@fontsource-variable/plus-jakarta-sans` | 5.3.0 | OFL-1.1 |
| `@humanfs/core` | 0.19.2 | Apache-2.0 |
| `@humanfs/node` | 0.16.8 | Apache-2.0 |
| `@humanfs/types` | 0.15.0 | Apache-2.0 |
| `@humanwhocodes/module-importer` | 1.0.1 | Apache-2.0 |
| `@humanwhocodes/retry` | 0.4.3 | Apache-2.0 |
| `@jridgewell/gen-mapping` | 0.3.13 | MIT |
| `@jridgewell/remapping` | 2.3.5 | MIT |
| `@jridgewell/resolve-uri` | 3.1.2 | MIT |
| `@jridgewell/sourcemap-codec` | 1.6.0 | MIT |
| `@jridgewell/trace-mapping` | 0.3.31 | MIT |
| `@jsdevtools/ono` | 7.1.3 | MIT |
| `@oxc-project/types` | 0.154.0 | MIT |
| `@playwright/test` | 1.63.0 | Apache-2.0 |
| `@rolldown/binding-android-arm-eabi` | 1.2.14 | MIT |
| `@rolldown/binding-android-arm64` | 1.2.14 | MIT |
| `@rolldown/binding-darwin-arm64` | 1.2.14 | MIT |
| `@rolldown/binding-darwin-x64` | 1.2.14 | MIT |
| `@rolldown/binding-freebsd-x64` | 1.2.14 | MIT |
| `@rolldown/binding-linux-arm-gnueabihf` | 1.2.14 | MIT |
| `@rolldown/binding-linux-arm64-gnu` | 1.2.14 | MIT |
| `@rolldown/binding-linux-arm64-musl` | 1.2.14 | MIT |
| `@rolldown/binding-linux-ppc64-gnu` | 1.2.14 | MIT |
| `@rolldown/binding-linux-s390x-gnu` | 1.2.14 | MIT |
| `@rolldown/binding-linux-x64-gnu` | 1.2.14 | MIT |
| `@rolldown/binding-linux-x64-musl` | 1.2.14 | MIT |
| `@rolldown/binding-openharmony-arm64` | 1.2.14 | MIT |
| `@rolldown/binding-win32-arm64-msvc` | 1.2.14 | MIT |
| `@rolldown/binding-win32-x64-msvc` | 1.2.14 | MIT |
| `@rolldown/pluginutils` | 1.0.1 | MIT |
| `@testing-library/dom` | 10.4.2 | MIT |
| `@testing-library/react` | 16.3.3 | MIT |
| `@types/aria-query` | 5.0.4 | MIT |
| `@types/chai` | 5.2.3 | MIT |
| `@types/deep-eql` | 4.0.2 | MIT |
| `@types/estree` | 1.0.9 | MIT |
| `@types/json-schema` | 7.0.15 | MIT |
| `@types/lodash` | 4.17.26 | MIT |
| `@types/node` | 24.19.1 | MIT |
| `@types/react` | 19.3.0 | MIT |
| `@types/react-dom` | 19.3.0 | MIT |
| `@typescript-eslint/eslint-plugin` | 8.71.0 | MIT |
| `@typescript-eslint/parser` | 8.71.0 | MIT |
| `@typescript-eslint/project-service` | 8.71.0 | MIT |
| `@typescript-eslint/scope-manager` | 8.71.0 | MIT |
| `@typescript-eslint/tsconfig-utils` | 8.71.0 | MIT |
| `@typescript-eslint/type-utils` | 8.71.0 | MIT |
| `@typescript-eslint/types` | 8.71.0 | MIT |
| `@typescript-eslint/typescript-estree` | 8.71.0 | MIT |
| `@typescript-eslint/utils` | 8.71.0 | MIT |
| `@typescript-eslint/visitor-keys` | 8.71.0 | MIT |
| `@vitejs/plugin-react` | 6.1.1 | MIT |
| `@vitest/mocker` | 5.0.3 | MIT |
| `@vitest/spy` | 5.0.3 | MIT |
| `acorn` | 8.19.0 | MIT |
| `acorn-jsx` | 5.3.2 | MIT |
| `ajv` | 6.15.0 | MIT |
| `ansi-regex` | 5.0.1 | MIT |
| `ansi-styles` | 4.3.0 | MIT |
| `ansi-styles` | 5.2.0 | MIT |
| `argparse` | 2.0.1 | Python-2.0 |
| `argparse` | 3.0.3 | PSF-2.0 |
| `aria-query` | 5.3.0 | Apache-2.0 |
| `aria-query` | 5.3.2 | Apache-2.0 |
| `array-buffer-byte-length` | 1.0.2 | MIT |
| `array-includes` | 3.2.0 | MIT |
| `array.prototype.flat` | 1.3.3 | MIT |
| `array.prototype.flatmap` | 1.3.3 | MIT |
| `arraybuffer.prototype.slice` | 1.0.4 | MIT |
| `assertion-error` | 2.0.1 | MIT |
| `ast-types-flow` | 0.0.8 | MIT |
| `async-function` | 1.0.0 | MIT |
| `available-typed-arrays` | 1.0.7 | MIT |
| `axe-core` | 4.13.0 | MPL-2.0 |
| `axe-core` | 4.14.0 | MPL-2.0 |
| `axobject-query` | 4.1.0 | Apache-2.0 |
| `balanced-match` | 1.0.2 | MIT |
| `balanced-match` | 4.0.4 | MIT |
| `baseline-browser-mapping` | 2.11.29 | Apache-2.0 |
| `bidi-js` | 1.1.0 | MIT |
| `brace-expansion` | 1.1.21 | MIT |
| `brace-expansion` | 5.0.12 | MIT |
| `browserslist` | 4.29.3 | MIT |
| `call-bind` | 1.0.9 | MIT |
| `call-bind-apply-helpers` | 1.0.2 | MIT |
| `call-bound` | 1.0.4 | MIT |
| `callsites` | 3.1.0 | MIT |
| `caniuse-lite` | 1.0.30001816 | CC-BY-4.0 |
| `chai` | 6.3.0 | MIT |
| `chalk` | 4.1.2 | MIT |
| `color-convert` | 2.0.1 | MIT |
| `color-name` | 1.1.4 | MIT |
| `concat-map` | 0.0.1 | MIT |
| `convert-source-map` | 2.0.0 | MIT |
| `cross-spawn` | 7.0.6 | MIT |
| `css-tree` | 3.2.1 | MIT |
| `csstype` | 3.2.3 | MIT |
| `damerau-levenshtein` | 1.0.8 | BSD-2-Clause |
| `data-urls` | 7.0.0 | MIT |
| `data-view-buffer` | 1.0.2 | MIT |
| `data-view-byte-length` | 1.0.2 | MIT |
| `data-view-byte-offset` | 1.0.1 | MIT |
| `debug` | 4.4.3 | MIT |
| `decimal.js` | 10.6.0 | MIT |
| `deep-is` | 0.1.4 | MIT |
| `define-data-property` | 1.1.4 | MIT |
| `define-properties` | 1.2.1 | MIT |
| `dequal` | 2.0.3 | MIT |
| `detect-libc` | 2.1.2 | Apache-2.0 |
| `dom-accessibility-api` | 0.5.16 | MIT |
| `dunder-proto` | 1.0.1 | MIT |
| `electron-to-chromium` | 1.5.459 | ISC |
| `emoji-regex` | 9.2.2 | MIT |
| `entities` | 8.1.0 | BSD-2-Clause |
| `es-abstract` | 1.24.2 | MIT |
| `es-abstract-get` | 1.0.0 | MIT |
| `es-define-property` | 1.0.1 | MIT |
| `es-errors` | 1.3.0 | MIT |
| `es-module-lexer` | 2.3.2 | MIT |
| `es-object-atoms` | 1.1.2 | MIT |
| `es-set-tostringtag` | 2.1.0 | MIT |
| `es-shim-unscopables` | 1.1.0 | MIT |
| `es-to-primitive` | 1.3.4 | MIT |
| `escalade` | 3.2.0 | MIT |
| `escape-string-regexp` | 4.0.0 | MIT |
| `eslint` | 9.39.5 | MIT |
| `eslint-plugin-jsx-a11y` | 6.10.2 | MIT |
| `eslint-plugin-react-hooks` | 7.1.1 | MIT |
| `eslint-scope` | 8.4.0 | BSD-2-Clause |
| `eslint-visitor-keys` | 3.4.3 | Apache-2.0 |
| `eslint-visitor-keys` | 4.2.1 | Apache-2.0 |
| `eslint-visitor-keys` | 5.0.1 | Apache-2.0 |
| `espree` | 10.4.0 | BSD-2-Clause |
| `esquery` | 1.7.0 | BSD-3-Clause |
| `esrecurse` | 4.3.0 | BSD-2-Clause |
| `estraverse` | 5.3.0 | BSD-2-Clause |
| `estree-walker` | 3.0.3 | MIT |
| `esutils` | 2.0.3 | BSD-2-Clause |
| `expect-type` | 1.4.0 | Apache-2.0 |
| `fast-deep-equal` | 3.1.3 | MIT |
| `fast-json-stable-stringify` | 2.1.0 | MIT |
| `fast-levenshtein` | 2.0.6 | MIT |
| `fdir` | 6.5.0 | MIT |
| `file-entry-cache` | 8.0.0 | MIT |
| `find-up` | 5.0.0 | MIT |
| `flat-cache` | 4.0.1 | MIT |
| `flatted` | 3.4.4 | ISC |
| `for-each` | 0.3.5 | MIT |
| `fsevents` | 2.3.3 | MIT |
| `function-bind` | 1.1.2 | MIT |
| `function.prototype.name` | 1.2.0 | MIT |
| `functions-have-names` | 1.2.3 | MIT |
| `generator-function` | 2.0.1 | MIT |
| `gensync` | 1.0.0-beta.2 | MIT |
| `get-intrinsic` | 1.3.0 | MIT |
| `get-proto` | 1.0.1 | MIT |
| `get-symbol-description` | 1.1.0 | MIT |
| `glob-parent` | 6.0.2 | ISC |
| `globals` | 14.0.0 | MIT |
| `globals` | 17.13.0 | MIT |
| `globalthis` | 1.0.4 | MIT |
| `gopd` | 1.2.0 | MIT |
| `has-bigints` | 1.1.0 | MIT |
| `has-flag` | 4.0.0 | MIT |
| `has-property-descriptors` | 1.0.2 | MIT |
| `has-proto` | 1.2.0 | MIT |
| `has-symbols` | 1.1.0 | MIT |
| `has-tostringtag` | 1.0.2 | MIT |
| `hasown` | 2.0.4 | MIT |
| `hermes-estree` | 0.25.1 | MIT |
| `hermes-parser` | 0.25.1 | MIT |
| `html-encoding-sniffer` | 7.0.0 | MIT |
| `ignore` | 5.3.2 | MIT |
| `ignore` | 7.0.12 | MIT |
| `import-fresh` | 3.3.1 | MIT |
| `imurmurhash` | 0.1.4 | MIT |
| `internal-slot` | 1.1.0 | MIT |
| `is-array-buffer` | 3.0.5 | MIT |
| `is-async-function` | 2.1.1 | MIT |
| `is-bigint` | 1.1.0 | MIT |
| `is-boolean-object` | 1.2.2 | MIT |
| `is-callable` | 1.2.7 | MIT |
| `is-data-view` | 1.0.2 | MIT |
| `is-date-object` | 1.1.0 | MIT |
| `is-document.all` | 1.0.0 | MIT |
| `is-extglob` | 2.1.1 | MIT |
| `is-finalizationregistry` | 1.1.1 | MIT |
| `is-generator-function` | 1.1.2 | MIT |
| `is-glob` | 4.0.3 | MIT |
| `is-map` | 2.0.3 | MIT |
| `is-negative-zero` | 2.0.3 | MIT |
| `is-number-object` | 1.1.1 | MIT |
| `is-potential-custom-element-name` | 1.0.1 | MIT |
| `is-regex` | 1.2.1 | MIT |
| `is-set` | 2.0.3 | MIT |
| `is-shared-array-buffer` | 1.0.4 | MIT |
| `is-string` | 1.1.1 | MIT |
| `is-symbol` | 1.1.1 | MIT |
| `is-typed-array` | 1.1.15 | MIT |
| `is-weakmap` | 2.0.2 | MIT |
| `is-weakref` | 1.1.1 | MIT |
| `is-weakset` | 2.0.4 | MIT |
| `isarray` | 2.0.5 | MIT |
| `isexe` | 2.0.0 | ISC |
| `js-tokens` | 4.0.0 | MIT |
| `js-yaml` | 4.3.2 | MIT |
| `js-yaml` | 5.5.0 | MIT |
| `jsdom` | 30.1.1 | MIT |
| `jsesc` | 3.1.0 | MIT |
| `json-buffer` | 3.0.1 | MIT |
| `json-schema-to-typescript` | 16.0.0 | MIT |
| `json-schema-traverse` | 0.4.1 | MIT |
| `json-stable-stringify-without-jsonify` | 1.0.1 | MIT |
| `json5` | 2.2.3 | MIT |
| `jsx-ast-utils` | 3.3.5 | MIT |
| `keyv` | 4.5.4 | MIT |
| `language-subtag-registry` | 0.3.23 | CC0-1.0 |
| `language-tags` | 1.0.9 | MIT |
| `levn` | 0.4.1 | MIT |
| `lightningcss` | 1.33.0 | MPL-2.0 |
| `lightningcss-android-arm64` | 1.33.0 | MPL-2.0 |
| `lightningcss-darwin-arm64` | 1.33.0 | MPL-2.0 |
| `lightningcss-darwin-x64` | 1.33.0 | MPL-2.0 |
| `lightningcss-freebsd-x64` | 1.33.0 | MPL-2.0 |
| `lightningcss-linux-arm-gnueabihf` | 1.33.0 | MPL-2.0 |
| `lightningcss-linux-arm64-gnu` | 1.33.0 | MPL-2.0 |
| `lightningcss-linux-arm64-musl` | 1.33.0 | MPL-2.0 |
| `lightningcss-linux-x64-gnu` | 1.33.0 | MPL-2.0 |
| `lightningcss-linux-x64-musl` | 1.33.0 | MPL-2.0 |
| `lightningcss-win32-arm64-msvc` | 1.33.0 | MPL-2.0 |
| `lightningcss-win32-x64-msvc` | 1.33.0 | MPL-2.0 |
| `locate-path` | 6.0.0 | MIT |
| `lodash` | 4.18.1 | MIT |
| `lodash.merge` | 4.6.2 | MIT |
| `lru-cache` | 11.5.3 | BlueOak-1.0.0 |
| `lru-cache` | 5.1.1 | ISC |
| `lz-string` | 1.5.0 | MIT |
| `magic-string` | 1.4.3 | MIT |
| `math-intrinsics` | 1.1.0 | MIT |
| `mdn-data` | 2.27.1 | CC0-1.0 |
| `minimatch` | 10.2.6 | BlueOak-1.0.0 |
| `minimatch` | 3.1.5 | ISC |
| `minimist` | 1.2.8 | MIT |
| `ms` | 2.1.3 | MIT |
| `nanoid` | 3.3.20 | MIT |
| `natural-compare` | 1.4.0 | MIT |
| `node-releases` | 2.0.59 | MIT |
| `object-inspect` | 1.13.4 | MIT |
| `object-keys` | 1.1.1 | MIT |
| `object.assign` | 4.1.7 | MIT |
| `object.fromentries` | 2.0.8 | MIT |
| `object.values` | 1.2.1 | MIT |
| `obug` | 2.2.1 | MIT |
| `optionator` | 0.9.4 | MIT |
| `own-keys` | 1.0.2 | MIT |
| `p-limit` | 3.1.0 | MIT |
| `p-locate` | 5.0.0 | MIT |
| `parent-module` | 1.0.1 | MIT |
| `parse5` | 8.0.1 | MIT |
| `path-exists` | 4.0.0 | MIT |
| `path-key` | 3.1.1 | MIT |
| `picocolors` | 1.1.1 | ISC |
| `picomatch` | 4.0.7 | MIT |
| `playwright` | 1.63.0 | Apache-2.0 |
| `playwright-core` | 1.63.0 | Apache-2.0 |
| `possible-typed-array-names` | 1.1.0 | MIT |
| `postcss` | 8.5.30 | MIT |
| `prelude-ls` | 1.2.1 | MIT |
| `prettier` | 3.9.9 | MIT |
| `pretty-format` | 27.5.1 | MIT |
| `punycode` | 2.3.1 | MIT |
| `react` | 19.3.0 | MIT |
| `react-dom` | 19.3.0 | MIT |
| `react-is` | 17.0.2 | MIT |
| `reflect.getprototypeof` | 1.0.10 | MIT |
| `regexp.prototype.flags` | 1.5.4 | MIT |
| `require-from-string` | 2.0.2 | MIT |
| `resolve-from` | 4.0.0 | MIT |
| `rolldown` | 1.2.14 | MIT |
| `safe-array-concat` | 1.1.4 | MIT |
| `safe-push-apply` | 1.0.0 | MIT |
| `safe-regex-test` | 1.1.0 | MIT |
| `saxes` | 6.0.0 | ISC |
| `scheduler` | 0.28.0 | MIT |
| `semver` | 6.3.1 | ISC |
| `semver` | 7.8.5 | ISC |
| `set-function-length` | 1.2.2 | MIT |
| `set-function-name` | 2.0.2 | MIT |
| `set-proto` | 1.0.0 | MIT |
| `shebang-command` | 2.0.0 | MIT |
| `shebang-regex` | 3.0.0 | MIT |
| `side-channel` | 1.1.1 | MIT |
| `side-channel-list` | 1.0.1 | MIT |
| `side-channel-map` | 1.0.1 | MIT |
| `side-channel-weakmap` | 1.0.2 | MIT |
| `source-map-js` | 1.2.2 | BSD-3-Clause |
| `std-env` | 4.3.0 | MIT |
| `stop-iteration-iterator` | 1.1.0 | MIT |
| `string.prototype.includes` | 2.0.1 | MIT |
| `string.prototype.trim` | 1.2.11 | MIT |
| `string.prototype.trimend` | 1.0.10 | MIT |
| `string.prototype.trimstart` | 1.0.8 | MIT |
| `strip-json-comments` | 3.1.1 | MIT |
| `supports-color` | 7.2.0 | MIT |
| `tinybench` | 6.2.2 | MIT |
| `tinyexec` | 1.3.1 | MIT |
| `tinyglobby` | 0.2.17 | MIT |
| `tldts` | 7.4.18 | MIT |
| `tldts-core` | 7.4.18 | MIT |
| `tough-cookie` | 6.0.2 | BSD-3-Clause |
| `tr46` | 6.0.0 | MIT |
| `tr46` | 7.0.0 | MIT |
| `ts-api-utils` | 2.5.0 | MIT |
| `type-check` | 0.4.0 | MIT |
| `typed-array-buffer` | 1.0.3 | MIT |
| `typed-array-byte-length` | 1.0.3 | MIT |
| `typed-array-byte-offset` | 1.0.5 | MIT |
| `typed-array-length` | 1.0.8 | MIT |
| `typescript` | 6.0.3 | Apache-2.0 |
| `typescript-eslint` | 8.71.0 | MIT |
| `unbox-primitive` | 1.1.0 | MIT |
| `undici` | 8.12.2 | MIT |
| `undici-types` | 7.24.6 | MIT |
| `update-browserslist-db` | 1.3.4 | MIT |
| `uri-js` | 4.4.1 | BSD-2-Clause |
| `vite` | 8.3.2 | MIT |
| `vitest` | 5.0.3 | MIT |
| `w3c-xmlserializer` | 6.0.0 | MIT |
| `webidl-conversions` | 8.0.1 | BSD-2-Clause |
| `whatwg-mimetype` | 5.0.0 | MIT |
| `whatwg-url` | 16.0.1 | MIT |
| `whatwg-url` | 17.3.0 | MIT |
| `which` | 2.0.2 | ISC |
| `which-boxed-primitive` | 1.1.1 | MIT |
| `which-builtin-type` | 1.2.1 | MIT |
| `which-collection` | 1.0.2 | MIT |
| `which-typed-array` | 1.1.24 | MIT |
| `why-is-node-running` | 3.2.1 | MIT |
| `word-wrap` | 1.2.5 | MIT |
| `xml-name-validator` | 5.0.0 | Apache-2.0 |
| `xmlchars` | 2.2.0 | MIT |
| `yallist` | 3.1.1 | ISC |
| `yocto-queue` | 0.1.0 | MIT |
| `zod` | 4.6.7 | MIT |
| `zod-validation-error` | 4.0.2 | MIT |
