# Dual-template PDF document generator

A complete Apps Script web app that collects structured data and downloads a finished PDF using either a Google Doc or a Google Sheet as the layout template. The selected template is copied, populated, exported and moved to Trash; generated source files are not retained.

## What it demonstrates

- A responsive, accessible HTML Service web app with a Doc/Sheet template toggle.
- Server-side validation independent of browser validation.
- Google Docs token replacement across the body, header and footer.
- Google Sheets template copying that preserves cell formatting, merged ranges, dimensions and print layout.
- Direct browser downloads using a Base64 response, `Blob` and temporary object URL.
- Guaranteed temporary-file cleanup with `try`/`finally`.
- Fail-closed checks for missing properties, wrong Drive file types, missing tabs and templates with no supported tokens.
- Synthetic self-tests that do not read Drive or generate files.

## Architecture

```text
                            ┌→ copy Google Doc → replace body/header/footer tokens ┐
Browser form → validation ─┤                                                      ├→ PDF Blob → Base64 → browser download
                            └→ copy Sheet tab → replace cell tokens → flush layout ┘
                                                ↓
                                      trash temporary source
```

## Script Properties

Both template IDs are required, even though the user selects only one for each download:

| Property | Required | Purpose |
| --- | --- | --- |
| `DOCUMENT_TEMPLATE_ID` | Yes | File ID of the Google Doc template. |
| `SPREADSHEET_TEMPLATE_ID` | Yes | File ID of the Google Spreadsheet template. |
| `SPREADSHEET_TEMPLATE_SHEET_NAME` | No | Template tab to copy. The first tab is used when omitted. |

No IDs are included in this repository. The deploying account must be able to read both templates and create temporary Drive files.

## Supported tokens

The same placeholders work in both template types:

```text
{{REFERENCE}}
{{CUSTOMER_NAME}}
{{CUSTOMER_ADDRESS}}
{{PROJECT_TITLE}}
{{START_DATE}}
{{CURRENCY}}
{{CURRENCY_SYMBOL}}
{{TOTAL}}
{{NOTES}}
{{CREATED_DATE}}
```

In a Google Doc, tokens may appear in the body, header or footer. In a Google Sheet, tokens may occupy a cell or appear inside other cell text. At least one supported token must exist in the selected template.

## Fictional templates

The `sample-template` directory contains complete build guides for:

- `Document Template.md` — an imagined project-confirmation Google Doc.
- `Spreadsheet Template.md` — an imagined one-page project-summary Google Sheet, including cell ranges and print-layout suggestions.
- `Test Data.md` — the fictional values used by the web app's **Load test data** button.

These Markdown files document the templates; they are not runtime dependencies. Recreate each layout in Google Drive and set its file ID in Script Properties.

## Deploy and test

1. Create a V8 standalone Apps Script project and add the source files.
2. Recreate the two fictional templates, or adapt your own templates to the supported tokens.
3. Add both required IDs under **Project Settings → Script Properties**.
4. Optionally set `SPREADSHEET_TEMPLATE_SHEET_NAME`.
5. Run `runDocumentGeneratorSelfTests()` and confirm it returns `{ ok: true }`.
6. Deploy as a web app for the intended signed-in users, using the narrowest suitable access setting.
7. Open the deployment, choose a template, select **Load test data**, then select **Download PDF**.
8. Repeat with the other template type and compare the two layouts.

## Production considerations

This pattern is suited to compact PDFs returned through `google.script.run`. For large or highly graphical files, save the PDF to a controlled Drive location and return a short-lived access flow instead of transferring a large Base64 payload. Drive Trash remains subject to the owner's retention policy, so environments with stricter deletion requirements should add an approved cleanup process.

## Portfolio note

The spreadsheet rendering path is a neutral reconstruction of a production-proven template-copy pattern: copy one formatted source tab into a temporary spreadsheet, remove default tabs, replace placeholders, flush, export and clean up. This example contains no production template, identifiers, finance fields, organisation names, customer data, branding or watermark assets.
