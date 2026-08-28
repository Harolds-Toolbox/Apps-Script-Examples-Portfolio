// Runtime configuration and Script Property names normally adjusted per deployment.
function webhookManagerConfig_() {
  const p = PropertiesService.getScriptProperties(),
    required = [
      "WEBHOOK_PROVIDER_BASE_URL",
      "WEBHOOK_PROVIDER_TOKEN",
      "WEBHOOK_CALLBACK_URL",
      "WEBHOOK_SIGNING_SECRET",
    ];
  const missing = required.filter((k) => !p.getProperty(k));
  if (missing.length)
    throw new Error("Missing Script Properties: " + missing.join(", "));
  return {
    baseUrl: p.getProperty("WEBHOOK_PROVIDER_BASE_URL").replace(/\/$/, ""),
    token: p.getProperty("WEBHOOK_PROVIDER_TOKEN"),
    callbackUrl: p.getProperty("WEBHOOK_CALLBACK_URL"),
    secret: p.getProperty("WEBHOOK_SIGNING_SECRET"),
    events: JSON.parse(
      p.getProperty("WEBHOOK_EVENTS_JSON") ||
        '["record.created","record.updated"]',
    ),
    scope: JSON.parse(p.getProperty("WEBHOOK_SCOPE_JSON") || "{}"),
    alert: p.getProperty("WEBHOOK_ALERT_RECIPIENT") || "",
    failureThreshold: Number(p.getProperty("WEBHOOK_FAILURE_THRESHOLD") || 3),
  };
}
