// Main lifecycle: prepare review batch → reviewer sends → retention and token housekeeping.
function runNotificationPreparation() {
  return prepareOpportunityNotifications();
}

function runRetentionReview() {
  return reviewSubscriberRetention();
}

function runLifecycleHousekeeping() {
  return purgeExpiredLifecycleTokens();
}
