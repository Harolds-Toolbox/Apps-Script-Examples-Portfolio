function getCatalogueAccessToken_() {
  const staticToken = catalogueProperty_('CATALOGUE_ACCESS_TOKEN', true);
  if (staticToken) return staticToken;
  const cache = CacheService.getScriptCache();
  const cached = cache.get('CATALOGUE_OAUTH_TOKEN');
  if (cached) return cached;

  const response = UrlFetchApp.fetch(catalogueProperty_('CATALOGUE_TOKEN_URL'), {
    method: 'post',
    contentType: 'application/x-www-form-urlencoded',
    payload: {
      grant_type: 'client_credentials',
      client_id: catalogueProperty_('CATALOGUE_CLIENT_ID'),
      client_secret: catalogueProperty_('CATALOGUE_CLIENT_SECRET')
    },
    muteHttpExceptions: true
  });
  if (response.getResponseCode() < 200 || response.getResponseCode() >= 300) throw new Error('Token endpoint returned HTTP ' + response.getResponseCode());
  const body = JSON.parse(response.getContentText() || '{}');
  if (!body.access_token) throw new Error('Token response did not contain access_token.');
  cache.put('CATALOGUE_OAUTH_TOKEN', body.access_token, Math.max(60, Math.min(Number(body.expires_in) || 3600, 3600) - 60));
  return body.access_token;
}
