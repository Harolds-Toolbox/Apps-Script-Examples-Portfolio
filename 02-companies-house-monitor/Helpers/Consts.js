// Runtime configuration and Script Property names normally adjusted per deployment.
const REGISTRY_CONFIG = Object.freeze({
  baseUrl: "https://api.company-information.service.gov.uk",
  searchPath: "/advanced-search/companies",
  pageSize: 100,
  maxPages: 50,
  maxAttempts: 4,
  reportSheet: "Registry Report",
  retainedSnapshots: 12,
  statuses: Object.freeze(["active"]),
  location: "United Kingdom",
});

const REGISTRY_HEADERS = Object.freeze([
  "Company Number",
  "Company Name",
  "Status",
  "Incorporated On",
  "Address",
  "Postcode",
  "Activity Codes",
  "Registry URL",
]);

function registryProperty_(name, optional) {
  const value = String(
    PropertiesService.getScriptProperties().getProperty(name) || "",
  ).trim();
  if (!value && !optional) throw new Error("Missing Script Property: " + name);
  return value;
}

function registryListProperty_(name) {
  return registryProperty_(name)
    .split(",")
    .map(function (item) {
      return item.trim();
    })
    .filter(Boolean);
}
