function scheduledSync() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) {
    console.log(JSON.stringify({ event: 'sync_skipped', reason: 'already_running' }));
    return;
  }

  const properties = PropertiesService.getScriptProperties();
  const startedAt = new Date();
  const checkpoint = properties.getProperty('SYNC_CHECKPOINT') || new Date(0).toISOString();
  try {
    const changes = fetchScheduledChanges_(checkpoint);
    changes.forEach(applyScheduledChange_);
    properties.setProperty('SYNC_CHECKPOINT', startedAt.toISOString());
    console.log(JSON.stringify({ event: 'sync_complete', changes: changes.length, checkpoint: startedAt.toISOString() }));
  } finally {
    lock.releaseLock();
  }
}

function fetchScheduledChanges_(checkpoint) {
  const response = UrlFetchApp.fetch('https://api.example.com/v1/changes?since=' + encodeURIComponent(checkpoint), {
    headers: { Authorization: 'Bearer ' + requiredScheduledProperty_('SCHEDULED_API_TOKEN') },
    muteHttpExceptions: true
  });
  if (response.getResponseCode() !== 200) throw new Error('Change feed returned HTTP ' + response.getResponseCode());
  return JSON.parse(response.getContentText()).items || [];
}

function applyScheduledChange_(change) {
  console.log(JSON.stringify({ event: 'change_applied', changeId: String(change.id), operation: String(change.operation) }));
}

function installScheduledSync() {
  ScriptApp.getProjectTriggers()
    .filter(function (trigger) { return trigger.getHandlerFunction() === 'scheduledSync'; })
    .forEach(ScriptApp.deleteTrigger);
  ScriptApp.newTrigger('scheduledSync').timeBased().everyHours(1).create();
}

function requiredScheduledProperty_(name) {
  const value = PropertiesService.getScriptProperties().getProperty(name);
  if (!value) throw new Error('Missing Script Property: ' + name);
  return value;
}
