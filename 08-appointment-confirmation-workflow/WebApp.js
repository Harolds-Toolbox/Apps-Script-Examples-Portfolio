function doGet(e) {
  const template = HtmlService.createTemplateFromFile('Confirmation');
  template.token = String((e.parameter || {}).token || '');
  return template.evaluate().setTitle('Appointment response').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DENY);
}

function submitAppointmentResponse(token, response) {
  if (!['Confirmed', 'Cancelled'].includes(response)) throw new Error('Invalid response.');
  const appointmentId = consumeAppointmentToken_(token);
  const item = findAppointment_(appointmentId);
  const sheet = appointmentSheets_().appointments;
  sheet.getRange(item.row, 7, 1, 3).setValues([[response, item.values[7], new Date()]]);
  auditAppointment_(appointmentId, 'RESPONSE_RECORDED', response);
  MailApp.sendEmail(item.coordinator, 'Appointment response: ' + response, item.name + ' responded ' + response.toLowerCase() + ' for appointment ' + appointmentId + '.');
  return { ok: true, message: 'Your response has been recorded.' };
}
