/**
 * Synthetic checks for the pure validation helpers. Run from the Apps Script
 * editor; it does not read Drive or generate a PDF.
 */
function runDocumentGeneratorSelfTests() {
  const validInput = {
    templateType: 'document',
    reference: 'DEMO-2048',
    customerName: 'Sample Customer',
    customerAddress: '10 Example Street\nSample Town',
    projectTitle: 'Community workspace refresh',
    startDate: '2026-09-14',
    currency: 'GBP',
    total: '1250.50',
    notes: 'Synthetic portfolio test data.'
  };
  const documentModel = validateDocumentInput_(validInput);
  const sheetModel = validateDocumentInput_(Object.assign({}, validInput, { templateType: 'spreadsheet' }));
  const cases = [
    documentModel.templateType === 'document',
    sheetModel.templateType === 'spreadsheet',
    documentModel.total === 1250.5,
    formatDocumentAmount_(1250.5) === '1,250.50',
    parseDocumentDate_('2026-02-29') === null,
    parseDocumentDate_('2028-02-29') instanceof Date
  ];

  return { ok: cases.every(function (result) { return result === true; }), results: cases };
}
