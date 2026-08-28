function sendAppointmentReminders() {
  const config = appointmentConfig_();
  const now = Date.now();
  appointmentRows_()
    .filter(
      (item) =>
        item.status === APPOINTMENT.statuses.pending &&
        !item.values[7] &&
        item.at.getTime() > now &&
        item.at.getTime() <= now + config.reminderLeadHours * 3600000,
    )
    .forEach((item) => {
      const token = issueAppointmentToken_(item.id);
      const url = config.webAppUrl + "?token=" + encodeURIComponent(token);
      MailApp.sendEmail({
        to: item.email,
        subject: "Please confirm your appointment",
        htmlBody:
          "<p>Hello " +
          htmlEscape_(item.name) +
          ",</p><p>Please confirm or cancel your appointment on " +
          htmlEscape_(item.at.toLocaleString()) +
          '.</p><p><a href="' +
          url +
          '">Respond securely</a></p><p>This one-time link expires automatically.</p>',
      });
      appointmentSheets_()
        .appointments.getRange(item.row, 8)
        .setValue(new Date());
      auditAppointment_(item.id, "REMINDER_SENT", item.email);
    });
}

function escalateMissingResponses() {
  const overdue = appointmentRows_().filter(
    (item) =>
      item.status === APPOINTMENT.statuses.pending &&
      item.at.getTime() <= Date.now(),
  );
  overdue.forEach((item) =>
    MailApp.sendEmail(
      item.coordinator,
      "Appointment requires follow-up",
      "No response was recorded for appointment " + item.id + ".",
    ),
  );
}

function htmlEscape_(value) {
  return String(value == null ? "" : value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
