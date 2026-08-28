function webhookApi_(method, path, body) {
  const c = webhookManagerConfig_();
  const url = webhookProviderUrl_(c.baseUrl, path);
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = UrlFetchApp.fetch(url, {
      method,
      headers: {
        Authorization: "Bearer " + c.token,
        Accept: "application/json",
      },
      contentType: "application/json",
      payload: body ? JSON.stringify(body) : undefined,
      muteHttpExceptions: true,
    });
    const code = response.getResponseCode();
    if (code >= 200 && code < 300)
      return response.getContentText()
        ? JSON.parse(response.getContentText())
        : {};
    if (code === 429 || code >= 500) {
      Utilities.sleep(Math.min(8000, 500 * Math.pow(2, attempt)));
      continue;
    }
    throw new Error(
      "Provider request failed (" +
        code +
        "): " +
        response.getContentText().slice(0, 500),
    );
  }
  throw new Error("Provider request failed after retries.");
}
function listProviderWebhooks_() {
  const c = webhookManagerConfig_();
  if (!Number.isInteger(c.maxPages) || c.maxPages < 1 || c.maxPages > 1000)
    throw new Error("WEBHOOK_MAX_PAGES must be an integer from 1 to 1000.");

  let url = webhookProviderUrl_(c.baseUrl, "/webhooks");
  const visited = {};
  const hooks = [];
  for (let page = 0; page < c.maxPages; page += 1) {
    if (visited[url])
      throw new Error("Provider webhook pagination loop detected.");
    visited[url] = true;
    const result = webhookApi_("get", url);
    const pageHooks = Array.isArray(result)
      ? result
      : result.items || result.results || result.webhooks || [];
    if (!Array.isArray(pageHooks))
      throw new Error("Provider webhook page did not contain an array.");
    Array.prototype.push.apply(hooks, pageHooks);

    const next = providerWebhookNextLink_(result);
    if (!next) return hooks;
    url = resolveProviderWebhookUrl_(c.baseUrl, url, next);
  }
  throw new Error(
    "Provider webhook pagination exceeded WEBHOOK_MAX_PAGES; refusing an incomplete result.",
  );
}
function createProviderWebhook_(c) {
  return webhookApi_("post", "/webhooks", {
    url: c.callbackUrl,
    events: c.events,
    scope: c.scope,
  });
}
function updateProviderWebhook_(id, patch) {
  return webhookApi_("patch", "/webhooks/" + encodeURIComponent(id), patch);
}
function deleteProviderWebhook_(id) {
  return webhookApi_("delete", "/webhooks/" + encodeURIComponent(id));
}

function providerWebhookNextLink_(result) {
  if (!result || Array.isArray(result)) return "";
  const next =
    result.next ||
    result.nextPageUrl ||
    (result.links && result.links.next) ||
    "";
  if (next && typeof next === "object")
    return String(next.href || next.url || "");
  return String(next || "");
}

function webhookProviderUrl_(baseUrl, path) {
  const value = String(path || "").trim();
  if (/^https?:\/\//i.test(value)) {
    if (webhookProviderOrigin_(value) !== webhookProviderOrigin_(baseUrl))
      throw new Error(
        "Provider pagination attempted to leave the configured origin.",
      );
    return value;
  }
  if (!value) return baseUrl;
  return (
    baseUrl.replace(/\/+$/, "") +
    (value.charAt(0) === "/" ? value : "/" + value)
  );
}

function resolveProviderWebhookUrl_(baseUrl, currentUrl, next) {
  const value = String(next || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return webhookProviderUrl_(baseUrl, value);
  if (value.charAt(0) === "/")
    return webhookProviderOrigin_(baseUrl) + value;
  if (value.charAt(0) === "?")
    return String(currentUrl).replace(/\?.*$/, "") + value;
  return (
    String(currentUrl).replace(/[?#].*$/, "").replace(/\/[^/]*$/, "/") +
    value
  );
}

function webhookProviderOrigin_(url) {
  const match = String(url || "").match(/^(https?:\/\/[^/?#]+)/i);
  if (!match)
    throw new Error("WEBHOOK_PROVIDER_BASE_URL must be an HTTP(S) URL.");
  return match[1].toLowerCase();
}
