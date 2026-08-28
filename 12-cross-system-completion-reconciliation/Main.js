// Main flow: fetch both systems → normalise → match → write exceptions → notify.
function reconcileCompletions() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const c = reconciliationConfig_(),
      cutoff = Date.now() - c.ageHours * 3600000,
      events = fetchPagedRecords_(c.sourceA)
        .map(normaliseSourceA_)
        .filter((e) => e.occurredAt.getTime() <= cutoff),
      completions = fetchPagedRecords_(c.sourceB).map(normaliseSourceB_),
      exceptions = events.filter((e) => !completionMatch_(e, completions));
    writeReconciliationReport_(exceptions);
    if (exceptions.length)
      MailApp.sendEmail({
        to: c.recipient,
        subject: "Completion exceptions: " + exceptions.length,
        htmlBody: completionEmail_(exceptions),
      });
    return { eligible: events.length, exceptions: exceptions.length };
  } finally {
    lock.releaseLock();
  }
}
function writeReconciliationReport_(rows) {
  const id = reconciliationConfig_().sheetId;
  if (!id) return;
  const ss = SpreadsheetApp.openById(id),
    sheet =
      ss.getSheetByName("Completion Exceptions") ||
      ss.insertSheet("Completion Exceptions");
  sheet.clearContents();
  sheet.appendRow(["Checked At", "Source ID", "Name", "Occurred At", "Reason"]);
  if (rows.length)
    sheet
      .getRange(2, 1, rows.length, 5)
      .setValues(
        rows.map((r) => [
          new Date(),
          r.id,
          r.name,
          r.occurredAt,
          "No matching completion found",
        ]),
      );
}
function completionEmail_(rows) {
  const escape = (v) =>
    String(v || "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  return (
    "<p>" +
    rows.length +
    ' eligible event(s) have no matching completion.</p><table border="1" cellpadding="6" cellspacing="0"><tr><th>ID</th><th>Name</th><th>Occurred</th></tr>' +
    rows
      .slice(0, 100)
      .map(
        (r) =>
          "<tr><td>" +
          escape(r.id) +
          "</td><td>" +
          escape(r.name) +
          "</td><td>" +
          escape(r.occurredAt.toISOString()) +
          "</td></tr>",
      )
      .join("") +
    "</table>" +
    (rows.length > 100 ? "<p>Only the first 100 are shown.</p>" : "")
  );
}
