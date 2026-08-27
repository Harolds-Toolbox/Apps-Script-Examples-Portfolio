function doGet() {
  return HtmlService.createTemplateFromFile('Index').evaluate().setTitle('API data catalogue')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function getApiCatalogueData() {
  const book = catalogueBook_();
  const endpoints = catalogueSheetObjects_(book.getSheetByName(CATALOGUE.endpointsSheet));
  const fields = catalogueSheetObjects_(book.getSheetByName(CATALOGUE.fieldsSheet));
  const relationships = catalogueSheetObjects_(book.getSheetByName(CATALOGUE.relationshipsSheet));
  return { endpoints: endpoints, fields: fields, relationships: relationships };
}

function catalogueSheetObjects_(sheet) {
  if (!sheet) return [];
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) return [];
  const headers = values.shift();
  return values.map(function (row) {
    return headers.reduce(function (object, header, index) { object[header] = row[index]; return object; }, {});
  });
}
