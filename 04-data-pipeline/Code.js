const PIPELINE_HEADERS = ['Record ID', 'Display Name', 'Region', 'Active', 'Updated At'];

function runCustomerPipeline() {
  const book = SpreadsheetApp.openById(requiredPipelineProperty_('PIPELINE_SPREADSHEET_ID'));
  const raw = extractRows_(book.getSheetByName('Raw Input'));
  const transformed = raw.map(transformRow_);
  const errors = validateRows_(transformed);
  if (errors.length) throw new Error('Validation failed: ' + errors.slice(0, 5).join('; '));

  loadAtomically_(book.getSheetByName('Staging'), book.getSheetByName('Reporting'), transformed);
  console.log(JSON.stringify({ event: 'pipeline_complete', input: raw.length, output: transformed.length }));
}

function extractRows_(sheet) {
  const values = sheet.getDataRange().getValues();
  const headers = values.shift().map(function (value) { return String(value).trim(); });
  return values.filter(function (row) { return row.some(Boolean); }).map(function (row) {
    return headers.reduce(function (record, header, index) {
      record[header] = row[index];
      return record;
    }, {});
  });
}

function transformRow_(record) {
  return [
    String(record['ID'] || '').trim(),
    toTitleCase_(record['Name']),
    String(record['Region'] || 'Unknown').trim().toUpperCase(),
    ['true', 'yes', '1'].indexOf(String(record['Active']).toLowerCase()) !== -1,
    normalizeDate_(record['Updated'])
  ];
}

function validateRows_(rows) {
  const seen = {};
  const errors = [];
  rows.forEach(function (row, index) {
    if (!row[0]) errors.push('row ' + (index + 2) + ' has no ID');
    if (seen[row[0]]) errors.push('duplicate ID ' + row[0]);
    seen[row[0]] = true;
    if (!(row[4] instanceof Date) || isNaN(row[4].getTime())) errors.push('invalid date for ' + row[0]);
  });
  return errors;
}

function loadAtomically_(staging, output, rows) {
  staging.clearContents();
  const allRows = [PIPELINE_HEADERS].concat(rows);
  staging.getRange(1, 1, allRows.length, PIPELINE_HEADERS.length).setValues(allRows);
  SpreadsheetApp.flush();

  output.clearContents();
  staging.getRange(1, 1, allRows.length, PIPELINE_HEADERS.length)
    .copyTo(output.getRange(1, 1), SpreadsheetApp.CopyPasteType.PASTE_VALUES, false);
}

function toTitleCase_(value) {
  return String(value || '').trim().toLowerCase().replace(/\b\w/g, function (letter) { return letter.toUpperCase(); });
}

function normalizeDate_(value) {
  return value instanceof Date ? value : new Date(String(value));
}

function requiredPipelineProperty_(name) {
  const value = PropertiesService.getScriptProperties().getProperty(name);
  if (!value) throw new Error('Missing Script Property: ' + name);
  return value;
}
