# Apps Script business automations

This repository is a set of independent Google Apps Script projects for the kinds of jobs that tend to sit between Sheets, Drive, email, web apps and external systems.

All code included here comes from snippets and patterns from projects I have deployed in production environments. It has been modified to be shareable: employer-owned code, organisation names, live identifiers, credentials, records, branding, watermarks and private endpoints are not included.

Each numbered directory is its own Apps Script project. They are not intended to be pushed as one large script.

## Projects

| Directory | Rundown |
| --- | --- |
| [`01-document-generator`](01-document-generator/) | Populates either a Google Doc or Google Sheet template and returns the result as a browser-downloaded PDF. |
| [`02-companies-house-monitor`](02-companies-house-monitor/) | Searches Companies House by postcode-area/SIC partitions, consumes every reported result page, snapshots deduplicated records to CSV and reports additions/removals. SIC filtering can be disabled with `*` or by omitting the property. |
| [`03-basic-values-display-dashboard`](03-basic-values-display-dashboard/) | Combines two Sheet feeds into an allow-listed, read-only operational dashboard. |
| [`04-procurement-approval-workflow`](04-procurement-approval-workflow/) | Runs a versioned request/review state machine with signed actions, audit history and optional PDFs. |
| [`05-reliable-webhook-inbox`](05-reliable-webhook-inbox/) | Acknowledges signed webhooks quickly, commits them idempotently to a durable Sheet inbox and processes them with retries and reconciliation. |
| [`06-schema-aware-file-pipeline`](06-schema-aware-file-pipeline/) | Discovers CSV/XLSX files in Drive, validates headers and publishes through staging tabs. |
| [`07-api-data-catalogue`](07-api-data-catalogue/) | Samples JSON endpoints and builds a searchable catalogue of fields, types and likely relationships. |
| [`08-appointment-confirmation-workflow`](08-appointment-confirmation-workflow/) | Sends expiring one-time confirmation links and records responses, audits and overdue follow-up. |
| [`09-record-history-entity-resolution`](09-record-history-entity-resolution/) | Keeps versioned snapshots/history and raises possible duplicate entities for manual review. |
| [`10-dynamic-project-intake-tracker`](10-dynamic-project-intake-tracker/) | Creates and archives repeating project blocks in a bound Sheet using stable IDs and configured validation. |
| [`11-self-healing-webhook-manager`](11-self-healing-webhook-manager/) | Checks complete provider webhook listings and verifies reactivation, deduplication or rotation changes before finishing. |
| [`12-cross-system-completion-reconciliation`](12-cross-system-completion-reconciliation/) | Compares two paginated systems, rejects incomplete page traversal and produces a consolidated missing-completion report. |
| [`13-configuration-management-dialog`](13-configuration-management-dialog/) | Maintains ordered Sheet configuration through a revision-aware dialog with rollback, Unicode-safe bootstrap and formula-safe text handling. |
| [`14-consent-aware-notification-lifecycle`](14-consent-aware-notification-lifecycle/) | Matches preferences, issues hashed one-time review/unsubscribe links and records retry-aware delivery and retention state. |

## Common project layout

Every project uses the same top-level shape:

```text
Project/
├── Helpers/
│   ├── Consts.js
│   └── Helper Functions.js
├── Setup.js
├── Main.js
├── appsscript.json
├── README.md
└── domain-specific .js and .html files
```

- `Helpers/Consts.js` contains Script Property names, sheet names, thresholds and other deployment-level values.
- `Helpers/Helper Functions.js` contains general-purpose functions that are not tied to one domain file.
- `Setup.js` starts with `SETUP_FOLDER_ID`. Its `setupProject()` function creates the Sheets, Docs, folders and generated Script Properties used by that project.
- `Main.js` is the quickest place to read the end-to-end flow or invoke it manually.
- Each project README lists the values setup creates, the properties that still need manual values, the likely permission prompts and a deterministic test sequence.

## Using clasp

The commands below use clasp 3.x. It requires Node.js 22 or later. Command names and options are kept in line with the [official clasp documentation](https://github.com/google/clasp/blob/master/README.md).

### Install and sign in

```bash
node --version
npm install --global @google/clasp
clasp login
```

Enable the Google Apps Script API for the signed-in account at `https://script.google.com/home/usersettings` before creating or cloning scripts.

### Create a standalone Apps Script project

From the repository root:

```bash
cd 01-document-generator
clasp create-script --title "Dual-template PDF document generator" --type standalone --rootDir .
clasp show-file-status
clasp push
clasp open-script
```

Run the equivalent commands from whichever numbered directory you are deploying. `clasp push` replaces the remote project's source with the local accepted files, so always check `clasp show-file-status` first.

clasp keeps the local `Helpers` directory structure when pushing. Markdown, CSV and other unsupported source extensions are not uploaded as Apps Script files.

### Create a bound Sheet project

Projects 10 and 13 need a container-bound spreadsheet for menus and dialogs. Create a blank Google Sheet first, copy its file ID, then run:

```bash
cd 10-dynamic-project-intake-tracker
clasp create-script --title "Dynamic project intake tracker" --type sheets --parentId GOOGLE_SHEET_FILE_ID --rootDir .
clasp show-file-status
clasp push
clasp open-script
```

Use the same pattern for project 13.

### Connect to an existing script

If the Apps Script project already exists:

```bash
cd PROJECT_DIRECTORY
clasp clone-script SCRIPT_ID --rootDir .
clasp show-file-status
```

If cloning would overwrite local files, clone into an empty temporary directory first and copy only the generated `.clasp.json` after checking its script ID and root directory.

`.clasp.json` identifies the remote script and must remain untracked. It is already covered by this repository's `.gitignore`.

## Setup and testing sequence

For any project:

1. Read its README before pushing; note whether it is standalone, bound or a web app.
2. Set `SETUP_FOLDER_ID` at the top of its `Setup.js` to a folder owned by the deploying account.
3. Push with clasp and open the script editor.
4. Run `setupProject()` once and approve only the permissions expected by that project's README.
5. Open **Project Settings → Script Properties**. Keep the generated IDs and add the manual secrets, URLs, recipients or account allow-lists described in the README.
6. Run the documented manual test with fictional data and accounts you control.
7. Inspect every generated Sheet, Doc, folder, email and log entry.
8. Only then install recurring triggers with `installProjectTriggers()` where that function exists.
9. For web apps, use **Deploy → New deployment → Web app** in the Apps Script editor so the execute-as and access settings are reviewed explicitly. Copy the resulting `/exec` URL into any property that requires it, then test again.

clasp can also create versions and deployments with `clasp create-deployment`, but web-app access settings are important enough that the editor flow is the safer first deployment. Existing deployments can be listed with `clasp list-deployments`.

## Local checks

Apps Script services such as `SpreadsheetApp`, `DriveApp` and `MailApp` do not run in Node.js. Local checks can still catch syntax, invalid manifests and browser-script parsing errors before a push. Runtime tests should use generated resources, fictional records and non-production external accounts.

Run the repository checks with Node.js 22 or later:

```bash
npm run verify
```

The command validates all fourteen project layouts, parses every manifest, checks JavaScript syntax, rejects tracked clasp/deployment credentials and runs deterministic regression tests for the queue and pagination failure paths. The same command runs through GitHub Actions on pushes and pull requests.

Never commit `.clasp.json`, `.clasprc.json`, API keys, deployment URLs, source payloads or exported production data. Script Properties are the boundary for deployment secrets and identifiers.
