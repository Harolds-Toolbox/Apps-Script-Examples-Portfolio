// Bound-Sheet menu, dialog and configuration persistence.
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("Configuration")
    .addItem("Manage items", "openConfigurationManager")
    .addItem("Set up configuration", "setupConfigurationManager")
    .addToUi();
}

function setupConfigurationManager() {
  const ss = SpreadsheetApp.getActive(),
    sheet =
      ss.getSheetByName(CONFIG_UI.sheet) || ss.insertSheet(CONFIG_UI.sheet);
  if (!sheet.getLastRow()) {
    sheet.appendRow(CONFIG_UI.headers);
    sheet.setFrozenRows(1);
  }
  sheet.setColumnWidths(1, CONFIG_UI.headers.length, 150);
  sheet.setColumnWidth(2, 260);
}

function openConfigurationManager() {
  const template = HtmlService.createTemplateFromFile("Index"),
    items = readConfigurationItems_();
  template.bootstrapBase64 = Utilities.base64Encode(
    JSON.stringify({
      items,
      regions: [...new Set(items.map((i) => i.region).filter(Boolean))],
    }),
  );
  SpreadsheetApp.getUi().showModalDialog(
    template.evaluate().setWidth(780).setHeight(650),
    "Configuration manager",
  );
}

function readConfigurationItems_() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(CONFIG_UI.sheet);
  if (!sheet || sheet.getLastRow() < 2) return [];
  return sheet
    .getRange(2, 1, sheet.getLastRow() - 1, CONFIG_UI.editableColumns)
    .getValues()
    .filter((r) => r[0])
    .map((r) => ({
      item: String(r[0]),
      address: String(r[1]),
      region: String(r[2]),
      active: r[3] !== false,
      sortOrder: Number(r[4] || 0),
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.item.localeCompare(b.item));
}

function saveConfigurationItems(items) {
  if (!Array.isArray(items)) throw new Error("Invalid configuration payload.");
  const clean = items.map((item, index) => ({
    item: String(item.item || "").trim(),
    address: String(item.address || "").trim(),
    region: String(item.region || "").trim(),
    active: Boolean(item.active),
    sortOrder: index + 1,
  }));
  if (clean.some((i) => !i.item)) throw new Error("Every item needs a name.");
  const names = clean.map((i) => i.item.toLowerCase());
  if (new Set(names).size !== names.length)
    throw new Error("Item names must be unique.");
  const lock = LockService.getDocumentLock();
  lock.waitLock(15000);
  try {
    const sheet = SpreadsheetApp.getActive().getSheetByName(CONFIG_UI.sheet);
    if (!sheet) throw new Error("Run setupConfigurationManager() first.");
    const existingRows = Math.max(0, sheet.getLastRow() - 1);
    if (existingRows)
      sheet
        .getRange(2, 1, existingRows, CONFIG_UI.headers.length)
        .clearContent();
    if (clean.length) {
      sheet
        .getRange(2, 1, clean.length, 5)
        .setValues(
          clean.map((i) => [
            i.item,
            i.address,
            i.region,
            i.active,
            i.sortOrder,
          ]),
        );
      sheet
        .getRange(2, 6, clean.length, 1)
        .setFormulaR1C1('=IF(RC[-5]="","",RC[-5]&" — "&RC[-3])');
    }
    SpreadsheetApp.flush();
    return { saved: clean.length };
  } finally {
    lock.releaseLock();
  }
}
