// SPDX-License-Identifier: AGPL-3.0-only
//! Exact USD cents. Fractions are rounded only when a line is finalized.
use crate::error::{Error, Result};
use num_bigint::BigInt;
use num_traits::{Signed, ToPrimitive, Zero};
use std::ops::{Add, Div, Mul, Neg, Rem};

pub const JSON_CENT_LIMIT: i64 = 9_007_199_254_740_991;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Money(i64);

impl Money {
    pub fn from_cents(cents: i64) -> Self {
        Self(cents)
    }
    pub fn cents(self) -> i64 {
        self.0
    }
    pub fn checked_add(self, rhs: Self) -> Result<Self> {
        self.0.checked_add(rhs.0).map(Self).ok_or_else(overflow)
    }
    pub fn checked_sub(self, rhs: Self) -> Result<Self> {
        self.0.checked_sub(rhs.0).map(Self).ok_or_else(overflow)
    }
    pub fn output_cents(self) -> Result<i64> {
        if !(-JSON_CENT_LIMIT..=JSON_CENT_LIMIT).contains(&self.0) {
            return Err(Error::invalid(
                "MONEY_OUTPUT_RANGE",
                "Monetary output exceeds the exact JSON cent range.",
            ));
        }
        Ok(self.0)
    }
}
fn overflow() -> Error {
    Error::invalid("MONEY_OVERFLOW", "Money arithmetic exceeds i64 cents.")
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Fraction {
    numerator: BigInt,
    denominator: BigInt,
}

impl Fraction {
    pub fn new(numerator: BigInt, denominator: BigInt) -> Result<Self> {
        if denominator <= BigInt::zero() {
            return Err(Error::invalid(
                "INVALID_RATE",
                "An exact fraction requires a positive denominator.",
            ));
        }
        Ok(Self {
            numerator,
            denominator,
        })
    }
    pub fn integer(value: i64) -> Self {
        Self {
            numerator: value.into(),
            denominator: 1.into(),
        }
    }
    pub fn decimal(value: &str) -> Result<Self> {
        let invalid = || {
            Error::invalid(
                "INVALID_RATE",
                "A rate must be a plain decimal string with at most 18 fractional digits.",
            )
        };
        let unsigned = value.strip_prefix('-').unwrap_or(value);
        let mut parts = unsigned.split('.');
        let whole = parts.next().ok_or_else(invalid)?;
        let fractional = parts.next();
        if parts.next().is_some()
            || whole.is_empty()
            || !whole.bytes().all(|b| b.is_ascii_digit())
            || fractional.is_some_and(|s| {
                s.is_empty() || s.len() > 18 || !s.bytes().all(|b| b.is_ascii_digit())
            })
        {
            return Err(invalid());
        }
        let fractional = fractional.unwrap_or("");
        let digits = format!("{whole}{fractional}");
        let mut numerator = BigInt::parse_bytes(digits.as_bytes(), 10).ok_or_else(invalid)?;
        if value.starts_with('-') {
            numerator = numerator.neg();
        }
        let power = u32::try_from(fractional.len()).map_err(|_| invalid())?;
        Self::new(numerator, BigInt::from(10).pow(power))
    }
    pub fn compare(&self, other: &Self) -> std::cmp::Ordering {
        self.numerator
            .clone()
            .mul(&other.denominator)
            .cmp(&other.numerator.clone().mul(&self.denominator))
    }
    pub fn minimum(self, other: Self) -> Self {
        if self.compare(&other).is_gt() {
            other
        } else {
            self
        }
    }
    pub fn maximum(self, other: Self) -> Self {
        if self.compare(&other).is_lt() {
            other
        } else {
            self
        }
    }
    /// Floor a nonnegative exact amount without rounding an intermediate cent.
    pub fn floor_multiple(&self, multiple: i64) -> Result<Money> {
        if self.is_negative() || multiple <= 0 {
            return Err(Error::invalid(
                "INVALID_RATE",
                "Floor requires nonnegative amounts and a positive multiple.",
            ));
        }
        let value = self
            .numerator
            .clone()
            .div(self.denominator.clone().mul(multiple))
            .mul(multiple);
        value.to_i64().map(Money).ok_or_else(overflow)
    }
    /// Exact terminating decimal, without converting through floating point.
    pub fn decimal_string(&self) -> Result<String> {
        let size = self.numerator.abs();
        let mut remainder = size.clone().rem(&self.denominator);
        let mut text = size.div(&self.denominator).to_string();
        if !remainder.is_zero() {
            text.push('.');
            for _ in 0..18 {
                remainder = remainder.mul(10);
                text.push_str(&remainder.clone().div(&self.denominator).to_string());
                remainder = remainder.rem(&self.denominator);
                if remainder.is_zero() {
                    break;
                }
            }
            if !remainder.is_zero() {
                return Err(Error::invalid(
                    "INVALID_RATE",
                    "Rate does not terminate within 18 decimal places.",
                ));
            }
        }
        if self.is_negative() {
            text.insert(0, '-');
        }
        Ok(text)
    }
    pub fn is_negative(&self) -> bool {
        self.numerator.is_negative()
    }
    pub fn plus(&self, other: &Self) -> Self {
        Self {
            numerator: self
                .numerator
                .clone()
                .mul(&other.denominator)
                .add(other.numerator.clone().mul(&self.denominator)),
            denominator: self.denominator.clone().mul(&other.denominator),
        }
    }
    pub fn times(&self, other: &Self) -> Self {
        Self {
            numerator: self.numerator.clone().mul(&other.numerator),
            denominator: self.denominator.clone().mul(&other.denominator),
        }
    }
    pub fn divided_by(&self, other: &Self) -> Result<Self> {
        Self::new(
            self.numerator.clone().mul(&other.denominator),
            self.denominator.clone().mul(&other.numerator),
        )
    }
    pub fn pow(&self, exponent: u32) -> Self {
        Self {
            numerator: self.numerator.pow(exponent),
            denominator: self.denominator.pow(exponent),
        }
    }
    pub fn finalize(&self) -> Result<Money> {
        let size = self.numerator.abs();
        let quotient = size.clone().div(&self.denominator);
        let remainder = size.rem(&self.denominator);
        let rounded = if remainder.mul(2) >= self.denominator {
            quotient.add(1)
        } else {
            quotient
        };
        let signed = if self.numerator.is_negative() {
            rounded.neg()
        } else {
            rounded
        };
        signed.to_i64().map(Money).ok_or_else(overflow)
    }
}

pub fn index_factor(rate: &str, base_year: u16, year: u16) -> Result<Fraction> {
    let factor = Fraction::integer(1).plus(&Fraction::decimal(rate)?);
    if factor.numerator <= BigInt::zero() {
        return Err(Error::invalid(
            "INVALID_RATE",
            "Inflation must be greater than -1.",
        ));
    }
    let exponent = year
        .checked_sub(base_year)
        .ok_or_else(|| Error::invalid("INVALID_YEAR", "Projection year precedes the base year."))?;
    Ok(factor.pow(u32::from(exponent)))
}
pub fn nominal(amount: Money, rate: &str, base_year: u16, year: u16) -> Result<Money> {
    Fraction::integer(amount.cents())
        .times(&index_factor(rate, base_year, year)?)
        .finalize()
}
pub fn today(amount: Money, rate: &str, base_year: u16, year: u16) -> Result<Money> {
    Fraction::integer(amount.cents())
        .divided_by(&index_factor(rate, base_year, year)?)?
        .finalize()
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn rounding_and_summed_lines() {
        for (input, expected) in [
            ("1000.4", 1000),
            ("1000.5", 1001),
            ("1000.6", 1001),
            ("-1000.4", -1000),
            ("-1000.5", -1001),
            ("-1000.6", -1001),
            ("0.5", 1),
            ("-0.5", -1),
            ("1000.49999", 1000),
        ] {
            assert_eq!(
                Fraction::decimal(input)
                    .unwrap()
                    .finalize()
                    .unwrap()
                    .cents(),
                expected
            );
        }
        for (values, expected) in [
            (vec!["0.4", "0.4", "0.4"], 1),
            (vec!["0.3", "0.3"], 1),
            (vec!["-0.3", "-0.3"], -1),
        ] {
            let sum = values.iter().fold(Fraction::integer(0), |s, v| {
                s.plus(&Fraction::decimal(v).unwrap())
            });
            assert_eq!(sum.finalize().unwrap().cents(), expected);
        }
    }
    #[test]
    fn checked_bounds() {
        assert_eq!(
            Money(i64::MAX).checked_add(Money(1)).unwrap_err().code,
            "MONEY_OVERFLOW"
        );
        assert_eq!(
            Money(i64::MIN).checked_sub(Money(1)).unwrap_err().code,
            "MONEY_OVERFLOW"
        );
        assert_eq!(
            Money(9_007_199_254_740_992)
                .output_cents()
                .unwrap_err()
                .code,
            "MONEY_OUTPUT_RANGE"
        );
        assert_eq!(
            Money(JSON_CENT_LIMIT).output_cents().unwrap(),
            JSON_CENT_LIMIT
        );
        assert_eq!(
            Money(-9_007_199_254_740_992)
                .output_cents()
                .unwrap_err()
                .code,
            "MONEY_OUTPUT_RANGE"
        );
        assert_eq!(
            Fraction::integer(i64::MAX)
                .plus(&Fraction::integer(1))
                .finalize()
                .unwrap_err()
                .code,
            "MONEY_OVERFLOW"
        );
    }
}
