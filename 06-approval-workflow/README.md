# Approval workflow

**Problem:** Let an authorized reviewer approve or reject a request from email while preventing link tampering and repeated actions.

**Architecture:** Request Sheet → signed action URL → Apps Script web app → guarded state transition → audit columns.

**Configure:** Add `APPROVAL_SPREADSHEET_ID`, `APPROVAL_LINK_SECRET`, and `APPROVAL_WEB_APP_URL` to Script Properties. Create `Requests` with columns: `Reference`, `Summary`, `Status`, `Requested By`, `Decision At`, `Decision By`.

Deploy as a web app. Use `buildApprovalLinks_(reference)` when composing a reviewer email.
