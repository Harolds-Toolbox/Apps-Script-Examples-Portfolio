# Cross-system completion reconciliation

## Problem

A process can be completed in one system while its required follow-up remains missing in another. Manual comparisons are slow, inconsistent, and easy to forget.

## Architecture

`System A paginated events + System B paginated completions → canonical models → deterministic/fuzzy matching → exception report + digest`

## How it works

- Retrieves paginated data with authentication, transient-error retries, and a page safety limit.
- Waits for a configurable grace period before declaring an item incomplete.
- Matches strongest identifiers first: source reference, email, phone, then a strict name similarity threshold.
- Produces one consolidated exception email rather than one alert per record.
- Optionally replaces a Sheet-based exception report on each run.
- Serialises scheduled executions with a script lock.

## Configure

Set `SOURCE_A_URL`, `SOURCE_A_TOKEN`, `SOURCE_B_URL`, `SOURCE_B_TOKEN`, and `RECONCILIATION_ALERT_RECIPIENT`. Optional: `RECONCILIATION_AGE_HOURS` and `RECONCILIATION_SPREADSHEET_ID`. Adapt only the two normaliser functions to map real API payloads, then run `installCompletionReconciliation()`.

## Portfolio note

This keeps the cross-system reconciliation pattern while replacing real forms, platforms, participants, fields, and messaging with provider-neutral examples. Matching results trigger human follow-up; they never mutate either source system.
