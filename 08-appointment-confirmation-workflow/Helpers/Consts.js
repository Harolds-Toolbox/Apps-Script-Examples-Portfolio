// Runtime configuration and Script Property names normally adjusted per deployment.
const APPOINTMENT = Object.freeze({
  sheet: "Appointments",
  tokenSheet: "_Response Tokens",
  auditSheet: "Audit Log",
  headers: [
    "Appointment ID",
    "Participant Name",
    "Participant Email",
    "Coordinator Email",
    "Appointment At",
    "Location",
    "Status",
    "Reminder Sent At",
    "Response At",
  ],
  tokenHeaders: ["Token", "Appointment ID", "Expires At", "Used At"],
  auditHeaders: ["Timestamp", "Appointment ID", "Action", "Detail"],
  statuses: {
    pending: "Pending",
    confirmed: "Confirmed",
    cancelled: "Cancelled",
  },
});

function appointmentConfig_() {
  const p = PropertiesService.getScriptProperties();
  const spreadsheetId = p.getProperty("APPOINTMENT_SPREADSHEET_ID");
  const webAppUrl = p.getProperty("APPOINTMENT_WEB_APP_URL");
  if (!spreadsheetId || !webAppUrl)
    throw new Error(
      "Set APPOINTMENT_SPREADSHEET_ID and APPOINTMENT_WEB_APP_URL.",
    );
  return {
    spreadsheetId,
    webAppUrl,
    reminderLeadHours: Number(p.getProperty("REMINDER_LEAD_HOURS") || 24),
    tokenLifetimeHours: Number(
      p.getProperty("RESPONSE_TOKEN_LIFETIME_HOURS") || 48,
    ),
  };
}
