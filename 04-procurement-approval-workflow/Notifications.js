function sendProcurementReviewEmail_(request) {
  MailApp.sendEmail({
    to: procurementProperty_("PROCUREMENT_REVIEWER_EMAILS"),
    subject: "Procurement request awaiting review: " + request.reference,
    body: [
      "A procurement request is awaiting review.",
      "",
      "Reference: " + request.reference,
      "Supplier: " + request.supplier,
      "Amount: " + request.currency + " " + request.amount.toFixed(2),
      "",
      "Approve: " + buildProcurementActionUrl_(request, "APPROVE"),
      "Reject: " + buildProcurementActionUrl_(request, "REJECT"),
      "",
      "Open the workflow portal to request more information.",
    ].join("\n"),
  });
}

function sendProcurementOutcomeEmail_(request, action) {
  const lines = [
    "Reference: " + request.reference,
    "Status: " + request.status,
  ];
  if (action === "REQUEST_INFORMATION")
    lines.push("Information requested: " + request.informationRequest);
  MailApp.sendEmail({
    to:
      action === "RESPOND_INFORMATION"
        ? procurementProperty_("PROCUREMENT_REVIEWER_EMAILS")
        : request.requesterEmail,
    subject: "Procurement request updated: " + request.reference,
    body: lines.join("\n"),
  });
}

function notifyPendingProcurementRequests() {
  const pending = listProcurementRequests_(
    procurementProperty_("PROCUREMENT_REVIEWER_EMAILS")
      .split(",")[0]
      .trim()
      .toLowerCase(),
  ).filter(function (request) {
    return request.status === PROCUREMENT.statuses.pending;
  });
  if (!pending.length) return;
  MailApp.sendEmail({
    to: procurementProperty_("PROCUREMENT_REVIEWER_EMAILS"),
    subject: pending.length + " procurement request(s) awaiting review",
    body: pending
      .map(function (request) {
        return (
          request.reference +
          " — " +
          request.currency +
          " " +
          request.amount.toFixed(2)
        );
      })
      .join("\n"),
  });
}
