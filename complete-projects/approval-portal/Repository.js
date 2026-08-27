const REQUEST_COLUMNS = Object.freeze({
  reference: 0, title: 1, details: 2, amount: 3, requesterEmail: 4,
  status: 5, createdAt: 6, updatedAt: 7, reviewerEmail: 8
});

function createRequest_(request) {
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    requestSheet_().appendRow(requestToRow_(request));
    return request;
  } finally {
    lock.releaseLock();
  }
}

function listVisibleRequests_(email) {
  const reviewer = isReviewer_(email);
  const values = requestSheet_().getDataRange().getValues();
  return values.slice(1).filter(function (row) {
    return reviewer || String(row[REQUEST_COLUMNS.requesterEmail]).toLowerCase() === email;
  }).map(rowToRequest_).sort(function (left, right) {
    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
}

function transitionRequest_(reference, nextStatus, actor) {
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    const sheet = requestSheet_();
    const cell = sheet.getRange('A:A').createTextFinder(reference).matchEntireCell(true).findNext();
    if (!cell || cell.getRow() === 1) throw new Error('Request not found');
    const rowRange = sheet.getRange(cell.getRow(), 1, 1, 9);
    const request = rowToRequest_(rowRange.getValues()[0]);
    if (request.status !== PORTAL.statuses.pending) throw new Error('Request has already been decided');

    request.status = nextStatus;
    request.updatedAt = new Date();
    request.reviewerEmail = actor;
    rowRange.setValues([requestToRow_(request)]);
    return request;
  } finally {
    lock.releaseLock();
  }
}

function requestSheet_() {
  const sheet = portalBook_().getSheetByName(PORTAL.requestsSheet);
  if (!sheet) throw new Error('Requests sheet was not found');
  return sheet;
}

function requestToRow_(request) {
  return [request.reference, request.title, request.details, request.amount, request.requesterEmail,
    request.status, request.createdAt, request.updatedAt, request.reviewerEmail];
}

function rowToRequest_(row) {
  return {
    reference: row[0], title: row[1], details: row[2], amount: row[3], requesterEmail: row[4],
    status: row[5], createdAt: row[6], updatedAt: row[7], reviewerEmail: row[8]
  };
}
