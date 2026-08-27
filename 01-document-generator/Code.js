function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Document generator')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function generateDocumentPdf(input) {
  const model = validateDocumentInput_(input);
  const templateId = requiredDocumentProperty_('DOCUMENT_TEMPLATE_ID');
  const template = DriveApp.getFileById(templateId);
  const temporaryFile = template.makeCopy(model.reference + ' - ' + model.projectTitle);
  let pdf;

  try {
    const document = DocumentApp.openById(temporaryFile.getId());
    replaceDocumentTokens_(document.getBody(), buildDocumentTokens_(model));
    document.saveAndClose();
    pdf = temporaryFile.getAs(MimeType.PDF).setName(model.reference + '.pdf');
  } finally {
    temporaryFile.setTrashed(true);
  }

  console.log(JSON.stringify({ event: 'document_generated', reference: model.reference }));
  return {
    fileName: pdf.getName(),
    mimeType: pdf.getContentType(),
    base64: Utilities.base64Encode(pdf.getBytes())
  };
}

function validateDocumentInput_(input) {
  const value = input || {};
  const model = {
    reference: cleanDocumentText_(value.reference),
    customerName: cleanDocumentText_(value.customerName),
    customerAddress: cleanMultilineText_(value.customerAddress),
    projectTitle: cleanDocumentText_(value.projectTitle),
    startDate: parseDocumentDate_(value.startDate),
    total: Number(value.total),
    notes: cleanMultilineText_(value.notes)
  };

  if (!/^[A-Z0-9-]{3,40}$/i.test(model.reference)) throw new Error('Reference must contain 3–40 letters, numbers or hyphens.');
  if (!model.customerName || model.customerName.length > 120) throw new Error('Enter a valid customer name.');
  if (!model.customerAddress || model.customerAddress.length > 500) throw new Error('Enter a valid address.');
  if (!model.projectTitle || model.projectTitle.length > 160) throw new Error('Enter a valid project title.');
  if (!model.startDate) throw new Error('Enter a valid start date.');
  if (!isFinite(model.total) || model.total < 0) throw new Error('Total must be zero or greater.');
  if (model.notes.length > 2000) throw new Error('Notes are too long.');

  return model;
}

function buildDocumentTokens_(model) {
  const timeZone = Session.getScriptTimeZone();
  return {
    REFERENCE: model.reference,
    CUSTOMER_NAME: model.customerName,
    CUSTOMER_ADDRESS: model.customerAddress,
    PROJECT_TITLE: model.projectTitle,
    START_DATE: Utilities.formatDate(model.startDate, timeZone, 'dd MMMM yyyy'),
    TOTAL: model.total.toFixed(2),
    NOTES: model.notes,
    CREATED_DATE: Utilities.formatDate(new Date(), timeZone, 'dd MMMM yyyy')
  };
}

function replaceDocumentTokens_(body, tokens) {
  Object.keys(tokens).forEach(function (key) {
    const pattern = escapeDocumentPattern_('{{' + key + '}}');
    const replacement = String(tokens[key] == null ? '' : tokens[key]).replace(/\n/g, '\r');
    body.replaceText(pattern, replacement);
  });
}

function parseDocumentDate_(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
  return date.getFullYear() === Number(match[1]) && date.getMonth() === Number(match[2]) - 1 && date.getDate() === Number(match[3]) ? date : null;
}

function cleanDocumentText_(value) {
  return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
}

function cleanMultilineText_(value) {
  return String(value == null ? '' : value).replace(/\r\n?/g, '\n').split('\n')
    .map(function (line) { return line.replace(/\s+/g, ' ').trim(); })
    .filter(Boolean).join('\n');
}

function escapeDocumentPattern_(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function requiredDocumentProperty_(name) {
  const value = PropertiesService.getScriptProperties().getProperty(name);
  if (!value) throw new Error('Missing Script Property: ' + name);
  return value;
}
