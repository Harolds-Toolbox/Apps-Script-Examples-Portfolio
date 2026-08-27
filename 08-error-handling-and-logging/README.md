# Error handling and logging

**Problem:** Give scheduled automations useful logs and alerts without leaking payloads or flooding an inbox.

**Architecture:** guarded entry point → structured log → throttled operational alert → rethrow for failed-run visibility.

**Configure:** Add `ALERT_RECIPIENT` to Script Properties. Wrap a trigger entry point with `runGuarded_('job_name', callback)`.

Run `exampleGuardedJob()` to see the success path.
