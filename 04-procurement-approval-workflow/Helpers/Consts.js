// Runtime configuration and Script Property names normally adjusted per deployment.
const PROCUREMENT = Object.freeze({
  requestsSheet: "Requests",
  auditSheet: "Audit Log",
  linkLifetimeSeconds: 48 * 60 * 60,
  currencies: Object.freeze(["GBP", "EUR", "USD"]),
  statuses: Object.freeze({
    pending: "PENDING",
    needsInformation: "NEEDS_INFORMATION",
    approved: "APPROVED",
    rejected: "REJECTED",
  }),
});

const PROCUREMENT_COLUMNS = Object.freeze({
  reference: 0,
  requesterEmail: 1,
  supplier: 2,
  description: 3,
  currency: 4,
  amount: 5,
  status: 6,
  informationRequest: 7,
  informationResponse: 8,
  createdAt: 9,
  updatedAt: 10,
  reviewerEmail: 11,
  version: 12,
});

function procurementProperty_(name, optional) {
  const value = String(
    PropertiesService.getScriptProperties().getProperty(name) || "",
  ).trim();
  if (!value && !optional) throw new Error("Missing Script Property: " + name);
  return value;
}

function procurementBook_() {
  return SpreadsheetApp.openById(
    procurementProperty_("PROCUREMENT_SPREADSHEET_ID"),
  );
}

function procurementUser_() {
  const email = String(Session.getActiveUser().getEmail() || "")
    .trim()
    .toLowerCase();
  if (!email) throw new Error("A signed-in account is required.");
  return email;
}

function isProcurementReviewer_(email) {
  return (
    procurementProperty_("PROCUREMENT_REVIEWER_EMAILS")
      .split(",")
      .map(function (value) {
        return value.trim().toLowerCase();
      })
      .filter(Boolean)
      .indexOf(String(email || "").toLowerCase()) !== -1
  );
}
