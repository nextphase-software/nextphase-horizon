# Stable error codes — household input v1/v2 / engine models 0.1.0–0.3.0

Errors serialize as `{ "status": "invalid" | "unsupported", "code": "...", "message": "..." }`.
The command exits 1 for invalid input and 2 for unsupported input. Codes are
permanent identifiers and must never be reassigned. A successful partial run
has status `partial` and exits 3 in supported commands, or 0 in legacy
`dev-run`, with its omissions explicitly listed. Complete supported results exit 0.

| Code | Status | Meaning |
| --- | --- | --- |
| `MISSING_FIELD` | invalid | A required household, fixture or assumption field is absent. |
| `MALFORMED_INPUT` | invalid | Invalid JSON, a wrong type, an unknown field or another structural violation. |
| `NEGATIVE_BALANCE` | invalid | A balance, cost basis or entered income/spending amount is negative. |
| `END_BEFORE_START` | invalid | Wage end date precedes its start date. |
| `UNKNOWN_ACCOUNT_TYPE` | invalid | Account type is outside cash, taxable, tax_deferred and roth. |
| `PLAN_END_AGE_REACHED` | invalid | End age is reached by 31 December of the valuation year. |
| `PERSON_REQUIRED` | invalid | The household contains no person. |
| `INVALID_PERSON` | invalid | Person ID is empty or end age is outside 1–130. |
| `INVALID_DATE` | invalid | Not a real Gregorian date in YYYY-MM-DD form, years 0001–9999. |
| `INVALID_DATE_ORDER` | invalid | Birth follows valuation or retirement. |
| `INVALID_YEAR` | invalid | Projection year precedes its reference year or end year exceeds 9999. |
| `INVALID_ACCOUNT_ID` | invalid | Account IDs are empty or duplicated. |
| `INVALID_OWNER` | invalid | Account owner differs from the single person's ID. |
| `ACCOUNT_FIELDS` | invalid | Taxable cost basis or tax-deferred plan kind is missing or inappropriate. |
| `INVALID_START_AGE` | invalid | An income start age exceeds 130. |
| `MISSING_ASSUMPTION` | invalid | A required rate assumption is absent; no implicit default exists. |
| `DUPLICATE_ASSUMPTION` | invalid | Two assumptions share an identifier. |
| `INVALID_ASSUMPTION` | invalid | A rate assumption has wrong units, effective year or source. |
| `INVALID_RATE` | invalid | Invalid plain decimal, nonpositive fraction denominator, or inflation at or below −1. |
| `MONEY_OVERFLOW` | invalid | Checked cent arithmetic or rounded result exceeds i64. |
| `MONEY_OUTPUT_RANGE` | invalid | A monetary value exceeds ±(2^53 − 1) cents. |
| `CANONICAL_JSON` | invalid | Non-ASCII object name, noninteger or out-of-range JSON number. |
| `FIXTURE_READ` | invalid | Requested fixture cannot be read as UTF-8. |
| `CLI_USAGE` | invalid | Unknown subcommand or wrong argument count for run, compare, export, import or dev-run. |
| `MULTIPLE_PERSONS_UNSUPPORTED` | unsupported | More than one person was provided. |
| `FEATURE_UNSUPPORTED` | unsupported | State-tax or healthcare input was provided. |
| `ASSUMPTION_UNSUPPORTED` | unsupported | An assumption outside inflation, investment_return, cash_return and tax_indexing was provided. |
| `NEGATIVE_RETURN_UNSUPPORTED` | unsupported | Cash or investment return is negative. |
| `RMD_TABLE_AGE_UNSUPPORTED` | unsupported | An owner distribution is due at an age below the committed table's first row (72). |
| `SURPLUS_ACCOUNT_ID_CONFLICT` | invalid | The generated surplus account ID is already held by a non-taxable account. |
| `LEDGER_INVARIANT` | invalid | A nonnegative balance/basis or exact conservation condition failed. |
| `TAX_YEAR_UNSUPPORTED` | unsupported | Federal tax year precedes 2026. |
| `INVALID_TAX_INDEXING` | invalid | Tax indexing is negative; zero is allowed. |
| `INVALID_TAX_PASS_LIMIT` | invalid | Requested tax funding pass limit is outside 1–50. |
| `INVALID_TAX_INPUT` | invalid | Direct tax computation received negative ordinary income, benefits, carry or early distributions. |
| `TAX_INVARIANT` | invalid | Tax funding could not execute a pass or locate its rounding cycle. |
| `SCENARIO_POINTER_INVALID` | invalid | A JSON Pointer is malformed, cannot resolve its parent/array index, or changes the input document to an invalid root shape. |
| `SCENARIO_ASSUMPTION_ID_MISMATCH` | invalid | An assumption object key differs from its identifier. |
| `COMPARISON_BASIS_MISMATCH` | invalid | Matched monetary lines have different dollar bases and cannot be subtracted. |
| `COMPARISON_LINE_INVALID` | invalid | A supplied run has malformed monetary lines, units, years or account identifiers. |
| `COMPARISON_RUN_INVALID` | invalid | A supplied run has no projection years to summarize. |
| `EXPORT_FORMAT_UNSUPPORTED` | unsupported | Export format version is not 1; checked before content hash. |
| `EXPORT_HASH_MISMATCH` | invalid | Content hash is missing, malformed or differs from the canonical export hash. |
| `EXPORT_MODEL_VERSION_UNSUPPORTED` | unsupported | Export model version differs from the running engine; checked after the hash. |
| `EXPORT_RESULT_MISMATCH` | invalid | Validated input fails to reproduce the embedded run or its duplicated metadata after rerunning. |
