// SPDX-License-Identifier: AGPL-3.0-only
//! IRS Publication 590-B (2025), Appendix B, Table III (Uniform Lifetime).
//! Source: https://www.irs.gov/publications/p590b
//! Retrieved 2026-10-16. Decimal strings are exact; last row is age 120 and over.
use crate::{
    error::{Error, Result},
    input::{Date, age_at_year_end},
    money::{Fraction, Money},
};

pub const TABLE_NAME: &str = "IRS Publication 590-B, Appendix B, Table III (Uniform Lifetime)";
pub const TABLE_YEAR: u16 = 2025;
pub const TABLE_SOURCE: &str = "https://www.irs.gov/publications/p590b";
pub const DIVISORS: [&str; 49] = [
    "27.4", "26.5", "25.5", "24.6", "23.7", "22.9", "22.0", "21.1", "20.2", "19.4", "18.5", "17.7",
    "16.8", "16.0", "15.2", "14.4", "13.7", "12.9", "12.2", "11.5", "10.8", "10.1", "9.5", "8.9",
    "8.4", "7.8", "7.3", "6.8", "6.4", "6.0", "5.6", "5.2", "4.9", "4.6", "4.3", "4.1", "3.9",
    "3.7", "3.5", "3.4", "3.3", "3.1", "3.0", "2.9", "2.8", "2.7", "2.5", "2.3", "2.0",
];
/// None denotes the older cohort, due in every projection year under this model.
pub fn applicable_age(birth: &Date) -> Result<Option<u16>> {
    Ok(match birth.year()? {
        0..=1950 => None,
        1951..=1959 => Some(73),
        _ => Some(75),
    })
}
pub fn first_rmd_year(birth: &Date) -> Result<Option<u16>> {
    applicable_age(birth)?
        .map(|age| {
            birth.year()?.checked_add(age).ok_or_else(|| {
                Error::invalid(
                    "INVALID_YEAR",
                    "Required-distribution year exceeds the calendar range.",
                )
            })
        })
        .transpose()
}
pub fn due(birth: &Date, year: u16) -> Result<bool> {
    Ok(match applicable_age(birth)? {
        None => true,
        Some(age) => age_at_year_end(birth, year)? >= age,
    })
}
pub fn divisor(age: u16) -> Result<&'static str> {
    let index = age.min(120).checked_sub(72).ok_or_else(|| {
        Error::unsupported(
            "RMD_TABLE_AGE_UNSUPPORTED",
            "The committed Uniform Lifetime Table begins at age 72.",
        )
    })?;
    Ok(DIVISORS[usize::from(index)])
}
pub fn amount(balance: i64, age: u16) -> Result<i64> {
    Fraction::integer(balance)
        .divided_by(&Fraction::decimal(divisor(age)?)?)?
        .finalize()
        .map(Money::cents)
}
