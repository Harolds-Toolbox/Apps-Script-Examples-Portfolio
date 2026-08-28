// Main scheduled flow: issue reminders, then escalate appointments still awaiting a response.
function runAppointmentReminderCycle() {
  sendAppointmentReminders();
  escalateMissingResponses();
  return { status: "complete" };
}
