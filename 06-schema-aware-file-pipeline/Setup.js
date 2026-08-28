const SETUP_FOLDER_ID = "PASTE_GOOGLE_DRIVE_FOLDER_ID_HERE";

function setupProject() {
  const folder = requireSetupFolder_();
  const inbox = folder.createFolder("Schema-aware File Pipeline - Inbox");
  const control = SpreadsheetApp.create("Schema-aware File Pipeline - Control");
  const destination = SpreadsheetApp.create(
    "Schema-aware File Pipeline - Destination",
  );
  moveSetupFileToFolder_(control.getId(), folder);
  moveSetupFileToFolder_(destination.getId(), folder);
  replaceSetupSheetData_(
    control.getSheets()[0].setName(FILE_PIPELINE.queueSheet),
    [FILE_QUEUE_HEADERS],
  );
  replaceSetupSheetData_(destination.getSheets()[0].setName("Orders"), [
    ["Order ID", "Order Date", "Amount"],
  ]);
  saveSetupProperties_({
    PIPELINE_INBOX_FOLDER_ID: inbox.getId(),
    PIPELINE_CONTROL_SPREADSHEET_ID: control.getId(),
    PIPELINE_DESTINATION_SPREADSHEET_ID: destination.getId(),
    PIPELINE_ROUTES_JSON: JSON.stringify([
      {
        name: "orders",
        filePattern: "^orders_.*\\.csv$",
        destinationSheet: "Orders",
        requiredHeaders: ["Order ID", "Order Date", "Amount"],
      },
    ]),
  });
  return {
    inboxFolderId: inbox.getId(),
    controlSpreadsheetId: control.getId(),
    destinationSpreadsheetId: destination.getId(),
  };
}

function installProjectTriggers() {
  removeSetupTriggers_(["runFilePipeline"]);
  ScriptApp.newTrigger("runFilePipeline").timeBased().everyMinutes(10).create();
}

function installFilePipeline() {
  return installProjectTriggers();
}
