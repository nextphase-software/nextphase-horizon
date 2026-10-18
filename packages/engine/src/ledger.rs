// SPDX-License-Identifier: AGPL-3.0-only
//! Annual ledger. All money arithmetic is checked or exact until line finalization.
use crate::{
    calendar::{Period, benefit_start_date, date_59_half},
    error::{Error, Result},
    input::{
        Account, AccountType, Amount, Assumption, DollarBasis, Household, TaxDeferredKind,
        WithdrawalOrder, age_at_year_end,
    },
    money::{Fraction, Money, index_factor},
    projection::MonetaryValue,
    rmd_table,
};
use serde::Serialize;
use std::collections::BTreeMap;

pub(crate) fn add(a: i64, b: i64) -> Result<i64> {
    Money::from_cents(a)
        .checked_add(Money::from_cents(b))
        .map(Money::cents)
}
pub(crate) fn sub(a: i64, b: i64) -> Result<i64> {
    Money::from_cents(a)
        .checked_sub(Money::from_cents(b))
        .map(Money::cents)
}
fn total(mut values: impl Iterator<Item = i64>) -> Result<i64> {
    values.try_fold(0, add)
}
pub fn rate<'a>(assumptions: &'a [Assumption], identifier: &str) -> Result<&'a str> {
    assumptions
        .iter()
        .find(|a| a.identifier == identifier)
        .map(|a| a.value.as_str())
        .ok_or_else(|| {
            Error::invalid(
                "MISSING_ASSUMPTION",
                format!("The {identifier} assumption is required; there is no implicit default."),
            )
        })
}
pub fn activated_fraction(
    amount: &Amount,
    inflation: &str,
    base: u16,
    year: u16,
    days: u16,
    year_days: u16,
) -> Result<Fraction> {
    let factor = if amount.dollar_basis == DollarBasis::Today {
        index_factor(inflation, base, year)?
    } else {
        Fraction::integer(1)
    };
    Ok(Fraction::integer(amount.cents)
        .times(&factor)
        .times(&Fraction::new(
            i64::from(days).into(),
            i64::from(year_days).into(),
        )?))
}
pub fn activated_amount(
    amount: &Amount,
    inflation: &str,
    base: u16,
    year: u16,
    days: u16,
    year_days: u16,
) -> Result<i64> {
    activated_fraction(amount, inflation, base, year, days, year_days)?
        .finalize()
        .map(Money::cents)
}
pub fn growth(
    opening: i64,
    net_flow: i64,
    rate: &str,
    period_days: u16,
    year_days: u16,
) -> Result<i64> {
    let factor = Fraction::decimal(rate)?.times(&Fraction::new(
        i64::from(period_days).into(),
        i64::from(year_days).into(),
    )?);
    Fraction::integer(opening)
        .times(&factor)
        .plus(
            &Fraction::integer(net_flow)
                .times(&factor)
                .divided_by(&Fraction::integer(2))?,
        )
        .finalize()
        .map(Money::cents)
}
pub fn average_cost_basis(opening: i64, basis: i64, withdrawal: i64) -> Result<(i64, i64)> {
    let removed = if withdrawal == 0 {
        0
    } else {
        Fraction::integer(withdrawal)
            .times(&Fraction::integer(basis))
            .divided_by(&Fraction::integer(opening))?
            .finalize()?
            .cents()
    };
    Ok((removed, sub(withdrawal, removed)?))
}
/// Unconstrained proportional unit calculation. Ledger funding additionally caps
/// draws to available balances. The last share is the exact cent remainder.
pub fn proportional_split(amount: i64, weights: &[i64]) -> Result<Vec<i64>> {
    let sum = total(weights.iter().copied())?;
    if weights.is_empty() || sum == 0 {
        return Ok(vec![0; weights.len()]);
    }
    let mut remaining = amount;
    let mut shares = Vec::new();
    for (i, weight) in weights.iter().enumerate() {
        let last = i.checked_add(1) == Some(weights.len());
        let share = if last {
            remaining
        } else {
            Fraction::integer(amount)
                .times(&Fraction::integer(*weight))
                .divided_by(&Fraction::integer(sum))?
                .finalize()?
                .cents()
                .min(remaining)
        };
        remaining = sub(remaining, share)?;
        shares.push(share);
    }
    Ok(shares)
}

#[derive(Debug, Clone, Serialize, schemars::JsonSchema)]
pub struct Line {
    #[serde(flatten)]
    pub value: MonetaryValue,
    pub rule_id: &'static str,
}
impl Line {
    fn new(cents: i64, rule_id: &'static str, base: u16, year: u16) -> Result<Self> {
        Ok(Self {
            value: MonetaryValue::new(Money::from_cents(cents), DollarBasis::Nominal, base, year)?,
            rule_id,
        })
    }
    pub fn cents(&self) -> i64 {
        self.value.cents
    }
}
#[derive(Debug, Clone, Serialize, schemars::JsonSchema)]
pub struct DistributionSource {
    pub table: &'static str,
    pub table_year: u16,
    pub source: &'static str,
    pub divisor: &'static str,
    pub prior_year_balance_is_estimate: bool,
}
#[derive(Debug, Clone, Serialize, schemars::JsonSchema)]
pub struct AccountLedger {
    pub identifier: String,
    pub account_type: AccountType,
    pub created: bool,
    pub opening: Line,
    pub rmd: Line,
    pub distribution_source: Option<DistributionSource>,
    pub withdrawal: Line,
    pub deposit: Line,
    pub growth: Line,
    pub closing: Line,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub closing_today: Option<Line>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub basis_removed: Option<Line>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub realized_gain: Option<Line>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub closing_basis: Option<Line>,
}
#[derive(Debug, Clone, Serialize, schemars::JsonSchema)]
pub struct YearLedger {
    pub period: Period,
    pub before_59_half: bool,
    pub withdrawal_order_used: &'static str,
    pub income: BTreeMap<String, Line>,
    pub income_total: Line,
    pub spending: Line,
    pub accounts: Vec<AccountLedger>,
    pub rmd_total: Line,
    pub withdrawals_total: Line,
    pub surplus_deposit: Line,
    pub shortfall: Line,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub total_closing: Option<Line>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub total_closing_today: Option<Line>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub shortfall_today: Option<Line>,
    pub created_account: Option<String>,
    pub flags: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub federal_tax: Option<crate::tax::FundedTax>,
}
#[derive(Clone)]
struct State {
    account: Account,
    created: bool,
}
#[derive(Clone)]
pub struct Ledger {
    states: Vec<State>,
    base: u16,
}
fn flag(flags: &mut Vec<String>, value: String) {
    if !flags.contains(&value) {
        flags.push(value);
    }
}
impl Ledger {
    pub fn new(h: &Household) -> Result<Self> {
        Ok(Self {
            states: h
                .accounts
                .iter()
                .cloned()
                .map(|account| State {
                    account,
                    created: false,
                })
                .collect(),
            base: h.valuation_date.year()?,
        })
    }
    pub fn year(
        &mut self,
        h: &Household,
        assumptions: &[Assumption],
        year: u16,
    ) -> Result<YearLedger> {
        self.year_with_outflow(h, assumptions, year, 0)
    }
    pub(crate) fn year_with_outflow(
        &mut self,
        h: &Household,
        assumptions: &[Assumption],
        year: u16,
        tax_paid: i64,
    ) -> Result<YearLedger> {
        let person = &h.persons[0];
        let period = Period::new(&h.valuation_date, year)?;
        let before_59_half = period.event_date < date_59_half(&person.birth_date)?;
        let order = h.withdrawal_order.unwrap_or_default();
        let used = if before_59_half {
            "before_59_half_cash_taxable_tax_deferred_roth"
        } else {
            order.identifier()
        };
        let inflation = rate(assumptions, "inflation")?;
        let mut income = BTreeMap::new();
        let mut active_wages = false;
        for (i, wage) in h.income.wages.iter().enumerate() {
            let days = period.active_days(Some(&wage.start_date), Some(&wage.end_date))?;
            active_wages |= days > 0;
            let amount = activated_amount(
                &wage.amount,
                inflation,
                self.base,
                year,
                days,
                period.days_in_year,
            )?;
            income.insert(
                format!("wages.{i}"),
                Line::new(amount, "wages_active_days", self.base, year)?,
            );
        }
        for (id, benefit) in [
            ("social_security", &h.income.social_security),
            ("pension", &h.income.pension),
        ] {
            let start = benefit_start_date(&person.birth_date, benefit.start_age)?;
            let days = period.active_days(Some(&start), None)?;
            let amount = activated_amount(
                &benefit.amount,
                inflation,
                self.base,
                year,
                days,
                period.days_in_year,
            )?;
            income.insert(
                id.into(),
                Line::new(amount, "benefit_month_after_birth_month", self.base, year)?,
            );
        }
        let income_total = total(income.values().map(Line::cents))?;
        let before = period.active_days(None, Some(&person.retirement_date))?;
        let after = period.active_days(Some(&person.retirement_date), None)?;
        let spending = activated_fraction(
            &h.spending.before_retirement,
            inflation,
            self.base,
            year,
            before,
            period.days_in_year,
        )?
        .plus(&activated_fraction(
            &h.spending.after_retirement,
            inflation,
            self.base,
            year,
            after,
            period.days_in_year,
        )?)
        .finalize()?
        .cents();
        let mut flags = Vec::new();
        let mut distributions = vec![0; self.states.len()];
        let mut sources = vec![None; self.states.len()];
        for (i, state) in self.states.iter().enumerate() {
            if state.account.account_type == AccountType::TaxDeferred
                && rmd_table::due(&person.birth_date, year)?
            {
                let age = age_at_year_end(&person.birth_date, year)?;
                distributions[i] = rmd_table::amount(state.account.opening_balance_cents, age)?;
                sources[i] = Some(DistributionSource {
                    table: rmd_table::TABLE_NAME,
                    table_year: rmd_table::TABLE_YEAR,
                    source: rmd_table::TABLE_SOURCE,
                    divisor: rmd_table::divisor(age)?,
                    prior_year_balance_is_estimate: year == self.base,
                });
                if year == self.base {
                    flag(
                        &mut flags,
                        format!(
                            "estimate:rmd_prior_year_end_balance_not_provided:{}",
                            state.account.id
                        ),
                    );
                }
                if distributions[i] > 0
                    && active_wages
                    && state.account.tax_deferred_kind == Some(TaxDeferredKind::EmployerPlan)
                {
                    flag(
                        &mut flags,
                        "partial:still_working_rmd_exception_not_modeled".into(),
                    );
                }
            }
        }
        let rmd_total = total(distributions.iter().copied())?;
        let need = sub(sub(add(spending, tax_paid)?, income_total)?, rmd_total)?;
        let mut withdrawals = vec![0; self.states.len()];
        let mut deposits = vec![0; self.states.len()];
        let mut available: Vec<i64> = self
            .states
            .iter()
            .zip(&distributions)
            .map(|(s, d)| sub(s.account.opening_balance_cents, *d))
            .collect::<Result<_>>()?;
        let mut remaining = need.max(0);
        draw_type(
            &self.states,
            &mut available,
            &mut withdrawals,
            AccountType::Cash,
            &mut remaining,
        )?;
        if !before_59_half && order == WithdrawalOrder::ProportionalTaxableTaxDeferred {
            draw_proportional(
                &self.states,
                &mut available,
                &mut withdrawals,
                &mut remaining,
            )?;
            draw_type(
                &self.states,
                &mut available,
                &mut withdrawals,
                AccountType::Roth,
                &mut remaining,
            )?;
        } else {
            let types = if before_59_half {
                [
                    AccountType::Taxable,
                    AccountType::TaxDeferred,
                    AccountType::Roth,
                ]
            } else {
                match order {
                    WithdrawalOrder::TaxDeferredFirst => [
                        AccountType::TaxDeferred,
                        AccountType::Taxable,
                        AccountType::Roth,
                    ],
                    WithdrawalOrder::RothBeforeTaxDeferred => [
                        AccountType::Taxable,
                        AccountType::Roth,
                        AccountType::TaxDeferred,
                    ],
                    _ => [
                        AccountType::Taxable,
                        AccountType::TaxDeferred,
                        AccountType::Roth,
                    ],
                }
            };
            for kind in types {
                draw_type(
                    &self.states,
                    &mut available,
                    &mut withdrawals,
                    kind,
                    &mut remaining,
                )?;
            }
        }
        if before_59_half {
            for (s, w) in self.states.iter().zip(&withdrawals) {
                if *w > 0 {
                    match s.account.account_type {
                        AccountType::TaxDeferred => flag(
                            &mut flags,
                            "partial:early_distribution_exceptions_not_modeled".into(),
                        ),
                        AccountType::Roth => flag(
                            &mut flags,
                            "partial:roth_early_withdrawal_ordering_not_modeled".into(),
                        ),
                        _ => {}
                    }
                }
            }
        }
        let surplus = if need < 0 { sub(0, need)? } else { 0 };
        let mut created_account = None;
        if surplus > 0 {
            let target = match self
                .states
                .iter()
                .position(|s| s.account.account_type == AccountType::Taxable)
            {
                Some(i) => i,
                None => {
                    if self
                        .states
                        .iter()
                        .any(|s| s.account.id == "surplus-taxable")
                    {
                        return Err(Error::invalid(
                            "SURPLUS_ACCOUNT_ID_CONFLICT",
                            "Cannot create surplus-taxable because that ID belongs to a non-taxable account.",
                        ));
                    }
                    let i = self.states.len();
                    self.states.push(State {
                        account: Account {
                            id: "surplus-taxable".into(),
                            owner: person.id.clone(),
                            account_type: AccountType::Taxable,
                            opening_balance_cents: 0,
                            cost_basis_cents: Some(0),
                            tax_deferred_kind: None,
                        },
                        created: true,
                    });
                    withdrawals.push(0);
                    distributions.push(0);
                    deposits.push(0);
                    sources.push(None);
                    created_account = Some("surplus-taxable".into());
                    i
                }
            };
            deposits[target] = surplus;
        }
        let withdrawals_total = total(withdrawals.iter().copied())?;
        let mut accounts = Vec::new();
        for (i, state) in self.states.iter_mut().enumerate() {
            let a = &mut state.account;
            let opening = a.opening_balance_cents;
            let net = sub(sub(deposits[i], withdrawals[i])?, distributions[i])?;
            let r = rate(
                assumptions,
                if a.account_type == AccountType::Cash {
                    "cash_return"
                } else {
                    "investment_return"
                },
            )?;
            let gain = growth(opening, net, r, period.days, period.days_in_year)?;
            let closing = add(add(opening, net)?, gain)?;
            if closing < 0 {
                return Err(Error::invalid(
                    "LEDGER_INVARIANT",
                    "Ledger balances must remain nonnegative.",
                ));
            }
            let mut basis_removed = None;
            let mut realized_gain = None;
            let mut closing_basis = None;
            if let Some(basis) = a.cost_basis_cents {
                let (removed, realized) = average_cost_basis(opening, basis, withdrawals[i])?;
                let next = add(sub(basis, removed)?, deposits[i])?;
                if next < 0 {
                    return Err(Error::invalid(
                        "LEDGER_INVARIANT",
                        "Taxable basis must remain nonnegative.",
                    ));
                }
                basis_removed = Some(Line::new(removed, "average_cost_basis", self.base, year)?);
                realized_gain = Some(Line::new(
                    realized,
                    "withdrawal_less_basis_removed",
                    self.base,
                    year,
                )?);
                closing_basis = Some(Line::new(
                    next,
                    "opening_basis_less_removed_plus_deposit",
                    self.base,
                    year,
                )?);
                a.cost_basis_cents = Some(next);
            }
            let record = AccountLedger {
                identifier: a.id.clone(),
                account_type: a.account_type,
                created: state.created,
                opening: Line::new(opening, "prior_year_closing_or_valuation", self.base, year)?,
                rmd: Line::new(
                    distributions[i],
                    if sources[i].is_some() {
                        "rmd_uniform_lifetime"
                    } else {
                        "rmd_not_due"
                    },
                    self.base,
                    year,
                )?,
                distribution_source: sources[i].clone(),
                withdrawal: Line::new(
                    withdrawals[i],
                    if a.account_type == AccountType::Cash {
                        "cash_first"
                    } else {
                        used
                    },
                    self.base,
                    year,
                )?,
                deposit: Line::new(
                    deposits[i],
                    if state.created {
                        "surplus_created_taxable"
                    } else {
                        "surplus_first_taxable"
                    },
                    self.base,
                    year,
                )?,
                growth: Line::new(
                    gain,
                    "opening_full_period_net_flow_half_period",
                    self.base,
                    year,
                )?,
                closing: Line::new(
                    closing,
                    "opening_plus_net_flow_plus_growth",
                    self.base,
                    year,
                )?,
                closing_today: None,
                basis_removed,
                realized_gain,
                closing_basis,
            };
            accounts.push(record);
            a.opening_balance_cents = closing;
        }
        // Enforce the household identity on the same finalized cents written out.
        if add(
            add(add(income_total, rmd_total)?, withdrawals_total)?,
            remaining,
        )? != add(add(spending, tax_paid)?, surplus)?
        {
            return Err(Error::invalid(
                "LEDGER_INVARIANT",
                "Household cash conservation failed.",
            ));
        }
        Ok(YearLedger {
            period,
            before_59_half,
            withdrawal_order_used: used,
            income,
            income_total: Line::new(income_total, "sum_finalized_income_lines", self.base, year)?,
            spending: Line::new(spending, "retirement_phases_active_days", self.base, year)?,
            accounts,
            rmd_total: Line::new(rmd_total, "sum_required_distributions", self.base, year)?,
            withdrawals_total: Line::new(
                withdrawals_total,
                "sum_account_withdrawals",
                self.base,
                year,
            )?,
            surplus_deposit: Line::new(
                surplus,
                "income_and_distributions_less_spending",
                self.base,
                year,
            )?,
            shortfall: Line::new(remaining, "unfunded_need_no_borrowing", self.base, year)?,
            total_closing: None,
            total_closing_today: None,
            shortfall_today: None,
            created_account,
            flags,
            federal_tax: None,
        })
    }
}
fn draw_type(
    states: &[State],
    available: &mut [i64],
    withdrawals: &mut [i64],
    kind: AccountType,
    need: &mut i64,
) -> Result<()> {
    for (i, state) in states.iter().enumerate() {
        if state.account.account_type == kind {
            let draw = (*need).min(available[i]);
            withdrawals[i] = add(withdrawals[i], draw)?;
            available[i] = sub(available[i], draw)?;
            *need = sub(*need, draw)?;
        }
    }
    Ok(())
}
fn draw_proportional(
    states: &[State],
    available: &mut [i64],
    withdrawals: &mut [i64],
    need: &mut i64,
) -> Result<()> {
    let indexes: Vec<usize> = states
        .iter()
        .enumerate()
        .filter(|(_, s)| {
            [AccountType::Taxable, AccountType::TaxDeferred].contains(&s.account.account_type)
        })
        .map(|(i, _)| i)
        .collect();
    let weights: Vec<i64> = indexes.iter().map(|i| available[*i]).collect();
    let capacity = total(weights.iter().copied())?;
    let amount = (*need).min(capacity);
    let shares = proportional_split(amount, &weights)?;
    let mut remaining = amount;
    let mut later_capacity = capacity;
    for ((i, weight), share) in indexes.iter().zip(&weights).zip(shares) {
        later_capacity = sub(later_capacity, *weight)?;
        // Respect hard balance limits even when rounding tiny shares. Reserve
        // enough funding so the last input account can take the remainder.
        let draw = share
            .max(sub(remaining, later_capacity)?.max(0))
            .min(remaining)
            .min(*weight);
        available[*i] = sub(available[*i], draw)?;
        withdrawals[*i] = add(withdrawals[*i], draw)?;
        remaining = sub(remaining, draw)?;
        *need = sub(*need, draw)?;
    }
    Ok(())
}

impl YearLedger {
    pub(crate) fn add_today_values(&mut self, inflation: &str, base: u16, year: u16) -> Result<()> {
        let factor = crate::money::index_factor(inflation, base, year)?;
        let converted = |cents| -> Result<Line> {
            let amount = Fraction::integer(cents).divided_by(&factor)?.finalize()?;
            Ok(Line {
                value: MonetaryValue::new(amount, DollarBasis::Today, base, year)?,
                rule_id: "nominal_divided_by_exact_inflation_factor",
            })
        };
        let closing = total(self.accounts.iter().map(|a| a.closing.cents()))?;
        for a in &mut self.accounts {
            a.closing_today = Some(converted(a.closing.cents())?);
        }
        self.total_closing = Some(Line::new(
            closing,
            "sum_finalized_account_closing_lines",
            base,
            year,
        )?);
        self.total_closing_today = Some(converted(closing)?);
        self.shortfall_today = Some(converted(self.shortfall.cents())?);
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn ledger_conserves_finalized_account_lines() {
        let opening = 10000000;
        let deposit = 3000000;
        let withdrawal = 2000000;
        let rmd = 1000000;
        let net = sub(sub(deposit, withdrawal).unwrap(), rmd).unwrap();
        let growth = growth(opening, net, "0.05", 200, 365).unwrap();
        let closing = add(add(opening, net).unwrap(), growth).unwrap();
        assert_eq!(
            closing,
            add(
                sub(
                    sub(add(opening, deposit).unwrap(), withdrawal).unwrap(),
                    rmd
                )
                .unwrap(),
                growth
            )
            .unwrap()
        );
        assert!(closing >= 0);
    }
    #[test]
    fn ledger_sum_rounds_only_at_the_final_line() {
        let annual = Amount {
            cents: 1,
            dollar_basis: DollarBasis::Nominal,
        };
        let a = activated_fraction(&annual, "0", 2026, 2026, 183, 365).unwrap();
        let b = activated_fraction(&annual, "0", 2026, 2026, 182, 365).unwrap();
        assert_eq!(a.plus(&b).finalize().unwrap().cents(), 1);
    }
}
