# Procurement approval workflow

A complete request-and-review web app with signed email actions, guarded workflow transitions, an audit log, additional-information handling and optional PDF purchase-record generation.

## Workflow

```text
PENDING ── approve ──────────────→ APPROVED
   │                                  │
   ├── reject ───────────────────→ REJECTED
   │
   └── request information → NEEDS_INFORMATION → requester responds → PENDING
```

Every state change is checked against the current stored state while holding a script lock. Email-action tokens contain the reference, action, expiry and record version, and are signed with HMAC-SHA256. A completed action increments the version and invalidates previously issued links.

## Sheets

Create a spreadsheet with these tabs and exact headers.

**Requests**

```text
Reference | Requester Email | Supplier | Description | Currency | Amount | Status | Information Request | Information Response | Created At | Updated At | Reviewer Email | Version
```

**Audit Log**

```text
Timestamp | Reference | Action | Actor | Metadata
```

## Script Properties

- `PROCUREMENT_SPREADSHEET_ID`
- `PROCUREMENT_REVIEWER_EMAILS` — comma-separated reviewers
- `PROCUREMENT_LINK_SECRET` — at least 32 random characters
- `PROCUREMENT_WEB_APP_URL` — deployed `/exec` URL
- `PROCUREMENT_DOCUMENT_TEMPLATE_ID` — optional Google Sheets template for generated PDFs

## Deploy

Deploy for signed-in domain users. Run `installProcurementTrigger()` to add a periodic notification job. The server checks reviewer identity even when a request arrived through a correctly signed URL.

The optional document template may contain `{{REFERENCE}}`, `{{SUPPLIER}}`, `{{DESCRIPTION}}`, `{{CURRENCY}}`, `{{AMOUNT}}`, `{{REQUESTER}}` and `{{APPROVED_AT}}`.
