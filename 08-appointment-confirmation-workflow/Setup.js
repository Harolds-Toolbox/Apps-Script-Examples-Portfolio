const SETUP_FOLDER_ID = "PASTE_GOOGLE_DRIVE_FOLDER_ID_HERE";

function setupProject() {
  const folder = requireSetupFolder_();
  const ss = SpreadsheetApp.create("Appointment Confirmation Workflow");
  moveSetupFileToFolder_(ss.getId(), folder);
  ss.getSheets()[0].setName(APPOINTMENT.sheet);
  [
    [APPOINTMENT.sheet, APPOINTMENT.headers],
    [APPOINTMENT.tokenSheet, APPOINTMENT.tokenHeaders],
    [APPOINTMENT.auditSheet, APPOINTMENT.auditHeaders],
  ].forEach(([name, headers]) => {
    const sheet = ss.getSheetByName(name) || ss.insertSheet(name);
    if (!sheet.getLastRow()) sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  });
  saveSetupProperties_({
    APPOINTMENT_SPREADSHEET_ID: ss.getId(),
    REMINDER_LEAD_HOURS: "24",
    RESPONSE_TOKEN_LIFETIME_HOURS: "48",
  });
  return {
    spreadsheetId: ss.getId(),
    propertyStillRequired: "APPOINTMENT_WEB_APP_URL",
  };
}

function installProjectTriggers() {
  removeSetupTriggers_([
    "sendAppointmentReminders",
    "escalateMissingResponses",
  ]);
  ScriptApp.newTrigger("sendAppointmentReminders")
    .timeBased()
    .everyHours(1)
    .create();
  ScriptApp.newTrigger("escalateMissingResponses")
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .create();
}

function setupAppointmentWorkflow() {
  return setupProject();
}
