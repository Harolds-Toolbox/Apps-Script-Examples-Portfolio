function fetchCatalogueEndpoint_(endpoint) {
  const baseUrl = catalogueProperty_('CATALOGUE_API_BASE_URL').replace(/\/+$/, '');
  const separator = endpoint.path.indexOf('?') === -1 ? '?' : '&';
  const url = baseUrl + (endpoint.path.charAt(0) === '/' ? endpoint.path : '/' + endpoint.path) + separator + 'limit=' + endpoint.sampleSize;
  const response = catalogueFetch_(url);
  const selected = endpoint.itemsPath ? getCataloguePath_(response, endpoint.itemsPath) : response;
  if (Array.isArray(selected)) return selected.slice(0, endpoint.sampleSize);
  if (selected && typeof selected === 'object') return [selected];
  throw new Error('Endpoint ' + endpoint.name + ' did not return an object or array at itemsPath.');
}

function catalogueFetch_(url) {
  let lastError;
  for (let attempt = 1; attempt <= CATALOGUE.maxAttempts; attempt += 1) {
    const response = UrlFetchApp.fetch(url, {
      method: 'get',
      headers: { Authorization: 'Bearer ' + getCatalogueAccessToken_(), Accept: 'application/json' },
      muteHttpExceptions: true
    });
    const status = response.getResponseCode();
    if (status >= 200 && status < 300) return JSON.parse(response.getContentText() || '{}');
    lastError = new Error('API returned HTTP ' + status);
    if ([429, 500, 502, 503, 504].indexOf(status) === -1) throw lastError;
    Utilities.sleep(500 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 200));
  }
  throw lastError;
}

function getCataloguePath_(value, path) {
  return String(path || '').split('.').filter(Boolean).reduce(function (current, key) {
    return current == null ? undefined : current[key];
  }, value);
}
