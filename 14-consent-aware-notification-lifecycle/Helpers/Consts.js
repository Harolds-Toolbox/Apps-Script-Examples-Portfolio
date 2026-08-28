// Runtime configuration and Script Property names normally adjusted per deployment.
const LIFECYCLE = Object.freeze({
  subscribers: "Subscribers",
  opportunities: "Opportunities",
  queue: "Notification Queue",
  tokens: "_Lifecycle Tokens",
  audit: "Audit Log",
  headers: {
    subscribers: [
      "Subscriber ID",
      "Name",
      "Email",
      "Categories",
      "Regions",
      "Consent Status",
      "Consent At",
      "Retention Review At",
    ],
    opportunities: [
      "Opportunity ID",
      "Title",
      "Category",
      "Region",
      "Closing At",
      "Status",
      "Review Requested At",
      "Notified At",
    ],
    queue: [
      "Batch ID",
      "Opportunity ID",
      "Subscriber ID",
      "Decision",
      "Sent At",
    ],
    tokens: [
      "Token",
      "Purpose",
      "Subject ID",
      "Context ID",
      "Expires At",
      "Used At",
    ],
    audit: ["Timestamp", "Subject ID", "Action", "Detail"],
  },
});
function lifecycleConfig_() {
  const p = PropertiesService.getScriptProperties(),
    spreadsheetId = p.getProperty("LIFECYCLE_SPREADSHEET_ID"),
    webAppUrl = p.getProperty("LIFECYCLE_WEB_APP_URL"),
    reviewer = p.getProperty("LIFECYCLE_REVIEWER_EMAIL");
  if (!spreadsheetId || !webAppUrl || !reviewer)
    throw new Error(
      "Set LIFECYCLE_SPREADSHEET_ID, LIFECYCLE_WEB_APP_URL and LIFECYCLE_REVIEWER_EMAIL.",
    );
  return {
    spreadsheetId,
    webAppUrl,
    reviewer,
    tokenHours: Number(p.getProperty("LIFECYCLE_TOKEN_HOURS") || 72),
    retentionDays: Number(p.getProperty("LIFECYCLE_RETENTION_DAYS") || 365),
  };
}
