// Runtime configuration and Script Property names normally adjusted per deployment.
function reconciliationConfig_() {
  const p = PropertiesService.getScriptProperties(),
    required = [
      "SOURCE_A_URL",
      "SOURCE_A_TOKEN",
      "SOURCE_B_URL",
      "SOURCE_B_TOKEN",
      "RECONCILIATION_ALERT_RECIPIENT",
    ];
  const missing = required.filter((k) => !p.getProperty(k));
  if (missing.length)
    throw new Error("Missing Script Properties: " + missing.join(", "));
  return {
    sourceA: {
      url: p.getProperty("SOURCE_A_URL"),
      token: p.getProperty("SOURCE_A_TOKEN"),
    },
    sourceB: {
      url: p.getProperty("SOURCE_B_URL"),
      token: p.getProperty("SOURCE_B_TOKEN"),
    },
    recipient: p.getProperty("RECONCILIATION_ALERT_RECIPIENT"),
    ageHours: Number(p.getProperty("RECONCILIATION_AGE_HOURS") || 24),
    sheetId: p.getProperty("RECONCILIATION_SPREADSHEET_ID") || "",
  };
}
