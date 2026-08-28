function fetchPagedRecords_(source) {
  const maxPages = Number(source.maxPages || 100);
  if (!Number.isInteger(maxPages) || maxPages < 1 || maxPages > 1000)
    throw new Error("RECONCILIATION_MAX_PAGES must be an integer from 1 to 1000.");
  const sourceOrigin = reconciliationUrlOrigin_(source.url);
  const visited = {};
  let url = source.url,
    records = [];
  for (let page = 0; page < maxPages; page += 1) {
    if (!url) return records;
    if (visited[url])
      throw new Error("Reconciliation pagination loop detected: " + url);
    if (reconciliationUrlOrigin_(url) !== sourceOrigin)
      throw new Error(
        "Reconciliation pagination attempted to leave the configured origin.",
      );
    visited[url] = true;
    const response = fetchReconciliationUrl_(url, source.token),
      payload = JSON.parse(response.getContentText());
    const pageRecords = Array.isArray(payload)
      ? payload
      : payload.items || payload.results || [];
    if (!Array.isArray(pageRecords))
      throw new Error("Reconciliation page did not contain an array of records.");
    records = records.concat(pageRecords);
    const next = reconciliationNextLink_(payload);
    if (!next) return records;
    url = resolveReconciliationUrl_(source.url, url, next);
  }
  throw new Error(
    "Reconciliation pagination exceeded RECONCILIATION_MAX_PAGES; refusing an incomplete result.",
  );
}

function reconciliationNextLink_(payload) {
  if (!payload || Array.isArray(payload)) return "";
  const next =
    payload.next ||
    payload.nextPageUrl ||
    (payload.links && payload.links.next) ||
    "";
  if (next && typeof next === "object")
    return String(next.href || next.url || "");
  return String(next || "");
}

function resolveReconciliationUrl_(sourceUrl, currentUrl, next) {
  const value = String(next || "").trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) {
    if (reconciliationUrlOrigin_(value) !== reconciliationUrlOrigin_(sourceUrl))
      throw new Error(
        "Reconciliation pagination attempted to leave the configured origin.",
      );
    return value;
  }
  if (value.charAt(0) === "/")
    return reconciliationUrlOrigin_(sourceUrl) + value;
  if (value.charAt(0) === "?")
    return String(currentUrl).replace(/\?.*$/, "") + value;
  return (
    String(currentUrl).replace(/[?#].*$/, "").replace(/\/[^/]*$/, "/") +
    value
  );
}

function reconciliationUrlOrigin_(url) {
  const match = String(url || "").match(/^(https?:\/\/[^/?#]+)/i);
  if (!match) throw new Error("Source URLs must be absolute HTTP(S) URLs.");
  return match[1].toLowerCase();
}
function fetchReconciliationUrl_(url, token) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = UrlFetchApp.fetch(url, {
      headers: { Authorization: "Bearer " + token, Accept: "application/json" },
      muteHttpExceptions: true,
    });
    const code = response.getResponseCode();
    if (code >= 200 && code < 300) return response;
    if (code === 429 || code >= 500) {
      Utilities.sleep(500 * Math.pow(2, attempt));
      continue;
    }
    throw new Error(
      "API request failed (" +
        code +
        "): " +
        response.getContentText().slice(0, 400),
    );
  }
  throw new Error("API unavailable after retries.");
}
function normaliseSourceA_(row) {
  return {
    id: String(row.id || row.eventId || ""),
    externalId: String(row.externalId || row.reference || ""),
    name: String(row.name || row.participantName || ""),
    email: String(row.email || ""),
    phone: String(row.phone || ""),
    occurredAt: new Date(row.completedAt || row.occurredAt || row.date),
  };
}
function normaliseSourceB_(row) {
  return {
    id: String(row.id || ""),
    sourceId: String(row.sourceId || row.externalId || ""),
    name: String(row.name || row.respondentName || ""),
    email: String(row.email || ""),
    phone: String(row.phone || ""),
    completedAt: new Date(row.completedAt || row.submittedAt || row.date),
  };
}
