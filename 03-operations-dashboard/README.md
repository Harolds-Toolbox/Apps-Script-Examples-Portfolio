# Operations dashboard

A responsive Apps Script web app that reconciles expected and actual daily values across multiple sites and presents live totals, variance and site-level detail.

## Data model

Create one spreadsheet with these tabs:

**Daily Reconciliation**

```text
Timestamp | Business Date | Site | Expected | Actual
```

**Operational Counts**

```text
Timestamp | Business Date | Site | Category | Quantity
```

For duplicate site/date submissions, the newest timestamp wins.

## Script Properties

- `DASHBOARD_SPREADSHEET_ID`
- `DASHBOARD_AUTHORIZED_EMAILS` — comma-separated signed-in accounts

Deploy as a web app restricted to your domain or named users. The server also checks the signed-in email and fails closed when identity is unavailable.

## Demonstrated patterns

- Multi-Sheet aggregation and header-driven mapping.
- Latest-record selection and daily reconciliation.
- Server-side access control.
- Responsive summary cards and detail table.
- Explicit loading, empty and failure states.
