function readEntitySources_() {
  const config = entityConfig_(),
    ss = SpreadsheetApp.openById(config.spreadsheetId),
    records = [];
  config.sources.forEach((source) => {
    const sheet = ss.getSheetByName(source.sheet);
    if (!sheet || sheet.getLastRow() < 2) return;
    const data = sheet.getDataRange().getValues(),
      headers = data.shift().map(String),
      idIndex = headers.indexOf(source.id);
    if (idIndex < 0)
      throw new Error(
        'Missing ID header "' + source.id + '" in ' + source.sheet,
      );
    data
      .filter((row) => row.some((value) => value !== ""))
      .forEach((row) => {
        const fields = {};
        headers.forEach(
          (header, i) => (fields[header] = serialiseEntityValue_(row[i])),
        );
        records.push({
          source: source.sheet,
          id: String(row[idIndex]),
          fields,
        });
      });
  });
  return records;
}

function writeEntitySnapshot_(records) {
  const config = entityConfig_(),
    folder = DriveApp.getFolderById(config.snapshotFolderId),
    stamp = Utilities.formatDate(new Date(), "UTC", "yyyyMMdd-HHmmss");
  folder.createFile(
    "entity-snapshot-" + stamp + ".json",
    JSON.stringify({ createdAt: new Date().toISOString(), records }, null, 2),
    MimeType.PLAIN_TEXT,
  );
  const files = [];
  const all = folder.getFiles();
  while (all.hasNext()) {
    const file = all.next();
    if (/^entity-snapshot-.*\.json$/.test(file.getName())) files.push(file);
  }
  files
    .sort((a, b) => b.getDateCreated() - a.getDateCreated())
    .slice(config.retention)
    .forEach((file) => file.setTrashed(true));
}

function serialiseEntityValue_(value) {
  return value instanceof Date ? value.toISOString() : value;
}
