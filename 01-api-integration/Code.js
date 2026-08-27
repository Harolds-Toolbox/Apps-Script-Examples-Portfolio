const API = Object.freeze({
  baseUrl: 'https://api.example.com/v1',
  pageSize: 100,
  maxAttempts: 4,
  retryableStatuses: [429, 500, 502, 503, 504]
});

function exampleFetchAllContacts() {
  const contacts = fetchAllPages_('/contacts', { status: 'active' });
  console.log(JSON.stringify({ event: 'contacts_fetched', count: contacts.length }));
  return contacts;
}

function fetchAllPages_(path, query) {
  const records = [];
  let cursor = '';

  do {
    const params = Object.assign({}, query, { limit: API.pageSize });
    if (cursor) params.cursor = cursor;
    const page = apiRequest_('get', path, params);
    records.push.apply(records, page.items || []);
    cursor = page.nextCursor || '';
  } while (cursor);

  return records;
}

function apiRequest_(method, path, query, body) {
  const token = getRequiredProperty_('API_TOKEN');
  const url = API.baseUrl + path + buildQueryString_(query || {});
  let lastError;

  for (let attempt = 1; attempt <= API.maxAttempts; attempt += 1) {
    try {
      const response = UrlFetchApp.fetch(url, {
        method: method,
        contentType: 'application/json',
        headers: { Authorization: 'Bearer ' + token },
        payload: body ? JSON.stringify(body) : undefined,
        muteHttpExceptions: true
      });
      const status = response.getResponseCode();
      const text = response.getContentText();

      if (status >= 200 && status < 300) return text ? JSON.parse(text) : {};
      lastError = new Error('API request failed with HTTP ' + status);
      if (API.retryableStatuses.indexOf(status) === -1) throw lastError;
    } catch (error) {
      lastError = error;
      if (attempt === API.maxAttempts) break;
    }

    Utilities.sleep(Math.min(8000, 500 * Math.pow(2, attempt - 1)) + Math.floor(Math.random() * 250));
  }

  throw new Error('API request exhausted retries: ' + lastError.message);
}

function buildQueryString_(params) {
  const pairs = Object.keys(params)
    .filter(function (key) { return params[key] !== '' && params[key] != null; })
    .map(function (key) {
      return encodeURIComponent(key) + '=' + encodeURIComponent(String(params[key]));
    });
  return pairs.length ? '?' + pairs.join('&') : '';
}

function getRequiredProperty_(name) {
  const value = PropertiesService.getScriptProperties().getProperty(name);
  if (!value) throw new Error('Missing Script Property: ' + name);
  return value;
}
