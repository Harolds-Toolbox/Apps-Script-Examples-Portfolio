function parsePipelineFile_(fileId, fileName) {
  const file = DriveApp.getFileById(fileId);
  if (/\.csv$/i.test(fileName))
    return normalizePipelineTable_(
      Utilities.parseCsv(removePipelineBom_(file.getBlob().getDataAsString())),
    );
  if (/\.xlsx$/i.test(fileName)) return parsePipelineXlsx_(file);
  throw new Error("Unsupported file type: " + fileName);
}

function parsePipelineXlsx_(file) {
  let convertedId = "";
  try {
    const metadata = {
      name: "temporary_pipeline_" + Utilities.getUuid(),
      mimeType: MimeType.GOOGLE_SHEETS,
    };
    const converted = Drive.Files.create(metadata, file.getBlob(), {
      fields: "id",
    });
    convertedId = converted.id;
    const source = SpreadsheetApp.openById(convertedId).getSheets()[0];
    return normalizePipelineTable_(source.getDataRange().getValues());
  } finally {
    if (convertedId) DriveApp.getFileById(convertedId).setTrashed(true);
  }
}

function normalizePipelineTable_(values) {
  const rows = (values || [])
    .map(function (row) {
      const copy = row.slice();
      while (copy.length && String(copy[copy.length - 1]) === "") copy.pop();
      return copy;
    })
    .filter(function (row) {
      return row.some(function (value) {
        return String(value) !== "";
      });
    });
  if (!rows.length) throw new Error("The file contains no data.");
  const width = rows.reduce(function (max, row) {
    return Math.max(max, row.length);
  }, 0);
  return rows.map(function (row) {
    const copy = row.slice();
    while (copy.length < width) copy.push("");
    return copy;
  });
}

function removePipelineBom_(text) {
  return String(text || "").replace(/^\uFEFF/, "");
}
