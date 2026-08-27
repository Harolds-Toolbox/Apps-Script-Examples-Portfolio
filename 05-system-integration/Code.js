function syncChangedRecords() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try {
    const sheet = SpreadsheetApp.openById(syncProperty_('SYNC_SPREADSHEET_ID')).getSheetByName('Outbound Sync');
    const rows = sheet.getDataRange().getValues();
    rows.slice(1).forEach(function (row, index) {
      if (row[3] !== true) return;
      const rowNumber = index + 2;
      try {
        const response = upsertRemoteRecord_({ localId: row[0], name: row[1], email: row[2] });
        sheet.getRange(rowNumber, 4, 1, 4).setValues([[false, response.id, new Date(), 'SYNCED']]);
      } catch (error) {
        sheet.getRange(rowNumber, 7).setValue('ERROR: ' + error.message);
      }
    });
  } finally {
    lock.releaseLock();
  }
}

function upsertRemoteRecord_(record) {
  if (!record.localId) throw new Error('Local ID is required');
  const response = UrlFetchApp.fetch('https://api.example.com/v1/records/upsert', {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + syncProperty_('DESTINATION_API_TOKEN'),
      'Idempotency-Key': String(record.localId)
    },
    payload: JSON.stringify(record),
    muteHttpExceptions: true
  });
  const status = response.getResponseCode();
  if (status < 200 || status >= 300) throw new Error('Destination returned HTTP ' + status);
  return JSON.parse(response.getContentText());
}

function syncProperty_(name) {
  const value = PropertiesService.getScriptProperties().getProperty(name);
  if (!value) throw new Error('Missing Script Property: ' + name);
  return value;
}
