function setupAppointmentWorkflow() {
  const ss = SpreadsheetApp.openById(appointmentConfig_().spreadsheetId);
  [[APPOINTMENT.sheet, APPOINTMENT.headers], [APPOINTMENT.tokenSheet, APPOINTMENT.tokenHeaders], [APPOINTMENT.auditSheet, APPOINTMENT.auditHeaders]].forEach(([name, headers]) => { const sheet = ss.getSheetByName(name) || ss.insertSheet(name); if (!sheet.getLastRow()) sheet.appendRow(headers); sheet.setFrozenRows(1); });
  ScriptApp.getProjectTriggers().filter(t => ['sendAppointmentReminders','escalateMissingResponses'].includes(t.getHandlerFunction())).forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('sendAppointmentReminders').timeBased().everyHours(1).create();
  ScriptApp.newTrigger('escalateMissingResponses').timeBased().everyDays(1).atHour(9).create();
}
