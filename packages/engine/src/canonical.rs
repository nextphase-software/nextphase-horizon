// SPDX-License-Identifier: AGPL-3.0-only
//! RFC 8785 restricted to ASCII object names and JSON-safe integers.
use crate::{
    error::{Error, Result},
    money::JSON_CENT_LIMIT,
};
use serde::Serialize;
use serde_json::Value;
use sha2::{Digest, Sha256};

pub fn canonical_json<T: Serialize>(value: &T) -> Result<String> {
    let value = serde_json::to_value(value).map_err(|_| invalid())?;
    let mut result = String::new();
    write_value(&value, &mut result)?;
    Ok(result)
}
fn invalid() -> Error {
    Error::invalid(
        "CANONICAL_JSON",
        "Canonical JSON requires ASCII member names and exact JSON-safe integers.",
    )
}
fn write_value(value: &Value, out: &mut String) -> Result<()> {
    match value {
        Value::Object(members) => {
            out.push('{');
            let mut entries: Vec<_> = members.iter().collect();
            entries.sort_by(|a, b| a.0.cmp(b.0));
            let mut first = true;
            for (name, value) in entries {
                if !name.is_ascii() {
                    return Err(invalid());
                }
                if !first {
                    out.push(',');
                }
                first = false;
                out.push_str(&serde_json::to_string(name).map_err(|_| invalid())?);
                out.push(':');
                write_value(value, out)?;
            }
            out.push('}');
        }
        Value::Array(items) => {
            out.push('[');
            let mut first = true;
            for item in items {
                if !first {
                    out.push(',');
                }
                first = false;
                write_value(item, out)?;
            }
            out.push(']');
        }
        Value::Number(number) => {
            let value = number
                .as_i64()
                .filter(|v| (-JSON_CENT_LIMIT..=JSON_CENT_LIMIT).contains(v))
                .ok_or_else(invalid)?;
            out.push_str(&value.to_string());
        }
        _ => out.push_str(&serde_json::to_string(value).map_err(|_| invalid())?),
    }
    Ok(())
}
pub fn hash<T: Serialize>(value: &T) -> Result<String> {
    Ok(Sha256::digest(canonical_json(value)?.as_bytes())
        .iter()
        .map(|byte| format!("{byte:02x}"))
        .collect())
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn rfc8785_string_example() {
        let value: Value =
            serde_json::from_str(r#"{"string":"\u20ac$\u000F\u000aA'\u0042\u0022\u005c\\\"\/"}"#)
                .unwrap();
        assert_eq!(
            canonical_json(&value).unwrap(),
            r#"{"string":"€$\u000f\nA'B\"\\\\\"/"}"#
        );
    }
    #[test]
    fn recursive_sorting_and_integer_restrictions() {
        assert_eq!(
            canonical_json(&serde_json::json!({"z": [{"b":1,"a":true}],"a":null})).unwrap(),
            r#"{"a":null,"z":[{"a":true,"b":1}]}"#
        );
        assert!(canonical_json(&serde_json::json!({"é":1})).is_err());
        assert!(canonical_json(&serde_json::json!(9_007_199_254_740_992_i64)).is_err());
        let fractional: Value = serde_json::from_str("0.5").unwrap();
        assert!(canonical_json(&fractional).is_err());
        assert_eq!(
            hash(&serde_json::json!({})).unwrap(),
            "44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a"
        );
    }
}
