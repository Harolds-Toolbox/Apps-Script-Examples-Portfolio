function registryFetchJson_(path, query) {
  const url =
    REGISTRY_CONFIG.baseUrl + path + registryQueryString_(query || {});
  const authorization =
    "Basic " +
    Utilities.base64Encode(registryProperty_("REGISTRY_API_KEY") + ":");
  let lastError;

  for (let attempt = 1; attempt <= REGISTRY_CONFIG.maxAttempts; attempt += 1) {
    try {
      const response = UrlFetchApp.fetch(url, {
        method: "get",
        headers: { Authorization: authorization, Accept: "application/json" },
        muteHttpExceptions: true,
      });
      const status = response.getResponseCode();
      const text = response.getContentText();
      if (status >= 200 && status < 300) return text ? JSON.parse(text) : {};
      lastError = new Error("Registry API returned HTTP " + status);
      if ([429, 500, 502, 503, 504].indexOf(status) === -1) throw lastError;
    } catch (error) {
      lastError = error;
      if (attempt === REGISTRY_CONFIG.maxAttempts) break;
    }
    Utilities.sleep(
      Math.min(8000, 600 * Math.pow(2, attempt - 1)) +
        Math.floor(Math.random() * 300),
    );
  }
  throw new Error("Registry request exhausted retries: " + lastError.message);
}

function registryQueryString_(query) {
  const pairs = [];
  Object.keys(query).forEach(function (key) {
    const values = Array.isArray(query[key]) ? query[key] : [query[key]];
    values.forEach(function (value) {
      if (value !== "" && value != null)
        pairs.push(
          encodeURIComponent(key) + "=" + encodeURIComponent(String(value)),
        );
    });
  });
  return pairs.length ? "?" + pairs.join("&") : "";
}
