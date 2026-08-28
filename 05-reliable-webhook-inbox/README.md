# Reliable webhook inbox

Apps Script web requests need to finish quickly. This receiver validates the request, queues the raw event temporarily in Script Properties and acknowledges it; scheduled jobs then commit events to a Sheet, process them with retries and optionally reconcile a source change feed.

## Flow

```text
signed POST → timestamp/HMAC check → property queue → immediate JSON acknowledgement
                                           ↓
minute trigger → Sheet inbox → route handler → DONE / RETRY / DEAD
hourly change-feed reconciliation ─────────┘
```

`runWebhookProcessingCycle()` in `Main.js` is the manual equivalent of the scheduled processing stages. The route handlers in `Processor.js` are intentionally small places to attach destination-specific work. The Sheet row is the durable queue commit: temporary properties and deduplication state are cleared only after the Sheet write and flush succeed. If execution stops after the write but before cleanup, the next run recognises the existing event ID and finishes cleanup without appending a duplicate.

## One-time setup

1. Set `SETUP_FOLDER_ID` in `Setup.js`.
2. Push and run `setupProject()` to create the `Webhook Inbox` spreadsheet.
3. Add `WEBHOOK_SIGNING_SECRET` with at least 32 random characters.
4. Deploy as a web app that executes as the deploying account and allows anonymous requests, matching the included manifest. Give the resulting `/exec` URL to the sending system; timestamped HMAC verification authenticates each request.
5. Optionally set the reconciliation endpoint properties.
6. Run `installProjectTriggers()` after a signed test request has completed successfully.

## Script Properties

| Property | Set by setup | Notes |
| --- | --- | --- |
| `WEBHOOK_SPREADSHEET_ID` | Yes | Durable processing inbox. |
| `WEBHOOK_SIGNING_SECRET` | No | HMAC-SHA256 secret shared with the sender. |
| `RECONCILIATION_API_URL` | No | Optional change-feed URL. |
| `RECONCILIATION_API_TOKEN` | No | Bearer token required when the reconciliation URL is set. |
| `RECONCILIATION_CHECKPOINT` | Runtime | Updated after successful reconciliation. |

Permissions cover Sheets, Script Properties, external requests and trigger management. The optional reconciliation path performs outbound HTTP requests.

## Testing the workflow

Use a fictional body such as:

```json
{"id":"evt_test_1042","type":"record.updated","occurredAt":"2026-01-15T09:30:00Z","data":{"recordId":"rec_test_88"}}
```

1. Generate a current Unix timestamp.
2. Calculate the hex HMAC-SHA256 of `timestamp + "." + rawBody` with `WEBHOOK_SIGNING_SECRET`.
3. POST the exact raw body to `WEB_APP_URL?timestamp=...&signature=...`.
4. Run `runWebhookProcessingCycle()` and confirm the event reaches `DONE`.
5. Repeat the same event ID and confirm it is not processed twice.
6. Send an invalid signature and an old timestamp; both should be rejected before queueing.
7. Run `npm test` locally to exercise the interrupted-write recovery path with mocked Apps Script services.

Do not install the recurring triggers until the route handlers are safe to run repeatedly.
