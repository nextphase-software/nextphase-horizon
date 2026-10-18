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

pub const MODEL_VERSION: &str = "horizon-engine-0.3.0";

#[derive(Debug, Clone, Serialize, schemars::JsonSchema)]
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
#[derive(Debug, Clone, Serialize, schemars::JsonSchema)]
pub struct IndexedAmount {
    pub identifier: String,
    pub nominal: MonetaryValue,
    pub today: MonetaryValue,
}
#[derive(Debug, Clone, Serialize, schemars::JsonSchema)]
pub struct OpeningAccount {
    pub identifier: String,
    pub owner: String,
    pub account_type: crate::input::AccountType,
    pub balance: MonetaryValue,
    pub cost_basis: Option<MonetaryValue>,
}
#[derive(Debug, Clone, Serialize, schemars::JsonSchema)]
pub struct ProjectionYear {
    pub year: u16,
    pub age_on_december_31: u16,
    /// Annual indexed input amounts; activated financial flows are in `ledger`.
    pub indexed_inputs: Vec<IndexedAmount>,
    pub ledger: crate::ledger::YearLedger,
}
#[derive(Debug, Clone, Serialize, schemars::JsonSchema)]
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
#[derive(Debug, Clone, Serialize, schemars::JsonSchema)]
pub struct Run {
    pub status: &'static str,
    pub description: &'static str,
    pub omissions: Vec<&'static str>,
    pub valuation_date: crate::input::Date,
    pub metadata: Metadata,
    pub assumptions_used: Vec<Assumption>,
    pub opening_accounts: Vec<OpeningAccount>,
    pub years: Vec<ProjectionYear>,
    pub withdrawal_order_used: &'static str,
}

/// Deterministic calculation only: no clock, environment, storage or implicit assumptions.
pub fn project(household: &Household, assumptions: &[Assumption]) -> Result<Run> {
    project_with_tax_limit(household, assumptions, crate::tax::DEFAULT_PASS_LIMIT)
}
/// Historical W2 operation: no federal tax outflow, with W2 status and omissions.
pub fn project_pre_tax(household: &Household, assumptions: &[Assumption]) -> Result<Run> {
    project_mode(household, assumptions, None)
}
pub fn project_with_tax_limit(
    household: &Household,
    assumptions: &[Assumption],
    pass_limit: u16,
) -> Result<Run> {
    if !(1..=crate::tax::DEFAULT_PASS_LIMIT).contains(&pass_limit) {
        return Err(crate::error::Error::invalid(
            "INVALID_TAX_PASS_LIMIT",
            "Tax pass limit must be from 1 through 50.",
        ));
    }
    project_mode(household, assumptions, Some(pass_limit))
}
fn project_mode(
    household: &Household,
    assumptions: &[Assumption],
    tax_limit: Option<u16>,
) -> Result<Run> {
    validate_household(household)?;
    let base = household.valuation_date.year()?;
    let mut assumptions = validate_assumptions(assumptions, base)?;
    if tax_limit.is_some() {
        let indexing = crate::ledger::rate(&assumptions, "tax_indexing")?;
        crate::tax::law(base, indexing)?;
    }
    if household.persons[0].birth_date.year()? == 1959 {
        assumptions.push(Assumption {
            identifier: "rmd_applicable_age_1959".into(), value: "73".into(), unit: "year_of_age".into(),
            source: "https://www.federalregister.gov/documents/2024/07/19/2024-14543/required-minimum-distributions".into(),
            effective_year: 2024, user_overrode_default: false,
        });
        assumptions.sort_by(|a, b| a.identifier.cmp(&b.identifier));
    }
    let inflation = crate::ledger::rate(&assumptions, "inflation")?;
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
    let mut ledger = crate::ledger::Ledger::new(household)?;
    let mut omissions = if tax_limit.is_some() {
        vec![
            "state tax not modeled",
            "alternative minimum tax not modeled",
            "taxable-account dividends and interest not modeled",
            "itemized deductions and credits not modeled",
        ]
    } else {
        vec![
            "federal income tax not modeled",
            "contributions not modeled",
            "state tax not modeled",
            "healthcare not modeled",
        ]
    };
    let mut loss_carry = 0;
    let mut partial = tax_limit.is_none();
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
        let annual = if let Some(limit) = tax_limit {
            crate::tax::funded_year(
                &mut ledger,
                household,
                &assumptions,
                year,
                loss_carry,
                limit,
            )?
        } else {
            ledger.year(household, &assumptions, year)?
        };
        if let Some(tax) = &annual.federal_tax {
            loss_carry = tax.breakdown.cents("loss_carry_out");
        }
        if tax_limit.is_some()
            && household.income.wages.iter().any(|w| {
                annual
                    .period
                    .active_days(Some(&w.start_date), Some(&w.end_date))
                    .is_ok_and(|days| days > 0)
            })
        {
            partial = true;
            if !omissions.contains(&"contributions not modeled") {
                omissions.push("contributions not modeled");
            }
        }
        partial |= annual.flags.iter().any(|f| f.starts_with("partial:"));
        for (flag, omission) in [
            (
                "partial:tax_funding_did_not_converge",
                "tax funding did not converge",
            ),
            (
                "partial:net_investment_income_tax_not_modeled",
                "net investment income tax not modeled",
            ),
            (
                "partial:still_working_rmd_exception_not_modeled",
                "still-working distribution exception not modeled",
            ),
            (
                "partial:early_distribution_exceptions_not_modeled",
                "early-distribution exceptions not modeled",
            ),
            (
                "partial:roth_early_withdrawal_ordering_not_modeled",
                "Roth early-withdrawal ordering not modeled",
            ),
        ] {
            if annual.flags.iter().any(|f| f == flag) && !omissions.contains(&omission) {
                omissions.push(omission);
            }
        }
        years.push(ProjectionYear {
            year,
            age_on_december_31: age_at_year_end(&person.birth_date, year)?,
            indexed_inputs: inputs,
            ledger: annual,
        });
    }
    Ok(Run {
        status: if partial { "partial" } else { "complete" },
        description: if tax_limit.is_some() {
            "Estimated annual ledger with single-filer federal income tax; see flags and omissions."
        } else {
            "Estimated annual ledger; federal income tax not modeled."
        },
        omissions,
        valuation_date: household.valuation_date.clone(),
        metadata: Metadata {
            model_version: if tax_limit.is_some() {
                MODEL_VERSION
            } else {
                "horizon-engine-0.2.0"
            },
            rule_set_identifier: if tax_limit.is_some() {
                "us-single-federal-tax-v3"
            } else {
                "us-single-ledger-v2"
            },
            rule_set_year: if tax_limit.is_some() {
                2026
            } else {
                crate::rmd_table::TABLE_YEAR
            },
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
        withdrawal_order_used: household.withdrawal_order.unwrap_or_default().identifier(),
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
