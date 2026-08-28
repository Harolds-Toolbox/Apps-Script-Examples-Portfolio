function doGet(e) {
  const template = HtmlService.createTemplateFromFile("Index");
  template.token = String((e.parameter || {}).token || "");
  template.view = String((e.parameter || {}).view || "preference");
  return template
    .evaluate()
    .setTitle("Notification preferences")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DENY);
}

function unsubscribeWithToken(token) {
  const ref = readLifecycleToken_(token, "unsubscribe", true),
    subscriber = lifecycleObjects_("subscribers").find(
      (s) => String(s["Subscriber ID"]) === ref.subjectId,
    );
  if (!subscriber) throw new Error("Subscriber not found.");
  lifecycleSheets_()
    .subscribers.getRange(subscriber._row, 6)
    .setValue("Unsubscribed");
  auditLifecycle_(
    subscriber["Subscriber ID"],
    "UNSUBSCRIBED",
    "Self-service link",
  );
  return { message: "You have been unsubscribed from future notifications." };
}

function reviewSubscriberRetention() {
  const c = lifecycleConfig_(),
    cutoff = Date.now() - c.retentionDays * 86400000,
    subscribers = lifecycleObjects_("subscribers");
  subscribers
    .filter(
      (s) =>
        String(s["Consent Status"]).toLowerCase() === "subscribed" &&
        new Date(s["Consent At"]).getTime() < cutoff &&
        (!s["Retention Review At"] ||
          new Date(s["Retention Review At"]).getTime() < cutoff),
    )
    .forEach((s) => {
      const token = issueLifecycleToken_("unsubscribe", s["Subscriber ID"], ""),
        url =
          c.webAppUrl +
          "?token=" +
          encodeURIComponent(token) +
          "&view=preference";
      MailApp.sendEmail({
        to: String(s.Email),
        subject: "Review your notification preferences",
        htmlBody:
          "<p>Hello " +
          escapeLifecycle_(s.Name) +
          ',</p><p>You are still subscribed to saved-opportunity notifications. You can <a href="' +
          url +
          '">unsubscribe here</a>.</p>',
      });
      lifecycleSheets_().subscribers.getRange(s._row, 8).setValue(new Date());
      auditLifecycle_(s["Subscriber ID"], "RETENTION_REVIEW_SENT", "");
    });
}

function purgeExpiredLifecycleTokens() {
  const sheet = lifecycleSheets_().tokens;
  if (sheet.getLastRow() < 2) return;
  const rows = sheet
    .getRange(2, 1, sheet.getLastRow() - 1, LIFECYCLE.headers.tokens.length)
    .getValues();
  for (let i = rows.length - 1; i >= 0; i--)
    if (new Date(rows[i][4]).getTime() < Date.now() - 30 * 86400000)
      sheet.deleteRow(i + 2);
}
