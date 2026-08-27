# Email automation

**Problem:** Send personalized notifications from a Sheet without duplicates when a run is retried.

**Architecture:** Notification queue → template rendering → Mail service → per-row delivery receipt.

**Configure:** Add `EMAIL_SPREADSHEET_ID` to Script Properties. Create `Email Queue` with columns: `Message ID`, `Recipient`, `First Name`, `Action URL`, `Status`, `Sent At`, `Error`.

Run `sendPendingEmails()` manually or from a time-driven trigger.
