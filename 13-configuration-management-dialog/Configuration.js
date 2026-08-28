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
    snapshot = readConfigurationSnapshot_();
  template.bootstrapBase64 = Utilities.base64Encode(
    JSON.stringify({
      items: snapshot.items,
      revision: snapshot.revision,
      regions: [
        ...new Set(snapshot.items.map((i) => i.region).filter(Boolean)),
      ],
    }),
    Utilities.Charset.UTF_8,
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

function readConfigurationSnapshot_() {
  const items = readConfigurationItems_();
  return { items, revision: configurationRevision_(items) };
}

function configurationRevision_(items) {
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    JSON.stringify(items),
    Utilities.Charset.UTF_8,
  );
  return Utilities.base64EncodeWebSafe(digest).replace(/=+$/, "");
}

function saveConfigurationItems(payload) {
  if (!payload || !Array.isArray(payload.items) || !payload.revision) {
    throw new Error("Invalid configuration payload.");
  }
  const items = payload.items;
  if (items.length > CONFIG_UI.maxItems) {
    throw new Error(`No more than ${CONFIG_UI.maxItems} items may be saved.`);
  }
  const clean = items.map((item, index) => ({
    item: String(item.item || "").trim(),
    address: String(item.address || "").trim(),
    region: String(item.region || "").trim(),
    active: Boolean(item.active),
    sortOrder: index + 1,
  }));
  if (clean.some((i) => !i.item)) throw new Error("Every item needs a name.");
  Object.keys(CONFIG_UI.maxLengths).forEach((field) => {
    const maximum = CONFIG_UI.maxLengths[field];
    if (clean.some((item) => item[field].length > maximum)) {
      throw new Error(`${field} values may not exceed ${maximum} characters.`);
    }
  });
  const names = clean.map((i) => i.item.toLowerCase());
  if (new Set(names).size !== names.length)
    throw new Error("Item names must be unique.");
  const lock = LockService.getDocumentLock();
  lock.waitLock(15000);
  try {
    const sheet = SpreadsheetApp.getActive().getSheetByName(CONFIG_UI.sheet);
    if (!sheet) throw new Error("Run setupConfigurationManager() first.");
    const current = readConfigurationSnapshot_();
    if (String(payload.revision) !== current.revision) {
      throw new Error(
        "This configuration changed after the dialog was opened. Close it, reopen it and apply your changes again.",
      );
    }
    const existingRows = Math.max(0, sheet.getLastRow() - 1);
    const snapshot = snapshotConfigurationRange_(sheet, existingRows);
    try {
      if (existingRows) {
        sheet
          .getRange(2, 1, existingRows, CONFIG_UI.headers.length)
          .clearContent();
      }
      if (clean.length) {
        sheet
          .getRange(2, 1, clean.length, 5)
          .setValues(
            clean.map((i) => [
              asConfigurationText_(i.item),
              asConfigurationText_(i.address),
              asConfigurationText_(i.region),
              i.active,
              i.sortOrder,
            ]),
          );
        sheet
          .getRange(2, 6, clean.length, 1)
          .setFormulaR1C1('=IF(RC[-5]="","",RC[-5]&" — "&RC[-3])');
      }
      SpreadsheetApp.flush();
    } catch (error) {
      restoreConfigurationRange_(sheet, snapshot, clean.length);
      throw error;
    }
    return { saved: clean.length, revision: configurationRevision_(clean) };
  } finally {
    lock.releaseLock();
  }
}

function asConfigurationText_(value) {
  const text = String(value || "");
  return text.startsWith("=") ? "'" + text : text;
}

function snapshotConfigurationRange_(sheet, rowCount) {
  if (!rowCount) return [];
  const range = sheet.getRange(2, 1, rowCount, CONFIG_UI.headers.length),
    values = range.getValues(),
    formulas = range.getFormulasR1C1();
  return values.map((row, rowIndex) =>
    row.map((value, columnIndex) => formulas[rowIndex][columnIndex] || value),
  );
}

function restoreConfigurationRange_(sheet, snapshot, attemptedRows) {
  const rowsToClear = Math.max(snapshot.length, attemptedRows);
  if (rowsToClear) {
    sheet
      .getRange(2, 1, rowsToClear, CONFIG_UI.headers.length)
      .clearContent();
  }
  if (snapshot.length) {
    sheet
      .getRange(2, 1, snapshot.length, CONFIG_UI.headers.length)
      .setValues(snapshot);
  }
  SpreadsheetApp.flush();
}
