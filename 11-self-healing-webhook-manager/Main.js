// Main flow: inspect provider registrations → retain a healthy hook or repair/rotate it.
function runWebhookMaintenance() {
  return reconcileProviderWebhook();
}
