const SETUP_FOLDER_ID = "PASTE_GOOGLE_DRIVE_FOLDER_ID_HERE";

function setupProject() {
  const folder = requireSetupFolder_();
  const spreadsheet = SpreadsheetApp.create("API Data Catalogue");
  moveSetupFileToFolder_(spreadsheet.getId(), folder);
  const first = spreadsheet.getSheets()[0].setName(CATALOGUE.endpointsSheet);
  replaceSetupSheetData_(first, [
    [
      "Endpoint",
      "Path",
      "Items Path",
      "Sample Size",
      "Records Sampled",
      "Generated At",
    ],
  ]);
  replaceSetupSheetData_(spreadsheet.insertSheet(CATALOGUE.fieldsSheet), [
    [
      "Endpoint",
      "Field Path",
      "Observed Types",
      "Nullable",
      "Example",
      "Occurrences",
    ],
  ]);
  replaceSetupSheetData_(
    spreadsheet.insertSheet(CATALOGUE.relationshipsSheet),
    [["Endpoint", "Field Path", "Possible Target", "Confidence"]],
  );
  saveSetupProperties_({ CATALOGUE_SPREADSHEET_ID: spreadsheet.getId() });
  return { spreadsheetId: spreadsheet.getId() };
}
