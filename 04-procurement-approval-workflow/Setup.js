const SETUP_FOLDER_ID = "PASTE_GOOGLE_DRIVE_FOLDER_ID_HERE";

function setupProject() {
  const folder = requireSetupFolder_();
  const spreadsheet = SpreadsheetApp.create(
    "Procurement Approval Workflow - Data",
  );
  moveSetupFileToFolder_(spreadsheet.getId(), folder);
  const requests = spreadsheet
    .getSheets()[0]
    .setName(PROCUREMENT.requestsSheet);
  replaceSetupSheetData_(requests, [
    [
      "Reference",
      "Requester Email",
      "Supplier",
      "Description",
      "Currency",
      "Amount",
      "Status",
      "Information Request",
      "Information Response",
      "Created At",
      "Updated At",
      "Reviewer Email",
      "Version",
    ],
  ]);
  replaceSetupSheetData_(spreadsheet.insertSheet(PROCUREMENT.auditSheet), [
    ["Timestamp", "Reference", "Action", "Actor", "Metadata JSON"],
  ]);

  const template = SpreadsheetApp.create(
    "Procurement Approval Workflow - PDF Template",
  );
  moveSetupFileToFolder_(template.getId(), folder);
  const templateSheet = template.getSheets()[0].setName("Approval Record");
  replaceSetupSheetData_(templateSheet, [
    ["APPROVED PROCUREMENT RECORD", ""],
    ["Reference", "{{REFERENCE}}"],
    ["Supplier", "{{SUPPLIER}}"],
    ["Description", "{{DESCRIPTION}}"],
    ["Currency", "{{CURRENCY}}"],
    ["Amount", "{{AMOUNT}}"],
    ["Requester", "{{REQUESTER}}"],
    ["Approved at", "{{APPROVED_AT}}"],
  ]);
  templateSheet
    .getRange("A1:B1")
    .merge()
    .setFontWeight("bold")
    .setBackground("#16324f")
    .setFontColor("#ffffff");
  templateSheet.setColumnWidths(1, 2, 220);

  saveSetupProperties_({
    PROCUREMENT_SPREADSHEET_ID: spreadsheet.getId(),
    PROCUREMENT_DOCUMENT_TEMPLATE_ID: template.getId(),
  });
  return {
    spreadsheetId: spreadsheet.getId(),
    documentTemplateId: template.getId(),
  };
}

function installProjectTriggers() {
  removeSetupTriggers_(["notifyPendingProcurementRequests"]);
  ScriptApp.newTrigger("notifyPendingProcurementRequests")
    .timeBased()
    .everyHours(1)
    .create();
}

function installProcurementTrigger() {
  return installProjectTriggers();
}
