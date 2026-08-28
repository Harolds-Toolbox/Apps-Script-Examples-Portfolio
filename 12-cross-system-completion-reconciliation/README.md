# Cross-system completion reconciliation

This scheduled comparison finds events in one system that have no corresponding completion in another after a configurable grace period. Matching checks source references first, followed by normalised email, phone and a strict name threshold.

## Flow

```text
System A pages → normalise eligible events ┐
                                           ├→ layered match → exceptions → Sheet report
System B pages → normalise completions ─────┘                         └→ consolidated email
```

`reconcileCompletions()` in `Main.js` holds the complete flow under a script lock. It reads both systems and writes a report; it does not mutate either source.

## One-time setup

1. Set `SETUP_FOLDER_ID` in `Setup.js`.
2. Push and run `setupProject()` to create the exception spreadsheet and default 24-hour grace period.
3. Add both source URLs/tokens and an alert recipient.
4. Adapt `normaliseSourceA_()` and `normaliseSourceB_()` to the test payload shapes.
5. Run `reconcileCompletions()` manually before calling `installProjectTriggers()`.

## Script Properties

| Property | Set by setup | Notes |
| --- | --- | --- |
| `RECONCILIATION_SPREADSHEET_ID` | Yes | `Completion Exceptions` report. |
| `RECONCILIATION_AGE_HOURS` | Yes | Defaults to `24`. |
| `RECONCILIATION_MAX_PAGES` | Yes | Defaults to `100`; reaching the limit while another page exists is an error. |
| `SOURCE_A_URL` / `SOURCE_A_TOKEN` | No | Event source and bearer token. |
| `SOURCE_B_URL` / `SOURCE_B_TOKEN` | No | Completion source and bearer token. |
| `RECONCILIATION_ALERT_RECIPIENT` | No | Consolidated exception recipient. |

The project requests external HTTP, Sheets, email and trigger permissions.

Each source client follows `next`, `nextPageUrl` or `links.next` URLs. It detects repeated pages, refuses cross-origin next links so bearer tokens cannot be forwarded elsewhere, and throws rather than returning partial data when `RECONCILIATION_MAX_PAGES` is reached while another page remains. When adapting a provider, confirm its final-page contract and set a bound that safely exceeds legitimate result sizes.

## Testing the workflow

1. Use test endpoints containing fictional identities only.
2. Include one exact source-reference match, one normalised email match, one phone match and one true exception older than the grace period.
3. Include one unmatched recent event and confirm it is ignored until the grace period passes.
4. Run `reconcileCompletions()` and confirm only the older unmatched event appears in the Sheet/email.
5. Alter a name slightly and inspect whether the strict similarity threshold behaves as expected for that data set.
6. Test pagination with more than one response page, confirm the provider's final page clears its next link, and verify the expected record count before installing the schedule.
7. Run `npm test` locally to check multi-page collection, loop detection, cross-origin rejection and page-limit failure with deterministic source mocks.

Fuzzy matching is a prompt for follow-up, not a basis for changing records automatically.
