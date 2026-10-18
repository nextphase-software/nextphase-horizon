// SPDX-License-Identifier: AGPL-3.0-only
use crate::{Fixture, parse_fixture, run_fixture};
use horizon_engine::{
    canonical::canonical_json,
    error::{Error, Result, Status},
    input::DollarBasis,
    money::Money,
    projection::{MonetaryValue, Run},
};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use std::collections::{BTreeMap, BTreeSet};
fn malformed() -> Error {
    Error::invalid(
        "SCENARIO_POINTER_INVALID",
        "Scenario change must resolve a valid JSON Pointer in the input document.",
    )
}
pub fn escape(token: &str) -> String {
    token.replace('~', "~0").replace('/', "~1")
}
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct PointerChange {
    pub path: String,
    pub value: Value,
}
#[derive(Debug, Clone, Serialize, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum ChangeKind {
    Added,
    Modified,
    Removed,
}
#[derive(Debug, Clone, Serialize, JsonSchema)]
pub struct ChangedInput {
    pub path: String,
    pub change: ChangeKind,
    pub baseline: Value,
    pub scenario: Value,
}
fn document(input: &Fixture) -> Result<Value> {
    let mut assumptions = serde_json::Map::new();
    for a in &input.assumptions {
        if assumptions.insert(a.identifier.clone(), json!(a)).is_some() {
            return Err(Error::invalid(
                "DUPLICATE_ASSUMPTION",
                "Assumption identifiers must be unique.",
            ));
        }
    }
    Ok(json!({"household":input.household,"assumptions":assumptions}))
}
/// JSON Pointer changes apply only to a fresh document; optional pass_limit is retained.
pub fn scenario(baseline: &Fixture, changes: &[PointerChange]) -> Result<Fixture> {
    let mut doc = document(baseline)?;
    for change in changes {
        set_pointer(&mut doc, &change.path, change.value.clone())?;
    }
    if doc.as_object().is_none_or(|m| {
        m.len() != 2 || !m.contains_key("household") || !m.contains_key("assumptions")
    }) {
        return Err(malformed());
    }
    let assumptions = doc
        .get("assumptions")
        .and_then(Value::as_object)
        .ok_or_else(malformed)?;
    for (key, value) in assumptions {
        if value["identifier"].as_str() != Some(key) {
            return Err(Error::invalid(
                "SCENARIO_ASSUMPTION_ID_MISMATCH",
                "Assumption keys must equal their identifiers.",
            ));
        }
    }
    let mut envelope = json!({"household":doc.get("household").ok_or_else(malformed)?,"assumptions":assumptions.values().collect::<Vec<_>>()});
    if let Some(limit) = baseline.pass_limit {
        envelope["pass_limit"] = json!(limit);
    }
    let fixture = parse_fixture(&canonical_json(&envelope)?)?;
    run_fixture(&fixture)?;
    Ok(fixture)
}
fn token(encoded: &str) -> Result<String> {
    let mut chars = encoded.chars();
    let mut decoded = String::new();
    while let Some(c) = chars.next() {
        if c == '~' {
            decoded.push(match chars.next() {
                Some('0') => '~',
                Some('1') => '/',
                _ => return Err(malformed()),
            });
        } else {
            decoded.push(c);
        }
    }
    Ok(decoded)
}
fn index(token: &str) -> Result<usize> {
    if token.is_empty()
        || (token.len() > 1 && token.starts_with('0'))
        || !token.bytes().all(|b| b.is_ascii_digit())
    {
        return Err(malformed());
    }
    token.parse().map_err(|_| malformed())
}
fn set_pointer(doc: &mut Value, path: &str, value: Value) -> Result<()> {
    if path.is_empty() {
        *doc = value;
        return Ok(());
    }
    let parts = path
        .strip_prefix('/')
        .ok_or_else(malformed)?
        .split('/')
        .map(token)
        .collect::<Result<Vec<_>>>()?;
    let (last, parents) = parts.split_last().ok_or_else(malformed)?;
    let mut target = doc;
    for part in parents {
        target = match target {
            Value::Object(m) => m.get_mut(part).ok_or_else(malformed)?,
            Value::Array(a) => a.get_mut(index(part)?).ok_or_else(malformed)?,
            _ => return Err(malformed()),
        };
    }
    match target {
        Value::Object(m) => {
            m.insert(last.clone(), value);
        }
        Value::Array(a) if last == "-" => a.push(value),
        Value::Array(a) => {
            *a.get_mut(index(last)?).ok_or_else(malformed)? = value;
        }
        _ => return Err(malformed()),
    }
    Ok(())
}
fn changed(path: &str, a: Option<&Value>, b: Option<&Value>, out: &mut Vec<ChangedInput>) {
    if a == b {
        return;
    }
    match (a, b) {
        (Some(Value::Object(a)), Some(Value::Object(b))) => {
            let keys: BTreeSet<_> = a.keys().chain(b.keys()).collect();
            for key in keys {
                changed(
                    &format!("{path}/{}", escape(key)),
                    a.get(key),
                    b.get(key),
                    out,
                );
            }
        }
        (Some(Value::Array(a)), Some(Value::Array(b))) => {
            for i in 0..a.len().max(b.len()) {
                changed(&format!("{path}/{i}"), a.get(i), b.get(i), out);
            }
        }
        _ => out.push(ChangedInput {
            path: path.into(),
            change: match (a, b) {
                (None, _) => ChangeKind::Added,
                (_, None) => ChangeKind::Removed,
                _ => ChangeKind::Modified,
            },
            baseline: a.cloned().unwrap_or(Value::Null),
            scenario: b.cloned().unwrap_or(Value::Null),
        }),
    }
}
#[derive(Debug, Clone, Serialize, JsonSchema)]
pub struct LineDifference {
    pub year: u16,
    pub path: String,
    pub baseline: Option<MonetaryValue>,
    pub scenario: Option<MonetaryValue>,
    pub difference: Option<MonetaryValue>,
}
fn money_line(v: &Value) -> Result<MonetaryValue> {
    let cents = v["cents"]
        .as_i64()
        .ok_or_else(|| Error::invalid("COMPARISON_LINE_INVALID", "Invalid cent-valued line."))?;
    let basis: DollarBasis = serde_json::from_value(v["dollar_basis"].clone())
        .map_err(|_| Error::invalid("COMPARISON_LINE_INVALID", "Invalid dollar basis."))?;
    let year = |key: &str| -> Result<u16> {
        v[key]
            .as_u64()
            .and_then(|y| u16::try_from(y).ok())
            .ok_or_else(|| Error::invalid("COMPARISON_LINE_INVALID", "Invalid monetary year."))
    };
    if v["unit"] != "cent" || v["currency"] != "USD" {
        return Err(Error::invalid(
            "COMPARISON_LINE_INVALID",
            "Only USD cent lines are supported.",
        ));
    }
    MonetaryValue::new(
        Money::from_cents(cents),
        basis,
        year("base_year")?,
        year("year")?,
    )
}
fn collect_lines(path: &str, v: &Value, out: &mut BTreeMap<String, MonetaryValue>) -> Result<()> {
    match v {
        Value::Object(m) if m.contains_key("cents") => {
            out.insert(path.into(), money_line(v)?);
        }
        Value::Object(m) => {
            for (k, v) in m {
                collect_lines(&format!("{path}/{}", escape(k)), v, out)?;
            }
        }
        Value::Array(a) => {
            for (i, v) in a.iter().enumerate() {
                let name = if path == "/accounts" {
                    v["identifier"]
                        .as_str()
                        .ok_or_else(|| {
                            Error::invalid("COMPARISON_LINE_INVALID", "Account identifier missing.")
                        })?
                        .to_owned()
                } else {
                    i.to_string()
                };
                collect_lines(&format!("{path}/{}", escape(&name)), v, out)?;
            }
        }
        _ => {}
    }
    Ok(())
}
/// Public typed-run seam also proves that mismatched dollar bases cannot be subtracted.
pub fn line_differences(a: &Run, b: &Run) -> Result<Vec<LineDifference>> {
    let mut left = BTreeMap::new();
    let mut right = BTreeMap::new();
    for (run, rows) in [(a, &mut left), (b, &mut right)] {
        for y in &run.years {
            let mut lines = BTreeMap::new();
            collect_lines("", &json!(y.ledger), &mut lines)?;
            for (path, value) in lines {
                rows.insert((y.year, path), value);
            }
        }
    }
    let keys: BTreeSet<_> = left.keys().chain(right.keys()).collect();
    let mut out = Vec::new();
    for (year, path) in keys {
        let l = left.get(&(*year, path.clone()));
        let r = right.get(&(*year, path.clone()));
        let difference = match (l, r) {
            (Some(l), Some(r)) => {
                if l.dollar_basis != r.dollar_basis {
                    return Err(Error::invalid(
                        "COMPARISON_BASIS_MISMATCH",
                        "Cannot subtract monetary lines with different dollar bases.",
                    ));
                }
                if l.cents == r.cents {
                    continue;
                }
                Some(MonetaryValue::new(
                    Money::from_cents(r.cents).checked_sub(Money::from_cents(l.cents))?,
                    r.dollar_basis,
                    r.base_year,
                    *year,
                )?)
            }
            _ => None,
        };
        out.push(LineDifference {
            year: *year,
            path: path.clone(),
            baseline: l.cloned(),
            scenario: r.cloned(),
            difference,
        });
    }
    Ok(out)
}
#[derive(Debug, Clone, Serialize, JsonSchema)]
pub struct EndingBalance {
    pub identifier: String,
    pub balance: MonetaryValue,
}
#[derive(Debug, Clone, Serialize, JsonSchema)]
pub struct Summary {
    pub status: &'static str,
    pub first_shortfall_year: Option<u16>,
    pub last_year: u16,
    pub total_shortfall: MonetaryValue,
    pub total_federal_tax_paid: MonetaryValue,
    pub totals_label: &'static str,
    pub ending_balances: Vec<EndingBalance>,
    pub ending_total: MonetaryValue,
}
fn summary(run: &Run) -> Result<Summary> {
    let last = run.years.last().ok_or_else(|| {
        Error::invalid(
            "COMPARISON_RUN_INVALID",
            "A run must have projection years.",
        )
    })?;
    let base = run.valuation_date.year()?;
    let mut shortfall = Money::from_cents(0);
    let mut tax = Money::from_cents(0);
    let mut ending = Money::from_cents(0);
    let mut balances = Vec::new();
    for y in &run.years {
        shortfall = shortfall.checked_add(Money::from_cents(y.ledger.shortfall.cents()))?;
        if let Some(f) = &y.ledger.federal_tax {
            tax = tax.checked_add(Money::from_cents(f.paid.cents()))?;
        }
    }
    for a in &last.ledger.accounts {
        ending = ending.checked_add(Money::from_cents(a.closing.cents()))?;
        balances.push(EndingBalance {
            identifier: a.identifier.clone(),
            balance: a.closing.value.clone(),
        });
    }
    balances.sort_by(|a, b| a.identifier.cmp(&b.identifier));
    let line = |v| MonetaryValue::new(v, DollarBasis::Nominal, base, last.year);
    Ok(Summary {
        status: run.status,
        first_shortfall_year: run
            .years
            .iter()
            .find(|y| y.ledger.shortfall.cents() > 0)
            .map(|y| y.year),
        last_year: last.year,
        total_shortfall: line(shortfall)?,
        total_federal_tax_paid: line(tax)?,
        totals_label: "nominal, summed across years",
        ending_balances: balances,
        ending_total: line(ending)?,
    })
}
#[derive(Debug, Clone, Serialize, JsonSchema)]
pub struct SummaryDifference {
    pub first_shortfall_year: Option<i32>,
    pub last_year: i32,
    pub total_shortfall: MonetaryValue,
    pub total_federal_tax_paid: MonetaryValue,
    pub ending_balances: Vec<EndingBalanceDifference>,
    pub ending_total: MonetaryValue,
    pub totals_label: &'static str,
}
#[derive(Debug, Clone, Serialize, JsonSchema)]
pub struct EndingBalanceDifference {
    pub identifier: String,
    pub baseline: Option<MonetaryValue>,
    pub scenario: Option<MonetaryValue>,
    pub difference: Option<MonetaryValue>,
}
#[derive(Debug, Clone, Serialize, JsonSchema)]
pub struct ComparisonSummary {
    pub baseline: Summary,
    pub scenario: Summary,
    pub difference: SummaryDifference,
}
#[derive(Debug, Clone, Serialize, JsonSchema)]
pub struct RunHashes {
    pub input_hash: String,
    pub assumption_set_hash: String,
}
#[derive(Debug, Clone, Serialize, JsonSchema)]
pub struct Comparison {
    pub status: &'static str,
    pub changed_inputs: Vec<ChangedInput>,
    pub line_differences: Vec<LineDifference>,
    pub summary: ComparisonSummary,
    pub baseline: Run,
    pub scenario: Run,
    pub baseline_hashes: RunHashes,
    pub scenario_hashes: RunHashes,
}
fn delta(a: &MonetaryValue, b: &MonetaryValue) -> Result<MonetaryValue> {
    if a.dollar_basis != b.dollar_basis {
        return Err(Error::invalid(
            "COMPARISON_BASIS_MISMATCH",
            "Cannot subtract monetary lines with different dollar bases.",
        ));
    }
    MonetaryValue::new(
        Money::from_cents(b.cents).checked_sub(Money::from_cents(a.cents))?,
        b.dollar_basis,
        b.base_year,
        b.year,
    )
}
pub(crate) fn pair<A, B>(a: Result<A>, b: Result<B>) -> Result<(A, B)> {
    match (a, b) {
        (Ok(a), Ok(b)) => Ok((a, b)),
        (Err(e), _) if e.status == Status::Unsupported => Err(e),
        (_, Err(e)) if e.status == Status::Unsupported => Err(e),
        (Err(e), _) | (_, Err(e)) => Err(e),
    }
}
pub fn compare_documents(a: &str, b: &str) -> Result<Comparison> {
    let (a, b) = pair(parse_fixture(a), parse_fixture(b))?;
    compare(&a, &b)
}
pub fn compare(a: &Fixture, b: &Fixture) -> Result<Comparison> {
    let (left, right) = pair(run_fixture(a), run_fixture(b))?;
    let mut changes = Vec::new();
    changed("", Some(&document(a)?), Some(&document(b)?), &mut changes);
    changes.sort_by(|a, b| a.path.cmp(&b.path));
    let sa = summary(&left)?;
    let sb = summary(&right)?;
    let keys: BTreeSet<_> = sa
        .ending_balances
        .iter()
        .chain(&sb.ending_balances)
        .map(|a| a.identifier.clone())
        .collect();
    let mut balances = Vec::new();
    for key in keys {
        let a = sa
            .ending_balances
            .iter()
            .find(|a| a.identifier == key)
            .map(|a| a.balance.clone());
        let b = sb
            .ending_balances
            .iter()
            .find(|a| a.identifier == key)
            .map(|a| a.balance.clone());
        let difference = match (&a, &b) {
            (Some(a), Some(b)) => Some(delta(a, b)?),
            _ => None,
        };
        balances.push(EndingBalanceDifference {
            identifier: key,
            baseline: a,
            scenario: b,
            difference,
        });
    }
    let difference = SummaryDifference {
        first_shortfall_year: match (sa.first_shortfall_year, sb.first_shortfall_year) {
            (Some(a), Some(b)) => Some(
                i32::from(b)
                    .checked_sub(i32::from(a))
                    .ok_or_else(malformed)?,
            ),
            _ => None,
        },
        last_year: i32::from(sb.last_year)
            .checked_sub(i32::from(sa.last_year))
            .ok_or_else(malformed)?,
        total_shortfall: delta(&sa.total_shortfall, &sb.total_shortfall)?,
        total_federal_tax_paid: delta(&sa.total_federal_tax_paid, &sb.total_federal_tax_paid)?,
        ending_total: delta(&sa.ending_total, &sb.ending_total)?,
        ending_balances: balances,
        totals_label: "nominal, summed across years",
    };
    let hashes = |r: &Run| RunHashes {
        input_hash: r.metadata.input_hash.clone(),
        assumption_set_hash: r.metadata.assumption_set_hash.clone(),
    };
    Ok(Comparison {
        status: if left.status == "complete" && right.status == "complete" {
            "complete"
        } else {
            "partial"
        },
        changed_inputs: changes,
        line_differences: line_differences(&left, &right)?,
        summary: ComparisonSummary {
            baseline: sa,
            scenario: sb,
            difference,
        },
        baseline_hashes: hashes(&left),
        scenario_hashes: hashes(&right),
        baseline: left,
        scenario: right,
    })
}

/// Preserve unsupported-input precedence when adapters read two documents.
pub fn read_pair(a: Result<String>, b: Result<String>) -> Result<(String, String)> {
    pair(a, b)
}
