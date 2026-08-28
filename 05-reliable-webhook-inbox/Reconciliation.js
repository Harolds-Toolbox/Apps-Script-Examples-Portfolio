function reconcileWebhookChanges() {
  const baseUrl = webhookProperty_("RECONCILIATION_API_URL", true);
  if (!baseUrl) return;
  const properties = PropertiesService.getScriptProperties();
  const checkpoint =
    properties.getProperty("RECONCILIATION_CHECKPOINT") ||
    new Date(
      Date.now() - WEBHOOK_CONFIG.reconciliationLookbackMinutes * 60 * 1000,
    ).toISOString();
  const startedAt = new Date();
  const response = webhookReconciliationFetch_(
    baseUrl +
      (baseUrl.indexOf("?") === -1 ? "?" : "&") +
      "since=" +
      encodeURIComponent(checkpoint),
  );
  const events = Array.isArray(response.events) ? response.events : [];
  events.forEach(function (payload) {
    const raw = JSON.stringify(payload);
    validateWebhookPayload_(payload, raw);
    enqueueWebhookPayload_(payload, raw, "RECONCILIATION");
  });
  properties.setProperty("RECONCILIATION_CHECKPOINT", startedAt.toISOString());
  flushWebhookQueue();
}

function webhookReconciliationFetch_(url) {
  const token = webhookProperty_("RECONCILIATION_API_TOKEN");
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    const response = UrlFetchApp.fetch(url, {
      headers: { Authorization: "Bearer " + token },
      muteHttpExceptions: true,
    });
    const status = response.getResponseCode();
    if (status >= 200 && status < 300)
      return JSON.parse(response.getContentText() || "{}");
    lastError = new Error("Reconciliation API returned HTTP " + status);
    if ([429, 500, 502, 503, 504].indexOf(status) === -1) throw lastError;
    Utilities.sleep(500 * Math.pow(2, attempt - 1));
  }
  throw lastError;
}
