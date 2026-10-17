// SPDX-License-Identifier: AGPL-3.0-only
//! Exact Gregorian date arithmetic, without a clock or external date library.
use crate::{
    error::{Error, Result},
    input::Date,
};
use serde::Serialize;

fn calendar_range() -> Error {
    Error::invalid(
        "INVALID_YEAR",
        "Calendar arithmetic exceeds supported years 0001–9999.",
    )
}
pub fn days_in_year(year: u16) -> u16 {
    if year.is_multiple_of(400) || (year.is_multiple_of(4) && !year.is_multiple_of(100)) {
        366
    } else {
        365
    }
}
fn month_days(year: u16, month: u16) -> Result<u16> {
    match month {
        1 | 3 | 5 | 7 | 8 | 10 | 12 => Ok(31),
        4 | 6 | 9 | 11 => Ok(30),
        2 => Ok(if days_in_year(year) == 366 { 29 } else { 28 }),
        _ => Err(calendar_range()),
    }
}
pub fn date(year: u16, month: u16, day: u16) -> Result<Date> {
    let value = Date(format!("{year:04}-{month:02}-{day:02}"));
    value.validate()?;
    Ok(value)
}
pub fn ordinal(value: &Date) -> Result<i64> {
    let (year, month, day) = value.parts()?;
    let prior = i64::from(year).checked_sub(1).ok_or_else(calendar_range)?;
    let mut days = prior
        .checked_mul(365)
        .and_then(|n| n.checked_add(prior.div_euclid(4)))
        .and_then(|n| n.checked_sub(prior.div_euclid(100)))
        .and_then(|n| n.checked_add(prior.div_euclid(400)))
        .ok_or_else(calendar_range)?;
    for m in 1..month {
        days = days
            .checked_add(i64::from(month_days(year, m)?))
            .ok_or_else(calendar_range)?;
    }
    days.checked_add(i64::from(day)).ok_or_else(calendar_range)
}
pub fn date_59_half(birth: &Date) -> Result<Date> {
    let (y, m, d) = birth.parts()?;
    let month = m.checked_add(6).ok_or_else(calendar_range)?;
    let year = y
        .checked_add(59)
        .and_then(|y| y.checked_add(if month > 12 { 1 } else { 0 }))
        .ok_or_else(calendar_range)?;
    let month = if month > 12 {
        month.checked_sub(12).ok_or_else(calendar_range)?
    } else {
        month
    };
    date(year, month, d.min(month_days(year, month)?))
}
pub fn benefit_start_date(birth: &Date, start_age: u16) -> Result<Date> {
    let (y, m, _) = birth.parts()?;
    let year = y
        .checked_add(start_age)
        .and_then(|y| y.checked_add(if m == 12 { 1 } else { 0 }))
        .ok_or_else(calendar_range)?;
    date(
        year,
        if m == 12 {
            1
        } else {
            m.checked_add(1).ok_or_else(calendar_range)?
        },
        1,
    )
}
#[derive(Debug, Clone, Serialize)]
pub struct Period {
    pub start: Date,
    pub end: Date,
    pub event_date: Date,
    pub days: u16,
    pub days_in_year: u16,
}
impl Period {
    pub fn new(valuation: &Date, year: u16) -> Result<Self> {
        let january = date(year, 1, 1)?;
        let start = if valuation.year()? == year {
            valuation.clone()
        } else {
            january.clone()
        };
        let end = date(year, 12, 31)?;
        let days = ordinal(&end)?
            .checked_sub(ordinal(&start)?)
            .and_then(|d| d.checked_add(1))
            .and_then(|d| u16::try_from(d).ok())
            .ok_or_else(calendar_range)?;
        let event_date = start.clone().max(date(year, 7, 1)?);
        Ok(Self {
            start,
            end,
            event_date,
            days,
            days_in_year: days_in_year(year),
        })
    }
    /// Intersect the period with [start, end); None means no bound.
    pub fn active_days(&self, start: Option<&Date>, end: Option<&Date>) -> Result<u16> {
        let left = ordinal(&self.start)?.max(start.map(ordinal).transpose()?.unwrap_or(i64::MIN));
        let right = ordinal(&self.end)?
            .checked_add(1)
            .ok_or_else(calendar_range)?
            .min(end.map(ordinal).transpose()?.unwrap_or(i64::MAX));
        u16::try_from(right.saturating_sub(left).max(0)).map_err(|_| calendar_range())
    }
}
