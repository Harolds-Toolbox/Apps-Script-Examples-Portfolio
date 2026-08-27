function doGet() {
  return ContentService.createTextOutput('Webhook receiver ready').setMimeType(ContentService.MimeType.TEXT);
}

function doPost(event) {
  try {
    const body = event && event.postData ? String(event.postData.contents || '') : '';
    const parameters = event && event.parameter ? event.parameter : {};
    verifyWebhookSignature_(body, parameters.timestamp, parameters.signature);
    const payload = JSON.parse(body);
    validateWebhookPayload_(payload, body);
    enqueueWebhookPayload_(payload, body, 'WEBHOOK');
    return webhookJson_({ ok: true, accepted: true, eventId: payload.id });
  } catch (error) {
    console.warn(JSON.stringify({ event: 'webhook_rejected', message: error.message }));
    return webhookJson_({ ok: false, accepted: false, error: error.message });
  }
}

function verifyWebhookSignature_(body, timestamp, supplied) {
  const numericTimestamp = Number(timestamp);
  if (!isFinite(numericTimestamp)) throw new Error('Missing or invalid timestamp.');
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - numericTimestamp) > WEBHOOK_CONFIG.allowedClockSkewSeconds) throw new Error('Webhook timestamp is outside the allowed window.');
  const secret = webhookProperty_('WEBHOOK_SIGNING_SECRET');
  if (secret.length < 32) throw new Error('WEBHOOK_SIGNING_SECRET must contain at least 32 characters.');
  const bytes = Utilities.computeHmacSha256Signature(String(timestamp) + '.' + body, secret);
  const expected = bytes.map(function (byte) { return ('0' + (byte & 255).toString(16)).slice(-2); }).join('');
  if (!webhookConstantTimeEqual_(expected, String(supplied || '').toLowerCase())) throw new Error('Invalid webhook signature.');
}

function validateWebhookPayload_(payload, rawBody) {
  if (!payload || typeof payload !== 'object') throw new Error('Payload must be a JSON object.');
  if (!/^[A-Za-z0-9_.:-]{3,160}$/.test(String(payload.id || ''))) throw new Error('Payload requires a valid event ID.');
  if (!/^[a-z0-9_.-]{3,100}$/.test(String(payload.type || ''))) throw new Error('Payload requires a valid event type.');
  if (rawBody.length > WEBHOOK_CONFIG.maxPayloadCharacters) throw new Error('Payload is too large for the fast queue.');
}

function webhookConstantTimeEqual_(left, right) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return mismatch === 0;
}

function webhookJson_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
