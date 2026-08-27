# Configuration management dialog

## Problem

Non-technical users need to maintain structured configuration, but direct Sheet editing can break formulas, sort order, validation, or aligned columns.

## Architecture

`Bound-Sheet menu → safely bootstrapped HTML dialog → client validation and drag ordering → locked atomic rewrite → calculated column`

## How it works

- Loads all configuration rows into one accessible management dialog.
- Encodes bootstrap data as Base64 before placing it in HTML, avoiding unsafe raw JSON/script injection.
- Supports multi-record creation, editing, deletion, active flags, and drag-and-drop ordering.
- Revalidates required and unique names on the server.
- Rewrites the editable table inside a document lock, then reapplies the calculated column as an R1C1 formula.
- Keeps the UI schema deliberately small so it can be adapted to locations, teams, products, routing rules, or similar settings.

## Configure

Create a bound Apps Script project, add both files, run `setupConfigurationManager()`, and reload the spreadsheet. Choose **Configuration → Manage items**.

## Portfolio note

This retains the strongest UX and data-integrity ideas from a more specialised configuration tool while replacing all organisation-specific fields, options, and locations.
