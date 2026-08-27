# Schema-aware file pipeline

A queue-based ingestion pipeline for CSV and XLSX files. It discovers new files in Drive, validates their schemas, converts Excel workbooks through the Advanced Drive service, loads data through a staging tab and records a row-level outcome.

## Architecture

```text
Drive inbox → discovery queue → CSV/XLSX parser → schema validator → staging Sheet → destination Sheet
                                  │                    │
                                  └→ temporary file    └→ schema hash + status
```

## Control spreadsheet

Create a tab named `File Queue` with:

```text
File ID | File Name | Status | Attempts | Next Retry At | Last Error | Route | Uploaded At | Processed At | Schema Hash | Row Count
```

The destination spreadsheet must contain an output tab for each configured route. Staging tabs named `_staging_ROUTE` are created automatically.

## Script Properties

- `PIPELINE_CONTROL_SPREADSHEET_ID`
- `PIPELINE_INBOX_FOLDER_ID`
- `PIPELINE_DESTINATION_SPREADSHEET_ID`
- `PIPELINE_ROUTES_JSON`

Example route configuration:

```json
[
  {
    "name": "orders",
    "filePattern": "^orders_.*\\.(csv|xlsx)$",
    "destinationSheet": "Orders",
    "requiredHeaders": ["Order ID", "Order Date", "Amount"]
  }
]
```

Enable the Advanced Drive API service in the Apps Script project and its linked Cloud project. Run `installFilePipeline()` once.

## Reliability

- Files are deduplicated by Drive file ID.
- Processing stops before the Apps Script runtime limit.
- Failures receive exponential retry dates and eventually enter `DEAD` state.
- Schemas are normalized, checked for duplicates and hashed.
- Temporary converted Sheets are always moved to Trash.
