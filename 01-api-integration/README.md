# API integration

**Problem:** Retrieve every record from an authenticated, paginated API without failing permanently on a brief outage or rate limit.

**Architecture:** Apps Script → REST API → normalized JavaScript objects.

**Configure:** Add `API_TOKEN` to Script Properties. The sample URL uses `api.example.com`; replace it with the real endpoint.

Run `exampleFetchAllContacts()` and inspect the execution log.
