const SETUP_FOLDER_ID = "PASTE_GOOGLE_DRIVE_FOLDER_ID_HERE";

function setupProject() {
  const folder = requireSetupFolder_();
  const spreadsheet = SpreadsheetApp.create("Reliable Webhook Inbox - Data");
  moveSetupFileToFolder_(spreadsheet.getId(), folder);
  const sheet = spreadsheet.getSheets()[0].setName(WEBHOOK_CONFIG.inboxSheet);
  replaceSetupSheetData_(sheet, [WEBHOOK_HEADERS]);
  sheet.setFrozenRows(1);
  saveSetupProperties_({ WEBHOOK_SPREADSHEET_ID: spreadsheet.getId() });
  return {
    spreadsheetId: spreadsheet.getId(),
    propertyStillRequired: "WEBHOOK_SIGNING_SECRET",
  };
}

function installProjectTriggers() {
  const handlers = [
    "flushWebhookQueue",
    "processWebhookInbox",
    "reconcileWebhookChanges",
    "cleanupWebhookDedupKeys",
  ];
  ScriptApp.getProjectTriggers()
    .filter(function (trigger) {
      return handlers.indexOf(trigger.getHandlerFunction()) !== -1;
    })
    .forEach(ScriptApp.deleteTrigger);
  ScriptApp.newTrigger("flushWebhookQueue")
    .timeBased()
    .everyMinutes(1)
    .create();
  ScriptApp.newTrigger("processWebhookInbox")
    .timeBased()
    .everyMinutes(5)
    .create();
  ScriptApp.newTrigger("reconcileWebhookChanges")
    .timeBased()
    .everyHours(1)
    .create();
  ScriptApp.newTrigger("cleanupWebhookDedupKeys")
    .timeBased()
    .everyDays(1)
    .atHour(3)
    .create();
}

function installWebhookAutomation() {
  return installProjectTriggers();
}
