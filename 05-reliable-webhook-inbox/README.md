# Reliable webhook inbox

A generic webhook receiver designed for Apps Script's short request lifecycle and quota constraints. It validates an HMAC signature, acknowledges quickly, drains a durable property queue into a Sheet inbox, retries failures and reconciles recent changes from the source API.

## Delivery contract

Send a JSON body with at least:

```json
{"id":"evt_1042","type":"record.updated","occurredAt":"2026-01-15T09:30:00Z","data":{"recordId":"rec_88"}}
```

The request URL must include:

```text
?timestamp=UNIX_SECONDS&signature=HEX_HMAC_SHA256
```

The signature is HMAC-SHA256 over `timestamp + "." + rawRequestBody`, using `WEBHOOK_SIGNING_SECRET`. Requests more than five minutes from the server clock are rejected.

## Sheet

Create `Webhook Inbox` with:

```text
Received At | Event ID | Event Type | Payload JSON | Status | Attempts | Next Retry At | Last Error | Processed At | Source
```

## Script Properties

- `WEBHOOK_SIGNING_SECRET` — at least 32 random characters
- `WEBHOOK_SPREADSHEET_ID`
- `RECONCILIATION_API_URL` — optional change-feed endpoint
- `RECONCILIATION_API_TOKEN` — optional bearer token

Run `installWebhookAutomation()` once. Replace the sample route handlers with destination-specific work.

## Reliability layers

1. Timestamped HMAC validation.
2. Fast Script Properties enqueue and immediate acknowledgement.
3. Lock-protected batch flush to a durable Sheet.
4. Event-ID deduplication.
5. Exponential retry scheduling and dead-letter state.
6. Source API reconciliation from a saved checkpoint.
