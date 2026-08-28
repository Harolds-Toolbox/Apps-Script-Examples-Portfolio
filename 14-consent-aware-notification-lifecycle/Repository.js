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

function assertLifecycleRecords_(records, idHeader, options) {
  const seen = new Set();
  records.forEach((record) => {
    const id = String(record[idHeader] || "").trim();
    if (!id) throw new Error(`${idHeader} is required on row ${record._row}.`);
    if (seen.has(id)) throw new Error(`Duplicate ${idHeader}: ${id}.`);
    seen.add(id);
    if (options && options.emailHeader) {
      const email = String(record[options.emailHeader] || "").trim();
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        throw new Error(`Invalid email on row ${record._row}.`);
      }
    }
    if (options && options.dateHeader) {
      parseDateValue_(
        record[options.dateHeader],
        `${options.dateHeader} on row ${record._row}`,
      );
    }
  });
}
