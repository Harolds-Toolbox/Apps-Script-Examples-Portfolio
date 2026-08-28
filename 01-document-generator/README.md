# Dual-template PDF document generator

This web app accepts a small set of project values and turns them into a downloadable PDF. The user can switch between a Google Doc layout and a Google Sheet layout without changing the submitted data.

## Flow

```text
web form → server validation → choose template type
                              ├→ copy Google Doc → replace body/header/footer tokens ┐
                              └→ copy Google Sheet → replace cell tokens → flush      ├→ PDF → browser download
                                                                                      └→ trash temporary source
```

`Main.js` exposes the two useful top-level calls. `runPdfGeneration()` follows the generation path; `runDocumentGeneratorChecks()` runs the synthetic validation checks. Both renderers work against temporary Drive copies, so the source templates are never edited.

## One-time setup

1. Open `Setup.js` and replace `PASTE_GOOGLE_DRIVE_FOLDER_ID_HERE` with the ID of a Drive folder owned by the deploying account.
2. Push the project to Apps Script.
3. Run `setupProject()` from the Apps Script editor.
4. Approve access to Google Drive, Docs and Sheets when prompted.
5. Check Script Properties. Setup writes `DOCUMENT_TEMPLATE_ID`, `SPREADSHEET_TEMPLATE_ID` and `SPREADSHEET_TEMPLATE_SHEET_NAME` automatically.
6. Run `runDocumentGeneratorChecks()` and confirm `{ ok: true }`.
7. Deploy as a web app for signed-in accounts in the deploying Workspace domain, matching the included `DOMAIN` manifest access setting.

Setup creates both fictional templates in the configured folder. The Markdown files under `sample-template` describe the same layouts if you want to rebuild them manually.

## Script Properties

| Property | Set by setup | Notes |
| --- | --- | --- |
| `DOCUMENT_TEMPLATE_ID` | Yes | Google Doc used for the narrative layout. |
| `SPREADSHEET_TEMPLATE_ID` | Yes | Google Spreadsheet used for the form layout. |
| `SPREADSHEET_TEMPLATE_SHEET_NAME` | Yes | Defaults to `Project Summary`. |

If the generated templates are replaced later, update the corresponding IDs manually.

## Testing the workflow

1. Open the deployed web app and select **Load test data**.
2. Leave **Google Doc** selected and choose **Download PDF**.
3. Confirm the PDF contains the reference, multiline address, formatted total and notes.
4. Switch to **Google Sheet** and download again.
5. Confirm the content matches but the layout follows the Sheet template.
6. Check Drive Trash for the temporary source files. No completed source file should remain in the setup folder.

The web app returns PDFs through `google.script.run`, so this version is intended for compact files. Larger output is better saved to a controlled Drive location with a separate access flow.

## Supported tokens

`{{REFERENCE}}`, `{{CUSTOMER_NAME}}`, `{{CUSTOMER_ADDRESS}}`, `{{PROJECT_TITLE}}`, `{{START_DATE}}`, `{{CURRENCY}}`, `{{CURRENCY_SYMBOL}}`, `{{TOTAL}}`, `{{NOTES}}` and `{{CREATED_DATE}}`.
