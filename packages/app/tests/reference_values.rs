// SPDX-License-Identifier: AGPL-3.0-only
mod common;
use horizon_engine::{
    input::{Date, age_at_year_end, projection_years},
    money::{Fraction, JSON_CENT_LIMIT, Money, nominal, today},
};

#[test]
fn rounding_reference_values() {
    for (input, result) in [
        ("1000.4", 1000),
        ("-1000.4", -1000),
        ("1000.5", 1001),
        ("-1000.5", -1001),
        ("1000.6", 1001),
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
            result,
            "{input}"
        );
    }
}
#[test]
fn summed_line_reference_values() {
    for (amounts, result) in [
        (vec!["0.4", "0.4", "0.4"], 1),
        (vec!["0.3", "0.3"], 1),
        (vec!["-0.3", "-0.3"], -1),
    ] {
        let total = amounts.iter().fold(Fraction::integer(0), |a, b| {
            a.plus(&Fraction::decimal(b).unwrap())
        });
        assert_eq!(total.finalize().unwrap().cents(), result);
    }
}
#[test]
fn overflow_and_output_range_reference_values() {
    assert_eq!(
        Money::from_cents(i64::MAX)
            .checked_add(Money::from_cents(1))
            .unwrap_err()
            .code,
        "MONEY_OVERFLOW"
    );
    assert_eq!(
        Money::from_cents(i64::MIN)
            .checked_sub(Money::from_cents(1))
            .unwrap_err()
            .code,
        "MONEY_OVERFLOW"
    );
    assert_eq!(
        Money::from_cents(9_007_199_254_740_992)
            .output_cents()
            .unwrap_err()
            .code,
        "MONEY_OUTPUT_RANGE"
    );
    assert_eq!(
        Money::from_cents(JSON_CENT_LIMIT).output_cents().unwrap(),
        9_007_199_254_740_991
    );
}
#[test]
fn age_labels_reference_values() {
    for (birth, year, age) in [
        ("1966-01-01", 2026, 60),
        ("1966-12-31", 2026, 60),
        ("1964-02-29", 2026, 62),
        ("1964-02-29", 2028, 64),
        ("1966-07-15", 2061, 95),
    ] {
        assert_eq!(age_at_year_end(&Date(birth.into()), year).unwrap(), age);
    }
}
#[test]
fn projection_year_reference_values() {
    let mut f = common::fixture("synthetic-working");
    for (age, last, count) in [(95, 2061, 36), (61, 2027, 2)] {
        f.household.persons[0].plan_end_age = age;
        let years: Vec<_> = projection_years(&f.household).unwrap().collect();
        assert_eq!(years.first(), Some(&2026));
        assert_eq!(years.last(), Some(&last));
        assert_eq!(years.len(), count);
    }
    f.household.persons[0].plan_end_age = 60;
    assert_eq!(
        projection_years(&f.household).unwrap_err().code,
        "PLAN_END_AGE_REACHED"
    );
}
#[test]
fn nominal_index_reference_values() {
    for (amount, rate, year, result) in [
        (6000000, "0.025", 2026, 6000000),
        (6000000, "0.025", 2027, 6150000),
        (6000000, "0.025", 2028, 6303750),
        (6000000, "0.025", 2056, 12585405),
        (100, "0.025", 2027, 103),
        (100, "0.025", 2028, 105),
        (6000000, "0", 2056, 6000000),
        (6000000, "0.0275", 2061, 15506555),
        (4250000, "0.03", 2040, 6428506),
    ] {
        assert_eq!(
            nominal(Money::from_cents(amount), rate, 2026, year)
                .unwrap()
                .cents(),
            result,
            "{amount} {rate} {year}"
        );
    }
}
#[test]
fn today_conversion_reference_values() {
    for (amount, rate, year, result, back) in [
        (12585405, "0.025", 2056, 6000000, 12585405),
        (103, "0.025", 2027, 100, 103),
        (10000000, "0.025", 2046, 6102709, 9999999),
    ] {
        let converted = today(Money::from_cents(amount), rate, 2026, year).unwrap();
        assert_eq!(converted.cents(), result);
        assert_eq!(nominal(converted, rate, 2026, year).unwrap().cents(), back);
        assert!(amount.abs_diff(back) <= 1);
    }
}
