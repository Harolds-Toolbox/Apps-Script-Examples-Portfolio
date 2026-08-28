// Main flow: discover → queue → validate → stage → publish or retry.
function runFilePipeline() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  const startedAt = Date.now();
  try {
    discoverPipelineFilesUnlocked_();
    const sheet = fileQueueSheet_();
    ensureFileQueueHeaders_(sheet);
    const values = sheet.getDataRange().getValues();
    const routes = filePipelineRoutes_().reduce(function (index, route) {
      index[route.name] = route;
      return index;
    }, {});
    let processed = 0;
    for (
      let index = 1;
      index < values.length && processed < FILE_PIPELINE.batchSize;
      index += 1
    ) {
      if (Date.now() - startedAt > FILE_PIPELINE.maxRunMilliseconds) break;
      const row = values[index];
      const status = String(row[2] || "").toUpperCase();
      const retryAt = row[4] instanceof Date ? row[4] : null;
      if (
        status !== "NEW" &&
        !(status === "RETRY" && (!retryAt || retryAt <= new Date()))
      )
        continue;
      processFileQueueRow_(sheet, index + 1, row, routes[String(row[6])]);
      processed += 1;
    }
  } finally {
    lock.releaseLock();
  }
}

function discoverPipelineFilesUnlocked_() {
  const folder = DriveApp.getFolderById(
    filePipelineProperty_("PIPELINE_INBOX_FOLDER_ID"),
  );
  const files = folder.getFiles();
  const queue = fileQueueSheet_();
  ensureFileQueueHeaders_(queue);
  const existing =
    queue.getLastRow() > 1
      ? queue
          .getRange(2, 1, queue.getLastRow() - 1, 1)
          .getDisplayValues()
          .reduce(function (set, row) {
            if (row[0]) set[row[0]] = true;
            return set;
          }, {})
      : {};
  const routes = filePipelineRoutes_();
  const rows = [];
  while (files.hasNext()) {
    const file = files.next();
    const route = findFilePipelineRoute_(file.getName(), routes);
    if (!existing[file.getId()] && route)
      rows.push([
        file.getId(),
        file.getName(),
        "NEW",
        0,
        "",
        "",
        route.name,
        file.getDateCreated(),
        "",
        "",
        "",
      ]);
  }
  if (rows.length)
    queue
      .getRange(
        queue.getLastRow() + 1,
        1,
        rows.length,
        FILE_QUEUE_HEADERS.length,
      )
      .setValues(rows);
}

function processFileQueueRow_(sheet, rowNumber, row, route) {
  const attempts = Number(row[3] || 0) + 1;
  sheet.getRange(rowNumber, 3, 1, 2).setValues([["PROCESSING", attempts]]);
  try {
    if (!route) throw new Error("Configured route was not found.");
    const values = parsePipelineFile_(String(row[0]), String(row[1]));
    const schema = validatePipelineSchema_(values, route);
    loadPipelineDestination_(values, route);
    sheet
      .getRange(rowNumber, 3, 1, 9)
      .setValues([
        [
          "DONE",
          attempts,
          "",
          "",
          route.name,
          row[7],
          new Date(),
          schema.hash,
          schema.rowCount,
        ],
      ]);
  } catch (error) {
    const terminal = attempts >= FILE_PIPELINE.maxAttempts;
    const retryAt = terminal
      ? ""
      : new Date(
          Date.now() +
            FILE_PIPELINE.retryBaseMinutes *
              Math.pow(2, attempts - 1) *
              60 *
              1000,
        );
    sheet
      .getRange(rowNumber, 3, 1, 4)
      .setValues([
        [
          terminal ? "DEAD" : "RETRY",
          attempts,
          retryAt,
          String(error.message || error).slice(0, 500),
        ],
      ]);
  }
}
