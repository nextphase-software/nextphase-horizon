// SPDX-License-Identifier: AGPL-3.0-only
use crate::{
    canonical::hash,
    error::Result,
    input::{
        Amount, Assumption, DollarBasis, Household, age_at_year_end, projection_years,
        validate_assumptions, validate_household,
    },
    money::{Money, nominal, today},
};
use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct MonetaryValue {
    pub cents: i64,
    pub unit: &'static str,
    pub currency: &'static str,
    pub dollar_basis: DollarBasis,
    pub base_year: u16,
    pub year: u16,
}
impl MonetaryValue {
    pub fn new(money: Money, basis: DollarBasis, base_year: u16, year: u16) -> Result<Self> {
        Ok(Self {
            cents: money.output_cents()?,
            unit: "cent",
            currency: "USD",
            dollar_basis: basis,
            base_year,
            year,
        })
    }
}
#[derive(Debug, Clone, Serialize)]
pub struct IndexedAmount {
    pub identifier: String,
    pub nominal: MonetaryValue,
    pub today: MonetaryValue,
}
#[derive(Debug, Clone, Serialize)]
pub struct OpeningAccount {
    pub identifier: String,
    pub owner: String,
    pub account_type: crate::input::AccountType,
    pub balance: MonetaryValue,
    pub cost_basis: Option<MonetaryValue>,
}
#[derive(Debug, Clone, Serialize)]
pub struct ProjectionYear {
    pub year: u16,
    pub age_on_december_31: u16,
    /// Indexed input amounts, NOT realized flows or an account ledger.
    pub indexed_inputs: Vec<IndexedAmount>,
}
#[derive(Debug, Clone, Serialize)]
pub struct Metadata {
    pub model_version: &'static str,
    pub rule_set_identifier: &'static str,
    pub rule_set_year: u16,
    pub input_hash: String,
    pub assumption_set_hash: String,
    pub hash_method: &'static str,
    pub canonical_json_method: &'static str,
    pub rounding: &'static str,
    pub indexing: &'static str,
    pub age_label: &'static str,
}
#[derive(Debug, Clone, Serialize)]
pub struct Run {
    pub status: &'static str,
    pub description: &'static str,
    pub omissions: Vec<&'static str>,
    pub valuation_date: crate::input::Date,
    pub metadata: Metadata,
    pub assumptions_used: Vec<Assumption>,
    pub opening_accounts: Vec<OpeningAccount>,
    pub years: Vec<ProjectionYear>,
}

/// Deterministic calculation only: no clock, environment, storage or implicit assumptions.
pub fn project(household: &Household, assumptions: &[Assumption]) -> Result<Run> {
    validate_household(household)?;
    let base = household.valuation_date.year()?;
    let assumptions = validate_assumptions(assumptions, base)?;
    let inflation = &assumptions[0].value;
    let mut opening_accounts = Vec::new();
    for a in &household.accounts {
        opening_accounts.push(OpeningAccount {
            identifier: a.id.clone(),
            owner: a.owner.clone(),
            account_type: a.account_type,
            balance: MonetaryValue::new(
                Money::from_cents(a.opening_balance_cents),
                DollarBasis::Nominal,
                base,
                base,
            )?,
            cost_basis: a
                .cost_basis_cents
                .map(|v| MonetaryValue::new(Money::from_cents(v), DollarBasis::Nominal, base, base))
                .transpose()?,
        });
    }
    let person = &household.persons[0];
    let mut years = Vec::new();
    for year in projection_years(household)? {
        let mut inputs = vec![
            indexed(
                "spending.before_retirement",
                &household.spending.before_retirement,
                inflation,
                base,
                year,
            )?,
            indexed(
                "spending.after_retirement",
                &household.spending.after_retirement,
                inflation,
                base,
                year,
            )?,
            indexed(
                "income.social_security",
                &household.income.social_security.amount,
                inflation,
                base,
                year,
            )?,
            indexed(
                "income.pension",
                &household.income.pension.amount,
                inflation,
                base,
                year,
            )?,
        ];
        for (i, wage) in household.income.wages.iter().enumerate() {
            inputs.push(indexed(
                &format!("income.wages.{i}"),
                &wage.amount,
                inflation,
                base,
                year,
            )?);
        }
        years.push(ProjectionYear {
            year,
            age_on_december_31: age_at_year_end(&person.birth_date, year)?,
            indexed_inputs: inputs,
        });
    }
    Ok(Run {
        status: "partial",
        description: "Estimated annual indexing skeleton; indexed inputs are not realized flows or a funded plan.",
        omissions: vec![
            "taxes",
            "withdrawals",
            "surplus",
            "required_minimum_distributions",
            "shortfalls",
            "within_year_flow_timing",
            "investment_growth",
            "income_and_spending_activation",
            "state_tax",
            "healthcare",
        ],
        valuation_date: household.valuation_date.clone(),
        metadata: Metadata {
            model_version: "horizon-engine-0.1.0",
            rule_set_identifier: "us-single-indexing-skeleton-v1",
            rule_set_year: base,
            input_hash: hash(household)?,
            assumption_set_hash: hash(&assumptions)?,
            hash_method: "sha-256",
            canonical_json_method: "rfc8785",
            rounding: "nearest_cent_half_away_from_zero_once_per_line",
            indexing: "annual_exact_factor_from_valuation_year",
            age_label: "whole_years_on_december_31",
        },
        assumptions_used: assumptions,
        opening_accounts,
        years,
    })
}
fn indexed(
    id: &str,
    amount: &Amount,
    inflation: &str,
    base: u16,
    year: u16,
) -> Result<IndexedAmount> {
    let entered = Money::from_cents(amount.cents);
    let (n, t) = match amount.dollar_basis {
        DollarBasis::Today => {
            let n = nominal(entered, inflation, base, year)?;
            (n, today(n, inflation, base, year)?)
        }
        DollarBasis::Nominal => (entered, today(entered, inflation, base, year)?),
    };
    Ok(IndexedAmount {
        identifier: id.into(),
        nominal: MonetaryValue::new(n, DollarBasis::Nominal, base, year)?,
        today: MonetaryValue::new(t, DollarBasis::Today, base, year)?,
    })
}
