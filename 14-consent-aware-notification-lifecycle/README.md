# Consent-aware notification lifecycle

This workflow matches subscribed records to open opportunities, asks a reviewer to approve the recipient set, sends only to records still subscribed at send time and maintains unsubscribe/retention state with opaque tokens.

## Flow

```text
Subscribers + Opportunities → preference match → pending review batch → authorised reviewer
                                                                      ↓
recheck consent → notification email → one-time unsubscribe link → consent update + audit
weekly retention review ───────────────────────────────────────────────┘
token housekeeping → remove expired token rows
```

`Main.js` separates preparation, retention review and housekeeping. The public web route handles review/unsubscribe actions while token state remains in the private workbook.

## One-time setup

1. Set `SETUP_FOLDER_ID` in `Setup.js`.
2. Push and run `setupProject()` to create all five storage tabs and default token/retention values.
3. Deploy the web app and add its `/exec` URL as `LIFECYCLE_WEB_APP_URL`.
4. Set `LIFECYCLE_REVIEWER_EMAIL` to an account you control.
5. Confirm the deployment exposes the signed-in reviewer identity to `Session.getActiveUser()`.
6. Test manually before running `installProjectTriggers()`.

## Script Properties

| Property | Set by setup | Notes |
| --- | --- | --- |
| `LIFECYCLE_SPREADSHEET_ID` | Yes | Subscribers, opportunities, queue, tokens and audit. |
| `LIFECYCLE_TOKEN_HOURS` | Yes | Defaults to `72`. |
| `LIFECYCLE_RETENTION_DAYS` | Yes | Defaults to `365`. |
| `LIFECYCLE_WEB_APP_URL` | No | Deployment `/exec` URL. |
| `LIFECYCLE_REVIEWER_EMAIL` | No | Exact signed-in reviewer email. |

Permissions include Drive, Sheets, email, signed-in identity, web-app execution and trigger management.

## Testing the workflow

1. Add one fictional subscriber using an email address you control, status `Subscribed`, current consent time and simple category/region preferences.
2. Add one matching open opportunity and one non-matching opportunity.
3. Run `runNotificationPreparation()` and open the review link sent to the reviewer.
4. Approve the selected test recipient and confirm one notification and audit entry are written.
5. Open the unsubscribe link, confirm the consent status changes, then try the link again and confirm it cannot be reused.
6. Run preparation again with another opportunity and confirm the unsubscribed record is excluded.
7. Use a deliberately old consent date in a test row and run `runRetentionReview()` to inspect the retention message.

Reviewer approval relies on a deployment context where the active user's email is available. If anonymous unsubscribe and internal review need different access settings, use separate deployments or a bound internal review UI rather than removing the reviewer check.
