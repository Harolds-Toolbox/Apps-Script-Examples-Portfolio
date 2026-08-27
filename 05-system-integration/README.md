# System integration

**Problem:** Push changed Sheet records into another platform and preserve a clear result for every row.

**Architecture:** Sheet change queue → API upsert → remote ID and sync status written back.

**Configure:** Add `SYNC_SPREADSHEET_ID` and `DESTINATION_API_TOKEN` to Script Properties. Create `Outbound Sync` with columns: `Local ID`, `Name`, `Email`, `Needs Sync`, `Remote ID`, `Synced At`, `Result`.

Run `syncChangedRecords()`.
