/** Generic setup helpers shared by this Apps Script project. */
function requireSetupFolder_() {
  const folderId = String(SETUP_FOLDER_ID || "").trim();
  if (!folderId || folderId === "PASTE_GOOGLE_DRIVE_FOLDER_ID_HERE") {
    throw new Error(
      "Set SETUP_FOLDER_ID at the top of Setup.js before running setupProject().",
    );
  }
  return DriveApp.getFolderById(folderId);
}

function moveSetupFileToFolder_(fileId, folder) {
  const file = DriveApp.getFileById(fileId);
  file.moveTo(folder);
  return file;
}

function ensureSetupSheet_(spreadsheet, name, headers) {
  const sheet =
    spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
  if (headers && headers.length && sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
  if (headers && headers.length) sheet.setFrozenRows(1);
  return sheet;
}

function replaceSetupSheetData_(sheet, values) {
  sheet.clearContents();
  if (values && values.length) {
    sheet.getRange(1, 1, values.length, values[0].length).setValues(values);
  }
}

function saveSetupProperties_(values) {
  PropertiesService.getScriptProperties().setProperties(values, false);
}

function removeSetupTriggers_(handlerNames) {
  ScriptApp.getProjectTriggers()
    .filter(function (trigger) {
      return handlerNames.indexOf(trigger.getHandlerFunction()) !== -1;
    })
    .forEach(function (trigger) {
      ScriptApp.deleteTrigger(trigger);
    });
}

function requiredDashboardProperty_(name) {
  const value = String(
    PropertiesService.getScriptProperties().getProperty(name) || "",
  ).trim();
  if (!value) throw new Error("Missing Script Property: " + name);
  return value;
}
