const SETUP_FOLDER_ID = "PASTE_GOOGLE_DRIVE_FOLDER_ID_HERE";

function setupProject() {
  const folder = requireSetupFolder_();
  const spreadsheet = SpreadsheetApp.getActive();
  if (!spreadsheet)
    throw new Error("This project must be bound to a Google Sheet.");
  moveSetupFileToFolder_(spreadsheet.getId(), folder);
  setupProjectTracker();
  return { spreadsheetId: spreadsheet.getId() };
}
