# Document generator

A complete Apps Script web app that collects structured data, fills a Google Docs template, converts the result to PDF and returns it to the browser without retaining a generated document.

## Architecture

```text
Browser form → server validation → copy Docs template → replace tokens
                                                  ↓
browser download ← Base64 PDF response ← convert to PDF ← trash temporary copy
```

## Template

Create a Google Doc containing any of these tokens:

```text
{{REFERENCE}}
{{CUSTOMER_NAME}}
{{CUSTOMER_ADDRESS}}
{{PROJECT_TITLE}}
{{START_DATE}}
{{TOTAL}}
{{NOTES}}
{{CREATED_DATE}}
```

Add the template file ID as the Script Property `DOCUMENT_TEMPLATE_ID`.

## Deploy

1. Copy the files to a V8 Apps Script project.
2. Add `DOCUMENT_TEMPLATE_ID` to Script Properties.
3. Deploy as a web app for the intended signed-in users.
4. Open the deployment and generate a document using fictional data.

The source contains no default template ID. Missing configuration causes a clear failure rather than silently using a production asset.
