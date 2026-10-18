// SPDX-License-Identifier: AGPL-3.0-only
//! Single-filer exact rate schedules. All amounts are nominal USD cents.
use crate::{
    error::{Error, Result},
    input::{AccountType, Assumption, Date, DollarBasis, Household},
    ledger::{Ledger, YearLedger, rate},
    money::{Fraction, Money, index_factor},
    projection::MonetaryValue,
};
use serde::Serialize;
use std::collections::BTreeMap;

pub const DEFAULT_PASS_LIMIT: u16 = 50;
pub const LAW_SOURCE: &str = "https://www.irs.gov/pub/irs-drop/rp-25-32.pdf";
const SS_SOURCE: &str = "https://www.law.cornell.edu/uscode/text/26/86";
const SENIOR_SOURCE: &str = "https://www.law.cornell.edu/uscode/text/26/151";
const LOSS_SOURCE: &str = "https://www.law.cornell.edu/uscode/text/26/1211";
const EARLY_SOURCE: &str = "https://www.irs.gov/taxtopics/tc557";
const RETRIEVED: &str = "2026-10-17";
// Published 2026 single-filer data, Rev. Proc. 2025-32, sections 4.01, 4.03, 4.14.
const THRESHOLDS: [i64; 6] = [
    1_240_000, 5_040_000, 10_570_000, 20_177_500, 25_622_500, 64_060_000,
];
const RATES: [&str; 7] = ["0.10", "0.12", "0.22", "0.24", "0.32", "0.35", "0.37"];
fn add(a: i64, b: i64) -> Result<i64> {
    Ok(Money::from_cents(a)
        .checked_add(Money::from_cents(b))?
        .cents())
}
fn sub(a: i64, b: i64) -> Result<i64> {
    Ok(Money::from_cents(a)
        .checked_sub(Money::from_cents(b))?
        .cents())
}
fn multiply(a: i64, r: &str) -> Result<i64> {
    Ok(Fraction::integer(a)
        .times(&Fraction::decimal(r)?)
        .finalize()?
        .cents())
}

#[derive(Debug, Clone, Serialize, schemars::JsonSchema)]
pub struct RuleValue {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub currency: Option<&'static str>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub dollar_basis: Option<DollarBasis>,
    pub value: String,
    pub unit: &'static str,
    pub source: &'static str,
    pub retrieved: &'static str,
    pub tax_year: u16,
    pub kind: &'static str,
}
#[derive(Debug, Clone, Serialize, schemars::JsonSchema)]
pub struct Law {
    pub currency: &'static str,
    pub unit: &'static str,
    pub dollar_basis: DollarBasis,
    pub base_year: u16,
    pub tax_year: u16,
    pub kind: &'static str,
    pub bracket_thresholds: Vec<i64>,
    pub standard_deduction: i64,
    pub additional_65: i64,
    pub capital_gains_zero_max: i64,
    pub capital_gains_15_max: i64,
    pub values: BTreeMap<String, RuleValue>,
}
pub fn law(year: u16, indexing: &str) -> Result<Law> {
    if year < 2026 {
        return Err(Error::unsupported(
            "TAX_YEAR_UNSUPPORTED",
            "Federal tax years before 2026 are unsupported.",
        ));
    }
    if Fraction::decimal(indexing)?.is_negative() {
        return Err(Error::invalid(
            "INVALID_TAX_INDEXING",
            "Tax indexing must be zero or greater.",
        ));
    }
    let factor = index_factor(indexing, 2026, year)?;
    let indexed = |amount| -> Result<i64> {
        let value = if year == 2026 {
            Money::from_cents(amount)
        } else {
            Fraction::integer(amount)
                .times(&factor)
                .floor_multiple(5000)?
        };
        value.output_cents()
    };
    let kind = if year == 2026 { "a" } else { "b" };
    let thresholds = THRESHOLDS
        .iter()
        .map(|v| indexed(*v))
        .collect::<Result<Vec<_>>>()?;
    let mut values = BTreeMap::new();
    let mut insert = |name: String, value: String, unit, source, kind| {
        values.insert(
            name,
            RuleValue {
                currency: if unit == "cent" { Some("USD") } else { None },
                dollar_basis: if unit == "cent" {
                    Some(DollarBasis::Nominal)
                } else {
                    None
                },
                value,
                unit,
                source,
                retrieved: RETRIEVED,
                tax_year: year,
                kind,
            },
        );
    };
    for (i, threshold) in thresholds.iter().enumerate() {
        insert(
            format!("ordinary_threshold_{i}"),
            threshold.to_string(),
            "cent",
            LAW_SOURCE,
            kind,
        );
    }
    for (i, rate) in RATES.iter().enumerate() {
        insert(
            format!("ordinary_rate_{i}"),
            (*rate).into(),
            "decimal_fraction",
            LAW_SOURCE,
            "a",
        );
    }
    for (name, amount) in [
        ("standard_deduction", 1_610_000),
        ("additional_65", 205_000),
        ("capital_gains_zero_max", 4_945_000),
        ("capital_gains_15_max", 54_550_000),
    ] {
        insert(
            name.into(),
            indexed(amount)?.to_string(),
            "cent",
            LAW_SOURCE,
            kind,
        );
    }
    for (name, amount, source) in [
        ("ss_base", 2_500_000, SS_SOURCE),
        ("ss_adjusted_base", 3_400_000, SS_SOURCE),
        ("capital_loss_limit", 300_000, LOSS_SOURCE),
        ("senior_deduction", 600_000, SENIOR_SOURCE),
        ("senior_phaseout_start", 7_500_000, SENIOR_SOURCE),
        (
            "niit_magi_threshold",
            20_000_000,
            "https://www.law.cornell.edu/uscode/text/26/1411",
        ),
    ] {
        insert(name.into(), amount.to_string(), "cent", source, "a");
    }
    for (name, value, source) in [
        ("ss_first_rate", "0.50", SS_SOURCE),
        ("ss_second_rate", "0.85", SS_SOURCE),
        ("senior_phaseout_rate", "0.06", SENIOR_SOURCE),
        ("early_distribution_rate", "0.10", EARLY_SOURCE),
        ("capital_gains_zero_rate", "0", LAW_SOURCE),
        ("capital_gains_middle_rate", "0.15", LAW_SOURCE),
        ("capital_gains_top_rate", "0.20", LAW_SOURCE),
    ] {
        insert(name.into(), value.into(), "decimal_fraction", source, "a");
    }
    insert(
        "senior_last_year".into(),
        "2028".into(),
        "tax_year",
        SENIOR_SOURCE,
        "a",
    );
    Ok(Law {
        currency: "USD",
        unit: "cent",
        dollar_basis: DollarBasis::Nominal,
        base_year: 2026,
        tax_year: year,
        kind,
        bracket_thresholds: thresholds,
        standard_deduction: indexed(1_610_000)?,
        additional_65: indexed(205_000)?,
        capital_gains_zero_max: indexed(4_945_000)?,
        capital_gains_15_max: indexed(54_550_000)?,
        values,
    })
}
pub fn age_65(birth: &Date, year: u16) -> Result<bool> {
    birth.validate()?;
    let cutoff = year
        .checked_sub(64)
        .ok_or_else(|| Error::invalid("INVALID_YEAR", "Age cutoff precedes year one."))?;
    Ok(*birth <= crate::calendar::date(cutoff, 1, 1)?)
}
pub fn ordinary_tax(income: i64, law: &Law) -> Result<i64> {
    let mut prior = 0;
    let mut amount = Fraction::integer(0);
    for (i, rate) in RATES.iter().enumerate() {
        let ceiling = law.bracket_thresholds.get(i).copied().unwrap_or(income);
        let width = sub(income.min(ceiling), prior)?.max(0);
        amount = amount.plus(&Fraction::integer(width).times(&Fraction::decimal(rate)?));
        prior = ceiling;
        if income <= ceiling {
            break;
        }
    }
    Ok(amount.finalize()?.cents())
}
pub fn taxable_social_security(benefits: i64, other: i64) -> Result<i64> {
    let half = Fraction::decimal("0.5")?;
    let high = Fraction::decimal("0.85")?;
    let provisional = Fraction::integer(other).plus(&Fraction::integer(benefits).times(&half));
    let zero = Fraction::integer(0);
    let first = provisional
        .plus(&Fraction::integer(-2_500_000))
        .maximum(zero.clone())
        .minimum(Fraction::integer(900_000))
        .times(&half)
        .minimum(Fraction::integer(benefits).times(&half));
    let taxable = if provisional.compare(&Fraction::integer(3_400_000)).is_gt() {
        provisional
            .plus(&Fraction::integer(-3_400_000))
            .times(&high)
            .plus(&first)
            .minimum(Fraction::integer(benefits).times(&high))
    } else {
        first
    };
    Ok(taxable.finalize()?.cents())
}
#[derive(Debug, Clone, Serialize, schemars::JsonSchema)]
pub struct TaxLine {
    #[serde(flatten)]
    pub value: MonetaryValue,
    pub rule_id: &'static str,
    pub tax_year: u16,
    pub kind: &'static str,
}
impl TaxLine {
    pub fn new(
        cents: i64,
        rule_id: &'static str,
        base: u16,
        year: u16,
        kind: &'static str,
    ) -> Result<Self> {
        Ok(Self {
            value: MonetaryValue::new(Money::from_cents(cents), DollarBasis::Nominal, base, year)?,
            rule_id,
            tax_year: year,
            kind,
        })
    }
    pub fn cents(&self) -> i64 {
        self.value.cents
    }
}
#[derive(Debug, Clone, Serialize, schemars::JsonSchema)]
pub struct Breakdown {
    pub tax_year: u16,
    pub law_kind: &'static str,
    pub method: &'static str,
    pub niit_threshold_exceeded: bool,
    #[serde(flatten)]
    pub lines: BTreeMap<String, TaxLine>,
    pub rules: Law,
}
impl Breakdown {
    pub fn cents(&self, name: &str) -> i64 {
        self.lines[name].cents()
    }
}
#[derive(Debug, Clone)]
pub struct TaxInput {
    pub ordinary_income: i64,
    pub social_security: i64,
    pub realized_gains: i64,
    pub loss_carry_in: i64,
    pub early_distributions: i64,
}
pub fn compute(
    input: &TaxInput,
    birth: &Date,
    base: u16,
    year: u16,
    indexing: &str,
) -> Result<Breakdown> {
    if input.ordinary_income < 0
        || input.social_security < 0
        || input.loss_carry_in < 0
        || input.early_distributions < 0
    {
        return Err(Error::invalid(
            "INVALID_TAX_INPUT",
            "Income, benefits, loss carry and early distributions must be nonnegative cents.",
        ));
    }
    let rules = law(year, indexing)?;
    let net = sub(input.realized_gains, input.loss_carry_in)?;
    let net_capital = net.max(-300_000);
    let loss_carry_out = if net < -300_000 {
        sub(-300_000, net)?
    } else {
        0
    };
    let other = add(input.ordinary_income, net_capital)?;
    let taxable_ss = taxable_social_security(input.social_security, other)?;
    let agi = add(other, taxable_ss)?;
    let is_65 = age_65(birth, year)?;
    let standard = add(
        rules.standard_deduction,
        if is_65 { rules.additional_65 } else { 0 },
    )?;
    let senior = if is_65 && year <= 2028 {
        Fraction::integer(600_000)
            .plus(
                &Fraction::integer(sub(agi, 7_500_000)?.max(0)).times(&Fraction::decimal("-0.06")?),
            )
            .maximum(Fraction::integer(0))
            .finalize()?
            .cents()
    } else {
        0
    };
    let taxable = sub(sub(agi, standard)?, senior)?.max(0);
    let preferential = net_capital.max(0).min(taxable);
    let ordinary = sub(taxable, preferential)?;
    let ordinary_tax = ordinary_tax(ordinary, &rules)?;
    let zero_gain = preferential.min(sub(rules.capital_gains_zero_max, ordinary)?.max(0));
    let middle = sub(preferential, zero_gain)?
        .min(sub(rules.capital_gains_15_max, add(ordinary, zero_gain)?)?.max(0));
    let top = sub(sub(preferential, zero_gain)?, middle)?;
    let gains_tax = Fraction::integer(middle)
        .times(&Fraction::decimal("0.15")?)
        .plus(&Fraction::integer(top).times(&Fraction::decimal("0.20")?))
        .finalize()?
        .cents();
    let early_tax = multiply(input.early_distributions, "0.10")?;
    let total = add(add(ordinary_tax, gains_tax)?, early_tax)?;
    let mut lines = BTreeMap::new();
    for (name, cents, rule, kind) in [
        (
            "ordinary_income",
            input.ordinary_income,
            "wages_pension_deferred_distributions_cash_interest",
            "a",
        ),
        (
            "social_security",
            input.social_security,
            "social_security_benefits",
            "a",
        ),
        ("taxable_social_security", taxable_ss, "usc_86_single", "a"),
        (
            "net_capital",
            net_capital,
            "long_term_gains_less_carry_usc_1211",
            "a",
        ),
        (
            "loss_carry_out",
            loss_carry_out,
            "capital_loss_above_3000_carried_forward",
            "a",
        ),
        (
            "agi",
            agi,
            "ordinary_plus_taxable_social_security_plus_net_capital",
            "a",
        ),
        (
            "standard_deduction",
            standard,
            "standard_plus_age_65_january_1",
            rules.kind,
        ),
        (
            "senior_deduction",
            senior,
            "usc_151_senior_through_2028",
            "a",
        ),
        (
            "taxable_income",
            taxable,
            "agi_less_standard_and_senior_deductions",
            rules.kind,
        ),
        (
            "ordinary_taxable",
            ordinary,
            "taxable_less_preferential",
            rules.kind,
        ),
        (
            "preferential",
            preferential,
            "net_positive_capital_capped_by_taxable",
            rules.kind,
        ),
        (
            "ordinary_tax",
            ordinary_tax,
            "exact_progressive_rate_schedule",
            rules.kind,
        ),
        (
            "capital_gains_tax",
            gains_tax,
            "long_term_gains_stacked_0_15_20",
            rules.kind,
        ),
        (
            "early_distribution_tax",
            early_tax,
            "taxable_early_deferred_distributions_10_percent",
            "a",
        ),
        ("total_tax", total, "sum_finalized_tax_lines", rules.kind),
    ] {
        lines.insert(name.into(), TaxLine::new(cents, rule, base, year, kind)?);
    }
    Ok(Breakdown {
        tax_year: year,
        law_kind: rules.kind,
        method: "exact_rate_schedules_at_all_income_levels_not_the_filing_tax_table",
        niit_threshold_exceeded: agi > 20_000_000,
        lines,
        rules,
    })
}
fn from_ledger(y: &YearLedger, carry: i64) -> Result<TaxInput> {
    let mut ordinary = 0;
    for (id, line) in &y.income {
        if id != "social_security" {
            ordinary = add(ordinary, line.cents())?;
        }
    }
    let mut realized = 0;
    let mut early = 0;
    for a in &y.accounts {
        match a.account_type {
            AccountType::Cash => ordinary = add(ordinary, a.growth.cents())?,
            AccountType::TaxDeferred => {
                let distribution = add(a.rmd.cents(), a.withdrawal.cents())?;
                ordinary = add(ordinary, distribution)?;
                if y.before_59_half {
                    early = add(early, distribution)?;
                }
            }
            _ => {}
        }
        if let Some(gain) = &a.realized_gain {
            realized = add(realized, gain.cents())?;
        }
    }
    Ok(TaxInput {
        ordinary_income: ordinary,
        social_security: y.income["social_security"].cents(),
        realized_gains: realized,
        loss_carry_in: carry,
        early_distributions: early,
    })
}
#[derive(Debug, Clone, Serialize, schemars::JsonSchema)]
pub struct FundedTax {
    pub breakdown: Breakdown,
    pub paid: TaxLine,
    pub rounding_settlement: TaxLine,
    pub passes: u16,
    pub pass_limit: u16,
    pub converged: bool,
    pub settled_by: Option<&'static str>,
}
pub fn funded_year(
    ledger: &mut Ledger,
    h: &Household,
    assumptions: &[Assumption],
    year: u16,
    carry: i64,
    limit: u16,
) -> Result<YearLedger> {
    if !(1..=DEFAULT_PASS_LIMIT).contains(&limit) {
        return Err(Error::invalid(
            "INVALID_TAX_PASS_LIMIT",
            "Tax pass limit must be from 1 through 50.",
        ));
    }
    let base = h.valuation_date.year()?;
    let indexing = rate(assumptions, "tax_indexing")?;
    let mut guesses = Vec::new();
    let mut paid = 0;
    for passes in 1..=limit {
        // Detect a repeated requested payment at the start of a pass. The
        // settlement calculation is itself a counted pass, including its limit.
        let cycle = guesses.iter().position(|v| *v == paid);
        if let Some(start) = cycle {
            paid = *guesses[start..]
                .iter()
                .max()
                .ok_or_else(|| Error::invalid("TAX_INVARIANT", "Empty tax cycle."))?;
        }
        guesses.push(paid);
        let mut candidate = ledger.clone();
        let mut annual = candidate.year_with_outflow(h, assumptions, year, paid)?;
        let tax = compute(
            &from_ledger(&annual, carry)?,
            &h.persons[0].birth_date,
            base,
            year,
            indexing,
        )?;
        let computed = tax.cents("total_tax");
        let settled_by = if computed == paid {
            Some("exact")
        } else if cycle.is_some() {
            Some("rounding_cycle")
        } else {
            None
        };
        let settlement = if cycle.is_some() {
            sub(paid, computed)?
        } else {
            0
        };
        if settled_by.is_some() || passes == limit {
            if settled_by.is_none() {
                annual
                    .flags
                    .push("partial:tax_funding_did_not_converge".into());
            }
            if tax.niit_threshold_exceeded {
                annual
                    .flags
                    .push("partial:net_investment_income_tax_not_modeled".into());
            }
            if year == base && annual.period.start != crate::calendar::date(base, 1, 1)? {
                annual
                    .flags
                    .push("estimate:base_year_tax_covers_projected_period_only".into());
            }
            annual.federal_tax = Some(FundedTax {
                paid: TaxLine::new(paid, "in_year_tax_funding", base, year, tax.law_kind)?,
                rounding_settlement: TaxLine::new(
                    settlement,
                    "highest_tax_in_rounding_cycle_less_computed",
                    base,
                    year,
                    tax.law_kind,
                )?,
                breakdown: tax,
                passes,
                pass_limit: limit,
                converged: settled_by.is_some(),
                settled_by,
            });
            *ledger = candidate;
            return Ok(annual);
        }
        paid = computed;
    }
    Err(Error::invalid(
        "TAX_INVARIANT",
        "No tax funding pass was executed.",
    ))
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn tax_boundaries_and_floor() {
        let l = law(2026, "0.025").unwrap();
        assert_eq!(ordinary_tax(5_040_001, &l).unwrap(), 580_000);
        assert_eq!(law(2027, "0.025").unwrap().standard_deduction, 1_650_000);
        assert_eq!(law(2025, "0").unwrap_err().code, "TAX_YEAR_UNSUPPORTED");
        assert!(age_65(&Date("1962-01-01".into()), 2026).unwrap());
        assert!(!age_65(&Date("1962-01-02".into()), 2026).unwrap());
    }
    #[test]
    fn tax_social_security_caps_and_half_cent() {
        assert_eq!(
            taxable_social_security(2_400_000, 3_000_000).unwrap(),
            1_130_000
        );
        assert_eq!(
            taxable_social_security(2_400_000, 6_000_000).unwrap(),
            2_040_000
        );
        assert_eq!(taxable_social_security(1, 3_400_000).unwrap(), 1);
    }
}
