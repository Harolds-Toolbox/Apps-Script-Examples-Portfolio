function loadPipelineDestination_(values, route) {
  const book = SpreadsheetApp.openById(
    filePipelineProperty_("PIPELINE_DESTINATION_SPREADSHEET_ID"),
  );
  const destination = book.getSheetByName(route.destinationSheet);
  if (!destination)
    throw new Error("Missing destination sheet: " + route.destinationSheet);
  const stagingName =
    "_staging_" + route.name.replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 70);
  const staging =
    book.getSheetByName(stagingName) || book.insertSheet(stagingName);
  staging.clearContents();
  staging.getRange(1, 1, values.length, values[0].length).setValues(values);
  SpreadsheetApp.flush();
  destination.clearContents();
  staging
    .getRange(1, 1, values.length, values[0].length)
    .copyTo(
      destination.getRange(1, 1),
      SpreadsheetApp.CopyPasteType.PASTE_VALUES,
      false,
    );
  destination.setFrozenRows(1);
  destination.getRange(1, 1, 1, values[0].length).setFontWeight("bold");
}
