# Webhook handler

**Problem:** Accept signed webhook events quickly without losing them when downstream processing is slow.

**Architecture:** Sender → `doPost` signature check → Sheet queue → time-driven processor.

**Configure:** Add `WEBHOOK_SECRET` and `QUEUE_SPREADSHEET_ID` to Script Properties. Create a sheet named `Webhook Queue` with the headers used in `queueWebhook_`.

Deploy as a web app, then run `installWebhookProcessor()` once.
