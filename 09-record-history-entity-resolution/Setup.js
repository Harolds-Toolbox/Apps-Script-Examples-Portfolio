const SETUP_FOLDER_ID = "PASTE_GOOGLE_DRIVE_FOLDER_ID_HERE";

function setupProject() {
  const folder = requireSetupFolder_();
  const snapshots = folder.createFolder("Entity Resolution - Snapshots");
  const spreadsheet = SpreadsheetApp.create(
    "Record History and Entity Resolution",
  );
  moveSetupFileToFolder_(spreadsheet.getId(), folder);
  const customers = spreadsheet.getSheets()[0].setName("Customers");
  replaceSetupSheetData_(customers, [
    ["Customer ID", "Name", "Email", "Phone"],
  ]);
  ensureSetupSheet_(spreadsheet, ENTITY.history, [
    "Observed At",
    "Source",
    "Record ID",
    "Fingerprint",
    "Record JSON",
  ]);
  ensureSetupSheet_(spreadsheet, ENTITY.matches, [
    "Match Key",
    "Left Source",
    "Left ID",
    "Right Source",
    "Right ID",
    "Score",
  ]);
  ensureSetupSheet_(spreadsheet, ENTITY.acknowledgements, [
    "Match Key",
    "Acknowledged At",
    "Note",
  ]);
  saveSetupProperties_({
    ENTITY_SPREADSHEET_ID: spreadsheet.getId(),
    ENTITY_SNAPSHOT_FOLDER_ID: snapshots.getId(),
    ENTITY_SOURCES_JSON: JSON.stringify([
      { sheet: "Customers", id: "Customer ID" },
    ]),
    SNAPSHOT_RETENTION_COUNT: "30",
  });
  return {
    spreadsheetId: spreadsheet.getId(),
    snapshotFolderId: snapshots.getId(),
  };
}

function installProjectTriggers() {
  removeSetupTriggers_(["snapshotAndResolveEntities"]);
  ScriptApp.newTrigger("snapshotAndResolveEntities")
    .timeBased()
    .everyDays(1)
    .atHour(2)
    .create();
}

function installEntityResolutionTrigger() {
  return installProjectTriggers();
}
