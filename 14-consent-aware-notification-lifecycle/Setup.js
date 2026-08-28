const SETUP_FOLDER_ID = "PASTE_GOOGLE_DRIVE_FOLDER_ID_HERE";

function setupProject() {
  const folder = requireSetupFolder_();
  const spreadsheet = SpreadsheetApp.create(
    "Consent-aware Notification Lifecycle",
  );
  moveSetupFileToFolder_(spreadsheet.getId(), folder);
  const firstKey = "subscribers";
  spreadsheet.getSheets()[0].setName(LIFECYCLE[firstKey]);
  Object.keys(LIFECYCLE.headers).forEach(function (key) {
    ensureSetupSheet_(spreadsheet, LIFECYCLE[key], LIFECYCLE.headers[key]);
  });
  saveSetupProperties_({
    LIFECYCLE_SPREADSHEET_ID: spreadsheet.getId(),
    LIFECYCLE_TOKEN_HOURS: "72",
    LIFECYCLE_RETENTION_DAYS: "365",
  });
  return {
    spreadsheetId: spreadsheet.getId(),
    propertiesStillRequired: [
      "LIFECYCLE_WEB_APP_URL",
      "LIFECYCLE_REVIEWER_EMAIL",
    ],
  };
}

function installProjectTriggers() {
  removeSetupTriggers_([
    "prepareOpportunityNotifications",
    "reviewSubscriberRetention",
    "purgeExpiredLifecycleTokens",
  ]);
  ScriptApp.newTrigger("prepareOpportunityNotifications")
    .timeBased()
    .everyDays(1)
    .atHour(7)
    .create();
  ScriptApp.newTrigger("reviewSubscriberRetention")
    .timeBased()
    .everyWeeks(1)
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(9)
    .create();
  ScriptApp.newTrigger("purgeExpiredLifecycleTokens")
    .timeBased()
    .everyWeeks(1)
    .onWeekDay(ScriptApp.WeekDay.SUNDAY)
    .atHour(3)
    .create();
}

function upgradeProject() {
  const spreadsheet = SpreadsheetApp.openById(
    PropertiesService.getScriptProperties().getProperty(
      "LIFECYCLE_SPREADSHEET_ID",
    ),
  );
  Object.keys(LIFECYCLE.headers).forEach(function (key) {
    const sheet = spreadsheet.getSheetByName(LIFECYCLE[key]);
    if (!sheet) throw new Error(`Missing sheet: ${LIFECYCLE[key]}.`);
    sheet
      .getRange(1, 1, 1, LIFECYCLE.headers[key].length)
      .setValues([LIFECYCLE.headers[key]]);
    sheet.setFrozenRows(1);
  });
  return { upgraded: true };
}

function setupConsentLifecycle() {
  return setupProject();
}
