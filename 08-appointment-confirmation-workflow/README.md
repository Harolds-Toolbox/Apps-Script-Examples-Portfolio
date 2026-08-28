# Appointment confirmation workflow

This workflow finds upcoming appointments, sends a response link and records either confirmation or cancellation. Links contain only an opaque server-side token and can be consumed once before expiry.

## Flow

```text
hourly trigger → pending appointments → issue expiring token → reminder email → response web app
                                                                              ↓
Appointments sheet ← status/response time ← consume token under lock ← confirm/cancel
        └→ coordinator notification + audit log + overdue escalation
```

`runAppointmentReminderCycle()` in `Main.js` runs both scheduled checks in order. The web app path is handled separately by `doGet()` and `submitAppointmentResponse()`.

## One-time setup

1. Set `SETUP_FOLDER_ID` at the top of `Setup.js`.
2. Push and run `setupProject()` to create the appointment, token and audit tabs.
3. Deploy as a web app that executes as the deploying account and allows anonymous access, matching the included manifest, then copy the `/exec` URL into `APPOINTMENT_WEB_APP_URL`. The opaque, expiring, single-use token authorises the response.
4. Add a fictional appointment using an email account you control.
5. Run `sendAppointmentReminders()` manually.
6. When the response flow works, run `installProjectTriggers()`.

## Script Properties

| Property | Set by setup | Notes |
| --- | --- | --- |
| `APPOINTMENT_SPREADSHEET_ID` | Yes | Workflow storage. |
| `REMINDER_LEAD_HOURS` | Yes | Defaults to `24`. |
| `RESPONSE_TOKEN_LIFETIME_HOURS` | Yes | Defaults to `48`. |
| `APPOINTMENT_WEB_APP_URL` | No | Deployment `/exec` URL. |

The project asks for Drive, Sheets, email, web-app and trigger permissions. If every participant belongs to one Workspace domain, the deployment can be restricted to that domain instead of allowing anonymous access.

## Testing the workflow

1. Add a row with status `Pending`, a time within the reminder window and your own participant/coordinator addresses.
2. Run `sendAppointmentReminders()` and open the received link.
3. Confirm the appointment and inspect the status, response time and audit row.
4. Open the same link again; it should report that the token is no longer valid.
5. Repeat with a second appointment and choose cancellation.
6. Add an overdue pending appointment and run `escalateMissingResponses()` to test coordinator follow-up.

Keep the `_Response Tokens` tab protected from ordinary editors. It is application state rather than an operator-facing table.
