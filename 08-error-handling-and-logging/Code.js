function exampleGuardedJob() {
  return runGuarded_('example_job', function (context) {
    logEvent_('INFO', 'job_work_started', { correlationId: context.correlationId });
    return { processed: 3 };
  });
}

function runGuarded_(jobName, callback) {
  const context = { jobName: jobName, correlationId: Utilities.getUuid(), startedAt: new Date() };
  try {
    const result = callback(context);
    logEvent_('INFO', 'job_succeeded', {
      jobName: jobName,
      correlationId: context.correlationId,
      durationMs: new Date().getTime() - context.startedAt.getTime()
    });
    return result;
  } catch (error) {
    const safeError = { name: error.name || 'Error', message: String(error.message || error).slice(0, 500) };
    logEvent_('ERROR', 'job_failed', {
      jobName: jobName,
      correlationId: context.correlationId,
      error: safeError
    });
    sendThrottledAlert_(jobName, context.correlationId, safeError);
    throw error;
  }
}

function logEvent_(level, eventName, details) {
  const entry = Object.assign({
    timestamp: new Date().toISOString(),
    level: level,
    event: eventName
  }, details || {});
  console.log(JSON.stringify(entry));
}

function sendThrottledAlert_(jobName, correlationId, error) {
  const cache = CacheService.getScriptCache();
  const throttleKey = 'alert:' + jobName;
  if (cache.get(throttleKey)) return;
  cache.put(throttleKey, 'sent', 900);

  const recipient = PropertiesService.getScriptProperties().getProperty('ALERT_RECIPIENT');
  if (!recipient) return;
  MailApp.sendEmail({
    to: recipient,
    subject: 'Automation failed: ' + jobName,
    body: [
      'Job: ' + jobName,
      'Correlation ID: ' + correlationId,
      'Error: ' + error.name + ': ' + error.message,
      '',
      'Review the Apps Script execution log for details.'
    ].join('\n')
  });
}
