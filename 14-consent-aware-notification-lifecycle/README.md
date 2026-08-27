# Consent-aware notification lifecycle

## Problem

Preference-based notifications need more than a matching query: teams also need explicit consent state, reviewer control, secure unsubscribe links, retention reviews, and an audit trail.

## Architecture

`Subscribers + opportunities → preference match → reviewer queue → approved email → consent/retention lifecycle`

## How it works

- Matches only currently subscribed records against comma-separated category and region preferences.
- Builds a review batch and sends an expiring, opaque review link to an authorised reviewer.
- Rechecks consent immediately before sending each approved notification.
- Issues one-time unsubscribe tokens stored server-side; no email address or subscriber ID appears in URLs.
- Sends periodic retention-review messages and records lifecycle events in an audit tab.
- Purges old token records while retaining the operational audit history.

## Configure

Set `LIFECYCLE_SPREADSHEET_ID`, `LIFECYCLE_WEB_APP_URL`, and `LIFECYCLE_REVIEWER_EMAIL`. Optional: `LIFECYCLE_TOKEN_HOURS` and `LIFECYCLE_RETENTION_DAYS`. Deploy the web app, run `setupConsentLifecycle()`, and add subscribers/opportunities using the generated headers. Reviewer approval relies on `Session.getActiveUser()`; deploy that route only in a Google Workspace context where the signed-in user's email is exposed. If anonymous and internal review must coexist, use separate deployments (or a bound internal review UI) rather than weakening this check.

## Portfolio note

This is a privacy-conscious reconstruction of a notification workflow. It contains no real subscriber data, employer terminology, opportunity data, email copy, or branded HTML. The public actions use opaque server-side tokens, and the review route additionally requires the configured signed-in reviewer.
