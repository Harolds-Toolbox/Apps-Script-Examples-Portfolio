const PORTAL = Object.freeze({
  requestsSheet: 'Requests',
  auditSheet: 'Audit Log',
  statuses: Object.freeze({ pending: 'PENDING', approved: 'APPROVED', rejected: 'REJECTED' }),
  maxTitleLength: 120,
  maxDetailsLength: 4000
});

function portalProperty_(name) {
  const value = PropertiesService.getScriptProperties().getProperty(name);
  if (!value) throw new Error('Missing Script Property: ' + name);
  return value;
}

function portalBook_() {
  return SpreadsheetApp.openById(portalProperty_('PORTAL_SPREADSHEET_ID'));
}

function signedInEmail_() {
  const email = String(Session.getActiveUser().getEmail() || '').trim().toLowerCase();
  if (!email) throw new Error('A signed-in account is required');
  return email;
}

function isReviewer_(email) {
  return portalProperty_('REVIEWER_EMAILS').split(',').map(function (item) {
    return item.trim().toLowerCase();
  }).indexOf(String(email).toLowerCase()) !== -1;
}
