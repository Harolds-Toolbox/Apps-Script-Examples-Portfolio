const SETUP_FOLDER_ID = "PASTE_GOOGLE_DRIVE_FOLDER_ID_HERE";

function setupProject() {
  requireSetupFolder_();
  saveSetupProperties_({
    WEBHOOK_EVENTS_JSON: '["record.created","record.updated"]',
    WEBHOOK_SCOPE_JSON: "{}",
    WEBHOOK_FAILURE_THRESHOLD: "3",
    WEBHOOK_MAX_PAGES: "100",
  });
  return {
    propertiesStillRequired: [
      "WEBHOOK_PROVIDER_BASE_URL",
      "WEBHOOK_PROVIDER_TOKEN",
      "WEBHOOK_CALLBACK_URL",
      "WEBHOOK_SIGNING_SECRET",
    ],
  };
}

function installProjectTriggers() {
  removeSetupTriggers_(["reconcileProviderWebhook"]);
  ScriptApp.newTrigger("reconcileProviderWebhook")
    .timeBased()
    .everyHours(1)
    .create();
}

function installWebhookHealthCheck() {
  installProjectTriggers();
  return reconcileProviderWebhook();
}
