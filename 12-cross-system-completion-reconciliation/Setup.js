const SETUP_FOLDER_ID = "PASTE_GOOGLE_DRIVE_FOLDER_ID_HERE";

function setupProject() {
  const folder = requireSetupFolder_();
  const spreadsheet = SpreadsheetApp.create(
    "Completion Reconciliation - Exceptions",
  );
  moveSetupFileToFolder_(spreadsheet.getId(), folder);
  const sheet = spreadsheet.getSheets()[0].setName("Completion Exceptions");
  replaceSetupSheetData_(sheet, [
    ["Checked At", "Source ID", "Name", "Occurred At", "Reason"],
  ]);
  saveSetupProperties_({
    RECONCILIATION_SPREADSHEET_ID: spreadsheet.getId(),
    RECONCILIATION_AGE_HOURS: "24",
  });
  return { spreadsheetId: spreadsheet.getId() };
}

function installProjectTriggers() {
  removeSetupTriggers_(["reconcileCompletions"]);
  ScriptApp.newTrigger("reconcileCompletions")
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .create();
}

function installCompletionReconciliation() {
  return installProjectTriggers();
}
