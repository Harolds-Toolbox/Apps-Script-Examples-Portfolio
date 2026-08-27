# Self-healing webhook manager

## Problem

Third-party webhook subscriptions can be suspended, duplicated, or left silently failing. A valid receiver alone does not guarantee that events keep arriving.

## Architecture

`Signed receiver + provider management API → hourly health reconciliation → reactivate or rotate → alert`

## How it works

- Validates inbound HMAC signatures with a constant-time comparison.
- Discovers the subscription registered for the configured callback URL.
- Creates a missing subscription, reactivates a lightly failing one, or rotates a persistently failing one.
- Preserves configured event types and scope during replacement.
- Removes duplicates only after a healthy subscription exists.
- Retries rate limits and transient provider failures with exponential backoff.

## Configure

Set `WEBHOOK_PROVIDER_BASE_URL`, `WEBHOOK_PROVIDER_TOKEN`, `WEBHOOK_CALLBACK_URL`, and `WEBHOOK_SIGNING_SECRET`. Optional properties are `WEBHOOK_EVENTS_JSON`, `WEBHOOK_SCOPE_JSON`, `WEBHOOK_ALERT_RECIPIENT`, and `WEBHOOK_FAILURE_THRESHOLD`. Adapt the four small API wrapper functions if your provider uses different routes, then run `installWebhookHealthCheck()`.

## Portfolio note

The provider is intentionally generic. The example demonstrates the operational pattern without exposing a real platform, tenant, endpoint, token, payload, or company-specific event name.
