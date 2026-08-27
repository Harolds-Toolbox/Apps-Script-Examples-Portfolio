# API data catalogue

A complete Apps Script tool that samples configured JSON API endpoints, recursively discovers field paths and value types, infers identifier relationships, writes a searchable catalogue to Google Sheets and serves a read-only browser interface.

## Architecture

```text
endpoint configuration → token provider → bounded API sampler → recursive schema discovery
                                                               ├→ Fields sheet
                                                               ├→ Relationships sheet
                                                               └→ searchable web app
```

## Catalogue spreadsheet

Create these tabs:

- `Endpoints`
- `Fields`
- `Relationships`

The generator replaces their contents on each run.

## Script Properties

- `CATALOGUE_SPREADSHEET_ID`
- `CATALOGUE_API_BASE_URL`
- `CATALOGUE_ENDPOINTS_JSON`
- `CATALOGUE_ACCESS_TOKEN` for a static bearer token, **or** all three OAuth properties below:
- `CATALOGUE_TOKEN_URL`
- `CATALOGUE_CLIENT_ID`
- `CATALOGUE_CLIENT_SECRET`

Example endpoint configuration:

```json
[
  {"name":"Customers","path":"/v1/customers","itemsPath":"items","sampleSize":50},
  {"name":"Orders","path":"/v1/orders","itemsPath":"data.records","sampleSize":50}
]
```

Run `generateApiCatalogue()` to refresh the sheets. Deploy the project for signed-in users to browse the catalogue.

## Discovery behaviour

- Objects are traversed recursively.
- Arrays record both the array field and their item shape.
- A field may accumulate multiple observed types.
- Example values are truncated and secrets are never logged.
- Fields ending in `Id` or `_id` are listed as possible relationships for human review.
