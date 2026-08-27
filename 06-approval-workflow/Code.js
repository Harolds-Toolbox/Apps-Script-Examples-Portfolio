function doGet(event) {
  try {
    const reference = String(event.parameter.ref || '');
    const action = String(event.parameter.action || '').toUpperCase();
    const signature = String(event.parameter.sig || '');
    if (['APPROVED', 'REJECTED'].indexOf(action) === -1) throw new Error('Invalid action');
    if (!verifyApprovalSignature_(reference, action, signature)) throw new Error('Invalid signature');

    applyDecision_(reference, action, Session.getActiveUser().getEmail() || 'authorized reviewer');
    return HtmlService.createHtmlOutput('<h2>Decision recorded</h2><p>You may close this window.</p>');
  } catch (error) {
    return HtmlService.createHtmlOutput('<h2>Unable to continue</h2><p>' + escapeApprovalHtml_(error.message) + '</p>');
  }
}

function applyDecision_(reference, decision, actor) {
  const lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    const sheet = SpreadsheetApp.openById(approvalProperty_('APPROVAL_SPREADSHEET_ID')).getSheetByName('Requests');
    const cell = sheet.getRange('A:A').createTextFinder(reference).matchEntireCell(true).findNext();
    if (!cell || cell.getRow() === 1) throw new Error('Request not found');
    const statusCell = sheet.getRange(cell.getRow(), 3);
    if (statusCell.getValue() !== 'PENDING') throw new Error('This request has already been decided');
    sheet.getRange(cell.getRow(), 3, 1, 4).setValues([[decision, sheet.getRange(cell.getRow(), 4).getValue(), new Date(), actor]]);
  } finally {
    lock.releaseLock();
  }
}

function buildApprovalLinks_(reference) {
  const base = approvalProperty_('APPROVAL_WEB_APP_URL');
  return ['APPROVED', 'REJECTED'].reduce(function (links, action) {
    links[action.toLowerCase()] = base + '?ref=' + encodeURIComponent(reference) + '&action=' + action + '&sig=' + signApproval_(reference, action);
    return links;
  }, {});
}

function signApproval_(reference, action) {
  const bytes = Utilities.computeHmacSha256Signature(reference + '|' + action, approvalProperty_('APPROVAL_LINK_SECRET'));
  return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/, '');
}

function verifyApprovalSignature_(reference, action, supplied) {
  const expected = signApproval_(reference, action);
  if (expected.length !== supplied.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i += 1) mismatch |= expected.charCodeAt(i) ^ supplied.charCodeAt(i);
  return mismatch === 0;
}

function escapeApprovalHtml_(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function approvalProperty_(name) {
  const value = PropertiesService.getScriptProperties().getProperty(name);
  if (!value) throw new Error('Missing Script Property: ' + name);
  return value;
}
