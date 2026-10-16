// SPDX-License-Identifier: AGPL-3.0-only
use serde::Serialize;

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
#[serde(rename_all = "snake_case")]
pub enum Status {
    Invalid,
    Unsupported,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Error {
    pub status: Status,
    pub code: String,
    pub message: String,
}

impl Error {
    pub fn invalid(code: &str, message: impl Into<String>) -> Self {
        Self {
            status: Status::Invalid,
            code: code.into(),
            message: message.into(),
        }
    }
    pub fn unsupported(code: &str, message: impl Into<String>) -> Self {
        Self {
            status: Status::Unsupported,
            code: code.into(),
            message: message.into(),
        }
    }
}

impl std::fmt::Display for Error {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}: {}", self.code, self.message)
    }
}
impl std::error::Error for Error {}
pub type Result<T> = std::result::Result<T, Error>;
