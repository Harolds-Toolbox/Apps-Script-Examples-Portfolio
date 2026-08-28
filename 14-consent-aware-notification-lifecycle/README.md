# Consent-aware notification lifecycle

This workflow matches subscribed records to open opportunities, emails a reviewer a short-lived approval link, sends only to records still subscribed at send time and maintains unsubscribe/retention state with opaque tokens. Only SHA-256 token hashes are stored in the workbook.

## Flow

```text
Subscribers + Opportunities → preference match → pending review batch → one-time review link
                                                                      ↓
recheck consent → notification email → one-time unsubscribe link → consent update + audit
weekly retention review ───────────────────────────────────────────────┘
token housekeeping → remove expired token rows
```

`Main.js` separates preparation, retention review and housekeeping. The public web route handles review/unsubscribe actions while token state remains in the private workbook. Review authority comes from possession of the single-use link sent to `LIFECYCLE_REVIEWER_EMAIL`; no Google identity or external API credential is required.

## One-time setup

1. Set `SETUP_FOLDER_ID` in `Setup.js`.
2. Push and run `setupProject()` to create all five storage tabs and default token/retention values.
3. Deploy the web app so it executes as the deploying account and allows anonymous access, matching the included manifest, then add its `/exec` URL as `LIFECYCLE_WEB_APP_URL`. Review and unsubscribe actions are authorised by separate, expiring, single-use capability tokens.
4. Set `LIFECYCLE_REVIEWER_EMAIL` to an account you control.
5. If upgrading an existing workbook, run `upgradeProject()` once to refresh the queue and token headers.
6. Test manually before running `installProjectTriggers()`.

## Script Properties

| Property | Set by setup | Notes |
| --- | --- | --- |
| `LIFECYCLE_SPREADSHEET_ID` | Yes | Subscribers, opportunities, queue, tokens and audit. |
| `LIFECYCLE_TOKEN_HOURS` | Yes | Defaults to `72`. |
| `LIFECYCLE_RETENTION_DAYS` | Yes | Defaults to `365`. |
| `LIFECYCLE_WEB_APP_URL` | No | Deployment `/exec` URL. |
| `LIFECYCLE_REVIEWER_EMAIL` | No | Recipient of the private review capability link; use an account you control. |

Permissions include Drive, Sheets, email, web-app execution and trigger management. No API key, OAuth client or third-party credential is used.

## Testing the workflow

1. Add one fictional subscriber using an email address you control, status `Subscribed`, current consent time and simple category/region preferences.
2. Add one matching open opportunity and one non-matching opportunity.
3. Run `runNotificationPreparation()` and open the review link sent to the reviewer.
4. Approve the selected test recipient and confirm the queue moves through `Sending` to `Sent`, then check the notification and audit entry.
5. Open the unsubscribe link, confirm the consent status changes, then try the link again and confirm it cannot be reused.
6. Run preparation again with another opportunity and confirm the unsubscribed record is excluded.
7. Use a deliberately old consent date in a test row and run `runRetentionReview()` to inspect the retention message.
8. Replace a test email with an invalid address and confirm preparation fails before a review batch is sent.
9. Simulate a delivery failure and confirm the row becomes `Failed`, the review token remains usable and already-sent rows are not offered again.

Date cells may contain native Sheet dates, `DD/MM/YYYY` text or `YYYY-MM-DD` text. Invalid and ambiguous date values are rejected before a review batch is prepared; notification emails format valid closing dates as `d MMM yyyy` in the project time zone.

Queue rows are marked `Sending` before the external email side effect and `Sent` afterwards. A caught delivery error becomes `Failed` and can be retried with the same review link without resending completed rows. If an execution is forcibly terminated while a row remains `Sending`, treat its delivery state as unknown and reconcile it manually rather than retrying automatically.

The deployed browser test covered encoded query input, invalid and reused tokens, reviewer approval, notification delivery, strict UK-style date validation, unsubscribe, exclusion after consent withdrawal and hashed token storage. The test workbook was returned to header-only state afterwards.
