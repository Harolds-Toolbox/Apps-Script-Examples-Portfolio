function saveRegistrySnapshot_(rows) {
  const folder = DriveApp.getFolderById(
    registryProperty_("REGISTRY_REPORT_FOLDER_ID"),
  );
  const timestamp = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    "yyyy-MM-dd_HH-mm-ss",
  );
  const name = "registry_" + timestamp + ".csv";
  const csv = [REGISTRY_HEADERS]
    .concat(rows)
    .map(function (row) {
      return row.map(registryCsvValue_).join(",");
    })
    .join("\r\n");
  const file = folder.createFile(name, csv, MimeType.CSV);
  return {
    id: file.getId(),
    name: name,
    rowCount: rows.length,
    createdAt: new Date(),
  };
}

function compareRegistrySnapshots_() {
  const snapshots = listRegistrySnapshots_();
  if (snapshots.length < 2)
    return {
      added: [],
      removed: [],
      currentCount: snapshots.length ? snapshots[0].rows.length : 0,
    };
  const current = indexRegistryRows_(snapshots[0].rows);
  const previous = indexRegistryRows_(snapshots[1].rows);
  return {
    added: Object.keys(current)
      .filter(function (key) {
        return !previous[key];
      })
      .map(function (key) {
        return current[key];
      }),
    removed: Object.keys(previous)
      .filter(function (key) {
        return !current[key];
      })
      .map(function (key) {
        return previous[key];
      }),
    currentCount: Object.keys(current).length,
  };
}

function listRegistrySnapshots_() {
  const folder = DriveApp.getFolderById(
    registryProperty_("REGISTRY_REPORT_FOLDER_ID"),
  );
  const files = folder.getFiles();
  const snapshots = [];
  while (files.hasNext()) {
    const file = files.next();
    if (
      !/^registry_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.csv$/.test(
        file.getName(),
      )
    )
      continue;
    const values = Utilities.parseCsv(file.getBlob().getDataAsString());
    snapshots.push({
      file: file,
      createdAt: file.getDateCreated(),
      rows: values.slice(1),
    });
  }
  return snapshots.sort(function (left, right) {
    return right.createdAt.getTime() - left.createdAt.getTime();
  });
}

function cleanupRegistrySnapshots() {
  listRegistrySnapshots_()
    .slice(REGISTRY_CONFIG.retainedSnapshots)
    .forEach(function (snapshot) {
      snapshot.file.setTrashed(true);
    });
}

function indexRegistryRows_(rows) {
  return (rows || []).reduce(function (index, row) {
    if (row[0]) index[String(row[0])] = row;
    return index;
  }, {});
}

function registryCsvValue_(value) {
  const text = String(value == null ? "" : value);
  return /[",\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
}
