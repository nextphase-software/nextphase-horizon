// SPDX-License-Identifier: AGPL-3.0-only
//! answers.v1 conversion rules (0017). USD cents use exact, checked arithmetic;
//! annual headroom/spending use whole valuation-year dollars from the existing search.
use crate::{Fixture, run_fixture, sustainable_spending};
use horizon_engine::{
    error::{Error, Result, Status},
    input::*,
    money::{Fraction, Money},
};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use std::collections::BTreeMap;

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
pub enum AnswersFormat {
    #[serde(rename = "horizon-answers")]
    HorizonAnswers,
}
// A literal true is required: false must never mean "later" or "none".
#[derive(Debug, Clone, Copy, Serialize, Deserialize, JsonSchema)]
#[serde(try_from = "bool", into = "bool")]
#[schemars(with = "bool", transform = true_schema)]
pub struct Yes;
fn true_schema(schema: &mut schemars::Schema) {
    schema.insert("const".into(), json!(true));
}
impl TryFrom<bool> for Yes {
    type Error = &'static str;
    fn try_from(value: bool) -> std::result::Result<Self, Self::Error> {
        if value {
            Ok(Self)
        } else {
            Err("expected true")
        }
    }
}
impl From<Yes> for bool {
    fn from(_: Yes) -> bool {
        true
    }
}
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum Planning {
    Alone,
    Partner,
}
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum Expectation {
    Yes,
    No,
    NotSure,
}
#[derive(Debug, Clone, Copy, Default, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum Period {
    #[default]
    Year,
    Month,
}
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(untagged, deny_unknown_fields)]
pub enum BirthAnswer {
    Date { date: Date },
    Later { later: Yes },
}
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(untagged, deny_unknown_fields)]
pub enum Retirement {
    Age { age: u16 },
    Date { date: Date },
    Later { later: Yes },
}
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(untagged, deny_unknown_fields)]
pub enum PayEnds {
    AtRetirement { at_retirement: Yes },
    Date { date: Date },
}
impl Default for PayEnds {
    fn default() -> Self {
        Self::AtRetirement { at_retirement: Yes }
    }
}
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct CentRange {
    pub low_cents: i64,
    pub high_cents: i64,
}
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(untagged, deny_unknown_fields)]
pub enum Balance {
    Cents { cents: i64 },
    Range { range: CentRange },
}
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(untagged, deny_unknown_fields)]
pub enum CostBasis {
    Cents { cents: i64 },
    Later { later: Yes },
}
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(untagged, deny_unknown_fields)]
pub enum MoneyAnswer {
    Cents {
        cents: i64,
        #[serde(default)]
        per: Period,
    },
    Range {
        range: CentRange,
        #[serde(default)]
        per: Period,
    },
    Later {
        later: Yes,
    },
}
impl MoneyAnswer {
    fn later(&self) -> bool {
        matches!(self, Self::Later { .. })
    }
}
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(untagged, deny_unknown_fields)]
pub enum RetirementSpending {
    Money(MoneyAnswer),
    Same { same_as_now: Yes },
}
#[derive(Debug, Clone, Copy, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum AccountKind {
    Cash,
    Taxable,
    EmployerPlan,
    TraditionalIra,
    Roth,
}
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct AnswerAccount {
    pub kind: AccountKind,
    pub balance: Balance,
    pub cost_basis: Option<CostBasis>,
}
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(untagged, deny_unknown_fields)]
pub enum Savings {
    None { none: Yes },
    Later { later: Yes },
    Accounts { accounts: Vec<AnswerAccount> },
}
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct SocialSecurity {
    pub expects: Expectation,
    pub start_age: Option<u16>,
    pub amount: Option<MoneyAnswer>,
}
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(tag = "expects", rename_all = "snake_case", deny_unknown_fields)]
pub enum Pension {
    No,
    Yes {
        amount: MoneyAnswer,
        start_age: Option<u16>,
        rises_with_prices: Option<Expectation>,
    },
}
#[derive(Debug, Clone, Default, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct AssumptionAnswers {
    pub cash_return: Option<String>,
    pub inflation: Option<String>,
    pub investment_return: Option<String>,
    pub tax_indexing: Option<String>,
}
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct Answers {
    pub format: AnswersFormat,
    #[schemars(range(min = 1, max = 1))]
    pub version: u8,
    pub valuation_date: Date,
    pub planning: Planning,
    pub birth_date: BirthAnswer,
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
}
#[derive(Debug, Clone, Serialize, JsonSchema)]
pub struct PlanSummary {
    pub run_status: &'static str,
    pub omissions: Vec<&'static str>,
    pub first_shortfall_age: Option<u16>,
    pub lasts_to_plan_end: bool,
    pub headroom: i64,
    pub sustainable_spending: i64,
}
#[derive(Debug, Clone, Serialize, JsonSchema)]
pub struct LeftOut {
    pub answer: String,
    pub direction: &'static str,
    pub omission: &'static str,
}
#[derive(Debug, Clone, Serialize, JsonSchema)]
pub struct StartingValue {
    pub answer: String,
    pub value: Value,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub direction: Option<&'static str>,
}
#[derive(Debug, Clone, Serialize, JsonSchema)]
pub struct RankedRange {
    pub answer: String,
    pub headroom_at_low: i64,
    pub headroom_at_high: i64,
    pub spread: u64,
    pub worse_end: &'static str,
}
#[derive(Debug, Clone, Serialize, JsonSchema)]
pub struct Bounds {
    pub worse: PlanSummary,
    pub better: PlanSummary,
    pub ordered: bool,
    pub ranked: Vec<RankedRange>,
}
#[derive(Debug, Clone, Serialize, JsonSchema)]
pub struct AnswersPlan {
    pub status: &'static str,
    pub code: Option<String>,
    pub needed: Vec<&'static str>,
    pub household_input: Option<Fixture>,
    pub central: Option<PlanSummary>,
    pub bounds: Option<Bounds>,
    pub left_out: Vec<LeftOut>,
    pub starting_values: Vec<StartingValue>,
    pub not_sure: Vec<String>,
}
impl AnswersPlan {
    fn empty(status: &'static str, not_sure: &[String]) -> Self {
        Self {
            status,
            code: None,
            needed: vec![],
            household_input: None,
            central: None,
            bounds: None,
            left_out: vec![],
            starting_values: vec![],
            not_sure: not_sure.to_vec(),
        }
    }
    fn error(error: Error, not_sure: &[String]) -> Self {
        let mut result = Self::empty(
            match error.status {
                Status::Invalid => "invalid",
                Status::Unsupported => "unsupported",
            },
            not_sure,
        );
        result.code = Some(error.code);
        result
    }
}
fn malformed() -> Error {
    Error::invalid("MALFORMED_INPUT", "Answers must match answers.v1.")
}
fn overflow() -> Error {
    Error::invalid(
        "MONEY_OVERFLOW",
        "Answer conversion exceeds integer bounds.",
    )
}

/// Parse failures and calculation failures retain the same answers-plan.v1 envelope.
pub fn plan_from_answers_json(text: &str) -> AnswersPlan {
    match serde_json::from_str::<Answers>(text) {
        Ok(answers) => plan_from_answers(&answers),
        Err(_) => AnswersPlan::error(malformed(), &[]),
    }
}
pub fn plan_from_answers(answers: &Answers) -> AnswersPlan {
    plan_with(answers, summarize)
}
fn plan_with<F>(a: &Answers, mut calculate: F) -> AnswersPlan
where
    F: FnMut(&Fixture) -> Result<PlanSummary>,
{
    let mut out = AnswersPlan::empty("incomplete", &a.not_sure);
    if a.planning == Planning::Partner {
        return AnswersPlan::error(
            Error::unsupported("ANSWERS_ONE_PERSON_ONLY", "Only one person is supported."),
            &a.not_sure,
        );
    }
    if matches!(a.birth_date, BirthAnswer::Later { .. }) {
        out.needed.push("birth_date");
    }
    if !a.retired && matches!(a.retirement, None | Some(Retirement::Later { .. })) {
        out.needed.push("retirement");
    }
    if matches!(a.savings, Savings::Later { .. }) {
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
    if !out.needed.is_empty() {
        return out;
    }
    let result = (|| -> Result<()> {
        if a.version != 1 {
            return Err(malformed());
        }
        // Validate all supplied amounts before selecting middles or generating dates.
        let ranges = validate_amounts(a)?;
        let input = build(a, &BTreeMap::new(), &mut out)?;
        let central = calculate(&input)?;
        if !ranges.is_empty() {
            let mut ranked = Vec::new();
            let mut worse = BTreeMap::new();
            let mut better = BTreeMap::new();
            for (name, range) in ranges {
                let mut ignored = AnswersPlan::empty("incomplete", &[]);
                let low = calculate(&build(
                    a,
                    &BTreeMap::from([(name.clone(), range.low_cents)]),
                    &mut ignored,
                )?)?;
                let high = calculate(&build(
                    a,
                    &BTreeMap::from([(name.clone(), range.high_cents)]),
                    &mut ignored,
                )?)?;
                let low_worse = low.headroom <= high.headroom;
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
                ranked.push(RankedRange {
                    answer: name,
                    headroom_at_low: low.headroom,
                    headroom_at_high: high.headroom,
                    spread: high
                        .headroom
                        .checked_sub(low.headroom)
                        .ok_or_else(overflow)?
                        .unsigned_abs(),
                    worse_end: if low_worse { "low" } else { "high" },
                });
            }
            ranked.sort_by(|a, b| {
                b.spread
                    .cmp(&a.spread)
                    .then_with(|| a.answer.cmp(&b.answer))
            });
            let mut ignored = AnswersPlan::empty("incomplete", &[]);
            let worse = calculate(&build(a, &worse, &mut ignored)?)?;
            let better = calculate(&build(a, &better, &mut ignored)?)?;
            let ordered = worse.headroom <= central.headroom && central.headroom <= better.headroom;
            out.bounds = Some(Bounds {
                worse,
                better,
                ordered,
                ranked,
            });
        }
        out.status = if out.left_out.is_empty() {
            central.run_status
        } else {
            "partial"
        };
        out.household_input = Some(input);
        out.central = Some(central);
        Ok(())
    })();
    match result {
        Ok(()) => out,
        Err(e) => AnswersPlan::error(e, &a.not_sure),
    }
}
fn summarize(input: &Fixture) -> Result<PlanSummary> {
    let run = run_fixture(input)?;
    let spending = sustainable_spending(input)?;
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
fn validate_amounts(a: &Answers) -> Result<BTreeMap<String, CentRange>> {
    let mut ranges = BTreeMap::new();
    let mut amounts = Vec::new();
    fn money(
        name: &str,
        m: &MoneyAnswer,
        ranges: &mut BTreeMap<String, CentRange>,
        amounts: &mut Vec<i64>,
    ) {
        match m {
            MoneyAnswer::Cents { cents, .. } => amounts.push(*cents),
            MoneyAnswer::Range { range, .. } => {
                ranges.insert(name.into(), range.clone());
            }
            MoneyAnswer::Later { .. } => (),
        }
    }
    for (name, m) in [
        ("pay", a.pay.as_ref()),
        ("spending_now", a.spending_now.as_ref()),
        ("social_security.amount", a.social_security.amount.as_ref()),
    ] {
        if let Some(m) = m {
            money(name, m, &mut ranges, &mut amounts);
        }
    }
    if let Pension::Yes { amount, .. } = &a.pension {
        money("pension.amount", amount, &mut ranges, &mut amounts);
    }
    if let RetirementSpending::Money(m) = &a.spending_in_retirement {
        money("spending_in_retirement", m, &mut ranges, &mut amounts);
    }
    if let Savings::Accounts { accounts } = &a.savings {
        for (i, account) in accounts.iter().enumerate() {
            match &account.balance {
                Balance::Cents { cents } => amounts.push(*cents),
                Balance::Range { range } => {
                    ranges.insert(format!("savings.accounts.{i}.balance"), range.clone());
                }
            }
            if let Some(CostBasis::Cents { cents }) = account.cost_basis {
                amounts.push(cents);
            }
        }
    }
    if ranges.values().any(|r| r.low_cents > r.high_cents) {
        return Err(Error::invalid(
            "ANSWERS_RANGE_ORDER",
            "Range low must not exceed high.",
        ));
    }
    if amounts.iter().any(|n| *n < 0)
        || ranges.values().any(|r| r.low_cents < 0 || r.high_cents < 0)
    {
        return Err(Error::invalid(
            "ANSWERS_NEGATIVE_AMOUNT",
            "Answers cannot contain negative amounts.",
        ));
    }
    // Each supplied cent value must also fit the exact canonical JSON range.
    for cents in amounts
        .into_iter()
        .chain(ranges.values().flat_map(|r| [r.low_cents, r.high_cents]))
    {
        Money::from_cents(cents).output_cents()?;
    }
    Ok(ranges)
}
fn starting(out: &mut AnswersPlan, answer: &str, value: Value, direction: Option<&'static str>) {
    out.starting_values.push(StartingValue {
        answer: answer.into(),
        value,
        direction,
    });
}
fn leave(out: &mut AnswersPlan, answer: &str, direction: &'static str, omission: &'static str) {
    out.left_out.push(LeftOut {
        answer: answer.into(),
        direction,
        omission,
    });
}
fn middle(range: &CentRange) -> Result<i64> {
    Ok(Fraction::integer(range.low_cents)
        .plus(&Fraction::integer(range.high_cents))
        .divided_by(&Fraction::integer(2))?
        .finalize()?
        .cents())
}
fn balance(b: &Balance, name: &str, ends: &BTreeMap<String, i64>) -> Result<i64> {
    match b {
        Balance::Cents { cents } => Ok(*cents),
        Balance::Range { range } => ends
            .get(name)
            .copied()
            .map(Ok)
            .unwrap_or_else(|| middle(range)),
    }
}
fn money(m: Option<&MoneyAnswer>, name: &str, ends: &BTreeMap<String, i64>) -> Result<i64> {
    let (cents, per) = match m {
        Some(MoneyAnswer::Cents { cents, per }) => (*cents, per),
        Some(MoneyAnswer::Range { range, per }) => (
            ends.get(name)
                .copied()
                .map(Ok)
                .unwrap_or_else(|| middle(range))?,
            per,
        ),
        _ => return Ok(0),
    };
    let cents = match per {
        Period::Year => cents,
        Period::Month => cents.checked_mul(12).ok_or_else(overflow)?,
    };
    Money::from_cents(cents).output_cents()?;
    Ok(cents)
}
fn amount(cents: i64, dollar_basis: DollarBasis) -> Amount {
    Amount {
        cents,
        dollar_basis,
    }
}
fn build(a: &Answers, ends: &BTreeMap<String, i64>, out: &mut AnswersPlan) -> Result<Fixture> {
    a.valuation_date.validate()?;
    let BirthAnswer::Date { date: birth } = &a.birth_date else {
        return Err(malformed());
    };
    birth.validate()?;
    let retirement = if a.retired {
        a.valuation_date.clone()
    } else {
        match &a.retirement {
            Some(Retirement::Date { date }) => {
                date.validate()?;
                date.clone()
            }
            Some(Retirement::Age { age }) => {
                let year = birth
                    .year()?
                    .checked_add(*age)
                    .filter(|y| *y <= 9999)
                    .ok_or_else(overflow)?;
                let mut suffix = birth.0[5..].to_string();
                if suffix == "02-29" && horizon_engine::calendar::days_in_year(year) != 366 {
                    suffix = "02-28".into();
                }
                Date(format!("{year:04}-{suffix}"))
            }
            _ => return Err(malformed()),
        }
    };
    if !a.retired && retirement <= a.valuation_date {
        return Err(Error::invalid(
            "ANSWERS_RETIREMENT_NOT_AFTER_VALUATION",
            "Retirement must follow valuation when not retired.",
        ));
    }
    if a.plan_end_age.is_none() {
        starting(out, "plan_end_age", json!(95), None);
    }
    let now = money(a.spending_now.as_ref(), "spending_now", ends)?;
    let after = match &a.spending_in_retirement {
        RetirementSpending::Money(m) => money(Some(m), "spending_in_retirement", ends)?,
        RetirementSpending::Same { .. } => now,
    };
    let mut wages = Vec::new();
    if !a.retired {
        if let Some(pay) = &a.pay
            && !pay.later()
        {
            wages.push(Wages {
                amount: amount(money(Some(pay), "pay", ends)?, DollarBasis::Today),
                start_date: a.valuation_date.clone(),
                end_date: match &a.pay_ends {
                    PayEnds::Date { date } => date.clone(),
                    _ => retirement.clone(),
                },
            });
        }
        match (
            a.pay.as_ref().is_none_or(MoneyAnswer::later),
            a.spending_now.as_ref().is_none_or(MoneyAnswer::later),
        ) {
            (true, true) => leave(
                out,
                "pay_and_spending_now",
                "not_stated",
                "Pay and spending before retirement not given yet; the plan assumes your pay covers your spending until you retire",
            ),
            (true, false) => leave(
                out,
                "pay",
                "too_pessimistic",
                "Pay before retirement not given yet",
            ),
            (false, true) => leave(
                out,
                "spending_now",
                "too_optimistic",
                "Spending before retirement not given yet",
            ),
            _ => (),
        }
    }
    let ss = &a.social_security;
    let social_security = if ss.expects == Expectation::No {
        AgeIncome {
            amount: amount(0, DollarBasis::Today),
            start_age: 67,
        }
    } else {
        if ss.start_age.is_none() {
            starting(out, "social_security.start_age", json!(67), None);
        }
        if ss.amount.as_ref().is_none_or(MoneyAnswer::later) {
            leave(
                out,
                "social_security",
                "too_pessimistic",
                "Social Security not given yet",
            );
        }
        AgeIncome {
            amount: amount(
                money(ss.amount.as_ref(), "social_security.amount", ends)?,
                DollarBasis::Today,
            ),
            start_age: ss.start_age.unwrap_or(67),
        }
    };
    let pension = match &a.pension {
        Pension::No => AgeIncome {
            amount: amount(0, DollarBasis::Nominal),
            start_age: 65,
        },
        Pension::Yes {
            amount: m,
            start_age,
            rises_with_prices,
        } => {
            if m.later() {
                leave(out, "pension", "too_pessimistic", "Pension not given yet");
            } else if start_age.is_none() || rises_with_prices.is_none() {
                return Err(malformed());
            }
            if *rises_with_prices == Some(Expectation::NotSure) {
                starting(
                    out,
                    "pension.rises_with_prices",
                    json!("no"),
                    Some("too_pessimistic"),
                );
            }
            AgeIncome {
                amount: amount(
                    money(Some(m), "pension.amount", ends)?,
                    if *rises_with_prices == Some(Expectation::Yes) {
                        DollarBasis::Today
                    } else {
                        DollarBasis::Nominal
                    },
                ),
                start_age: start_age.unwrap_or(65),
            }
        }
    };
    let mut accounts = Vec::new();
    let mut counts = BTreeMap::<&str, u32>::new();
    if let Savings::Accounts { accounts: answers } = &a.savings {
        for (i, account) in answers.iter().enumerate() {
            let (kind, account_type, tax_deferred_kind) = match account.kind {
                AccountKind::Cash => ("cash", AccountType::Cash, None),
                AccountKind::Taxable => ("taxable", AccountType::Taxable, None),
                AccountKind::EmployerPlan => (
                    "employer-plan",
                    AccountType::TaxDeferred,
                    Some(TaxDeferredKind::EmployerPlan),
                ),
                AccountKind::TraditionalIra => (
                    "traditional-ira",
                    AccountType::TaxDeferred,
                    Some(TaxDeferredKind::TraditionalIra),
                ),
                AccountKind::Roth => ("roth", AccountType::Roth, None),
            };
            let count = counts.entry(kind).or_default();
            *count = count.checked_add(1).ok_or_else(overflow)?;
            let opening_balance_cents = balance(
                &account.balance,
                &format!("savings.accounts.{i}.balance"),
                ends,
            )?;
            let cost_basis_cents = if account_type == AccountType::Taxable {
                Some(match account.cost_basis {
                    Some(CostBasis::Cents { cents }) => cents,
                    _ => {
                        starting(
                            out,
                            &format!("savings.accounts.{i}.cost_basis"),
                            json!("equal to the balance"),
                            Some("too_optimistic"),
                        );
                        opening_balance_cents
                    }
                })
            } else {
                if account.cost_basis.is_some() {
                    return Err(malformed());
                }
                None
            };
            accounts.push(Account {
                id: format!("{kind}-{count}"),
                owner: "person".into(),
                account_type,
                opening_balance_cents,
                cost_basis_cents,
                tax_deferred_kind,
            });
        }
    }
    let overrides = &a.assumptions;
    let mut assumptions = Vec::new();
    for (id, value, default) in [
        ("cash_return", &overrides.cash_return, "0.02"),
        ("inflation", &overrides.inflation, "0.025"),
        ("investment_return", &overrides.investment_return, "0.05"),
        ("tax_indexing", &overrides.tax_indexing, "0.025"),
    ] {
        if value.is_none() {
            starting(out, &format!("assumptions.{id}"), json!(default), None);
        }
        assumptions.push(Assumption {
            identifier: id.into(),
            value: value.as_deref().unwrap_or(default).into(),
            unit: "decimal_fraction_per_year".into(),
            source: "user".into(),
            effective_year: a.valuation_date.year()?,
            user_overrode_default: value.is_some(),
        });
    }
    Ok(Fixture {
        household: Household {
            valuation_date: a.valuation_date.clone(),
            persons: vec![Person {
                id: "person".into(),
                birth_date: birth.clone(),
                retirement_date: retirement,
                plan_end_age: a.plan_end_age.unwrap_or(95),
            }],
            accounts,
            income: Income {
                wages,
                social_security,
                pension,
            },
            spending: Spending {
                before_retirement: amount(if a.retired { after } else { now }, DollarBasis::Today),
                after_retirement: amount(after, DollarBasis::Today),
            },
            withdrawal_order: None,
        },
        assumptions,
        pass_limit: None,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    fn case(name: &str) -> Answers {
        let values: Value = serde_json::from_str(include_str!(
            "../../../docs/briefs/0002-W4-reference-values.json"
        ))
        .unwrap();
        serde_json::from_value(values["cases"][name]["answers"].clone()).unwrap()
    }
    fn converted(a: &Answers) -> (Fixture, AnswersPlan) {
        let mut out = AnswersPlan::empty("incomplete", &a.not_sure);
        (build(a, &BTreeMap::new(), &mut out).unwrap(), out)
    }
    #[test]
    fn intake_monthly_leap_day_and_explicit_pay_end() {
        let mut a = case("monthly-and-leap-birthday");
        let (f, _) = converted(&a);
        assert_eq!(f.household.persons[0].retirement_date.0, "2027-02-28");
        assert_eq!(f.household.spending.after_retirement.cents, 6_000_000);
        let monthly = match a.pay.as_ref().unwrap() {
            MoneyAnswer::Cents { cents, .. } => *cents,
            _ => panic!(),
        };
        assert_eq!(
            f.household.income.wages[0].amount.cents,
            monthly.checked_mul(12).unwrap()
        );
        a.pay_ends = PayEnds::Date {
            date: Date("2029-12-31".into()),
        };
        assert_eq!(
            converted(&a).0.household.income.wages[0].end_date.0,
            "2029-12-31"
        );
        a.retirement = Some(Retirement::Age { age: 64 });
        assert_eq!(
            converted(&a).0.household.persons[0].retirement_date.0,
            "2028-02-29"
        );
    }
    #[test]
    fn intake_same_as_now_value_range_and_retired_missing() {
        let mut a = case("working-complete");
        a.spending_in_retirement = RetirementSpending::Same { same_as_now: Yes };
        let (f, _) = converted(&a);
        assert_eq!(
            f.household.spending.before_retirement.cents,
            f.household.spending.after_retirement.cents
        );
        a.spending_now = Some(MoneyAnswer::Range {
            range: CentRange {
                low_cents: 100,
                high_cents: 101,
            },
            per: Period::Month,
        });
        let (f, _) = converted(&a);
        assert_eq!(f.household.spending.before_retirement.cents, 1212);
        assert_eq!(f.household.spending.after_retirement.cents, 1212);
        let mut out = AnswersPlan::empty("incomplete", &[]);
        let f = build(
            &a,
            &BTreeMap::from([("spending_now".into(), 100)]),
            &mut out,
        )
        .unwrap();
        assert_eq!(f.household.spending.before_retirement.cents, 1200);
        assert_eq!(f.household.spending.after_retirement.cents, 1200);
        a.retired = true;
        assert_eq!(plan_from_answers(&a).needed, vec!["spending_in_retirement"]);
    }
    #[test]
    fn intake_no_savings_missing_basis_and_unsure_pension() {
        assert!(
            converted(&case("no-savings"))
                .0
                .household
                .accounts
                .is_empty()
        );
        let (f, out) = converted(&case("starting-values"));
        assert_eq!(
            f.household.income.pension.amount.dollar_basis,
            DollarBasis::Nominal
        );
        assert_eq!(
            f.household.accounts[0].cost_basis_cents,
            Some(f.household.accounts[0].opening_balance_cents)
        );
        assert!(
            out.starting_values
                .iter()
                .any(|v| v.answer == "pension.rises_with_prices"
                    && v.direction == Some("too_pessimistic"))
        );
        let mut a = case("starting-values");
        let Savings::Accounts { accounts } = &mut a.savings else {
            panic!()
        };
        accounts[0].balance = Balance::Range {
            range: CentRange {
                low_cents: 100_000,
                high_cents: 200_000,
            },
        };
        let mut out = AnswersPlan::empty("incomplete", &[]);
        let f = build(
            &a,
            &BTreeMap::from([("savings.accounts.0.balance".into(), 100_000)]),
            &mut out,
        )
        .unwrap();
        assert_eq!(f.household.accounts[0].cost_basis_cents, Some(100_000));
    }
    #[test]
    fn intake_account_ids_count_each_kind_in_answer_order() {
        let mut a = case("working-complete");
        let Savings::Accounts { accounts } = &mut a.savings else {
            panic!()
        };
        accounts.push(accounts[0].clone());
        accounts.push(accounts[2].clone());
        let (f, _) = converted(&a);
        assert_eq!(
            f.household
                .accounts
                .iter()
                .map(|a| a.id.as_str())
                .collect::<Vec<_>>(),
            vec![
                "cash-1",
                "taxable-1",
                "employer-plan-1",
                "roth-1",
                "cash-2",
                "employer-plan-2"
            ]
        );
        assert!(f.household.accounts.iter().all(|a| a.owner == "person"));
    }
    #[test]
    fn intake_bounds_detect_unordered_central_and_rank_ties_by_name() {
        let a = case("range-two");
        let (middle, _) = converted(&a);
        let result = plan_with(&a, |input| {
            let same = input.household.accounts[2].opening_balance_cents
                == middle.household.accounts[2].opening_balance_cents
                && input.household.spending.after_retirement.cents
                    == middle.household.spending.after_retirement.cents;
            Ok(PlanSummary {
                run_status: "complete",
                omissions: vec![],
                first_shortfall_age: None,
                lasts_to_plan_end: true,
                headroom: if same { 100 } else { 0 },
                sustainable_spending: 100,
            })
        });
        let bounds = result.bounds.unwrap();
        assert!(!bounds.ordered);
        assert!(
            bounds
                .ranked
                .iter()
                .all(|r| r.worse_end == "low" && r.spread == 0)
        );
        assert_eq!(bounds.ranked[0].answer, "savings.accounts.2.balance");
        assert_eq!(bounds.ranked[1].answer, "spending_in_retirement");
    }
    #[test]
    fn intake_income_ranges_and_defaults_follow_answer_paths() {
        let mut a = case("working-complete");
        let range = MoneyAnswer::Range {
            range: CentRange {
                low_cents: 100,
                high_cents: 200,
            },
            per: Period::Month,
        };
        a.pay = Some(range.clone());
        a.social_security = SocialSecurity {
            expects: Expectation::NotSure,
            start_age: None,
            amount: Some(range.clone()),
        };
        a.pension = Pension::Yes {
            amount: range,
            start_age: Some(65),
            rises_with_prices: Some(Expectation::Yes),
        };
        let ranges = validate_amounts(&a).unwrap();
        assert_eq!(
            ranges.keys().map(String::as_str).collect::<Vec<_>>(),
            vec!["pay", "pension.amount", "social_security.amount"]
        );
        let mut out = AnswersPlan::empty("incomplete", &[]);
        let f = build(
            &a,
            &BTreeMap::from([
                ("pay".into(), 100),
                ("pension.amount".into(), 200),
                ("social_security.amount".into(), 100),
            ]),
            &mut out,
        )
        .unwrap();
        assert_eq!(f.household.income.wages[0].amount.cents, 1200);
        assert_eq!(f.household.income.pension.amount.cents, 2400);
        assert_eq!(
            f.household.income.pension.amount.dollar_basis,
            DollarBasis::Today
        );
        assert_eq!(f.household.income.social_security.amount.cents, 1200);
        assert_eq!(f.household.income.social_security.start_age, 67);
        assert!(
            out.starting_values
                .iter()
                .any(|s| s.answer == "social_security.start_age")
        );
    }

    #[test]
    fn intake_precedence_and_negative_answers_never_run() {
        let mut a = case("needed-all-four");
        a.pay = Some(MoneyAnswer::Cents {
            cents: -1,
            per: Period::Year,
        });
        let no_run = |_: &Fixture| -> Result<PlanSummary> { panic!("must not run") };
        assert_eq!(plan_with(&a, no_run).status, "incomplete");
        a.planning = Planning::Partner;
        assert_eq!(
            plan_with(&a, no_run).code.as_deref(),
            Some("ANSWERS_ONE_PERSON_ONLY")
        );
        let mut a = case("working-complete");
        for name in [
            "pay",
            "spending_now",
            "spending_in_retirement",
            "social_security",
            "pension",
            "balance",
            "cost_basis",
        ] {
            let mut v = serde_json::to_value(&a).unwrap();
            match name {
                "pay" | "spending_now" | "spending_in_retirement" => v[name] = json!({"cents":-1}),
                "social_security" => v[name]["amount"] = json!({"cents":-1}),
                "pension" => {
                    v[name] = json!({"expects":"yes","amount":{"cents":-1},"start_age":65,"rises_with_prices":"no"})
                }
                "balance" => v["savings"]["accounts"][0][name] = json!({"cents":-1}),
                _ => v["savings"]["accounts"][1][name] = json!({"cents":-1}),
            }
            let negative: Answers = serde_json::from_value(v).unwrap();
            assert_eq!(
                plan_with(&negative, no_run).code.as_deref(),
                Some("ANSWERS_NEGATIVE_AMOUNT"),
                "{name}"
            );
        }
        a.retirement = None;
        assert_eq!(plan_with(&a, no_run).needed, vec!["retirement"]);
    }
    #[test]
    fn intake_structural_and_arithmetic_errors_keep_one_result_shape() {
        let base = serde_json::to_value(case("working-complete")).unwrap();
        for (key, value) in [
            ("format", json!("other")),
            ("version", json!(2)),
            ("unknown", json!(true)),
            ("birth_date", json!({"later":false})),
            ("pay", json!({"cents":0,"later":true})),
        ] {
            let mut value0 = base.clone();
            value0[key] = value;
            assert_eq!(
                plan_from_answers_json(&value0.to_string()).status,
                "invalid",
                "{key}"
            );
        }
        for cents in [i64::MAX, horizon_engine::money::JSON_CENT_LIMIT] {
            let mut a = case("working-complete");
            a.pay = Some(MoneyAnswer::Cents {
                cents,
                per: Period::Month,
            });
            let result = plan_from_answers(&a);
            assert_eq!(result.status, "invalid");
            assert!(result.household_input.is_none() && result.central.is_none());
        }
        assert_eq!(
            middle(&CentRange {
                low_cents: -2,
                high_cents: -1
            })
            .unwrap(),
            -2
        );
        assert_eq!(
            middle(&CentRange {
                low_cents: i64::MAX,
                high_cents: i64::MAX
            })
            .unwrap(),
            i64::MAX
        );
    }
    #[test]
    fn intake_reproduces_samples_and_omission_directions() {
        for (name, fixture) in [
            (
                "working-complete",
                include_str!("../fixtures/answers-working-61.json"),
            ),
            (
                "already-retired",
                include_str!("../fixtures/synthetic-retired.json"),
            ),
        ] {
            let expected = summarize(&crate::parse_fixture(fixture).unwrap()).unwrap();
            let actual = plan_from_answers(&case(name)).central.unwrap();
            assert_eq!(
                serde_json::to_value(actual).unwrap(),
                serde_json::to_value(expected).unwrap()
            );
        }
        let baseline = plan_from_answers(&case("working-complete"))
            .central
            .unwrap()
            .headroom;
        for name in [
            "left-out-pay",
            "left-out-social-security",
            "left-out-spending-now",
        ] {
            let result = plan_from_answers(&case(name));
            let headroom = result.central.unwrap().headroom;
            if result.left_out[0].direction == "too_pessimistic" {
                assert!(headroom < baseline);
            } else {
                assert!(headroom > baseline);
            }
        }
        let mut pension_given = case("left-out-pension");
        pension_given.pension = Pension::Yes {
            amount: MoneyAnswer::Cents {
                cents: 1_000_000,
                per: Period::Year,
            },
            start_age: Some(65),
            rises_with_prices: Some(Expectation::Yes),
        };
        let pension_missing = plan_from_answers(&case("left-out-pension"))
            .central
            .unwrap()
            .headroom;
        assert!(pension_missing < plan_from_answers(&pension_given).central.unwrap().headroom);
    }
}
