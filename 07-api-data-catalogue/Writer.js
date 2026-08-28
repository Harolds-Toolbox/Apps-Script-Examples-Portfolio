function writeApiCatalogue_(endpointRows, fieldRows, relationshipRows) {
  const book = catalogueBook_();
  replaceCatalogueSheet_(
    book,
    CATALOGUE.endpointsSheet,
    [
      "Endpoint",
      "Path",
      "Items Path",
      "Sample Size",
      "Records Sampled",
      "Generated At",
    ],
    endpointRows,
  );
  replaceCatalogueSheet_(
    book,
    CATALOGUE.fieldsSheet,
    [
      "Endpoint",
      "Field Path",
      "Observed Types",
      "Nullable",
      "Example",
      "Occurrences",
    ],
    fieldRows,
  );
  replaceCatalogueSheet_(
    book,
    CATALOGUE.relationshipsSheet,
    ["Endpoint", "Field Path", "Possible Target", "Confidence"],
    relationshipRows,
  );
}

function replaceCatalogueSheet_(book, name, headers, rows) {
  const sheet = book.getSheetByName(name);
  if (!sheet) throw new Error("Missing sheet: " + name);
  sheet.clearContents();
  const values = [headers].concat(rows);
  sheet.getRange(1, 1, values.length, headers.length).setValues(values);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
  sheet.autoResizeColumns(1, headers.length);
}
