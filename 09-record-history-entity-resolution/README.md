# Record history and entity resolution

## Problem

Operational records are edited in place across several tabs, making it hard to reconstruct history or spot duplicates created under slightly different details.

## Architecture

`Header-driven Sheet sources → canonical records → Drive snapshot + append-only history → similarity matching → review queue`

## How it works

- Reads any configured tab by header name rather than relying on colours, positions, or employer-specific layouts.
- Writes timestamped JSON snapshots to Drive and keeps a configurable number of versions.
- Appends only changed record fingerprints to the history table.
- Scores possible matches using exact normalised email/phone and fuzzy name comparison.
- Separates suggestions from decisions; acknowledged pairs are not repeatedly raised.
- Uses a script lock so scheduled runs cannot overlap.

## Configure

Set `ENTITY_SPREADSHEET_ID`, `ENTITY_SNAPSHOT_FOLDER_ID`, and `ENTITY_SOURCES_JSON`, for example `[{"sheet":"Customers","id":"Customer ID"},{"sheet":"Enquiries","id":"Enquiry ID"}]`. Optional properties: `SNAPSHOT_RETENTION_COUNT` and `ENTITY_ALERT_RECIPIENT`. Run `installEntityResolutionTrigger()` once.

## Portfolio note

This extracts the reusable history and entity-resolution ideas from a larger CRM without copying its names, data model, styling, or personal data. Matching is deliberately review-first: it never merges records automatically.
