function validateDocumentInput_(input) {
  const value = input || {};
  const totalText = cleanDocumentText_(value.total);
  const model = {
    templateType: cleanDocumentText_(value.templateType).toLowerCase(),
    reference: cleanDocumentText_(value.reference),
    customerName: cleanDocumentText_(value.customerName),
    customerAddress: cleanMultilineText_(value.customerAddress),
    projectTitle: cleanDocumentText_(value.projectTitle),
    startDate: parseDocumentDate_(value.startDate),
    currency: cleanDocumentText_(value.currency).toUpperCase(),
    total: Number(totalText),
    notes: cleanMultilineText_(value.notes)
  };

  if (!Object.keys(DOCUMENT_GENERATOR.templateTypes).some(function (key) {
    return DOCUMENT_GENERATOR.templateTypes[key] === model.templateType;
  })) throw new Error('Choose either the Google Doc or Google Sheet template.');

  if (!/^[A-Z0-9-]{3,40}$/i.test(model.reference)) {
    throw new Error('Reference must contain 3–40 letters, numbers or hyphens.');
  }
  if (!model.customerName || model.customerName.length > 120) throw new Error('Enter a valid customer name.');
  if (!model.customerAddress || model.customerAddress.length > 500) throw new Error('Enter a valid address.');
  if (!model.projectTitle || model.projectTitle.length > 160) throw new Error('Enter a valid project title.');
  if (!model.startDate) throw new Error('Enter a valid start date.');
  if (!['GBP', 'EUR', 'USD'].includes(model.currency)) throw new Error('Choose a supported currency.');
  if (!totalText || !isFinite(model.total) || model.total < 0 || model.total > 999999999.99) {
    throw new Error('Total must be between zero and 999,999,999.99.');
  }
  if (model.notes.length > 2000) throw new Error('Notes are too long.');

  return model;
}

function buildDocumentTokens_(model) {
  const timeZone = Session.getScriptTimeZone();
  const currencySymbols = { GBP: '£', EUR: '€', USD: '$' };

  return {
    REFERENCE: model.reference,
    CUSTOMER_NAME: model.customerName,
    CUSTOMER_ADDRESS: model.customerAddress,
    PROJECT_TITLE: model.projectTitle,
    START_DATE: Utilities.formatDate(model.startDate, timeZone, 'dd MMMM yyyy'),
    CURRENCY: model.currency,
    CURRENCY_SYMBOL: currencySymbols[model.currency],
    TOTAL: currencySymbols[model.currency] + formatDocumentAmount_(model.total),
    NOTES: model.notes || 'No additional notes.',
    CREATED_DATE: Utilities.formatDate(new Date(), timeZone, 'dd MMMM yyyy')
  };
}

function parseDocumentDate_(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12);
  return date.getFullYear() === Number(match[1])
    && date.getMonth() === Number(match[2]) - 1
    && date.getDate() === Number(match[3]) ? date : null;
}

function formatDocumentAmount_(value) {
  return Number(value).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function cleanDocumentText_(value) {
  return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
}

function cleanMultilineText_(value) {
  return String(value == null ? '' : value)
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map(function (line) { return line.replace(/\s+/g, ' ').trim(); })
    .filter(Boolean)
    .join('\n');
}

function escapeDocumentPattern_(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function safeDocumentReplacement_(value) {
  return String(value == null ? '' : value).replace(/\n/g, '\r');
}

function buildGeneratedPdfName_(model, sourceLabel) {
  return model.reference + ' - ' + sourceLabel + '.pdf';
}
