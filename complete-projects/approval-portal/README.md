# Approval portal — complete project

A complete, neutral Apps Script web app for submitting, reviewing, approving, and rejecting internal requests.

## Architecture

```text
Browser UI → Apps Script service layer → Google Sheet
                         ├──────────────→ email notification
                         └──────────────→ audit log
```

The UI deliberately contains no logo, organization name, external font, image, or SVG. Styling is local and generic.

## Set up

1. Create a Google Sheet with tabs named `Requests` and `Audit Log`.
2. Add these headers to `Requests`: `Reference`, `Title`, `Details`, `Amount`, `Requester Email`, `Status`, `Created At`, `Updated At`, `Reviewer Email`.
3. Add these headers to `Audit Log`: `Timestamp`, `Reference`, `Action`, `Actor`, `Metadata`.
4. Add Script Properties: `PORTAL_SPREADSHEET_ID` and `REVIEWER_EMAILS` (comma-separated).
5. Copy these files into a V8 Apps Script project and deploy it as a web app restricted to the intended users.

## Flow

- A user submits a request through the web UI.
- Server-side validation creates a `PENDING` record and audit event.
- A reviewer sees pending work and records an approval or rejection.
- The workflow verifies the current state before changing it.
- The requester receives a plain, generic outcome notification.

## Production considerations

Restrict the deployment, validate the signed-in identity against your directory, tailor retention, and replace the simple reviewer list with a managed group if appropriate.
