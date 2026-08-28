// Runtime configuration and Script Property names normally adjusted per deployment.
const CATALOGUE = Object.freeze({
  endpointsSheet: "Endpoints",
  fieldsSheet: "Fields",
  relationshipsSheet: "Relationships",
  maxAttempts: 4,
  maxDepth: 12,
  maxExampleLength: 120,
});

function catalogueProperty_(name, optional) {
  const value = String(
    PropertiesService.getScriptProperties().getProperty(name) || "",
  ).trim();
  if (!value && !optional) throw new Error("Missing Script Property: " + name);
  return value;
}

function catalogueEndpoints_() {
  let endpoints;
  try {
    endpoints = JSON.parse(catalogueProperty_("CATALOGUE_ENDPOINTS_JSON"));
  } catch (error) {
    throw new Error("CATALOGUE_ENDPOINTS_JSON must contain valid JSON.");
  }
  if (!Array.isArray(endpoints) || !endpoints.length)
    throw new Error("At least one endpoint is required.");
  return endpoints.map(function (endpoint) {
    if (!endpoint.name || !endpoint.path)
      throw new Error("Each endpoint requires name and path.");
    return {
      name: String(endpoint.name),
      path: String(endpoint.path),
      itemsPath: String(endpoint.itemsPath || ""),
      sampleSize: Math.min(Math.max(Number(endpoint.sampleSize) || 50, 1), 250),
    };
  });
}

function catalogueBook_() {
  return SpreadsheetApp.openById(
    catalogueProperty_("CATALOGUE_SPREADSHEET_ID"),
  );
}
