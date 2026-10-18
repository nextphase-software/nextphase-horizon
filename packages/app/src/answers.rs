// SPDX-License-Identifier: AGPL-3.0-only
//! Deterministic annual answers. Whole-dollar/year results use valuation-year dollars.
use crate::{
    Fixture,
    compare::{PointerChange, input_value},
    run_fixture, scenario,
};
use horizon_engine::{
    canonical::hash,
    error::{Error, Result},
    input::{Date, DollarBasis, projection_years},
    money::Fraction,
    projection::Run,
};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
pub const CAP: i64 = 10_000_000;
fn overflow() -> Error {
    Error::invalid("MONEY_OVERFLOW", "Answer arithmetic exceeds i64 bounds.")
}
fn sub(a: i64, b: i64) -> Result<i64> {
    a.checked_sub(b).ok_or_else(overflow)
}
fn scaled(cents: i64, rate: &str) -> Result<i64> {
    Ok(Fraction::integer(cents)
        .times(&Fraction::decimal(rate)?)
        .finalize()?
        .cents())
}
fn rate_change(value: &str, change: &str, clamp: bool) -> Result<String> {
    let value = Fraction::decimal(value)?.plus(&Fraction::decimal(change)?);
    let value = if clamp {
        value.maximum(Fraction::integer(0))
    } else {
        value
    };
    value.decimal_string()
}
#[derive(Debug, Clone, Serialize, JsonSchema)]
pub struct AnnualUnit {
    pub unit: &'static str,
    pub currency: &'static str,
    pub dollar_basis: DollarBasis,
    pub base_year: u16,
}
fn unit(input: &Fixture) -> Result<AnnualUnit> {
    Ok(AnnualUnit {
        unit: "whole_dollar_per_year",
        currency: "USD",
        dollar_basis: DollarBasis::Today,
        base_year: input.household.valuation_date.year()?,
    })
}
#[derive(Debug, Clone, Serialize, JsonSchema)]
pub struct SustainableSpending {
    pub status: &'static str,
    pub sustainable_spending: i64,
    pub flag: Option<&'static str>,
    pub runs: u32,
    pub entered: i64,
    pub headroom: i64,
    pub cap: i64,
    pub units: AnnualUnit,
    pub input_hash: String,
    pub run: Run,
}
pub fn sustainable_spending(input: &Fixture) -> Result<SustainableSpending> {
    sustainable_spending_with(input, run_fixture)
}
/// Replaceable calculation seam: every call, including verification, is counted.
pub fn sustainable_spending_with<F>(
    input: &Fixture,
    mut calculate: F,
) -> Result<SustainableSpending>
where
    F: FnMut(&Fixture) -> Result<Run>,
{
    horizon_engine::input::validate_household(&input.household)?;
    if input.household.spending.after_retirement.dollar_basis != DollarBasis::Today {
        return Err(Error::unsupported(
            "SPENDING_BASIS_UNSUPPORTED",
            "Sustainable spending requires today's-dollar after-retirement spending.",
        ));
    }
    let entered = input
        .household
        .spending
        .after_retirement
        .cents
        .div_euclid(100);
    let mut runs = 0u32;
    let mut trial = |dollars: i64| -> Result<Run> {
        runs = runs.checked_add(1).ok_or_else(overflow)?;
        let mut copy = input.clone();
        copy.household.spending.after_retirement.cents =
            dollars.checked_mul(100).ok_or_else(overflow)?;
        calculate(&copy)
    };
    let feasible = |r: &Run| r.years.iter().all(|y| y.ledger.shortfall.cents() == 0);
    let start = entered.min(CAP);
    let first = trial(start)?;
    let (answer, flag, result) = if feasible(&first) {
        if start == CAP {
            (CAP, Some("at_or_above_cap"), first)
        } else {
            let mut lo = start;
            let mut hi = start.checked_mul(2).ok_or_else(overflow)?.clamp(1, CAP);
            let upper = loop {
                let r = trial(hi)?;
                if !feasible(&r) {
                    break None;
                }
                lo = hi;
                if hi == CAP {
                    break Some(r);
                }
                hi = hi.checked_mul(2).ok_or_else(overflow)?.min(CAP);
            };
            if let Some(r) = upper {
                (CAP, Some("at_or_above_cap"), r)
            } else {
                let (s, r) = bisect(&mut trial, &feasible, lo, hi)?;
                (s, None, r)
            }
        }
    } else {
        let zero = trial(0)?;
        if !feasible(&zero) {
            (0, Some("shortfall_with_no_retirement_spending"), zero)
        } else {
            let (s, r) = bisect(&mut trial, &feasible, 0, start)?;
            (s, None, r)
        }
    };
    Ok(SustainableSpending {
        status: result.status,
        sustainable_spending: answer,
        flag,
        runs,
        entered,
        headroom: sub(answer, entered)?,
        cap: CAP,
        units: unit(input)?,
        input_hash: hash(&input.household)?,
        run: result,
    })
}
fn bisect<F, P>(trial: &mut F, feasible: &P, mut lo: i64, mut hi: i64) -> Result<(i64, Run)>
where
    F: FnMut(i64) -> Result<Run>,
    P: Fn(&Run) -> bool,
{
    while sub(hi, lo)? > 1 {
        let middle = lo.checked_add(hi).ok_or_else(overflow)?.div_euclid(2);
        if feasible(&trial(middle)?) {
            lo = middle
        } else {
            hi = middle
        }
    }
    let result = trial(lo)?;
    let beyond = trial(lo.checked_add(1).ok_or_else(overflow)?)?;
    if !feasible(&result) || feasible(&beyond) {
        return Err(Error::invalid(
            "SPENDING_SEARCH_NOT_MONOTONIC",
            "Spending boundary verification failed.",
        ));
    }
    Ok((lo, result))
}
#[derive(Debug, Clone, Serialize, JsonSchema)]
pub struct YearFlags {
    pub year: u16,
    pub flags: Vec<String>,
}
fn flags(run: &Run) -> Vec<YearFlags> {
    run.years
        .iter()
        .map(|y| YearFlags {
            year: y.year,
            flags: y.ledger.flags.clone(),
        })
        .collect()
}
#[derive(Debug, Clone, Serialize, JsonSchema)]
pub struct Lever {
    pub id: &'static str,
    pub kind: &'static str,
    pub changes: Vec<PointerChange>,
    pub sustainable_spending: i64,
    pub flag: Option<&'static str>,
    pub headroom: i64,
    pub effect: i64,
    pub first_shortfall_age: Option<u16>,
    pub ending_total_today: horizon_engine::projection::MonetaryValue,
    pub status: &'static str,
    pub omissions: Vec<&'static str>,
    pub flags: Vec<YearFlags>,
}
#[derive(Debug, Clone, Serialize, JsonSchema)]
pub struct SkippedLever {
    pub id: &'static str,
    pub reason: &'static str,
}
#[derive(Debug, Clone, Serialize, JsonSchema)]
pub struct Levers {
    pub status: &'static str,
    pub units: AnnualUnit,
    pub baseline: SustainableSpending,
    pub levers: Vec<Lever>,
    pub skipped: Vec<SkippedLever>,
    pub ranking: Vec<&'static str>,
    pub what_moves_most: Vec<&'static str>,
}
fn shifted_date(date: &Date, later: bool) -> Result<Date> {
    date.validate()?;
    let year = date.year()?;
    let year = if later {
        year.checked_add(1)
    } else {
        year.checked_sub(1)
    }
    .ok_or_else(overflow)?;
    let month: u16 = date.0[5..7].parse().map_err(|_| overflow())?;
    let day: u16 = date.0[8..10].parse().map_err(|_| overflow())?;
    let day = if month == 2 && day == 29 && horizon_engine::calendar::days_in_year(year) != 366 {
        28
    } else {
        day
    };
    horizon_engine::calendar::date(year, month, day)
}
pub fn levers(input: &Fixture) -> Result<Levers> {
    let baseline = sustainable_spending(input)?;
    let mut status = baseline.status;
    let mut offered = Vec::new();
    let mut skipped = Vec::new();
    let person = &input.household.persons[0];
    let end = horizon_engine::calendar::date(*projection_years(&input.household)?.end(), 12, 31)?;
    for (id, later) in [("retire_earlier", false), ("retire_later", true)] {
        if person.retirement_date <= input.household.valuation_date {
            skipped.push(SkippedLever {
                id,
                reason: "already_retired",
            });
            continue;
        }
        if later && person.retirement_date.year()? == 9999 {
            skipped.push(SkippedLever {
                id,
                reason: "retirement_date_outside_offered_range",
            });
            continue;
        }
        let date = shifted_date(&person.retirement_date, later)?;
        if date <= input.household.valuation_date || date > end {
            skipped.push(SkippedLever {
                id,
                reason: "retirement_date_outside_offered_range",
            });
            continue;
        }
        let mut changes = vec![PointerChange {
            path: "/household/persons/0/retirement_date".into(),
            value: json!(date),
        }];
        for (i, w) in input.household.income.wages.iter().enumerate() {
            if w.end_date == person.retirement_date {
                changes.push(PointerChange {
                    path: format!("/household/income/wages/{i}/end_date"),
                    value: json!(date),
                });
            }
        }
        offered.push((id, "retirement_date", changes));
    }
    for (id, rate) in [("spend_lower", "0.9"), ("spend_higher", "1.1")] {
        offered.push((
            id,
            "spending",
            vec![PointerChange {
                path: "/household/spending/after_retirement/cents".into(),
                value: json!(scaled(
                    input.household.spending.after_retirement.cents,
                    rate
                )?),
            }],
        ));
    }
    let rate = input
        .assumptions
        .iter()
        .find(|a| a.identifier == "investment_return")
        .ok_or_else(|| Error::invalid("MISSING_ASSUMPTION", "Investment return is required."))?;
    for (id, shift) in [("return_lower", "-0.01"), ("return_higher", "0.01")] {
        let next = rate_change(&rate.value, shift, false)?;
        if Fraction::decimal(&next)?.is_negative() {
            skipped.push(SkippedLever {
                id,
                reason: "return_below_zero",
            });
            continue;
        }
        offered.push((
            id,
            "return",
            vec![PointerChange {
                path: "/assumptions/investment_return/value".into(),
                value: json!(next),
            }],
        ));
    }
    let mut output = Vec::new();
    for (id, kind, changes) in offered {
        let changed = scenario(input, &changes)?;
        let answer = sustainable_spending(&changed)?;
        let entered = run_fixture(&changed)?;
        let last = entered.years.last().ok_or_else(overflow)?;
        let ending = last
            .ledger
            .total_closing_today
            .as_ref()
            .ok_or_else(overflow)?
            .value
            .clone();
        if answer.status == "partial" {
            status = "partial";
        }
        output.push(Lever {
            id,
            kind,
            changes,
            sustainable_spending: answer.sustainable_spending,
            flag: answer.flag,
            headroom: answer.headroom,
            effect: sub(answer.headroom, baseline.headroom)?,
            first_shortfall_age: entered
                .years
                .iter()
                .find(|y| y.ledger.shortfall.cents() > 0)
                .map(|y| y.age_on_december_31),
            ending_total_today: ending,
            status: answer.status,
            omissions: answer.run.omissions.clone(),
            flags: flags(&answer.run),
        });
    }
    let mut ranking: Vec<_> = output.iter().collect();
    ranking.sort_by_key(|a| std::cmp::Reverse(a.effect.unsigned_abs()));
    let ranking = ranking.iter().map(|v| v.id).collect();
    let mut kinds: Vec<(&str, u64)> = Vec::new();
    for lever in &output {
        if let Some(kind) = kinds.iter_mut().find(|v| v.0 == lever.kind) {
            kind.1 = kind.1.max(lever.effect.unsigned_abs());
        } else {
            kinds.push((lever.kind, lever.effect.unsigned_abs()));
        }
    }
    kinds.sort_by_key(|a| std::cmp::Reverse(a.1));
    Ok(Levers {
        status,
        units: unit(input)?,
        baseline,
        levers: output,
        skipped,
        ranking,
        what_moves_most: kinds.into_iter().map(|v| v.0).collect(),
    })
}
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct RoughInput {
    pub path: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub low: Option<Value>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub high: Option<Value>,
}
#[derive(Debug, Clone, Serialize, JsonSchema)]
pub struct ImpactItem {
    pub path: String,
    pub low: Value,
    pub high: Value,
    pub headroom_low: i64,
    pub headroom_high: i64,
    pub impact: u64,
    pub status_low: &'static str,
    pub status_high: &'static str,
    pub omissions_low: Vec<&'static str>,
    pub omissions_high: Vec<&'static str>,
    pub flags_low: Vec<YearFlags>,
    pub flags_high: Vec<YearFlags>,
}
#[derive(Debug, Clone, Serialize, JsonSchema)]
pub struct InputImpact {
    pub status: &'static str,
    pub units: AnnualUnit,
    pub baseline_headroom: i64,
    pub baseline: SustainableSpending,
    pub items: Vec<ImpactItem>,
}
fn defaults(input: &Fixture, path: &str, value: &Value) -> Result<Option<(Value, Value)>> {
    let parts: Vec<_> = path.split('/').collect();
    if parts.len() == 4 && parts[1] == "assumptions" && parts[3] == "value" {
        let Some(rate) = value.as_str() else {
            return Ok(None);
        };
        return Ok(Some((
            json!(rate_change(rate, "-0.01", true)?),
            json!(rate_change(rate, "0.01", true)?),
        )));
    }
    let Some(cents) = value.as_i64() else {
        return Ok(None);
    };
    let account = parts.len() == 5 && parts[1] == "household" && parts[2] == "accounts";
    if account && parts[4] == "cost_basis_cents" {
        let i: usize = parts[3].parse().map_err(|_| overflow())?;
        let balance = input
            .household
            .accounts
            .get(i)
            .ok_or_else(overflow)?
            .opening_balance_cents;
        return Ok(Some((
            json!(scaled(cents, "0.75")?),
            json!(scaled(cents, "1.25")?.min(balance)),
        )));
    }
    let amount = (parts.len() == 5
        && parts[1] == "household"
        && parts[2] == "spending"
        && ["before_retirement", "after_retirement"].contains(&parts[3])
        && parts[4] == "cents")
        || (parts.len() == 6
            && parts[1] == "household"
            && parts[2] == "income"
            && ["pension", "social_security"].contains(&parts[3])
            && parts[4] == "amount"
            && parts[5] == "cents")
        || (parts.len() == 7
            && parts[1] == "household"
            && parts[2] == "income"
            && parts[3] == "wages"
            && parts[5] == "amount"
            && parts[6] == "cents")
        || (account && parts[4] == "opening_balance_cents");
    Ok(if amount {
        Some((json!(scaled(cents, "0.9")?), json!(scaled(cents, "1.1")?)))
    } else {
        None
    })
}
pub fn input_impact(input: &Fixture, rough: &[RoughInput]) -> Result<InputImpact> {
    // Resolve pointers before search or default selection, preserving the strict pointer error.
    let values = rough
        .iter()
        .map(|item| input_value(input, &item.path))
        .collect::<Result<Vec<_>>>()?;
    let baseline = sustainable_spending(input)?;
    let mut status = baseline.status;
    let mut items = Vec::new();
    for (item, value) in rough.iter().zip(values) {
        let default = if item.low.is_none() || item.high.is_none() {
            match &value {
                Some(value) => defaults(input, &item.path, value)?,
                None => None,
            }
        } else {
            None
        };
        let required = || {
            Error::invalid(
                "IMPACT_RANGE_REQUIRED",
                "This rough input path requires an explicit low and high range.",
            )
        };
        let low = item
            .low
            .clone()
            .or_else(|| default.as_ref().map(|d| d.0.clone()))
            .ok_or_else(required)?;
        let high = item
            .high
            .clone()
            .or_else(|| default.as_ref().map(|d| d.1.clone()))
            .ok_or_else(required)?;
        let low_input = scenario(
            input,
            &[PointerChange {
                path: item.path.clone(),
                value: low.clone(),
            }],
        )?;
        let high_input = scenario(
            input,
            &[PointerChange {
                path: item.path.clone(),
                value: high.clone(),
            }],
        )?;
        let lo = sustainable_spending(&low_input)?;
        let hi = sustainable_spending(&high_input)?;
        if lo.status == "partial" || hi.status == "partial" {
            status = "partial";
        }
        let impact = sub(lo.headroom, baseline.headroom)?
            .unsigned_abs()
            .max(sub(hi.headroom, baseline.headroom)?.unsigned_abs());
        items.push(ImpactItem {
            path: item.path.clone(),
            low,
            high,
            headroom_low: lo.headroom,
            headroom_high: hi.headroom,
            impact,
            status_low: lo.status,
            status_high: hi.status,
            omissions_low: lo.run.omissions.clone(),
            omissions_high: hi.run.omissions.clone(),
            flags_low: flags(&lo.run),
            flags_high: flags(&hi.run),
        });
    }
    items.sort_by_key(|a| std::cmp::Reverse(a.impact));
    Ok(InputImpact {
        status,
        units: unit(input)?,
        baseline_headroom: baseline.headroom,
        baseline,
        items,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    fn input() -> Fixture {
        crate::parse_fixture(include_str!("../fixtures/answers-working-61.json")).unwrap()
    }
    #[test]
    fn answers_verifies_both_boundary_runs_and_counts_edge_cases() {
        let mut f = input();
        let template = run_fixture(&f).unwrap();
        f.household.spending.after_retirement.cents = 100;
        for fail_low in [true, false] {
            let mut two = 0u16;
            let mut three = 0u16;
            let error = sustainable_spending_with(&f, |trial| {
                let n = trial.household.spending.after_retirement.cents;
                if n == 200 {
                    two = two.checked_add(1).unwrap();
                }
                if n == 300 {
                    three = three.checked_add(1).unwrap();
                }
                let feasible = if fail_low && n == 200 && two == 2 {
                    false
                } else if !fail_low && n == 300 && three == 2 {
                    true
                } else {
                    n <= 200
                };
                let mut r = template.clone();
                for y in &mut r.years {
                    y.ledger.shortfall.value.cents = if feasible { 0 } else { 1 };
                }
                Ok(r)
            })
            .unwrap_err();
            assert_eq!(error.code, "SPENDING_SEARCH_NOT_MONOTONIC");
        }
        f.household.spending.after_retirement.cents = CAP.checked_mul(100).unwrap();
        let cap = sustainable_spending_with(&f, |_| {
            let mut r = template.clone();
            for y in &mut r.years {
                y.ledger.shortfall.value.cents = 0;
            }
            Ok(r)
        })
        .unwrap();
        assert_eq!(cap.runs, 1);
        assert_eq!(cap.flag, Some("at_or_above_cap"));
        f.household.spending.after_retirement.cents = 0;
        let no = sustainable_spending_with(&f, |_| {
            let mut r = template.clone();
            r.years[0].ledger.shortfall.value.cents = 1;
            Ok(r)
        })
        .unwrap();
        assert_eq!(no.runs, 2);
        assert_eq!(no.flag, Some("shortfall_with_no_retirement_spending"));
        f.household.spending.after_retirement.dollar_basis = DollarBasis::Nominal;
        assert_eq!(
            sustainable_spending(&f).unwrap_err().code,
            "SPENDING_BASIS_UNSUPPORTED"
        );
    }
    #[test]
    fn answers_defaults_pointer_errors_and_exact_rate_arithmetic() {
        let mut f = input();
        for path in ["/household/persons/0/plan_end_age", "/unknown/path"] {
            assert_eq!(
                input_impact(
                    &f,
                    &[RoughInput {
                        path: path.into(),
                        low: None,
                        high: None
                    }]
                )
                .unwrap_err()
                .code,
                "IMPACT_RANGE_REQUIRED"
            );
        }
        for path in [
            "no/slash",
            "/unknown/~2",
            "/household/accounts/00/opening_balance_cents",
        ] {
            assert_eq!(
                input_impact(
                    &f,
                    &[RoughInput {
                        path: path.into(),
                        low: None,
                        high: None
                    }]
                )
                .unwrap_err()
                .code,
                "SCENARIO_POINTER_INVALID"
            );
        }
        assert_eq!(rate_change("0.005", "-0.01", true).unwrap(), "0");
        assert_eq!(
            rate_change("0.019999999999999999", "0.01", false).unwrap(),
            "0.029999999999999999"
        );
        assert_eq!(scaled(105, "0.9").unwrap(), 95);
        assert_eq!(
            shifted_date(&Date("2032-02-29".into()), false).unwrap(),
            Date("2031-02-28".into())
        );
        assert_eq!(
            defaults(&f, "/assumptions/investment_return/value", &json!("0.005")).unwrap(),
            Some((json!("0"), json!("0.015")))
        );
        f.household.accounts[1].opening_balance_cents = 100;
        f.household.accounts[1].cost_basis_cents = Some(100);
        assert_eq!(
            defaults(&f, "/household/accounts/1/cost_basis_cents", &json!(100)).unwrap(),
            Some((json!(75), json!(100)))
        );
    }
    #[test]
    fn answers_offering_bounds_and_stable_impact_ties() {
        let mut f = crate::parse_fixture(include_str!("../fixtures/answers-cap.json")).unwrap();
        f.assumptions
            .iter_mut()
            .find(|a| a.identifier == "investment_return")
            .unwrap()
            .value = "0.005".into();
        let old = f.household.persons[0].retirement_date.clone();
        f.household.persons[0].retirement_date = Date("2027-01-01".into());
        for w in &mut f.household.income.wages {
            if w.end_date == old {
                w.end_date = Date("2027-01-01".into());
            }
        }
        let a = levers(&f).unwrap();
        assert!(a.skipped.iter().any(|s| s.id == "retire_earlier"));
        assert!(a.skipped.iter().any(|s| s.id == "return_lower"));
        assert!(!a.levers.iter().any(|s| s.id == "return_lower"));
        let original = hash(&f).unwrap();
        let items = vec![
            RoughInput {
                path: "/household/income/pension/amount/cents".into(),
                low: Some(json!(f.household.income.pension.amount.cents)),
                high: Some(json!(f.household.income.pension.amount.cents)),
            },
            RoughInput {
                path: "/assumptions/cash_return/value".into(),
                low: Some(json!(
                    f.assumptions
                        .iter()
                        .find(|a| a.identifier == "cash_return")
                        .unwrap()
                        .value
                )),
                high: Some(json!(
                    f.assumptions
                        .iter()
                        .find(|a| a.identifier == "cash_return")
                        .unwrap()
                        .value
                )),
            },
        ];
        let answer = input_impact(&f, &items).unwrap();
        assert_eq!(
            answer
                .items
                .iter()
                .map(|i| i.path.as_str())
                .collect::<Vec<_>>(),
            items.iter().map(|i| i.path.as_str()).collect::<Vec<_>>()
        );
        assert!(answer.items.iter().all(|i| i.impact == 0));
        assert_eq!(hash(&f).unwrap(), original);
    }
}
