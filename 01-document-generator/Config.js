const DOCUMENT_GENERATOR = Object.freeze({
  templateTypes: Object.freeze({
    document: 'document',
    spreadsheet: 'spreadsheet'
  }),
  properties: Object.freeze({
    documentTemplateId: 'DOCUMENT_TEMPLATE_ID',
    spreadsheetTemplateId: 'SPREADSHEET_TEMPLATE_ID',
    spreadsheetTemplateSheetName: 'SPREADSHEET_TEMPLATE_SHEET_NAME'
  })
});

function getDocumentGeneratorConfig_() {
  const properties = PropertiesService.getScriptProperties();

  return {
    documentTemplateId: requiredDocumentProperty_(properties, DOCUMENT_GENERATOR.properties.documentTemplateId),
    spreadsheetTemplateId: requiredDocumentProperty_(properties, DOCUMENT_GENERATOR.properties.spreadsheetTemplateId),
    spreadsheetTemplateSheetName: cleanDocumentText_(
      properties.getProperty(DOCUMENT_GENERATOR.properties.spreadsheetTemplateSheetName)
    )
  };
}

function requiredDocumentProperty_(properties, name) {
  const value = cleanDocumentText_(properties.getProperty(name));
  if (!value) throw new Error('Missing Script Property: ' + name);
  return value;
}
