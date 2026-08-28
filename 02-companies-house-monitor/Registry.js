function fetchRegistryCompanies_() {
  const activityCodes = registryActivityCodes_();
  const postcodeAreas = registryListProperty_("REGISTRY_POSTCODE_AREAS").map(
    function (area) {
      return area.toUpperCase();
    },
  );
  const results = [];

  REGISTRY_CONFIG.statuses.forEach(function (status) {
    postcodeAreas.forEach(function (postcodeArea) {
      activityCodes.forEach(function (code) {
        const items = fetchRegistrySearchPages_({
          company_status: status,
          location: postcodeArea,
          sic_codes: code,
        });
        results.push.apply(results, items);
      });
    });
  });

  return dedupeRegistryCompanies_(results)
    .filter(function (item) {
      return registryPostcodeMatches_(
        item.registered_office_address,
        postcodeAreas,
      );
    })
    .map(normalizeRegistryCompany_)
    .sort(function (left, right) {
      return left[1].localeCompare(right[1]);
    });
}

function fetchRegistrySearchPages_(filters) {
  const results = [];
  let startIndex = 0;
  let expectedHits = null;

  while (true) {
    const query = Object.assign({}, filters, {
      size: REGISTRY_CONFIG.pageSize,
      start_index: startIndex,
    });
    const response = registryFetchJson_(REGISTRY_CONFIG.searchPath, query);
    const items = Array.isArray(response.items) ? response.items : [];
    const hits = Number(response.hits);
    if (expectedHits === null && Number.isFinite(hits) && hits >= 0)
      expectedHits = hits;

    if (!items.length) {
      if (expectedHits !== null && startIndex < expectedHits)
        throw new Error(
          "Registry pagination stopped at " +
            startIndex +
            " of " +
            expectedHits +
            " results.",
        );
      break;
    }

    results.push.apply(results, items);
    startIndex += items.length;
    if (expectedHits !== null && startIndex >= expectedHits) break;
    if (expectedHits === null && items.length < REGISTRY_CONFIG.pageSize) break;
  }

  return results;
}

function registryActivityCodes_() {
  const configured = registryProperty_("REGISTRY_ACTIVITY_CODES", true);
  if (!configured) return [""];
  const codes = configured
    .split(",")
    .map(function (code) {
      return code.trim();
    })
    .filter(Boolean);
  return codes.indexOf("*") !== -1 || !codes.length ? [""] : codes;
}

function dedupeRegistryCompanies_(items) {
  const seen = {};
  return (items || []).filter(function (item) {
    const number = String((item && item.company_number) || "").trim();
    if (!number || seen[number]) return false;
    seen[number] = true;
    return true;
  });
}

function registryPostcodeMatches_(address, areas) {
  if (!areas.length) return true;
  const postcode = String((address && address.postal_code) || "")
    .trim()
    .toUpperCase();
  const match = postcode.match(/^([A-Z]{1,2})(?=\d)/);
  return Boolean(match && areas.indexOf(match[1]) !== -1);
}

function normalizeRegistryCompany_(item) {
  const address = item.registered_office_address || {};
  return [
    String(item.company_number || ""),
    String(item.company_name || ""),
    String(item.company_status || ""),
    String(item.date_of_creation || ""),
    [address.premises, address.address_line_1, address.locality, address.region]
      .filter(Boolean)
      .join(", "),
    String(address.postal_code || ""),
    Array.isArray(item.sic_codes) ? item.sic_codes.join(", ") : "",
    "https://find-and-update.company-information.service.gov.uk/company/" +
      encodeURIComponent(String(item.company_number || "")),
  ];
}
