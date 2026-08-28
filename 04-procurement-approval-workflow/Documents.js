function generateApprovedProcurementPdf(reference) {
  const actor = procurementUser_();
  if (!isProcurementReviewer_(actor))
    throw new Error("Reviewer access is required.");
  const found = findProcurementRequest_(String(reference || ""));
  if (!found || found.request.status !== PROCUREMENT.statuses.approved)
    throw new Error("Only approved requests can generate a PDF.");
  const templateId = procurementProperty_(
    "PROCUREMENT_DOCUMENT_TEMPLATE_ID",
    true,
  );
  if (!templateId)
    throw new Error("PROCUREMENT_DOCUMENT_TEMPLATE_ID is not configured.");
  const copy = DriveApp.getFileById(templateId).makeCopy(
    found.request.reference + " purchase record",
  );
  let pdf;
  try {
    const sheet = SpreadsheetApp.openById(copy.getId()).getSheets()[0];
    const tokens = {
      REFERENCE: found.request.reference,
      SUPPLIER: found.request.supplier,
      DESCRIPTION: found.request.description,
      CURRENCY: found.request.currency,
      AMOUNT: found.request.amount.toFixed(2),
      REQUESTER: found.request.requesterEmail,
      APPROVED_AT: Utilities.formatDate(
        new Date(found.request.updatedAt),
        Session.getScriptTimeZone(),
        "dd MMMM yyyy HH:mm",
      ),
    };
    Object.keys(tokens).forEach(function (key) {
      sheet
        .createTextFinder("{{" + key + "}}")
        .matchCase(true)
        .replaceAllWith(String(tokens[key]));
    });
    SpreadsheetApp.flush();
    pdf = copy.getAs(MimeType.PDF).setName(found.request.reference + ".pdf");
  } finally {
    copy.setTrashed(true);
  }
  return {
    fileName: pdf.getName(),
    mimeType: pdf.getContentType(),
    base64: Utilities.base64Encode(pdf.getBytes()),
  };
}
