# Security policy

- Date: 2026-10-13
- Status: pre-implementation; no deployed service or supported release

## Reporting a vulnerability

Report security problems privately through GitHub: open this repository's **Security** tab and choose **Report a vulnerability**. The report goes only to the maintainers. Please do not open a public issue for a vulnerability.

Do not include secrets, real client documents, personal financial data, or exploitable production details in any report or issue. Use synthetic reproductions. Never commit credentials or local environment files.

There is no released version and no hosted service yet, so there is no supported-version list. Response expectations will be stated here before the first release.

## Before hosted operation

Tenant and household isolation, server authorization, storage and document access, import limits, audit and redaction, backup and restore, and dependency handling are documented before any hosted operation, and validated as part of each relevant change, not left to a final security sweep. Nothing in this repository authorizes production deployment or the handling of real customer data.
