# Self-healing webhook manager

This job checks a provider's webhook registrations and keeps exactly one healthy subscription for the configured callback. Missing subscriptions are created; suspended ones are reactivated; persistently failing ones are replaced.

## Flow

```text
hourly trigger → provider webhook list → find callback registration
                                      ├→ healthy: remove duplicates
                                      ├→ lightly failing: reactivate
                                      └→ missing/persistent failure: create replacement → remove old → alert

provider POST → HMAC check → record last received time → JSON acknowledgement
```

`runWebhookMaintenance()` in `Main.js` starts the management flow. Provider-specific routes are isolated in `Api.js`.

## One-time setup

1. Set `SETUP_FOLDER_ID` in `Setup.js`. This project creates no Drive templates, but setup validates the deployment folder and writes safe JSON/default thresholds.
2. Push and run `setupProject()`.
3. Add the provider URL/token and signing secret.
4. Deploy as a web app that executes as the deploying account and allows anonymous requests, matching the included manifest. Save its `/exec` URL as `WEBHOOK_CALLBACK_URL` and register the same URL with the provider; inbound HMAC verification authenticates requests.
5. Adapt the small API functions if the provider uses different webhook routes or status fields.
6. Run `runWebhookMaintenance()` manually with a non-production provider workspace.
7. Run `installProjectTriggers()` only after create/update/delete behaviour has been checked.

## Script Properties

| Property | Set by setup | Notes |
| --- | --- | --- |
| `WEBHOOK_EVENTS_JSON` | Yes | Default record-created/updated events. |
| `WEBHOOK_SCOPE_JSON` | Yes | Default empty scope. |
| `WEBHOOK_FAILURE_THRESHOLD` | Yes | Defaults to `3`. |
| `WEBHOOK_PROVIDER_BASE_URL` | No | Provider API origin. |
| `WEBHOOK_PROVIDER_TOKEN` | No | Provider management API token. |
| `WEBHOOK_CALLBACK_URL` | No | Deployed receiver URL. |
| `WEBHOOK_SIGNING_SECRET` | No | HMAC secret for inbound events. |
| `WEBHOOK_ALERT_RECIPIENT` | No | Optional rotation alert. |
| `WEBHOOK_LAST_RECEIVED_AT` | Runtime | Updated by valid inbound requests. |

External request, email and trigger permissions may be requested. The management token needs only the provider scopes required to list/create/update/delete webhooks.

## Testing the workflow

1. Point the configuration at a sandbox or disposable provider workspace.
2. Run with no matching registration and confirm one is created.
3. Run again and confirm it reports healthy without creating another.
4. Create a duplicate and confirm the healthy registration remains while the duplicate is removed.
5. Mark the test hook suspended/failing in the provider and exercise reactivation, then rotation after the threshold.
6. Send a signed fictional payload to the callback and confirm `WEBHOOK_LAST_RECEIVED_AT` changes; send a bad signature and confirm it does not.

Do not test rotation against a production callback until the provider adapter has been reviewed against its exact API contract.
