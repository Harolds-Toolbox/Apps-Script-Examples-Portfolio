const SETUP_FOLDER_ID = "PASTE_GOOGLE_DRIVE_FOLDER_ID_HERE";

function setupProject() {
  const folder = requireSetupFolder_();
  const document = DocumentApp.create(
    "Document Generator - Google Doc Template",
  );
  const body = document.getBody();
  body
    .appendParagraph("SAMPLE PROJECT SERVICES")
    .setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body
    .appendParagraph("Project confirmation")
    .setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph("Reference: {{REFERENCE}}");
  body.appendParagraph("Created: {{CREATED_DATE}}");
  body
    .appendParagraph("Customer")
    .setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph("{{CUSTOMER_NAME}}\n{{CUSTOMER_ADDRESS}}");
  body
    .appendParagraph("Project summary")
    .setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph("{{PROJECT_TITLE}} begins on {{START_DATE}}.");
  body.appendTable([
    ["Currency", "{{CURRENCY}}"],
    ["Agreed total", "{{TOTAL}}"],
  ]);
  body
    .appendParagraph("Notes")
    .setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph("{{NOTES}}");
  document.saveAndClose();
  moveSetupFileToFolder_(document.getId(), folder);

  const spreadsheet = SpreadsheetApp.create(
    "Document Generator - Google Sheet Template",
  );
  moveSetupFileToFolder_(spreadsheet.getId(), folder);
  const sheet = spreadsheet.getSheets()[0].setName("Project Summary");
  buildDocumentGeneratorSheetTemplate_(sheet);

  saveSetupProperties_({
    DOCUMENT_TEMPLATE_ID: document.getId(),
    SPREADSHEET_TEMPLATE_ID: spreadsheet.getId(),
    SPREADSHEET_TEMPLATE_SHEET_NAME: "Project Summary",
  });

  return {
    documentTemplateId: document.getId(),
    spreadsheetTemplateId: spreadsheet.getId(),
  };
}

function buildDocumentGeneratorSheetTemplate_(sheet) {
  sheet.clear();
  sheet.setHiddenGridlines(true);
  sheet
    .getRange("A1:F2")
    .merge()
    .setValue("SAMPLE PROJECT SERVICES")
    .setFontSize(18)
    .setFontWeight("bold")
    .setBackground("#16324f")
    .setFontColor("#ffffff");
  sheet
    .getRange("A3:F3")
    .merge()
    .setValue("Project confirmation")
    .setFontSize(14)
    .setFontWeight("bold");
  const rows = [
    ["Reference", "", "{{REFERENCE}}", "", "", ""],
    ["Created", "", "{{CREATED_DATE}}", "", "", ""],
    ["Customer", "", "{{CUSTOMER_NAME}}", "", "", ""],
    ["Address", "", "{{CUSTOMER_ADDRESS}}", "", "", ""],
    ["Project", "", "{{PROJECT_TITLE}}", "", "", ""],
    ["Start date", "", "{{START_DATE}}", "", "", ""],
    ["Currency", "", "{{CURRENCY}}", "", "{{TOTAL}}", ""],
    ["Notes", "", "{{NOTES}}", "", "", ""],
  ];
  sheet.getRange(5, 1, rows.length, 6).setValues(rows);
  sheet.getRange("A5:A12").setFontWeight("bold").setBackground("#eaf0f6");
  sheet.getRange("C5:F12").setWrap(true);
  sheet.setColumnWidths(1, 6, 105);
  sheet.setRowHeights(5, 8, 34);
}
