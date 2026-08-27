# Apps Script Examples Portfolio

Fourteen complete, public-safe Google Apps Script projects based on business automation patterns used in real operational systems. The implementations have been generalized, secured, and documented for demonstration purposes. They contain no employer code, production identifiers, personal data, logos, watermarks, or private endpoints.

## Projects

| Project | What it demonstrates |
| --- | --- |
| [Document generator](01-document-generator/) | Web form, Google Docs templating, PDF generation, Drive cleanup |
| [Public registry monitor](02-public-registry-monitor/) | Authenticated API pagination, filtering, CSV snapshots, comparisons, retention |
| [Operations dashboard](03-operations-dashboard/) | Responsive web app, multi-Sheet aggregation, reconciliation, access control |
| [Procurement approval workflow](04-procurement-approval-workflow/) | Signed actions, guarded state transitions, audit history, document generation |
| [Reliable webhook inbox](05-reliable-webhook-inbox/) | Fast intake, HMAC validation, durable queue, retries, deduplication, reconciliation |
| [Schema-aware file pipeline](06-schema-aware-file-pipeline/) | CSV/XLSX ingestion, schema checks, runtime budgets, staged destinations |
| [API data catalogue](07-api-data-catalogue/) | Token-based API access, endpoint sampling, recursive schema discovery, catalogue UI |
| [Appointment confirmation workflow](08-appointment-confirmation-workflow/) | Scheduled reminders, expiring one-time response links, escalation, audit history |
| [Record history and entity resolution](09-record-history-entity-resolution/) | Versioned snapshots, append-only change history, review-first duplicate matching |
| [Dynamic project intake tracker](10-dynamic-project-intake-tracker/) | Stable block IDs, configuration-driven validation, dynamic rows, JSON archiving |
| [Self-healing webhook manager](11-self-healing-webhook-manager/) | Signed intake, subscription health checks, reactivation, rotation, deduplication |
| [Cross-system completion reconciliation](12-cross-system-completion-reconciliation/) | Paginated API comparison, layered matching, grace periods, consolidated exceptions |
| [Configuration management dialog](13-configuration-management-dialog/) | Safe HTML bootstrapping, multi-record editing, drag ordering, atomic Sheet updates |
| [Consent-aware notification lifecycle](14-consent-aware-notification-lifecycle/) | Preference matching, reviewer approval, opaque unsubscribe links, retention review |

## Repository principles

- Every secret and deployment-specific identifier belongs in Script Properties.
- Examples fail closed when security configuration is absent.
- External requests have bounded retries and concise error messages.
- State-changing operations are idempotent and lock-protected.
- Logs contain identifiers and outcomes, not entire sensitive payloads.
- Web interfaces use local CSS and contain no external images, fonts, logos, or SVG watermarks.

## Using an example

Each numbered folder is an independent Apps Script project:

1. Create a new standalone Apps Script project.
2. Copy the folder contents or use `clasp` while keeping `.clasp.json` untracked.
3. Add the Script Properties listed in that project's README.
4. Create the described Sheet tabs or template document.
5. Run the setup function where one is provided.
6. Test with fictional data before connecting a real system.

Apps Script permissions and web-app access settings are deployment concerns. Review every requested scope and choose the narrowest access level suitable for the environment.

## Safety statement

All names, records and workflow examples are fictional. Any public-service API names used are necessary to document that public interface and do not identify a private organization. The repository intentionally excludes `.clasp.json`, real document IDs, email addresses, API keys and source-system payloads.
