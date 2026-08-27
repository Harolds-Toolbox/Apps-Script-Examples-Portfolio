function doPost(event) {
  try {
    const body = event.postData && event.postData.contents ? event.postData.contents : '';
    const signature = String((event.parameter && event.parameter.signature) || '');
    if (!isValidSignature_(body, signature)) return jsonResponse_({ ok: false }, 401);

    const payload = JSON.parse(body);
    queueWebhook_(payload);
    return jsonResponse_({ ok: true }, 202);
  } catch (error) {
    console.error(JSON.stringify({ event: 'webhook_rejected', message: error.message }));
    return jsonResponse_({ ok: false }, 400);
  }
}

function queueWebhook_(payload) {
  const sheet = getQueueSheet_();
  const eventId = String(payload.id || Utilities.getUuid());
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    const finder = sheet.getRange('A:A').createTextFinder(eventId).matchEntireCell(true).findNext();
    if (!finder) sheet.appendRow([eventId, new Date(), 'PENDING', JSON.stringify(payload), '', '']);
  } finally {
    lock.releaseLock();
  }
}

function processWebhookQueue() {
  const sheet = getQueueSheet_();
  const values = sheet.getDataRange().getValues();

  values.slice(1).forEach(function (row, index) {
    if (row[2] !== 'PENDING') return;
    const rowNumber = index + 2;
    try {
      routeWebhookEvent_(JSON.parse(row[3]));
      sheet.getRange(rowNumber, 3, 1, 4).setValues([['DONE', row[3], new Date(), '']]);
    } catch (error) {
      sheet.getRange(rowNumber, 3, 1, 4).setValues([['ERROR', row[3], new Date(), error.message]]);
    }
  });
}

function routeWebhookEvent_(payload) {
  const handlers = {
    'record.created': function (data) { console.log('Create ' + String(data.recordId)); },
    'record.updated': function (data) { console.log('Update ' + String(data.recordId)); }
  };
  if (!handlers[payload.type]) throw new Error('Unsupported event type');
  handlers[payload.type](payload.data || {});
}

function isValidSignature_(body, supplied) {
  const secret = getWebhookProperty_('WEBHOOK_SECRET');
  const bytes = Utilities.computeHmacSha256Signature(body, secret);
  const expected = bytes.map(function (byte) {
    return ('0' + (byte & 255).toString(16)).slice(-2);
  }).join('');
  if (expected.length !== supplied.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i += 1) mismatch |= expected.charCodeAt(i) ^ supplied.charCodeAt(i);
  return mismatch === 0;
}

function getQueueSheet_() {
  return SpreadsheetApp.openById(getWebhookProperty_('QUEUE_SPREADSHEET_ID')).getSheetByName('Webhook Queue');
}

function installWebhookProcessor() {
  ScriptApp.newTrigger('processWebhookQueue').timeBased().everyMinutes(5).create();
}

function jsonResponse_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}

function getWebhookProperty_(name) {
  const value = PropertiesService.getScriptProperties().getProperty(name);
  if (!value) throw new Error('Missing Script Property: ' + name);
  return value;
}
