function appendAudit_(reference, action, actor, metadata) {
  const sheet = portalBook_().getSheetByName(PORTAL.auditSheet);
  if (!sheet) throw new Error('Audit Log sheet was not found');
  sheet.appendRow([new Date(), reference, action, actor, JSON.stringify(metadata || {})]);
}
