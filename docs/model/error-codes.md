# Stable error codes — household input v1/v2 / engine models 0.1.0–0.2.0

Errors serialize as `{ "status": "invalid" | "unsupported", "code": "...", "message": "..." }`.
The command exits 1 for invalid input and 2 for unsupported input. Codes are
permanent identifiers and must never be reassigned. A successful partial run
has status `partial` and exits 0, with its omissions explicitly listed.

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
| `CLI_USAGE` | invalid | Command is not exactly dev-run plus one fixture name or path. |
| `MULTIPLE_PERSONS_UNSUPPORTED` | unsupported | More than one person was provided. |
| `FEATURE_UNSUPPORTED` | unsupported | State-tax or healthcare input was provided. |
| `ASSUMPTION_UNSUPPORTED` | unsupported | An assumption outside inflation, investment_return and cash_return was provided. |
| `NEGATIVE_RETURN_UNSUPPORTED` | unsupported | Cash or investment return is negative. |
| `RMD_TABLE_AGE_UNSUPPORTED` | unsupported | An owner distribution is due at an age below the committed table's first row (72). |
| `SURPLUS_ACCOUNT_ID_CONFLICT` | invalid | The generated surplus account ID is already held by a non-taxable account. |
| `LEDGER_INVARIANT` | invalid | A nonnegative balance/basis or exact conservation condition failed. |
