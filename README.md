# Apps Script Business Automation Examples

A public-safe portfolio of small Google Apps Script patterns for common business automation work. Every example uses fictional data, reserved domains, and placeholder identifiers. No client or employer code is included.

## Examples

| Example | Business pattern | Key ideas |
| --- | --- | --- |
| [API integration](01-api-integration/) | Pull records from a REST API | Bearer auth, pagination, retries, rate limits |
| [Webhook handler](02-webhook-handler/) | Receive events reliably | Signature validation, fast acknowledgement, durable queue |
| [Email automation](03-email-automation/) | Send templated notifications | Idempotency, HTML escaping, status tracking |
| [Data pipeline](04-data-pipeline/) | Load API data into Sheets | Extract, transform, validate, atomic replace |
| [System integration](05-system-integration/) | Push Sheet rows to another system | Incremental sync, row-level outcomes, locking |
| [Approval workflow](06-approval-workflow/) | Approve or reject requests | Signed links, state transitions, audit trail |
| [Scheduled sync](07-scheduled-sync/) | Reconcile two systems on a schedule | Trigger setup, checkpoints, overlap protection |
| [Error handling and logging](08-error-handling-and-logging/) | Make automations observable | Structured logs, correlation IDs, alert throttling |

## Complete project

[Approval portal](complete-projects/approval-portal/) is a larger, deployment-ready example showing how the patterns fit together: a neutral web UI, request repository, guarded workflow transitions, notifications, and an audit trail. It is the kind of project that can be adapted as a whole rather than read as an isolated snippet.

## How to use

Each folder is intentionally independent. Copy its `Code.js` into a V8 Apps Script project, add the listed Script Properties, grant the required scopes, and run the example's setup function if it has one.

These are reference implementations, not drop-in production services. Before deploying, adjust schemas, access controls, retention, quotas, and alert recipients for the real environment.

## Design principles

- Secrets live in Script Properties, never source code.
- External calls use bounded retries and actionable errors.
- Webhook endpoints acknowledge quickly and defer work.
- Repeated runs are safe through idempotency keys and checkpoints.
- Logs contain operational context, not sensitive payloads.
- Sheet writes are batched to reduce quota usage.

## Repository safety

All names and sample records are fictional. URLs use IANA-reserved domains. There are no logos, SVG files, production IDs, email addresses, API keys, or copied business data in this repository.

## Licence

MIT. See [LICENSE](LICENSE).
