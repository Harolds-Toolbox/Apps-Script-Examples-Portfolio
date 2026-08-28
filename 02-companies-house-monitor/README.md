# Companies House monitor

This scheduled job searches the Companies House API, normalises the results, keeps timestamped CSV snapshots and reports changes between the newest two runs.

## Flow

```text
time trigger → paginated Companies House search → filter/deduplicate → CSV snapshot
previous snapshot ───────────────────────────────→ compare changes ─┬→ Registry Report sheet
                                                                  └→ optional email summary
```

`runRegistryMonitor()` in `Main.js` shows the complete sequence. Snapshots are private Drive files and the retention pass keeps the newest twelve by default.

## One-time setup

1. Set `SETUP_FOLDER_ID` at the top of `Setup.js` to a Drive folder ID.
2. Push the project and run `setupProject()`.
3. Approve Drive and Sheets access. Setup creates a report spreadsheet and a private snapshots folder, then writes both IDs to Script Properties.
4. Add the manual properties below.
5. Run `runRegistryMonitor()` once with a narrow test filter.
6. When the output looks right, run `installProjectTriggers()` to schedule the daily 06:00 refresh.

## Script Properties

| Property | Set by setup | Notes |
| --- | --- | --- |
| `REGISTRY_REPORT_FOLDER_ID` | Yes | Folder containing timestamped CSV snapshots. |
| `REGISTRY_SPREADSHEET_ID` | Yes | Spreadsheet containing `Registry Report`. |
| `REGISTRY_API_KEY` | No | Companies House API key. |
| `REGISTRY_POSTCODE_AREAS` | No | Comma-separated outward postcode areas. |
| `REGISTRY_ACTIVITY_CODES` | No | Comma-separated SIC/activity codes. Set to `*`, or omit the property, to include every SIC code. |
| `REGISTRY_ALERT_RECIPIENT` | No | Optional summary recipient; leave absent during initial tests. |

The first run may ask for permission to call an external service. Adding the optional recipient also requires permission to send email. Installing the trigger requires permission to manage project triggers.

## Testing the workflow

1. Use one postcode area and one activity code that return a small result set. To test without a SIC filter, set `REGISTRY_ACTIVITY_CODES` to `*` or delete the property.
2. Run `runRegistryMonitor()` and inspect the report sheet and first CSV snapshot.
3. Run it again. The second run should compare two snapshots and report zero changes when the source data is unchanged.
4. Temporarily change the filter, run again and confirm additions/removals are shown.
5. Restore the intended filters before installing the trigger.

The API criteria are deployment configuration. Nothing in setup publishes files or changes sharing permissions.
