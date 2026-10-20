// SPDX-License-Identifier: AGPL-3.0-only
//! Version 2 answer rules (0019). Money is checked integer USD cents;
//! searches use whole valuation-year dollars or whole birthday ages.
use super::*;
use crate::answers::sustainable_spending_with;
use horizon_engine::projection::Run;
use std::cmp::Ordering;

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(untagged, deny_unknown_fields)]
pub enum BirthAnswerV2 {
    Date { date: Date },
    Age { age: i64 },
    Later { later: Yes },
}
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct WhatIf {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub savings_total_cents: Option<i64>,
}
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct AnswersV2 {
    pub format: AnswersFormat,
    #[schemars(range(min = 2, max = 2))]
    pub version: u8,
    pub valuation_date: Date,
    pub planning: Planning,
    pub birth_date: BirthAnswerV2,
    pub retired: bool,
    pub retirement: Option<Retirement>,
    pub plan_end_age: Option<u16>,
    pub pay: Option<MoneyAnswer>,
    pub spending_now: Option<MoneyAnswer>,
    #[serde(default)]
    pub pay_ends: PayEnds,
    pub social_security: SocialSecurity,
    pub pension: Pension,
    pub savings: Savings,
    pub spending_in_retirement: RetirementSpending,
    #[serde(default)]
    pub assumptions: AssumptionAnswers,
    #[serde(default)]
    pub not_sure: Vec<String>,
    pub what_if: Option<WhatIf>,
}
impl AnswersV2 {
    // Share v1's conversion helpers without expanding its published types/schema.
    fn common(&self) -> Answers {
        Answers {
            format: self.format.clone(),
            version: 1,
            valuation_date: self.valuation_date.clone(),
            planning: self.planning,
            birth_date: match &self.birth_date {
                BirthAnswerV2::Date { date } => BirthAnswer::Date { date: date.clone() },
                _ => BirthAnswer::Later { later: Yes },
            },
            retired: self.retired,
            retirement: self.retirement.clone(),
            plan_end_age: self.plan_end_age,
            pay: self.pay.clone(),
            spending_now: self.spending_now.clone(),
            pay_ends: self.pay_ends.clone(),
            social_security: self.social_security.clone(),
            pension: self.pension.clone(),
            savings: self.savings.clone(),
            spending_in_retirement: self.spending_in_retirement.clone(),
            assumptions: self.assumptions.clone(),
            not_sure: self.not_sure.clone(),
        }
    }
}
#[derive(Debug, Clone, Serialize, JsonSchema)]
pub struct SolvedValue {
    pub value: Option<i64>,
    pub flag: Option<&'static str>,
}
#[derive(Debug, Clone, Serialize, JsonSchema)]
pub struct Solved {
    pub answer: &'static str,
    pub unit: &'static str,
    #[serde(flatten)]
    pub result: SolvedValue,
}
#[derive(Debug, Clone, Serialize, JsonSchema)]
pub struct SolvedSummary {
    #[serde(flatten)]
    pub summary: PlanSummary,
    pub solved: SolvedValue,
}
#[derive(Debug, Clone, Serialize, JsonSchema)]
pub struct SolvedRange {
    pub answer: String,
    pub worse_end: &'static str,
    pub value_at_low: Option<i64>,
    pub value_at_high: Option<i64>,
    pub spread: Option<u64>,
}
#[derive(Debug, Clone, Serialize, JsonSchema)]
pub struct SolvedBounds {
    pub worse: SolvedSummary,
    pub better: SolvedSummary,
    pub ordered: bool,
    pub ranked: Vec<SolvedRange>,
}
#[derive(Debug, Clone, Serialize, JsonSchema)]
#[serde(untagged)]
pub enum BoundsV2 {
    Unsolved(Bounds),
    Solved(SolvedBounds),
}
#[derive(Debug, Clone, Serialize, JsonSchema)]
pub struct AnswersPlanV2 {
    pub status: &'static str,
    pub code: Option<String>,
    pub needed: Vec<&'static str>,
    pub household_input: Option<Fixture>,
    pub central: Option<PlanSummary>,
    pub bounds: Option<BoundsV2>,
    pub left_out: Vec<LeftOut>,
    pub starting_values: Vec<StartingValue>,
    pub not_sure: Vec<String>,
    pub solved: Option<Solved>,
    pub what_if: Option<WhatIf>,
}
impl From<AnswersPlan> for AnswersPlanV2 {
    fn from(a: AnswersPlan) -> Self {
        Self {
            status: a.status,
            code: a.code,
            needed: a.needed,
            household_input: a.household_input,
            central: a.central,
            bounds: a.bounds.map(BoundsV2::Unsolved),
            left_out: a.left_out,
            starting_values: a.starting_values,
            not_sure: a.not_sure,
            solved: None,
            what_if: None,
        }
    }
}
impl AnswersPlanV2 {
    pub(super) fn from_error(error: Error) -> Self {
        AnswersPlan::error(error, &[]).into()
    }
}
impl AnswerDocument for AnswersV2 {
    type Plan = AnswersPlanV2;
    fn plan(&self) -> Self::Plan {
        plan_with(self, run_fixture)
    }
}
fn shifted_year(date: &Date, year: u16) -> Result<Date> {
    date.validate()?;
    let suffix = if &date.0[5..] == "02-29" && horizon_engine::calendar::days_in_year(year) != 366 {
        "02-28"
    } else {
        &date.0[5..]
    };
    let result = Date(format!("{year:04}-{suffix}"));
    result.validate()?;
    Ok(result)
}
fn birthday(birth: &Date, age: u16) -> Result<Date> {
    shifted_year(birth, birth.year()?.checked_add(age).ok_or_else(overflow)?)
}
fn taxable(cents: i64) -> Savings {
    Savings::Accounts {
        accounts: vec![AnswerAccount {
            kind: AccountKind::Taxable,
            balance: Balance::Cents { cents },
            cost_basis: Some(CostBasis::Cents { cents }),
        }],
    }
}
fn savings_start(out: &mut AnswersPlan) {
    starting(
        out,
        "savings",
        json!("a brokerage account with no gain to tax"),
        Some("too_optimistic"),
    );
}
/// Largest-remainder allocation uses i128 intermediates, checked at every step.
fn share(a: &mut Answers, total: i64) -> Result<bool> {
    let Savings::Accounts { accounts } = &mut a.savings else {
        a.savings = taxable(total);
        return Ok(true);
    };
    let weights = accounts
        .iter()
        .map(|a| balance(&a.balance, "", &BTreeMap::new()))
        .collect::<Result<Vec<_>>>()?;
    let sum = weights.iter().try_fold(0i128, |s, n| {
        s.checked_add(i128::from(*n)).ok_or_else(overflow)
    })?;
    if sum == 0 {
        a.savings = taxable(total);
        return Ok(true);
    }
    let mut shares = Vec::new();
    let mut remainders = Vec::new();
    let mut allocated = 0i64;
    for (i, weight) in weights.into_iter().enumerate() {
        let numerator = i128::from(total)
            .checked_mul(i128::from(weight))
            .ok_or_else(overflow)?;
        let cents = i64::try_from(numerator.checked_div(sum).ok_or_else(overflow)?)
            .map_err(|_| overflow())?;
        allocated = allocated.checked_add(cents).ok_or_else(overflow)?;
        shares.push(cents);
        remainders.push((i, numerator.checked_rem(sum).ok_or_else(overflow)?));
    }
    remainders.sort_by(|a, b| b.1.cmp(&a.1).then_with(|| a.0.cmp(&b.0)));
    let leftover = usize::try_from(total.checked_sub(allocated).ok_or_else(overflow)?)
        .map_err(|_| overflow())?;
    for (i, _) in remainders.into_iter().take(leftover) {
        shares[i] = shares[i].checked_add(1).ok_or_else(overflow)?;
    }
    for (account, cents) in accounts.iter_mut().zip(shares) {
        account.balance = Balance::Cents { cents };
    }
    Ok(false)
}
fn no_shortfall(run: &Run) -> bool {
    run.years.iter().all(|y| y.ledger.shortfall.cents() == 0)
}
fn summary_with<F>(input: &Fixture, calculate: &mut F) -> Result<PlanSummary>
where
    F: FnMut(&Fixture) -> Result<Run>,
{
    let run = calculate(input)?;
    let spending = sustainable_spending_with(input, calculate)?;
    let first_shortfall_age = run
        .years
        .iter()
        .find(|y| y.ledger.shortfall.cents() > 0)
        .map(|y| y.age_on_december_31);
    Ok(PlanSummary {
        run_status: run.status,
        omissions: run.omissions,
        first_shortfall_age,
        lasts_to_plan_end: first_shortfall_age.is_none(),
        headroom: spending.headroom,
        sustainable_spending: spending.sustainable_spending,
    })
}
const SAVINGS_CAP: i64 = 100_000_000;
fn solve<F>(
    a: &Answers,
    ends: &BTreeMap<String, i64>,
    answer: &'static str,
    calculate: &mut F,
) -> Result<(Fixture, AnswersPlan, SolvedValue)>
where
    F: FnMut(&Fixture) -> Result<Run>,
{
    let mut copy = a.clone();
    match answer {
        "savings" => copy.savings = taxable(0),
        "spending_in_retirement" => {
            copy.spending_in_retirement = RetirementSpending::Money(MoneyAnswer::Cents {
                cents: 0,
                per: Period::Year,
            })
        }
        "retirement" => {
            copy.retirement = Some(Retirement::Age {
                age: copy
                    .plan_end_age
                    .unwrap_or(95)
                    .checked_sub(1)
                    .ok_or_else(overflow)?,
            })
        }
        _ => unreachable!(),
    }
    let mut metadata = AnswersPlan::empty("incomplete", &copy.not_sure);
    let mut input = build(&copy, ends, &mut metadata)?;
    let result = match answer {
        "spending_in_retirement" => {
            let spending = sustainable_spending_with(&input, &mut *calculate)?;
            let cents = spending
                .sustainable_spending
                .checked_mul(100)
                .ok_or_else(overflow)?;
            input.household.spending.after_retirement.cents = cents;
            if a.retired {
                input.household.spending.before_retirement.cents = cents;
            }
            SolvedValue {
                value: Some(cents),
                flag: spending.flag,
            }
        }
        "savings" => {
            let mut trial = |dollars: i64| -> Result<bool> {
                let cents = dollars.checked_mul(100).ok_or_else(overflow)?;
                input.household.accounts[0].opening_balance_cents = cents;
                input.household.accounts[0].cost_basis_cents = Some(cents);
                Ok(no_shortfall(&calculate(&input)?))
            };
            if trial(0)? {
                SolvedValue {
                    value: Some(0),
                    flag: Some("none_needed"),
                }
            } else if !trial(SAVINGS_CAP)? {
                SolvedValue {
                    value: None,
                    flag: Some("unreachable"),
                }
            } else {
                let (mut low, mut high) = (0i64, SAVINGS_CAP);
                while high.checked_sub(low).ok_or_else(overflow)? > 1 {
                    let mid = low.checked_add(high).ok_or_else(overflow)?.div_euclid(2);
                    if trial(mid)? {
                        high = mid;
                    } else {
                        low = mid;
                    }
                }
                trial(high)?;
                SolvedValue {
                    value: Some(high.checked_mul(100).ok_or_else(overflow)?),
                    flag: None,
                }
            }
        }
        "retirement" => {
            let birth = input.household.persons[0].birth_date.clone();
            let end = input.household.persons[0].plan_end_age;
            let mut value = None;
            for age in 0..end {
                let date = birthday(&birth, age)?;
                if date <= a.valuation_date {
                    continue;
                }
                input.household.persons[0].retirement_date = date.clone();
                if matches!(a.pay_ends, PayEnds::AtRetirement { .. }) {
                    for wage in &mut input.household.income.wages {
                        wage.end_date = date.clone();
                    }
                }
                if no_shortfall(&calculate(&input)?) {
                    value = Some(i64::from(age));
                    break;
                }
            }
            SolvedValue {
                value,
                flag: value.is_none().then_some("unreachable"),
            }
        }
        _ => unreachable!(),
    };
    Ok((input, metadata, result))
}
// Greater means worse; null is worse than any finite solution.
fn quality(a: Option<i64>, b: Option<i64>, answer: &str) -> Ordering {
    match (a, b) {
        (None, None) => Ordering::Equal,
        (None, Some(_)) => Ordering::Greater,
        (Some(_), None) => Ordering::Less,
        (Some(a), Some(b)) if answer == "spending_in_retirement" => b.cmp(&a),
        (Some(a), Some(b)) => a.cmp(&b),
    }
}
fn solved_bounds<F>(
    a: &Answers,
    ranges: BTreeMap<String, CentRange>,
    answer: &'static str,
    central: &SolvedValue,
    calculate: &mut F,
) -> Result<SolvedBounds>
where
    F: FnMut(&Fixture) -> Result<Run>,
{
    let mut ranked = Vec::new();
    let mut worse = BTreeMap::new();
    let mut better = BTreeMap::new();
    for (name, range) in ranges {
        let (_, _, low) = solve(
            a,
            &BTreeMap::from([(name.clone(), range.low_cents)]),
            answer,
            calculate,
        )?;
        let (_, _, high) = solve(
            a,
            &BTreeMap::from([(name.clone(), range.high_cents)]),
            answer,
            calculate,
        )?;
        let low_worse = quality(low.value, high.value, answer) != Ordering::Less;
        worse.insert(
            name.clone(),
            if low_worse {
                range.low_cents
            } else {
                range.high_cents
            },
        );
        better.insert(
            name.clone(),
            if low_worse {
                range.high_cents
            } else {
                range.low_cents
            },
        );
        let spread = match (low.value, high.value) {
            (Some(l), Some(h)) => Some(h.checked_sub(l).ok_or_else(overflow)?.unsigned_abs()),
            _ => None,
        };
        ranked.push(SolvedRange {
            answer: name,
            worse_end: if low_worse { "low" } else { "high" },
            value_at_low: low.value,
            value_at_high: high.value,
            spread,
        });
    }
    ranked.sort_by(|a, b| {
        match (a.spread, b.spread) {
            (None, None) => Ordering::Equal,
            (None, Some(_)) => Ordering::Less,
            (Some(_), None) => Ordering::Greater,
            (Some(a), Some(b)) => b.cmp(&a),
        }
        .then_with(|| a.answer.cmp(&b.answer))
    });
    let (worse_input, _, worse) = solve(a, &worse, answer, calculate)?;
    let (better_input, _, better) = solve(a, &better, answer, calculate)?;
    let ordered = central.value.is_some()
        && worse.value.is_some()
        && better.value.is_some()
        && quality(central.value, worse.value, answer) != Ordering::Greater
        && quality(central.value, better.value, answer) != Ordering::Less;
    Ok(SolvedBounds {
        worse: SolvedSummary {
            summary: summary_with(&worse_input, calculate)?,
            solved: worse,
        },
        better: SolvedSummary {
            summary: summary_with(&better_input, calculate)?,
            solved: better,
        },
        ordered,
        ranked,
    })
}
fn plan_with<F>(a: &AnswersV2, mut calculate: F) -> AnswersPlanV2
where
    F: FnMut(&Fixture) -> Result<Run>,
{
    let mut common = a.common();
    let mut out = AnswersPlan::empty("incomplete", &a.not_sure);
    let total = a.what_if.as_ref().and_then(|w| w.savings_total_cents);
    let result = (|| -> Result<AnswersPlanV2> {
        if a.planning == Planning::Partner {
            return Err(Error::unsupported(
                "ANSWERS_ONE_PERSON_ONLY",
                "Only one person is supported.",
            ));
        }
        if matches!(a.birth_date, BirthAnswerV2::Later { .. }) {
            out.needed.push("birth_date");
        } else {
            if !a.retired && matches!(a.retirement, None | Some(Retirement::Later { .. })) {
                out.needed.push("retirement");
            }
            if total.is_none() && matches!(a.savings, Savings::Later { .. }) {
                out.needed.push("savings");
            }
            if match &a.spending_in_retirement {
                RetirementSpending::Money(m) => m.later(),
                RetirementSpending::Same { .. } => {
                    a.retired || a.spending_now.as_ref().is_none_or(MoneyAnswer::later)
                }
            } {
                out.needed.push("spending_in_retirement");
            }
        }
        if out.needed == ["birth_date"]
            || out.needed.len() >= 2
            || (out.needed == ["retirement"] && a.pay.as_ref().is_none_or(MoneyAnswer::later))
        {
            return Ok(out.into());
        }
        if a.version != 2 {
            return Err(malformed());
        }
        validate_amounts_with(&common, &total.into_iter().collect::<Vec<_>>())?;
        let birth_start = if let BirthAnswerV2::Age { age } = a.birth_date {
            if !(18..=110).contains(&age) {
                return Err(Error::invalid(
                    "ANSWERS_AGE_RANGE",
                    "Age must be from 18 through 110.",
                ));
            }
            let year = a
                .valuation_date
                .year()?
                .checked_sub(u16::try_from(age).map_err(|_| overflow())?)
                .ok_or_else(overflow)?;
            let date = shifted_year(&a.valuation_date, year)?;
            common.birth_date = BirthAnswer::Date { date: date.clone() };
            Some(date)
        } else {
            None
        };
        let savings_start_needed = if let Some(total) = total {
            share(&mut common, total)?
        } else {
            false
        };
        let ranges = validate_amounts(&common)?;
        let answer = out.needed.first().copied();
        let mut result: AnswersPlanV2 = if let Some(answer) = answer {
            let (input, mut metadata, solved) =
                solve(&common, &BTreeMap::new(), answer, &mut calculate)?;
            let summary = summary_with(&input, &mut calculate)?;
            metadata.status = if metadata.left_out.is_empty() {
                summary.run_status
            } else {
                "partial"
            };
            metadata.household_input = Some(input);
            metadata.central = Some(summary);
            let mut result = AnswersPlanV2::from(metadata);
            if !ranges.is_empty() {
                result.bounds = Some(BoundsV2::Solved(solved_bounds(
                    &common,
                    ranges,
                    answer,
                    &solved,
                    &mut calculate,
                )?));
            }
            result.solved = Some(Solved {
                answer,
                unit: if answer == "retirement" {
                    "age"
                } else {
                    "cents"
                },
                result: solved,
            });
            result
        } else {
            super::plan_with(&common, |f| summary_with(f, &mut calculate)).into()
        };
        if result.code.is_none() {
            let mut extra = AnswersPlan::empty("incomplete", &[]);
            if let Some(date) = birth_start {
                starting(&mut extra, "birth_date", json!(date), None);
            }
            if savings_start_needed || answer == Some("savings") {
                savings_start(&mut extra);
            }
            result.starting_values.extend(extra.starting_values);
        }
        Ok(result)
    })();
    let mut result = match result {
        Ok(out) => out,
        Err(e) => AnswersPlan::error(e, &a.not_sure).into(),
    };
    result.what_if = a.what_if.clone();
    result
}

#[cfg(test)]
mod tests {
    use super::*;
    fn case(name: &str) -> AnswersV2 {
        let cases: Value = serde_json::from_str(include_str!(
            "../../../../docs/briefs/0002-W5-reference-values.json"
        ))
        .unwrap();
        serde_json::from_value(cases["cases"][name]["answers"].clone()).unwrap()
    }
    fn no_run(_: &Fixture) -> Result<Run> {
        panic!("must not calculate")
    }
    #[test]
    fn intake_v2_needed_combinations_and_birth_first() {
        for mask in 0u8..8 {
            let mut a = case("v2-working-complete");
            let mut needed = Vec::new();
            if mask & 1 != 0 {
                a.retirement = None;
                needed.push("retirement");
            }
            if mask & 2 != 0 {
                a.savings = Savings::Later { later: Yes };
                needed.push("savings");
            }
            if mask & 4 != 0 {
                a.spending_in_retirement =
                    RetirementSpending::Money(MoneyAnswer::Later { later: Yes });
                needed.push("spending_in_retirement");
            }
            if needed.len() >= 2 {
                assert_eq!(plan_with(&a, no_run).needed, needed);
            }
            a.birth_date = BirthAnswerV2::Later { later: Yes };
            assert_eq!(plan_with(&a, no_run).needed, ["birth_date"]);
        }
        for pay in [None, Some(MoneyAnswer::Later { later: Yes })] {
            let mut a = case("v2-solve-retirement");
            a.pay = pay;
            assert_eq!(plan_with(&a, no_run).needed, ["retirement"]);
        }
        let mut a = case("v2-needed-two");
        a.what_if = Some(WhatIf {
            savings_total_cents: Some(1),
        });
        a.birth_date = BirthAnswerV2::Later { later: Yes };
        assert_eq!(plan_with(&a, no_run).needed, ["birth_date"]);
    }
    #[test]
    fn intake_v2_check_order_and_age_boundaries() {
        let mut a = case("v2-working-complete");
        a.planning = Planning::Partner;
        a.birth_date = BirthAnswerV2::Later { later: Yes };
        a.spending_now = Some(MoneyAnswer::Range {
            range: CentRange {
                low_cents: 2,
                high_cents: -1,
            },
            per: Period::Year,
        });
        a.what_if = Some(WhatIf {
            savings_total_cents: Some(-1),
        });
        assert_eq!(
            plan_with(&a, no_run).code.as_deref(),
            Some("ANSWERS_ONE_PERSON_ONLY")
        );
        a.planning = Planning::Alone;
        assert_eq!(plan_with(&a, no_run).needed, ["birth_date"]);
        a.birth_date = BirthAnswerV2::Age { age: 17 };
        assert_eq!(
            plan_with(&a, no_run).code.as_deref(),
            Some("ANSWERS_RANGE_ORDER")
        );
        a.spending_now = Some(MoneyAnswer::Cents {
            cents: 0,
            per: Period::Year,
        });
        assert_eq!(
            plan_with(&a, no_run).code.as_deref(),
            Some("ANSWERS_NEGATIVE_AMOUNT")
        );
        a.what_if = None;
        a.retirement = Some(Retirement::Date {
            date: a.valuation_date.clone(),
        });
        for age in [-1, 0, 17, 111, i64::MAX] {
            a.birth_date = BirthAnswerV2::Age { age };
            assert_eq!(
                plan_with(&a, no_run).code.as_deref(),
                Some("ANSWERS_AGE_RANGE")
            );
        }
        for age in [18, 110] {
            a.birth_date = BirthAnswerV2::Age { age };
            assert_eq!(
                plan_with(&a, no_run).code.as_deref(),
                Some("ANSWERS_RETIREMENT_NOT_AFTER_VALUATION")
            );
        }
        let a = case("v2-age-leap-valuation");
        let result = plan_from_answers(&a);
        assert_eq!(
            result.household_input.unwrap().household.persons[0]
                .birth_date
                .0,
            "1967-02-28"
        );
    }
    #[test]
    fn intake_v2_savings_boundary_and_each_search_flag() {
        let result = plan_from_answers(&case("v2-solve-savings"));
        let mut input = result.household_input.unwrap();
        assert!(no_shortfall(&run_fixture(&input).unwrap()));
        let cents = result
            .solved
            .unwrap()
            .result
            .value
            .unwrap()
            .checked_sub(100)
            .unwrap();
        input.household.accounts[0].opening_balance_cents = cents;
        input.household.accounts[0].cost_basis_cents = Some(cents);
        assert!(!no_shortfall(&run_fixture(&input).unwrap()));
        for (name, flag) in [
            ("v2-solve-savings-none-needed", "none_needed"),
            ("v2-solve-savings-unreachable", "unreachable"),
            ("v2-solve-retirement-unreachable", "unreachable"),
            (
                "v2-solve-spending-shortfall-at-zero",
                "shortfall_with_no_retirement_spending",
            ),
        ] {
            let result = plan_from_answers(&case(name));
            assert_eq!(result.solved.as_ref().unwrap().result.flag, Some(flag));
            let input = result.household_input.unwrap();
            if name == "v2-solve-savings-unreachable" {
                assert_eq!(
                    input.household.accounts[0].opening_balance_cents,
                    10_000_000_000
                );
            }
            if name == "v2-solve-retirement-unreachable" {
                assert_eq!(
                    input.household.persons[0].retirement_date,
                    birthday(&input.household.persons[0].birth_date, 94).unwrap()
                );
            }
        }
        let mut a = case("v2-solve-spending");
        a.savings = taxable(1_000_000_000_000);
        let result = plan_from_answers(&a);
        assert_eq!(result.solved.unwrap().result.flag, Some("at_or_above_cap"));
        let a = case("v2-solve-retirement");
        let result = plan_from_answers(&a);
        let age = u16::try_from(result.solved.unwrap().result.value.unwrap()).unwrap();
        for earlier in 61..age {
            let mut copy = a.common();
            copy.retirement = Some(Retirement::Age { age: earlier });
            let mut ignored = AnswersPlan::empty("incomplete", &[]);
            let input = build(&copy, &BTreeMap::new(), &mut ignored).unwrap();
            assert!(!no_shortfall(&run_fixture(&input).unwrap()));
        }
    }
    #[test]
    fn intake_v2_sharing_middle_remainders_ties_and_empty_accounts() {
        let mut a = case("v2-working-complete").common();
        a.savings = Savings::Accounts {
            accounts: vec![
                AnswerAccount {
                    kind: AccountKind::Cash,
                    balance: Balance::Cents { cents: 1 },
                    cost_basis: None,
                },
                AnswerAccount {
                    kind: AccountKind::Roth,
                    balance: Balance::Range {
                        range: CentRange {
                            low_cents: 0,
                            high_cents: 2,
                        },
                    },
                    cost_basis: None,
                },
                AnswerAccount {
                    kind: AccountKind::Cash,
                    balance: Balance::Cents { cents: 1 },
                    cost_basis: None,
                },
            ],
        };
        assert!(!share(&mut a, 5).unwrap());
        let Savings::Accounts { accounts } = &a.savings else {
            panic!()
        };
        let values: Vec<_> = accounts
            .iter()
            .map(|a| balance(&a.balance, "", &BTreeMap::new()).unwrap())
            .collect();
        assert_eq!(values, [2, 2, 1]);
        assert!(
            accounts
                .iter()
                .all(|a| matches!(a.balance, Balance::Cents { .. }))
        );
        for savings in [
            Savings::None { none: Yes },
            Savings::Later { later: Yes },
            Savings::Accounts { accounts: vec![] },
            taxable(0),
        ] {
            a.savings = savings;
            assert!(share(&mut a, 5).unwrap());
            let Savings::Accounts { accounts } = &a.savings else {
                panic!()
            };
            assert_eq!(accounts.len(), 1);
            assert!(matches!(
                accounts[0].cost_basis,
                Some(CostBasis::Cents { cents: 5 })
            ));
        }
        let a = case("v2-what-if-total-with-range");
        assert!(plan_from_answers(&a).bounds.is_none());
    }
    #[test]
    fn intake_v2_ranges_null_order_and_replaceable_run_bounds() {
        let mut a = case("v2-solve-savings-with-range");
        a.spending_in_retirement = RetirementSpending::Money(MoneyAnswer::Range {
            range: CentRange {
                low_cents: 6_000_000,
                high_cents: 10_000_000_000,
            },
            per: Period::Year,
        });
        let result = plan_from_answers(&a);
        let BoundsV2::Solved(bounds) = result.bounds.unwrap() else {
            panic!()
        };
        assert!(!bounds.ordered);
        assert_eq!(bounds.ranked[0].value_at_high, None);
        assert_eq!(bounds.ranked[0].spread, None);
        assert_eq!(bounds.ranked[0].worse_end, "high");
        let a = case("v2-solve-savings-with-range");
        let template = plan_from_answers(&case("v2-working-complete"))
            .household_input
            .unwrap();
        let template_run = run_fixture(&template).unwrap();
        let result = plan_with(&a, |input| {
            let central = input.household.spending.after_retirement.cents == 6_700_000;
            let threshold = if central { 10_000 } else { 1_000 };
            let mut run = template_run.clone();
            let shortfall = if input.household.accounts[0].opening_balance_cents >= threshold {
                0
            } else {
                1
            };
            for year in &mut run.years {
                year.ledger.shortfall.value.cents = shortfall;
            }
            Ok(run)
        });
        let BoundsV2::Solved(bounds) = result.bounds.unwrap() else {
            panic!()
        };
        assert!(!bounds.ordered);
        assert_eq!(bounds.ranked[0].worse_end, "low");
        assert_eq!(bounds.ranked[0].spread, Some(0));
        assert_eq!(quality(None, Some(0), "retirement"), Ordering::Greater);
        assert_eq!(
            quality(Some(2), Some(1), "spending_in_retirement"),
            Ordering::Less
        );
    }
}
