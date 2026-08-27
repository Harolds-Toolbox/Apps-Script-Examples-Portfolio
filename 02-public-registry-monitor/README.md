# Public registry monitor

A scheduled pipeline that queries the UK public company registry, filters and deduplicates results, stores timestamped CSV snapshots, compares the latest two snapshots, refreshes a reporting Sheet and sends a concise change notification.

The API is a public government service. Search criteria in this example are fictional defaults and must be configured for a real use case.

## Architecture

```text
time trigger → paginated public API → normalize/filter/dedupe → CSV snapshot in Drive
                                                              ├→ reporting Sheet
previous snapshot → comparison ────────────────────────────────└→ email summary
```

## Script Properties

| Property | Purpose |
| --- | --- |
| `REGISTRY_API_KEY` | Public registry API credential |
| `REGISTRY_REPORT_FOLDER_ID` | Private Drive folder for CSV snapshots |
| `REGISTRY_SPREADSHEET_ID` | Spreadsheet containing a `Registry Report` tab |
| `REGISTRY_ALERT_RECIPIENT` | Optional notification recipient |
| `REGISTRY_POSTCODE_AREAS` | Comma-separated outward areas, for example `AB,CD` |
| `REGISTRY_ACTIVITY_CODES` | Comma-separated activity/SIC codes |

Run `installRegistryMonitor()` once to create a daily trigger, or run `runRegistryMonitor()` manually.

## Safety

Snapshots remain in the configured private folder. The code does not publish files or grant link access. `cleanupRegistrySnapshots()` retains the newest 12 snapshots by default.
