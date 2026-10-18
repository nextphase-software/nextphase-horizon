// SPDX-License-Identifier: AGPL-3.0-only
//! One reference proof shared by native and WebAssembly hosts.
use horizon_app::{
    answers::{RoughInput, SustainableSpending},
    compare, input_impact, levers, run_fixture, sustainable_spending,
};
use horizon_engine::canonical::canonical_json;
use serde_json::{Value, json};
fn refs() -> Value {
    serde_json::from_str(include_str!(
        "../../../../docs/briefs/0003-W1-reference-values.json"
    ))
    .unwrap()
}
fn fixture(name: &str) -> horizon_app::Fixture {
    let text = super::fixtures::FIXTURES
        .iter()
        .find(|x| x.0 == name)
        .unwrap()
        .1;
    horizon_app::parse_fixture(text).unwrap()
}
fn normalized_spending(s: &SustainableSpending) -> Value {
    json!({"sustainable_spending":s.sustainable_spending,"flag":s.flag,"runs":s.runs,"entered":s.entered,"status":s.status})
}
pub fn spending() {
    let r = refs();
    for (name, expected) in r["sustainable_spending"].as_object().unwrap() {
        let f = fixture(name);
        let a = sustainable_spending(&f).unwrap();
        assert_eq!(normalized_spending(&a), *expected, "{name}");
        assert_eq!(a.headroom, a.sustainable_spending - a.entered);
        let gold = super::answer_golden::SPENDING
            .iter()
            .find(|g| g.0 == name)
            .unwrap()
            .1;
        assert_eq!(format!("{}\n", canonical_json(&a).unwrap()), gold, "{name}");
    }
}
pub fn lever_values() {
    let r = refs();
    for (name, e) in r["levers"].as_object().unwrap() {
        let a = levers(&fixture(name)).unwrap();
        let rows:Vec<_>=a.levers.iter().map(|l|json!({"id":l.id,"kind":l.kind,"changes":l.changes,"sustainable_spending":l.sustainable_spending,"flag":l.flag,"headroom":l.headroom,"effect":l.effect,"first_shortfall_age":l.first_shortfall_age,"ending_total_today":l.ending_total_today.cents,"status":l.status})).collect();
        let actual = json!({"baseline":{"entered":a.baseline.entered,"headroom":a.baseline.headroom,"sustainable_spending":a.baseline.sustainable_spending},"levers":rows,"ranking":a.ranking,"what_moves_most":a.what_moves_most});
        assert_eq!(actual, *e, "{name}");
        let gold = super::answer_golden::LEVERS
            .iter()
            .find(|g| g.0 == name)
            .unwrap()
            .1;
        assert_eq!(format!("{}\n", canonical_json(&a).unwrap()), gold, "{name}");
    }
}
pub fn impact() {
    let rough: Vec<RoughInput> = serde_json::from_str(include_str!(
        "../../../app/test-data/answers-working-61-rough.json"
    ))
    .unwrap();
    let a = input_impact(&fixture("answers-working-61"), &rough).unwrap();
    let rows:Vec<_>=a.items.iter().map(|i|json!({"path":i.path,"low":i.low,"high":i.high,"headroom_low":i.headroom_low,"headroom_high":i.headroom_high,"impact":i.impact})).collect();
    assert_eq!(
        json!({"baseline_headroom":a.baseline_headroom,"items":rows}),
        refs()["input_impact"]["answers-working-61"]
    );
    assert_eq!(
        format!("{}\n", canonical_json(&a).unwrap()),
        super::answer_golden::IMPACT
    );
}
pub fn today_values() {
    for (name, e) in refs()["today_values"].as_object().unwrap() {
        let run = run_fixture(&fixture(name)).unwrap();
        let rows:Vec<_>=run.years.iter().map(|y|{
            let l=&y.ledger;let accounts:serde_json::Map<_,_>=l.accounts.iter().map(|a|(a.identifier.clone(),json!(a.closing_today.as_ref().unwrap().cents()))).collect();
            for a in &l.accounts{assert_eq!(json!(a.closing_today.as_ref().unwrap().value.dollar_basis),"today");}
            json!({"year":y.year,"total_closing_nominal":l.total_closing.as_ref().unwrap().cents(),"total_closing_today":l.total_closing_today.as_ref().unwrap().cents(),"shortfall_nominal":l.shortfall.cents(),"shortfall_today":l.shortfall_today.as_ref().unwrap().cents(),"accounts_closing_today":accounts})
        }).collect();
        assert_eq!(json!({"status":run.status,"years":rows}), *e, "{name}");
    }
}
pub fn comparison_today() {
    let c = compare(
        &fixture("answers-working-61"),
        &fixture("answers-working-61-retire-later"),
    )
    .unwrap();
    let mut result = serde_json::Map::new();
    for (name, s) in [
        ("baseline", c.summary.baseline),
        ("scenario", c.summary.scenario),
    ] {
        let balances: serde_json::Map<_, _> = s
            .ending_balances
            .iter()
            .map(|a| {
                (
                    a.identifier.clone(),
                    json!({"balance":a.balance.cents,"balance_today":a.balance_today.cents}),
                )
            })
            .collect();
        result.insert(name.into(),json!({"last_year":s.last_year,"ending_total":s.ending_total.cents,"ending_total_today":s.ending_total_today.cents,"ending_balances":balances}));
    }
    assert_eq!(
        Value::Object(result),
        refs()["comparison_today"]["answers-working-61 vs answers-working-61-retire-later"]
    );
}
