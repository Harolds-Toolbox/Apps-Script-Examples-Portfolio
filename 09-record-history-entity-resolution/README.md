# Record history and entity resolution

This job turns editable Sheet records into timestamped Drive snapshots and append-only history rows, then raises possible duplicate entities for manual review. It never merges records automatically.

## Flow

```text
configured source tabs → header-driven records ─┬→ timestamped JSON snapshot → retention
                                                ├→ fingerprint → append changed history
                                                └→ email/phone/name scoring → unacknowledged match queue
```

`snapshotAndResolveEntities()` in `Main.js` shows the full run. Exact normalised email and phone matches carry the strongest score; fuzzy names are deliberately held below automatic-decision territory.

## One-time setup

1. Set `SETUP_FOLDER_ID` in `Setup.js`.
2. Push and run `setupProject()`.
3. Approve Drive and Sheets access. Setup creates the workbook, a `Customers` source tab and a snapshots folder.
4. Edit `ENTITY_SOURCES_JSON` if additional source tabs are required.
5. Run `snapshotAndResolveEntities()` manually before installing the daily trigger with `installProjectTriggers()`.

## Script Properties

| Property | Set by setup | Notes |
| --- | --- | --- |
| `ENTITY_SPREADSHEET_ID` | Yes | Source, history and match-review workbook. |
| `ENTITY_SNAPSHOT_FOLDER_ID` | Yes | JSON snapshot storage. |
| `ENTITY_SOURCES_JSON` | Yes | Defaults to the generated `Customers` tab. |
| `SNAPSHOT_RETENTION_COUNT` | Yes | Defaults to `30`. |
| `ENTITY_ALERT_RECIPIENT` | No | Optional match notification address. |

Email permission is only needed when an alert recipient is configured. Trigger installation requires trigger-management permission.

## Testing the workflow

1. Add two fictional customers with different IDs and the same normalised email or phone.
2. Add a third row with a similar but not identical name.
3. Run `snapshotAndResolveEntities()` and inspect the JSON snapshot, `Record History` and `Possible Matches`.
4. Copy one match key to `_Match Acknowledgements`, add a timestamp/note and run again; that pair should no longer be raised.
5. Edit one customer field and rerun; one new history fingerprint should be appended.
6. Confirm no source row was changed or merged.

Source definitions use header names rather than fixed column numbers, colours or formatting.
