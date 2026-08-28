function doGet(e) {
  const template = HtmlService.createTemplateFromFile("Index");
  const view =
    String((e.parameter || {}).view || "preference") === "review"
      ? "review"
      : "preference";
  template.bootstrapBase64 = Utilities.base64Encode(
    JSON.stringify({
      token: String((e.parameter || {}).token || ""),
      view,
    }),
    Utilities.Charset.UTF_8,
  );
  return template
    .evaluate()
    .setTitle("Notification preferences")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

function unsubscribeWithToken(token) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const ref = readLifecycleTokenUnlocked_(token, "unsubscribe"),
      subscriber = lifecycleObjects_("subscribers").find(
        (s) => String(s["Subscriber ID"]) === ref.subjectId,
      );
    if (!subscriber) throw new Error("Subscriber not found.");
    const alreadyUnsubscribed =
      String(subscriber["Consent Status"]).toLowerCase() === "unsubscribed";
    if (!alreadyUnsubscribed) {
      lifecycleSheets_()
        .subscribers.getRange(subscriber._row, 6)
        .setValue("Unsubscribed");
      auditLifecycle_(
        subscriber["Subscriber ID"],
        "UNSUBSCRIBED",
        "Self-service link",
      );
    }
    consumeLifecycleTokenUnlocked_(ref.tokenRow);
    return { message: "You have been unsubscribed from future notifications." };
  } finally {
    lock.releaseLock();
  }
}

function reviewSubscriberRetention() {
  const c = lifecycleConfig_(),
    cutoff = Date.now() - c.retentionDays * 86400000,
    subscribers = lifecycleObjects_("subscribers");
  assertLifecycleRecords_(subscribers, "Subscriber ID", {
    emailHeader: "Email",
  });
  subscribers
    .filter(
      (s) => {
        if (String(s["Consent Status"]).toLowerCase() !== "subscribed") {
          return false;
        }
        const consentAt = parseDateValue_(
            s["Consent At"],
            `Consent At on row ${s._row}`,
          ).getTime(),
          retentionReviewedAt = s["Retention Review At"]
            ? parseDateValue_(
                s["Retention Review At"],
                `Retention Review At on row ${s._row}`,
              ).getTime()
            : 0;
        return (
          consentAt < cutoff &&
          (!retentionReviewedAt || retentionReviewedAt < cutoff)
        );
      },
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
