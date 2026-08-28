# Schema-aware file pipeline

This Drive ingestion job discovers CSV or XLSX files, assigns a configured route, validates the header schema and publishes values through a staging tab. Queue rows record retries, terminal failures, schema hashes and row counts.

## Flow

```text
Drive inbox → discovery → File Queue → CSV/XLSX parser → schema check → staging tab → destination tab
                                              │               │
                                              └→ retry/dead    └→ hash + row count
```

`runFilePipeline()` in `Main.js` contains the complete bounded run: discovery first, then eligible queue rows until the batch or runtime budget is reached.

## One-time setup

1. Set `SETUP_FOLDER_ID` in `Setup.js`.
2. Push and run `setupProject()`.
3. Approve Drive and Sheets access. Setup creates an inbox folder, control spreadsheet, destination spreadsheet and an `orders` route.
4. In Apps Script **Services**, enable the Advanced Drive service. Enable the Drive API in the linked Google Cloud project as well.
5. Run one manual test before calling `installProjectTriggers()`.

## Script Properties

Setup writes all required properties:

- `PIPELINE_INBOX_FOLDER_ID`
- `PIPELINE_CONTROL_SPREADSHEET_ID`
- `PIPELINE_DESTINATION_SPREADSHEET_ID`
- `PIPELINE_ROUTES_JSON`

Edit `PIPELINE_ROUTES_JSON` when adding routes. Every route needs `name`, `filePattern`, `destinationSheet` and `requiredHeaders`.

## Testing the workflow

1. Upload `sample-data/orders_2026-01-15.csv` to the generated inbox folder.
2. Run `runFilePipeline()`.
3. Confirm the queue row reaches `DONE`, includes a schema hash and reports three data rows.
4. Confirm the `Orders` tab contains the uploaded values.
5. Upload a copy with one required header renamed and confirm the row retries before eventually reaching `DEAD`.
6. Upload the same Drive file again without changing its ID and confirm discovery does not create a duplicate queue row.

XLSX parsing temporarily converts the workbook to Google Sheets. The temporary conversion is moved to Trash in a `finally` block.
