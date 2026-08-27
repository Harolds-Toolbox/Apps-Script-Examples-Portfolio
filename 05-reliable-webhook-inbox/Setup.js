function installWebhookAutomation() {
  const handlers = ['flushWebhookQueue', 'processWebhookInbox', 'reconcileWebhookChanges', 'cleanupWebhookDedupKeys'];
  ScriptApp.getProjectTriggers().filter(function (trigger) { return handlers.indexOf(trigger.getHandlerFunction()) !== -1; })
    .forEach(ScriptApp.deleteTrigger);
  ScriptApp.newTrigger('flushWebhookQueue').timeBased().everyMinutes(1).create();
  ScriptApp.newTrigger('processWebhookInbox').timeBased().everyMinutes(5).create();
  ScriptApp.newTrigger('reconcileWebhookChanges').timeBased().everyHours(1).create();
  ScriptApp.newTrigger('cleanupWebhookDedupKeys').timeBased().everyDays(1).atHour(3).create();
}
