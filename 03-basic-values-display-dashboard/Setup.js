const SETUP_FOLDER_ID = "PASTE_GOOGLE_DRIVE_FOLDER_ID_HERE";

function setupProject() {
  const folder = requireSetupFolder_();
  const spreadsheet = SpreadsheetApp.create(
    "Basic Values Display Dashboard - Data",
  );
  moveSetupFileToFolder_(spreadsheet.getId(), folder);
  const reconciliation = spreadsheet
    .getSheets()[0]
    .setName(DASHBOARD_CONFIG.reconciliationSheet);
  const counts = spreadsheet.insertSheet(DASHBOARD_CONFIG.countsSheet);
  const now = new Date();
  const businessDate = Utilities.formatDate(
    now,
    Session.getScriptTimeZone(),
    "yyyy-MM-dd",
  );
  replaceSetupSheetData_(reconciliation, [
    ["Timestamp", "Business Date", "Site", "Expected", "Actual"],
    [now, businessDate, "North Site", 1250, 1248.5],
    [now, businessDate, "Central Site", 980, 991.25],
    [now, businessDate, "South Site", 1435.5, 1435.5],
  ]);
  replaceSetupSheetData_(counts, [
    ["Timestamp", "Business Date", "Site", "Category", "Quantity"],
    [now, businessDate, "North Site", "Completed Orders", 84],
    [now, businessDate, "North Site", "Open Exceptions", 3],
    [now, businessDate, "Central Site", "Completed Orders", 72],
    [now, businessDate, "South Site", "Completed Orders", 91],
  ]);
  reconciliation.setFrozenRows(1);
  counts.setFrozenRows(1);
  saveSetupProperties_({ DASHBOARD_SPREADSHEET_ID: spreadsheet.getId() });
  return {
    spreadsheetId: spreadsheet.getId(),
    propertyStillRequired: "DASHBOARD_AUTHORIZED_EMAILS",
  };
}
