// SPDX-License-Identifier: AGPL-3.0-only
use crate::{
    error::{Error, Result},
    money::{JSON_CENT_LIMIT, Money, index_factor},
};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};
use std::collections::BTreeSet;

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq, PartialOrd, Ord)]
#[serde(transparent)]
pub struct Date(#[schemars(regex(pattern = r"^[0-9]{4}-[0-9]{2}-[0-9]{2}$"))] pub String);
impl Date {
    pub fn year(&self) -> Result<u16> {
        Ok(self.parts()?.0)
    }
    pub(crate) fn parts(&self) -> Result<(u16, u16, u16)> {
        let invalid = || {
            Error::invalid(
                "INVALID_DATE",
                "Dates must be real Gregorian dates in YYYY-MM-DD form (years 0001–9999).",
            )
        };
        let bytes = self.0.as_bytes();
        if bytes.len() != 10 || bytes.get(4) != Some(&b'-') || bytes.get(7) != Some(&b'-') {
            return Err(invalid());
        }
        for (i, b) in bytes.iter().enumerate() {
            if i != 4 && i != 7 && !b.is_ascii_digit() {
                return Err(invalid());
            }
        }
        let year: u16 = self
            .0
            .get(..4)
            .ok_or_else(invalid)?
            .parse()
            .map_err(|_| invalid())?;
        let month: u16 = self
            .0
            .get(5..7)
            .ok_or_else(invalid)?
            .parse()
            .map_err(|_| invalid())?;
        let day: u16 = self
            .0
            .get(8..)
            .ok_or_else(invalid)?
            .parse()
            .map_err(|_| invalid())?;
        let leap =
            year.is_multiple_of(400) || (year.is_multiple_of(4) && !year.is_multiple_of(100));
        let days = match month {
            1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
            4 | 6 | 9 | 11 => 30,
            2 if leap => 29,
            2 => 28,
            _ => 0,
        };
        if year == 0 || day == 0 || day > days {
            return Err(invalid());
        }
        Ok((year, month, day))
    }
    pub fn validate(&self) -> Result<()> {
        self.parts().map(|_| ())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct Person {
    #[schemars(length(min = 1))]
    pub id: String,
    pub birth_date: Date,
    pub retirement_date: Date,
    #[schemars(range(min = 1, max = 130))]
    pub plan_end_age: u16,
}
#[derive(Debug, Clone, Copy, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum AccountType {
    Cash,
    Taxable,
    TaxDeferred,
    Roth,
}
#[derive(Debug, Clone, Copy, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum TaxDeferredKind {
    EmployerPlan,
    TraditionalIra,
}
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct Account {
    #[schemars(length(min = 1))]
    pub id: String,
    #[schemars(length(min = 1))]
    pub owner: String,
    pub account_type: AccountType,
    #[schemars(range(min=0, max=JSON_CENT_LIMIT))]
    pub opening_balance_cents: i64,
    #[schemars(range(min=0, max=JSON_CENT_LIMIT))]
    pub cost_basis_cents: Option<i64>,
    pub tax_deferred_kind: Option<TaxDeferredKind>,
}
#[derive(Debug, Clone, Copy, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum DollarBasis {
    Nominal,
    Today,
}
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct Amount {
    #[schemars(range(min=0, max=JSON_CENT_LIMIT))]
    pub cents: i64,
    pub dollar_basis: DollarBasis,
}
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct Wages {
    pub amount: Amount,
    pub start_date: Date,
    pub end_date: Date,
}
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct AgeIncome {
    pub amount: Amount,
    #[schemars(range(min = 0, max = 130))]
    pub start_age: u16,
}
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct Income {
    pub wages: Vec<Wages>,
    pub social_security: AgeIncome,
    pub pension: AgeIncome,
}
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct Spending {
    pub before_retirement: Amount,
    pub after_retirement: Amount,
}
#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema)]
#[serde(deny_unknown_fields)]
pub struct Household {
    pub valuation_date: Date,
    #[schemars(length(min = 1, max = 1))]
    pub persons: Vec<Person>,
    pub accounts: Vec<Account>,
    pub income: Income,
    pub spending: Spending,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub withdrawal_order: Option<WithdrawalOrder>,
}

#[derive(Debug, Clone, Copy, Default, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum WithdrawalOrder {
    #[default]
    TaxableFirst,
    TaxDeferredFirst,
    RothBeforeTaxDeferred,
    ProportionalTaxableTaxDeferred,
}
impl WithdrawalOrder {
    pub fn identifier(self) -> &'static str {
        match self {
            Self::TaxableFirst => "taxable_first",
            Self::TaxDeferredFirst => "tax_deferred_first",
            Self::RothBeforeTaxDeferred => "roth_before_tax_deferred",
            Self::ProportionalTaxableTaxDeferred => "proportional_taxable_tax_deferred",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, JsonSchema, PartialEq, Eq)]
#[serde(deny_unknown_fields)]
pub struct Assumption {
    #[schemars(length(min = 1))]
    pub identifier: String,
    /// Exact decimal string, never a floating-point number.
    #[schemars(regex(pattern = r"^-?[0-9]+(\.[0-9]{1,18})?$"))]
    pub value: String,
    pub unit: String,
    pub source: String,
    #[schemars(range(min = 1, max = 9999))]
    pub effective_year: u16,
    pub user_overrode_default: bool,
}

pub fn age_at_year_end(birth: &Date, year: u16) -> Result<u16> {
    year.checked_sub(birth.year()?)
        .ok_or_else(|| Error::invalid("INVALID_YEAR", "Age-label year precedes birth year."))
}
pub fn projection_years(household: &Household) -> Result<std::ops::RangeInclusive<u16>> {
    let person = household
        .persons
        .first()
        .ok_or_else(|| Error::invalid("PERSON_REQUIRED", "Exactly one person is required."))?;
    let base = household.valuation_date.year()?;
    let end = person
        .birth_date
        .year()?
        .checked_add(person.plan_end_age)
        .filter(|y| *y <= 9999)
        .ok_or_else(|| Error::invalid("INVALID_YEAR", "Plan end year must be at most 9999."))?;
    if end <= base {
        return Err(Error::invalid(
            "PLAN_END_AGE_REACHED",
            "The person reaches the plan end age by 31 December of the base year.",
        ));
    }
    Ok(base..=end)
}

pub fn validate_household(h: &Household) -> Result<()> {
    if h.persons.len() > 1 {
        return Err(Error::unsupported(
            "MULTIPLE_PERSONS_UNSUPPORTED",
            "Only one person is supported.",
        ));
    }
    let person = h
        .persons
        .first()
        .ok_or_else(|| Error::invalid("PERSON_REQUIRED", "Exactly one person is required."))?;
    h.valuation_date.validate()?;
    person.birth_date.validate()?;
    person.retirement_date.validate()?;
    if person.birth_date > h.valuation_date || person.retirement_date < person.birth_date {
        return Err(Error::invalid(
            "INVALID_DATE_ORDER",
            "Birth must not follow valuation or retirement.",
        ));
    }
    if person.id.is_empty() || !(1..=130).contains(&person.plan_end_age) {
        return Err(Error::invalid(
            "INVALID_PERSON",
            "Person ID is required and plan end age must be 1–130.",
        ));
    }
    projection_years(h)?;
    let mut ids = BTreeSet::new();
    for account in &h.accounts {
        if account.id.is_empty() || !ids.insert(&account.id) {
            return Err(Error::invalid(
                "INVALID_ACCOUNT_ID",
                "Account IDs must be nonempty and unique.",
            ));
        }
        if account.owner != person.id {
            return Err(Error::invalid(
                "INVALID_OWNER",
                "Every account must belong to the supported person.",
            ));
        }
        nonnegative(account.opening_balance_cents)?;
        if let Some(basis) = account.cost_basis_cents {
            nonnegative(basis)?;
        }
        if (account.account_type == AccountType::Taxable) != account.cost_basis_cents.is_some()
            || (account.account_type == AccountType::TaxDeferred)
                != account.tax_deferred_kind.is_some()
        {
            return Err(Error::invalid(
                "ACCOUNT_FIELDS",
                "Only taxable accounts require cost basis; only tax-deferred accounts require a plan kind.",
            ));
        }
    }
    for wage in &h.income.wages {
        wage.start_date.validate()?;
        wage.end_date.validate()?;
        if wage.end_date < wage.start_date {
            return Err(Error::invalid(
                "END_BEFORE_START",
                "Wage end date precedes its start date.",
            ));
        }
        nonnegative(wage.amount.cents)?;
    }
    for income in [&h.income.social_security, &h.income.pension] {
        nonnegative(income.amount.cents)?;
        if income.start_age > 130 {
            return Err(Error::invalid(
                "INVALID_START_AGE",
                "Income start age must be at most 130.",
            ));
        }
    }
    nonnegative(h.spending.before_retirement.cents)?;
    nonnegative(h.spending.after_retirement.cents)?;
    Ok(())
}
fn nonnegative(cents: i64) -> Result<()> {
    if cents < 0 {
        return Err(Error::invalid(
            "NEGATIVE_BALANCE",
            "Balances, cost bases and entered amounts must be nonnegative cents.",
        ));
    }
    Money::from_cents(cents).output_cents().map(|_| ())
}
pub fn validate_assumptions(assumptions: &[Assumption], base: u16) -> Result<Vec<Assumption>> {
    let mut sorted = assumptions.to_vec();
    sorted.sort_by(|a, b| a.identifier.cmp(&b.identifier));
    let mut ids = BTreeSet::new();
    for a in &sorted {
        if !ids.insert(&a.identifier) {
            return Err(Error::invalid(
                "DUPLICATE_ASSUMPTION",
                "Assumption identifiers must be unique.",
            ));
        }
        // Reject unused or unrecognized model knobs.
        if ![
            "inflation",
            "investment_return",
            "cash_return",
            "tax_indexing",
        ]
        .contains(&a.identifier.as_str())
        {
            return Err(Error::unsupported(
                "ASSUMPTION_UNSUPPORTED",
                "This model supports inflation, investment_return, cash_return and tax_indexing assumptions.",
            ));
        }
        if a.unit != "decimal_fraction_per_year"
            || a.effective_year != base
            || !(a.source == "user" || (a.source.starts_with("https://") && a.source.len() > 8))
        {
            return Err(Error::invalid(
                "INVALID_ASSUMPTION",
                "Rates need annual decimal-fraction units, the base effective year, and a public HTTPS reference or user source.",
            ));
        }
        if a.identifier == "inflation" {
            index_factor(&a.value, base, base)?;
        } else if a.identifier == "tax_indexing" {
            if crate::money::Fraction::decimal(&a.value)?.is_negative() {
                return Err(Error::invalid(
                    "INVALID_TAX_INDEXING",
                    "Tax indexing must be zero or greater.",
                ));
            }
        } else if crate::money::Fraction::decimal(&a.value)?.is_negative() {
            return Err(Error::unsupported(
                "NEGATIVE_RETURN_UNSUPPORTED",
                "Negative investment and cash returns are unsupported.",
            ));
        }
    }
    if sorted.is_empty() {
        return Err(Error::invalid(
            "MISSING_ASSUMPTION",
            "The inflation assumption is required; there is no implicit default.",
        ));
    }
    for identifier in ["inflation", "cash_return", "investment_return"] {
        if !sorted.iter().any(|a| a.identifier == identifier) {
            return Err(Error::invalid(
                "MISSING_ASSUMPTION",
                format!("The {identifier} assumption is required; there is no implicit default."),
            ));
        }
    }
    Ok(sorted)
}
