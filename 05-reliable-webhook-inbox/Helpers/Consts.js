// Runtime configuration and Script Property names normally adjusted per deployment.
const WEBHOOK_CONFIG = Object.freeze({
  inboxSheet: "Webhook Inbox",
  queuePrefix: "WEBHOOK_QUEUE:",
  dedupPrefix: "WEBHOOK_SEEN:",
  allowedClockSkewSeconds: 300,
  maxPayloadCharacters: 7500,
  maxAttempts: 5,
  processorBatchSize: 25,
  retryBaseSeconds: 60,
  reconciliationLookbackMinutes: 15,
});

const WEBHOOK_HEADERS = Object.freeze([
  "Received At",
  "Event ID",
  "Event Type",
  "Payload JSON",
  "Status",
  "Attempts",
  "Next Retry At",
  "Last Error",
  "Processed At",
  "Source",
]);

function webhookProperty_(name, optional) {
  const value = String(
    PropertiesService.getScriptProperties().getProperty(name) || "",
  ).trim();
  if (!value && !optional) throw new Error("Missing Script Property: " + name);
  return value;
}

function webhookInbox_() {
  const sheet = SpreadsheetApp.openById(
    webhookProperty_("WEBHOOK_SPREADSHEET_ID"),
  ).getSheetByName(WEBHOOK_CONFIG.inboxSheet);
  if (!sheet) throw new Error("Missing sheet: " + WEBHOOK_CONFIG.inboxSheet);
  return sheet;
}
