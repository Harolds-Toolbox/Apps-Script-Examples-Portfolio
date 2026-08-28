function subscriberMatches_(subscriber, opportunity) {
  if (String(subscriber["Consent Status"]).toLowerCase() !== "subscribed")
    return false;
  const categories = splitPreferences_(subscriber.Categories),
    regions = splitPreferences_(subscriber.Regions);
  return (
    (!categories.length ||
      categories.includes(normalisePreference_(opportunity.Category))) &&
    (!regions.length ||
      regions.includes(normalisePreference_(opportunity.Region)))
  );
}
function splitPreferences_(value) {
  return String(value || "")
    .split(",")
    .map(normalisePreference_)
    .filter(Boolean);
}
function normalisePreference_(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}
