function updateRecordHistory_(records) {
  const ss = SpreadsheetApp.openById(entityConfig_().spreadsheetId),
    sheet = ss.getSheetByName(ENTITY.history) || ss.insertSheet(ENTITY.history);
  const headers = [
    "Observed At",
    "Source",
    "Record ID",
    "Fingerprint",
    "Record JSON",
  ];
  if (!sheet.getLastRow()) sheet.appendRow(headers);
  const existing = new Set(
    sheet.getLastRow() < 2
      ? []
      : sheet
          .getRange(2, 4, sheet.getLastRow() - 1, 1)
          .getValues()
          .flat()
          .map(String),
  );
  const rows = records
    .map((record) => {
      const json = stableEntityJson_(record.fields),
        fingerprint = digestEntity_(
          record.source + "|" + record.id + "|" + json,
        );
      return existing.has(fingerprint)
        ? null
        : [new Date(), record.source, record.id, fingerprint, json];
    })
    .filter(Boolean);
  if (rows.length)
    sheet
      .getRange(sheet.getLastRow() + 1, 1, rows.length, headers.length)
      .setValues(rows);
}

function stableEntityJson_(value) {
  if (Array.isArray(value))
    return "[" + value.map(stableEntityJson_).join(",") + "]";
  if (value && typeof value === "object")
    return (
      "{" +
      Object.keys(value)
        .sort()
        .map((k) => JSON.stringify(k) + ":" + stableEntityJson_(value[k]))
        .join(",") +
      "}"
    );
  return JSON.stringify(value);
}
function digestEntity_(value) {
  return Utilities.base64EncodeWebSafe(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value),
  ).replace(/=+$/, "");
}
