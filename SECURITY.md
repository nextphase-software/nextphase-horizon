# Security policy

- Date: 2026-10-13
- Status: pre-implementation; no deployed service or supported release

Do not publish vulnerabilities with secrets, real client documents, personal financial data, or exploitable production details in public issues. Use synthetic reproductions. Never commit credentials or local environment files.

A private reporting channel, maintainer response expectations, and supported-version policy must be established before public release. No email address or reporting URL has been configured; this scaffold does not claim a working disclosure channel.

Before hosted operation, document tenant/household isolation, server authorization, storage/document access, import limits, audit/redaction, backup/restore, and dependency handling. Validate those boundaries as part of each relevant milestone rather than postponing them to a final security sweep. Production deployment and real customer data handling are not authorized by repository initialization.
