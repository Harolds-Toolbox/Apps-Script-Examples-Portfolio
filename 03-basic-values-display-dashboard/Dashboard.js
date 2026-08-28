// Dashboard web entry point, access check and view-model construction.
function doGet() {
  return HtmlService.createTemplateFromFile("Index")
    .evaluate()
    .setTitle("Operations dashboard")
    .addMetaTag("viewport", "width=device-width, initial-scale=1");
}

function getDashboardData() {
  const userEmail = requireDashboardUser_();
  const book = SpreadsheetApp.openById(
    requiredDashboardProperty_("DASHBOARD_SPREADSHEET_ID"),
  );
  const businessDate = dashboardDateKey_(new Date());
  const reconciliations = latestDashboardRowsBySite_(
    readDashboardObjects_(
      book.getSheetByName(DASHBOARD_CONFIG.reconciliationSheet),
    ),
    businessDate,
  );
  const counts = latestDashboardCounts_(
    readDashboardObjects_(book.getSheetByName(DASHBOARD_CONFIG.countsSheet)),
    businessDate,
  );
  const sites = buildDashboardSites_(reconciliations, counts);
  const totals = sites.reduce(
    function (value, site) {
      value.expected += site.expected;
      value.actual += site.actual;
      value.quantity += site.quantity;
      return value;
    },
    { expected: 0, actual: 0, quantity: 0 },
  );
  totals.variance = roundDashboardNumber_(totals.actual - totals.expected);

  return {
    userEmail: userEmail,
    businessDate: businessDate,
    refreshedAt: new Date().toISOString(),
    totals: totals,
    sites: sites,
  };
}

function readDashboardObjects_(sheet) {
  if (!sheet) throw new Error("A required dashboard sheet is missing.");
  const values = sheet.getDataRange().getValues();
  if (!values.length) return [];
  const headers = values.shift().map(function (value) {
    return String(value).trim();
  });
  return values
    .filter(function (row) {
      return row.some(function (value) {
        return value !== "";
      });
    })
    .map(function (row) {
      return headers.reduce(function (object, header, index) {
        object[header] = row[index];
        return object;
      }, {});
    });
}

function latestDashboardRowsBySite_(rows, dateKey) {
  return rows.reduce(function (latest, row) {
    if (dashboardDateKey_(row["Business Date"]) !== dateKey) return latest;
    const site = String(row.Site || "").trim();
    const timestamp = dashboardDate_(row.Timestamp);
    if (!site || !timestamp) return latest;
    if (
      !latest[site] ||
      timestamp.getTime() > latest[site].timestamp.getTime()
    ) {
      latest[site] = {
        timestamp: timestamp,
        expected: dashboardNumber_(row.Expected),
        actual: dashboardNumber_(row.Actual),
      };
    }
    return latest;
  }, {});
}

function latestDashboardCounts_(rows, dateKey) {
  const latest = {};
  rows.forEach(function (row) {
    if (dashboardDateKey_(row["Business Date"]) !== dateKey) return;
    const site = String(row.Site || "").trim();
    const category = String(row.Category || "").trim();
    const timestamp = dashboardDate_(row.Timestamp);
    if (!site || !category || !timestamp) return;
    const key = site + "\u001f" + category;
    if (!latest[key] || timestamp.getTime() > latest[key].timestamp.getTime()) {
      latest[key] = {
        site: site,
        category: category,
        timestamp: timestamp,
        quantity: dashboardNumber_(row.Quantity),
      };
    }
  });
  return Object.keys(latest).map(function (key) {
    return latest[key];
  });
}

function buildDashboardSites_(reconciliations, counts) {
  const names = {};
  Object.keys(reconciliations).forEach(function (site) {
    names[site] = true;
  });
  counts.forEach(function (count) {
    names[count.site] = true;
  });
  return Object.keys(names)
    .sort()
    .map(function (site) {
      const reconciliation = reconciliations[site] || {
        expected: 0,
        actual: 0,
        timestamp: null,
      };
      const siteCounts = counts.filter(function (count) {
        return count.site === site;
      });
      const quantity = siteCounts.reduce(function (sum, count) {
        return sum + count.quantity;
      }, 0);
      return {
        site: site,
        expected: roundDashboardNumber_(reconciliation.expected),
        actual: roundDashboardNumber_(reconciliation.actual),
        variance: roundDashboardNumber_(
          reconciliation.actual - reconciliation.expected,
        ),
        quantity: roundDashboardNumber_(quantity),
        capturedAt: reconciliation.timestamp
          ? reconciliation.timestamp.toISOString()
          : "",
        counts: siteCounts.map(function (count) {
          return { category: count.category, quantity: count.quantity };
        }),
      };
    });
}

function requireDashboardUser_() {
  const email = String(Session.getActiveUser().getEmail() || "")
    .trim()
    .toLowerCase();
  const allowed = requiredDashboardProperty_("DASHBOARD_AUTHORIZED_EMAILS")
    .split(",")
    .map(function (value) {
      return value.trim().toLowerCase();
    })
    .filter(Boolean);
  if (!email)
    throw new Error(
      "Signed-in identity is unavailable. Check the web-app deployment access setting.",
    );
  if (allowed.indexOf(email) === -1)
    throw new Error("This account is not authorized to view the dashboard.");
  return email;
}

function dashboardDateKey_(value) {
  const date = dashboardDate_(value);
  return date
    ? Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd")
    : "";
}

function dashboardDate_(value) {
  if (value instanceof Date && !isNaN(value.getTime())) return value;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

function dashboardNumber_(value) {
  const number = Number(
    String(value == null ? "" : value).replace(/[^0-9.-]/g, ""),
  );
  return isFinite(number) ? number : 0;
}

function roundDashboardNumber_(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}
