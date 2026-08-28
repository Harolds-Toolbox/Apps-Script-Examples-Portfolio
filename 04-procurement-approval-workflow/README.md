# Procurement approval workflow

This web app handles a request from submission through review, requests for more information, approval or rejection. Each transition is checked against the current record under a script lock and written to an audit log.

## Flow

```text
requester submits → PENDING ─┬→ reviewer approves → APPROVED → optional PDF
                             ├→ reviewer rejects  → REJECTED
                             └→ asks for detail   → NEEDS_INFORMATION → requester replies → PENDING
                                      │
                                      └→ signed, expiring, versioned action links + audit rows
```

`Main.js` contains wrappers for submission, review actions and approved PDF generation. Action signatures include the reference, action, expiry and current record version, so a completed action invalidates older links.

## One-time setup

1. Set `SETUP_FOLDER_ID` in `Setup.js`.
2. Push the project and run `setupProject()`.
3. Approve Drive, Sheets and file-creation access. Setup creates the workflow spreadsheet and a formatted Google Sheet PDF template.
4. Add the remaining Script Properties below. Generate a random link secret of at least 32 characters.
5. Deploy as a domain-only web app for signed-in Workspace accounts, then add the deployment `/exec` URL as `PROCUREMENT_WEB_APP_URL`.
6. Run `installProjectTriggers()` only after reviewer emails are configured.

## Script Properties

| Property | Set by setup | Notes |
| --- | --- | --- |
| `PROCUREMENT_SPREADSHEET_ID` | Yes | `Requests` and `Audit Log` storage. |
| `PROCUREMENT_DOCUMENT_TEMPLATE_ID` | Yes | Sheet template used for approved PDFs. |
| `PROCUREMENT_REVIEWER_EMAILS` | No | Comma-separated reviewers. |
| `PROCUREMENT_LINK_SECRET` | No | HMAC secret, minimum 32 random characters. |
| `PROCUREMENT_WEB_APP_URL` | No | Deployed `/exec` URL. |

The first complete run asks for Sheets, Drive, email, user identity and trigger permissions.

## Testing the workflow

1. Use accounts you control as requester and reviewer.
2. Submit a low-value fictional request from the web app and confirm a `PENDING` row and audit entry are created.
3. Request more information, reply as the requester and confirm the row returns to `PENDING` with a higher version.
4. Try an older signed link and confirm it is rejected.
5. Approve the request and run `runApprovedProcurementPdf(reference)` as a reviewer.
6. Confirm the PDF is populated and its temporary Sheet copy is moved to Trash.

The generated template tokens are `{{REFERENCE}}`, `{{SUPPLIER}}`, `{{DESCRIPTION}}`, `{{CURRENCY}}`, `{{AMOUNT}}`, `{{REQUESTER}}` and `{{APPROVED_AT}}`.
