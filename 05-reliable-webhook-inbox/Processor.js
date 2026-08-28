function processWebhookInbox() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try {
    const sheet = webhookInbox_();
    ensureWebhookHeaders_(sheet);
    const values = sheet.getDataRange().getValues();
    const now = new Date();
    let processed = 0;
    for (
      let index = 1;
      index < values.length && processed < WEBHOOK_CONFIG.processorBatchSize;
      index += 1
    ) {
      const row = values[index];
      const status = String(row[4] || "").toUpperCase();
      const nextRetry = row[6] instanceof Date ? row[6] : null;
      if (
        status !== "NEW" &&
        !(status === "RETRY" && (!nextRetry || nextRetry <= now))
      )
        continue;
      processWebhookRow_(sheet, index + 1, row);
      processed += 1;
    }
  } finally {
    lock.releaseLock();
  }
}

function processWebhookRow_(sheet, rowNumber, row) {
  const attempts = Number(row[5] || 0) + 1;
  sheet.getRange(rowNumber, 5, 1, 2).setValues([["PROCESSING", attempts]]);
  try {
    const payload = JSON.parse(String(row[3] || "{}"));
    routeWebhookPayload_(payload);
    sheet
      .getRange(rowNumber, 5, 1, 5)
      .setValues([["DONE", attempts, "", "", new Date()]]);
  } catch (error) {
    const terminal = attempts >= WEBHOOK_CONFIG.maxAttempts;
    const retryAt = terminal
      ? ""
      : new Date(
          Date.now() +
            WEBHOOK_CONFIG.retryBaseSeconds * Math.pow(2, attempts - 1) * 1000,
        );
    sheet
      .getRange(rowNumber, 5, 1, 5)
      .setValues([
        [
          terminal ? "DEAD" : "RETRY",
          attempts,
          retryAt,
          String(error.message || error).slice(0, 500),
          "",
        ],
      ]);
  }
}

function routeWebhookPayload_(payload) {
  const handlers = {
    "record.created": handleWebhookRecordCreated_,
    "record.updated": handleWebhookRecordUpdated_,
    "record.deleted": handleWebhookRecordDeleted_,
  };
  const handler = handlers[payload.type];
  if (!handler) throw new Error("Unsupported event type: " + payload.type);
  handler(payload.data || {}, payload);
}

function handleWebhookRecordCreated_(data, event) {
  console.log(
    JSON.stringify({
      event: "record_created_processed",
      eventId: event.id,
      recordId: String(data.recordId || ""),
    }),
  );
}

function handleWebhookRecordUpdated_(data, event) {
  console.log(
    JSON.stringify({
      event: "record_updated_processed",
      eventId: event.id,
      recordId: String(data.recordId || ""),
    }),
  );
}

function handleWebhookRecordDeleted_(data, event) {
  console.log(
    JSON.stringify({
      event: "record_deleted_processed",
      eventId: event.id,
      recordId: String(data.recordId || ""),
    }),
  );
}
