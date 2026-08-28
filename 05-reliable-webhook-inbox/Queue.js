function enqueueWebhookPayload_(payload, rawBody, source) {
  const properties = PropertiesService.getScriptProperties();
  const key =
    WEBHOOK_CONFIG.queuePrefix + Date.now() + ":" + Utilities.getUuid();
  properties.setProperty(
    key,
    JSON.stringify({
      receivedAt: new Date().toISOString(),
      eventId: String(payload.id),
      eventType: String(payload.type),
      rawBody: String(rawBody),
      source: source || "WEBHOOK",
    }),
  );
}

function flushWebhookQueue() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try {
    const properties = PropertiesService.getScriptProperties();
    const all = properties.getProperties();
    const keys = Object.keys(all)
      .filter(function (key) {
        return key.indexOf(WEBHOOK_CONFIG.queuePrefix) === 0;
      })
      .sort();
    if (!keys.length) return;
    const rows = [];
    keys.forEach(function (key) {
      try {
        const item = JSON.parse(all[key]);
        if (!isWebhookEventSeen_(item.eventId)) {
          rows.push([
            new Date(item.receivedAt),
            item.eventId,
            item.eventType,
            item.rawBody,
            "NEW",
            0,
            "",
            "",
            "",
            item.source,
          ]);
          markWebhookEventSeen_(item.eventId);
        }
        properties.deleteProperty(key);
      } catch (error) {
        console.error(
          JSON.stringify({
            event: "webhook_queue_item_invalid",
            key: key,
            message: error.message,
          }),
        );
      }
    });
    if (!rows.length) return;
    const sheet = webhookInbox_();
    ensureWebhookHeaders_(sheet);
    sheet
      .getRange(sheet.getLastRow() + 1, 1, rows.length, WEBHOOK_HEADERS.length)
      .setValues(rows);
  } finally {
    lock.releaseLock();
  }
}

function isWebhookEventSeen_(eventId) {
  return Boolean(
    PropertiesService.getScriptProperties().getProperty(
      WEBHOOK_CONFIG.dedupPrefix + eventId,
    ),
  );
}

function markWebhookEventSeen_(eventId) {
  PropertiesService.getScriptProperties().setProperty(
    WEBHOOK_CONFIG.dedupPrefix + eventId,
    new Date().toISOString(),
  );
}

function cleanupWebhookDedupKeys() {
  const properties = PropertiesService.getScriptProperties();
  const all = properties.getProperties();
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  Object.keys(all).forEach(function (key) {
    if (key.indexOf(WEBHOOK_CONFIG.dedupPrefix) !== 0) return;
    if (new Date(all[key]).getTime() < cutoff) properties.deleteProperty(key);
  });
}

function ensureWebhookHeaders_(sheet) {
  const current = sheet
    .getRange(1, 1, 1, WEBHOOK_HEADERS.length)
    .getValues()[0];
  if (current.join("|") !== WEBHOOK_HEADERS.join("|"))
    sheet
      .getRange(1, 1, 1, WEBHOOK_HEADERS.length)
      .setValues([WEBHOOK_HEADERS]);
}
