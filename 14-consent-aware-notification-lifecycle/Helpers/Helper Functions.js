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

function parseDateValue_(value, label) {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return new Date(value.getTime());
  }
  const text = String(value || "").trim(),
    dayFirst = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/),
    yearFirst = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  let year, month, day;
  if (dayFirst) {
    day = Number(dayFirst[1]);
    month = Number(dayFirst[2]);
    year = Number(dayFirst[3]);
  } else if (yearFirst) {
    year = Number(yearFirst[1]);
    month = Number(yearFirst[2]);
    day = Number(yearFirst[3]);
  } else {
    throw new Error(`${label || "Date"} must use DD/MM/YYYY or YYYY-MM-DD.`);
  }
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    throw new Error(`${label || "Date"} is not a valid calendar date.`);
  }
  return parsed;
}

function formatDateValue_(value, label) {
  return Utilities.formatDate(
    parseDateValue_(value, label),
    Session.getScriptTimeZone(),
    "d MMM yyyy",
  );
}
