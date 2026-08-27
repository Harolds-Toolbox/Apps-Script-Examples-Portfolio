function issueAppointmentToken_(appointmentId) {
  const token = Utilities.getUuid() + Utilities.getUuid().replace(/-/g, '');
  const expires = new Date(Date.now() + appointmentConfig_().tokenLifetimeHours * 3600000);
  appointmentSheets_().tokens.appendRow([token, appointmentId, expires, '']);
  return token;
}

function consumeAppointmentToken_(token) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const sheet = appointmentSheets_().tokens;
    if (sheet.getLastRow() < 2) throw new Error('Invalid response link.');
    const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, APPOINTMENT.tokenHeaders.length).getValues();
    const index = values.findIndex(row => String(row[0]) === String(token));
    if (index < 0) throw new Error('Invalid response link.');
    const row = values[index];
    if (row[3]) throw new Error('This response link has already been used.');
    if (new Date(row[2]).getTime() < Date.now()) throw new Error('This response link has expired.');
    sheet.getRange(index + 2, 4).setValue(new Date());
    return String(row[1]);
  } finally { lock.releaseLock(); }
}
