# Scheduled sync

**Problem:** Reconcile records regularly without overlapping runs or starting from the beginning every time.

**Architecture:** Time trigger → lock → fetch changes since checkpoint → apply changes → advance checkpoint.

**Configure:** Add `SCHEDULED_API_TOKEN` to Script Properties and replace `applyScheduledChange_` with the destination-specific update.

Run `installScheduledSync()` once, then run `scheduledSync()` manually for the first smoke test.
