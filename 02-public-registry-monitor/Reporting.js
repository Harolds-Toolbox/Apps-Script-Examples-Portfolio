function refreshRegistryReport_(rows) {
  const book = SpreadsheetApp.openById(registryProperty_('REGISTRY_SPREADSHEET_ID'));
  const sheet = book.getSheetByName(REGISTRY_CONFIG.reportSheet);
  if (!sheet) throw new Error('Missing sheet: ' + REGISTRY_CONFIG.reportSheet);
  sheet.clearContents();
  const values = [REGISTRY_HEADERS].concat(rows);
  sheet.getRange(1, 1, values.length, REGISTRY_HEADERS.length).setValues(values);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, REGISTRY_HEADERS.length).setFontWeight('bold');
  sheet.autoResizeColumns(1, REGISTRY_HEADERS.length);
}

function sendRegistrySummary_(comparison, snapshot) {
  const recipient = registryProperty_('REGISTRY_ALERT_RECIPIENT', true);
  if (!recipient) return;
  MailApp.sendEmail({
    to: recipient,
    subject: 'Public registry monitor: ' + comparison.added.length + ' added, ' + comparison.removed.length + ' removed',
    body: [
      'Registry refresh complete.', '',
      'Current records: ' + comparison.currentCount,
      'Added since previous snapshot: ' + comparison.added.length,
      'Removed since previous snapshot: ' + comparison.removed.length,
      'Snapshot: ' + snapshot.name
    ].join('\n')
  });
}
