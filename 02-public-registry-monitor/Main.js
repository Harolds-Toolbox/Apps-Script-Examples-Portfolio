function runRegistryMonitor() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try {
    const rows = fetchRegistryCompanies_();
    const snapshot = saveRegistrySnapshot_(rows);
    const comparison = compareRegistrySnapshots_();
    refreshRegistryReport_(rows);
    sendRegistrySummary_(comparison, snapshot);
    cleanupRegistrySnapshots();
    console.log(JSON.stringify({ event: 'registry_refresh_complete', records: rows.length, added: comparison.added.length, removed: comparison.removed.length }));
    return { snapshot: snapshot, comparison: comparison };
  } finally {
    lock.releaseLock();
  }
}

function installRegistryMonitor() {
  ScriptApp.getProjectTriggers().filter(function (trigger) {
    return trigger.getHandlerFunction() === 'runRegistryMonitor';
  }).forEach(ScriptApp.deleteTrigger);
  ScriptApp.newTrigger('runRegistryMonitor').timeBased().everyDays(1).atHour(6).create();
}
