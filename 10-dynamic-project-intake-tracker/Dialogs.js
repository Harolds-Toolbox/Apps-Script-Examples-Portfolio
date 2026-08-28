function showProjectDialog() {
  SpreadsheetApp.getUi().showModalDialog(
    HtmlService.createHtmlOutputFromFile("ProjectDialog")
      .setWidth(430)
      .setHeight(430),
    "Create a project",
  );
}
