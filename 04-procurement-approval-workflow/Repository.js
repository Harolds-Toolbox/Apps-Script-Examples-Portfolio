function createProcurementRequest_(request) {
  return withProcurementLock_(function () {
    procurementRequestsSheet_().appendRow(procurementRequestToRow_(request));
    return request;
  });
}

function findProcurementRequest_(reference) {
  const sheet = procurementRequestsSheet_();
  const cell = sheet
    .getRange("A:A")
    .createTextFinder(reference)
    .matchEntireCell(true)
    .findNext();
  if (!cell || cell.getRow() === 1) return null;
  return {
    rowNumber: cell.getRow(),
    request: procurementRowToRequest_(
      sheet.getRange(cell.getRow(), 1, 1, 13).getValues()[0],
    ),
  };
}

function saveProcurementRequest_(rowNumber, request) {
  procurementRequestsSheet_()
    .getRange(rowNumber, 1, 1, 13)
    .setValues([procurementRequestToRow_(request)]);
  return request;
}

function listProcurementRequests_(email) {
  const reviewer = isProcurementReviewer_(email);
  const values = procurementRequestsSheet_().getDataRange().getValues();
  return values
    .slice(1)
    .filter(function (row) {
      return (
        reviewer ||
        String(row[PROCUREMENT_COLUMNS.requesterEmail]).toLowerCase() === email
      );
    })
    .map(procurementRowToRequest_)
    .sort(function (left, right) {
      return (
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      );
    });
}

function appendProcurementAudit_(reference, action, actor, metadata) {
  const sheet = procurementBook_().getSheetByName(PROCUREMENT.auditSheet);
  if (!sheet) throw new Error("Missing sheet: " + PROCUREMENT.auditSheet);
  sheet.appendRow([
    new Date(),
    reference,
    action,
    actor,
    JSON.stringify(metadata || {}),
  ]);
}

function procurementRequestsSheet_() {
  const sheet = procurementBook_().getSheetByName(PROCUREMENT.requestsSheet);
  if (!sheet) throw new Error("Missing sheet: " + PROCUREMENT.requestsSheet);
  return sheet;
}

function procurementRequestToRow_(request) {
  return [
    request.reference,
    request.requesterEmail,
    request.supplier,
    request.description,
    request.currency,
    request.amount,
    request.status,
    request.informationRequest,
    request.informationResponse,
    request.createdAt,
    request.updatedAt,
    request.reviewerEmail,
    request.version,
  ];
}

function procurementRowToRequest_(row) {
  return {
    reference: row[0],
    requesterEmail: row[1],
    supplier: row[2],
    description: row[3],
    currency: row[4],
    amount: Number(row[5]) || 0,
    status: row[6],
    informationRequest: row[7],
    informationResponse: row[8],
    createdAt: row[9],
    updatedAt: row[10],
    reviewerEmail: row[11],
    version: Number(row[12]) || 1,
  };
}

function withProcurementLock_(callback) {
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    return callback();
  } finally {
    lock.releaseLock();
  }
}
