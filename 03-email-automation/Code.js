function sendPendingEmails() {
  const sheet = SpreadsheetApp.openById(requiredEmailProperty_('EMAIL_SPREADSHEET_ID')).getSheetByName('Email Queue');
  const rows = sheet.getDataRange().getValues();

  rows.slice(1).forEach(function (row, index) {
    if (row[4] === 'SENT') return;
    const rowNumber = index + 2;
    try {
      validateEmailRow_(row);
      const model = { firstName: row[2], actionUrl: row[3] };
      MailApp.sendEmail({
        to: row[1],
        subject: 'Your requested update',
        body: renderPlainEmail_(model),
        htmlBody: renderHtmlEmail_(model),
        name: 'Automation Demo'
      });
      sheet.getRange(rowNumber, 5, 1, 3).setValues([['SENT', new Date(), '']]);
    } catch (error) {
      sheet.getRange(rowNumber, 5, 1, 3).setValues([['ERROR', '', error.message]]);
    }
  });
}

function renderHtmlEmail_(model) {
  return [
    '<div style="font:16px/1.5 Arial,sans-serif;max-width:600px">',
    '<h2>Update ready</h2>',
    '<p>Hello ' + escapeHtml_(model.firstName) + ',</p>',
    '<p>The update you requested is ready to review.</p>',
    '<p><a href="' + escapeHtml_(model.actionUrl) + '" style="background:#155eef;color:#fff;padding:12px 18px;text-decoration:none;border-radius:6px">View update</a></p>',
    '<p>If you were not expecting this message, you can ignore it.</p>',
    '</div>'
  ].join('');
}

function renderPlainEmail_(model) {
  return 'Hello ' + model.firstName + ',\n\nYour requested update is ready:\n' + model.actionUrl;
}

function validateEmailRow_(row) {
  if (!row[0]) throw new Error('Message ID is required');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(row[1]))) throw new Error('Recipient is invalid');
  if (!/^https:\/\//.test(String(row[3]))) throw new Error('Action URL must use HTTPS');
}

function escapeHtml_(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function requiredEmailProperty_(name) {
  const value = PropertiesService.getScriptProperties().getProperty(name);
  if (!value) throw new Error('Missing Script Property: ' + name);
  return value;
}
