function discoverPipelineFiles() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try {
    const folder = DriveApp.getFolderById(filePipelineProperty_('PIPELINE_INBOX_FOLDER_ID'));
    const files = folder.getFiles();
    const queue = fileQueueSheet_();
    ensureFileQueueHeaders_(queue);
    const existingIds = queue.getLastRow() > 1 ? queue.getRange(2, 1, queue.getLastRow() - 1, 1).getDisplayValues()
      .reduce(function (set, row) { if (row[0]) set[row[0]] = true; return set; }, {}) : {};
    const routes = filePipelineRoutes_();
    const rows = [];
    while (files.hasNext()) {
      const file = files.next();
      if (existingIds[file.getId()]) continue;
      const route = findFilePipelineRoute_(file.getName(), routes);
      if (!route) continue;
      rows.push([file.getId(), file.getName(), 'NEW', 0, '', '', route.name, file.getDateCreated(), '', '', '']);
    }
    if (rows.length) queue.getRange(queue.getLastRow() + 1, 1, rows.length, FILE_QUEUE_HEADERS.length).setValues(rows);
  } finally {
    lock.releaseLock();
  }
}

function findFilePipelineRoute_(fileName, routes) {
  for (let index = 0; index < routes.length; index += 1) {
    if (new RegExp(routes[index].filePattern, 'i').test(fileName)) return routes[index];
  }
  return null;
}

function ensureFileQueueHeaders_(sheet) {
  const current = sheet.getRange(1, 1, 1, FILE_QUEUE_HEADERS.length).getValues()[0];
  if (current.join('|') !== FILE_QUEUE_HEADERS.join('|')) sheet.getRange(1, 1, 1, FILE_QUEUE_HEADERS.length).setValues([FILE_QUEUE_HEADERS]);
}
