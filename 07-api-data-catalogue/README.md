# API data catalogue

This tool samples configured JSON endpoints, walks the returned object shapes and writes a searchable field catalogue to Google Sheets. Fields ending in `Id` or `_id` are listed as possible relationships for review.

## Flow

```text
endpoint config → static/OAuth token → bounded API samples → recursive field discovery
                                                          ├→ Endpoints sheet
                                                          ├→ Fields sheet
                                                          └→ Relationships sheet → read-only web UI
```

`generateApiCatalogue()` in `Main.js` shows the sequence from authentication through publishing. Existing catalogue tabs are replaced on each run.

## One-time setup

1. Set `SETUP_FOLDER_ID` in `Setup.js`.
2. Push and run `setupProject()` to create the catalogue spreadsheet and its three tabs.
3. Add the API base URL, endpoint JSON and one authentication method.
4. Run `generateApiCatalogue()` manually.
5. Deploy as a web app for signed-in readers if the generated catalogue should have a browser view.

## Script Properties

| Property | Set by setup | Notes |
| --- | --- | --- |
| `CATALOGUE_SPREADSHEET_ID` | Yes | Generated catalogue workbook. |
| `CATALOGUE_API_BASE_URL` | No | API origin without a trailing path. |
| `CATALOGUE_ENDPOINTS_JSON` | No | Endpoint names, paths and response item paths. |
| `CATALOGUE_ACCESS_TOKEN` | No | Static bearer token option. |
| `CATALOGUE_TOKEN_URL` | No | OAuth client-credentials token URL. |
| `CATALOGUE_CLIENT_ID` | No | Required with OAuth token URL. |
| `CATALOGUE_CLIENT_SECRET` | No | Required with OAuth token URL. |

Use either the static token or all OAuth properties. External request and spreadsheet permissions are requested on the first run.

Example endpoint configuration:

```json
[{"name":"Customers","path":"/v1/customers","itemsPath":"items","sampleSize":25}]
```

## Testing the workflow

1. Configure a test endpoint containing fictional data and a sample size below 50.
2. Run `generateApiCatalogue()` and inspect all three tabs.
3. Confirm nested objects and array items produce dotted field paths.
4. Add a nullable or mixed-type field to the test response and rerun; its observed types should update.
5. Open the web deployment and search for a known field path.

Examples are truncated before writing. Tokens and full response payloads are not logged.
