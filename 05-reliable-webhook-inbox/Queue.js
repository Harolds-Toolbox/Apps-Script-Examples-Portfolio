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
    const sheet = webhookInbox_();
    ensureWebhookHeaders_(sheet);
    const durableEventIds = webhookInboxEventIds_(sheet);
    const rows = [];
    const eventIdsToMark = [];
    const keysToDeleteAfterCommit = [];
    keys.forEach(function (key) {
      try {
        const item = JSON.parse(all[key]);
        const eventId = String(item.eventId || "");
        if (!eventId) throw new Error("Queued event is missing its event ID.");
        const alreadySeen = isWebhookEventSeen_(eventId);
        if (!alreadySeen && !durableEventIds[eventId]) {
          rows.push([
            new Date(item.receivedAt),
            eventId,
            item.eventType,
            item.rawBody,
            "NEW",
            0,
            "",
            "",
            "",
            item.source,
          ]);
          eventIdsToMark.push(eventId);
          durableEventIds[eventId] = true;
        } else if (!alreadySeen) {
          eventIdsToMark.push(eventId);
        }
        keysToDeleteAfterCommit.push(key);
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
    if (rows.length) {
      sheet
        .getRange(sheet.getLastRow() + 1, 1, rows.length, WEBHOOK_HEADERS.length)
        .setValues(rows);
      SpreadsheetApp.flush();
    }

    // The Sheet is the durable commit point. If execution stops before this
    // cleanup, the next run sees the event IDs already in the Sheet and safely
    // removes the retained property entries without appending duplicates.
    eventIdsToMark.forEach(markWebhookEventSeen_);
    keysToDeleteAfterCommit.forEach(function (key) {
      properties.deleteProperty(key);
    });
  } finally {
    lock.releaseLock();
  }
}

function webhookInboxEventIds_(sheet) {
  if (sheet.getLastRow() < 2) return {};
  return sheet
    .getRange(2, 2, sheet.getLastRow() - 1, 1)
    .getDisplayValues()
    .reduce(function (index, row) {
      const eventId = String(row[0] || "").trim();
      if (eventId) index[eventId] = true;
      return index;
    }, {});
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
