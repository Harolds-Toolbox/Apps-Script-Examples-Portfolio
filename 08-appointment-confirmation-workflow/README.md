# Appointment confirmation workflow

## Problem

Teams lose time chasing appointment confirmations, while ordinary query-string links can expose personal data or allow repeat actions.

## Architecture

`Appointments sheet → scheduled reminder → one-time token → web response → coordinator notification + audit log`

## How it works

- Finds pending appointments inside a configurable reminder window.
- Emails an opaque, one-time, expiring response link—no identity data appears in the URL.
- Uses a script lock so concurrent clicks cannot consume the same token twice.
- Records confirmation or cancellation and alerts the responsible coordinator.
- Escalates appointments that reach their start time without a response.

## Configure

Set Script Properties `APPOINTMENT_SPREADSHEET_ID`, `APPOINTMENT_WEB_APP_URL`, and optionally `REMINDER_LEAD_HOURS` and `RESPONSE_TOKEN_LIFETIME_HOURS`. Deploy as a web app, then run `setupAppointmentWorkflow()` once.

## Portfolio note

This is a neutral rebuild of a production appointment-reminder pattern. Names, branding, data, layouts, and URLs are fictional; the security model was strengthened with server-side, expiring, single-use tokens.
