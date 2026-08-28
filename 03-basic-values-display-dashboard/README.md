# Basic values display dashboard

This is a small read-only web dashboard for two operational feeds: expected-versus-actual values and category counts. For duplicate site/date rows, the newest timestamp wins.

## Flow

```text
signed-in viewer → server allow-list check → read two Sheet tabs → select latest rows
                                                            → combine by site → totals/variance → dashboard UI
```

`runDashboardRefresh()` in `Main.js` returns the same view model used by the browser. All access checks happen on the server before the spreadsheet is read.

## One-time setup

1. Set `SETUP_FOLDER_ID` in `Setup.js`.
2. Push the project and run `setupProject()`.
3. Approve Drive and Sheets access. Setup creates a spreadsheet with `Daily Reconciliation`, `Operational Counts` and current-date synthetic rows.
4. Add `DASHBOARD_AUTHORIZED_EMAILS` in Script Properties as a comma-separated list. Include the account used for testing.
5. Deploy as a web app that runs as the user accessing it and requires sign-in.

## Script Properties

| Property | Set by setup | Notes |
| --- | --- | --- |
| `DASHBOARD_SPREADSHEET_ID` | Yes | Source spreadsheet created by setup. |
| `DASHBOARD_AUTHORIZED_EMAILS` | No | Comma-separated lower- or mixed-case Google account emails. |

The project asks for spreadsheet access and signed-in user identity. Deployment settings must expose `Session.getActiveUser().getEmail()`; otherwise the server deliberately refuses access.

## Testing the workflow

1. Run `runDashboardRefresh()` in the editor while signed in as an allowed account.
2. Open the deployment and confirm all three sites appear.
3. Add a newer row for one site with today's business date and refresh; that site should use the new row.
4. Add an older duplicate row and confirm it is ignored.
5. Remove the test account from `DASHBOARD_AUTHORIZED_EMAILS` and confirm the web app fails closed, then restore it.

The sample CSV files mirror the two accepted header sets and are useful when replacing the generated test data.
