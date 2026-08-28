const SETUP_FOLDER_ID = "PASTE_GOOGLE_DRIVE_FOLDER_ID_HERE";

function setupProject() {
  const folder = requireSetupFolder_();
  const snapshotFolder = folder.createFolder(
    "Companies House Monitor - Snapshots",
  );
  const spreadsheet = SpreadsheetApp.create("Companies House Monitor - Report");
  moveSetupFileToFolder_(spreadsheet.getId(), folder);
  const sheet = spreadsheet.getSheets()[0].setName(REGISTRY_CONFIG.reportSheet);
  replaceSetupSheetData_(sheet, [REGISTRY_HEADERS]);
  sheet.setFrozenRows(1);

  saveSetupProperties_({
    REGISTRY_REPORT_FOLDER_ID: snapshotFolder.getId(),
    REGISTRY_SPREADSHEET_ID: spreadsheet.getId(),
  });
  return {
    spreadsheetId: spreadsheet.getId(),
    snapshotFolderId: snapshotFolder.getId(),
  };
}

function installProjectTriggers() {
  removeSetupTriggers_(["runRegistryMonitor"]);
  ScriptApp.newTrigger("runRegistryMonitor")
    .timeBased()
    .everyDays(1)
    .atHour(6)
    .create();
}

function installRegistryMonitor() {
  return installProjectTriggers();
}
