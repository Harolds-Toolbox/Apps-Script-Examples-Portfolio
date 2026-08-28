function appointmentSheets_() {
  const ss = SpreadsheetApp.openById(appointmentConfig_().spreadsheetId);
  return {
    appointments: ss.getSheetByName(APPOINTMENT.sheet),
    tokens: ss.getSheetByName(APPOINTMENT.tokenSheet),
    audit: ss.getSheetByName(APPOINTMENT.auditSheet),
  };
}

function appointmentRows_() {
  const sheet = appointmentSheets_().appointments;
  if (sheet.getLastRow() < 2) return [];
  return sheet
    .getRange(2, 1, sheet.getLastRow() - 1, APPOINTMENT.headers.length)
    .getValues()
    .map((values, offset) => ({
      row: offset + 2,
      values,
      id: String(values[0]),
      name: String(values[1]),
      email: String(values[2]),
      coordinator: String(values[3]),
      at: new Date(values[4]),
      location: String(values[5]),
      status: String(values[6]),
    }));
}

function findAppointment_(id) {
  const found = appointmentRows_().find((item) => item.id === String(id));
  if (!found) throw new Error("Appointment not found.");
  return found;
}

function auditAppointment_(id, action, detail) {
  appointmentSheets_().audit.appendRow([new Date(), id, action, detail || ""]);
}
