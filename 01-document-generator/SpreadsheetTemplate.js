function createPdfFromSpreadsheetTemplate_(config, model, tokens) {
  const templateFile = DriveApp.getFileById(config.spreadsheetTemplateId);
  if (templateFile.getMimeType() !== MimeType.GOOGLE_SHEETS) {
    throw new Error("SPREADSHEET_TEMPLATE_ID must point to a Google Sheet.");
  }

  const sourceSpreadsheet = SpreadsheetApp.openById(
    config.spreadsheetTemplateId,
  );
  const sourceSheet = getSpreadsheetTemplateSheet_(
    sourceSpreadsheet,
    config.spreadsheetTemplateSheetName,
  );
  const temporarySpreadsheet = SpreadsheetApp.create(
    "Temporary PDF source - " + model.reference,
  );
  const temporaryFile = DriveApp.getFileById(temporarySpreadsheet.getId());

  try {
    const copiedSheet = sourceSheet
      .copyTo(temporarySpreadsheet)
      .setName(sourceSheet.getName());
    removeOtherSpreadsheetSheets_(
      temporarySpreadsheet,
      copiedSheet.getSheetId(),
    );
    assertSheetHasTemplateTokens_(copiedSheet, tokens);
    replaceSpreadsheetTokens_(copiedSheet, tokens);
    SpreadsheetApp.flush();

    return temporaryFile
      .getAs(MimeType.PDF)
      .setName(buildGeneratedPdfName_(model, "Google Sheet template"));
  } finally {
    temporaryFile.setTrashed(true);
  }
}

function getSpreadsheetTemplateSheet_(spreadsheet, configuredName) {
  if (configuredName) {
    const configuredSheet = spreadsheet.getSheetByName(configuredName);
    if (!configuredSheet)
      throw new Error("Spreadsheet template tab not found: " + configuredName);
    return configuredSheet;
  }

  const sheets = spreadsheet.getSheets();
  if (!sheets.length)
    throw new Error("The spreadsheet template does not contain a sheet.");
  return sheets[0];
}

function assertSheetHasTemplateTokens_(sheet, tokens) {
  const hasToken = Object.keys(tokens).some(function (key) {
    return Boolean(
      sheet
        .createTextFinder("{{" + key + "}}")
        .matchCase(true)
        .findNext(),
    );
  });

  if (!hasToken)
    throw new Error(
      "The Google Sheet template does not contain any supported {{TOKEN}} placeholders.",
    );
}

function replaceSpreadsheetTokens_(sheet, tokens) {
  Object.keys(tokens).forEach(function (key) {
    sheet
      .createTextFinder("{{" + key + "}}")
      .matchCase(true)
      .useRegularExpression(false)
      .replaceAllWith(String(tokens[key] == null ? "" : tokens[key]));
  });
}

function removeOtherSpreadsheetSheets_(spreadsheet, copiedSheetId) {
  spreadsheet.getSheets().forEach(function (sheet) {
    if (sheet.getSheetId() !== copiedSheetId) spreadsheet.deleteSheet(sheet);
  });
}
