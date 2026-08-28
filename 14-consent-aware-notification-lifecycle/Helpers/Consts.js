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
      "Delivery At",
    ],
    tokens: [
      "Token Hash",
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
  const tokenHours = Number(p.getProperty("LIFECYCLE_TOKEN_HOURS") || 72),
    retentionDays = Number(
      p.getProperty("LIFECYCLE_RETENTION_DAYS") || 365,
    );
  if (!/^https:\/\/.+\/exec(?:$|[?#])/.test(webAppUrl)) {
    throw new Error("LIFECYCLE_WEB_APP_URL must be a deployed HTTPS /exec URL.");
  }
  if (!/^\S+@\S+\.\S+$/.test(reviewer)) {
    throw new Error("LIFECYCLE_REVIEWER_EMAIL must be a valid email address.");
  }
  if (!Number.isFinite(tokenHours) || tokenHours < 1 || tokenHours > 720) {
    throw new Error("LIFECYCLE_TOKEN_HOURS must be between 1 and 720.");
  }
  if (
    !Number.isFinite(retentionDays) ||
    retentionDays < 1 ||
    retentionDays > 3650
  ) {
    throw new Error("LIFECYCLE_RETENTION_DAYS must be between 1 and 3650.");
  }
  return {
    spreadsheetId,
    webAppUrl,
    reviewer,
    tokenHours,
    retentionDays,
  };
}
