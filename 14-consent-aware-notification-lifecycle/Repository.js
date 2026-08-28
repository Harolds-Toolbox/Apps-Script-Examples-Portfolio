function lifecycleSheets_() {
  const ss = SpreadsheetApp.openById(lifecycleConfig_().spreadsheetId),
    result = {};
  Object.keys(LIFECYCLE.headers).forEach(
    (key) => (result[key] = ss.getSheetByName(LIFECYCLE[key])),
  );
  return result;
}
function lifecycleObjects_(key) {
  const sheet = lifecycleSheets_()[key],
    headers = LIFECYCLE.headers[key];
  if (sheet.getLastRow() < 2) return [];
  return sheet
    .getRange(2, 1, sheet.getLastRow() - 1, headers.length)
    .getValues()
    .map((values, index) => {
      const object = { _row: index + 2 };
      headers.forEach((header, i) => (object[header] = values[i]));
      return object;
    });
}
function auditLifecycle_(subjectId, action, detail) {
  lifecycleSheets_().audit.appendRow([
    new Date(),
    subjectId,
    action,
    detail || "",
  ]);
}
