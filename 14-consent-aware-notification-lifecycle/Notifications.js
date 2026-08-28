function prepareOpportunityNotifications() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const sheets = lifecycleSheets_(),
      subscribers = lifecycleObjects_("subscribers"),
      opportunities = lifecycleObjects_("opportunities").filter(
        (o) =>
          String(o.Status).toLowerCase() === "open" &&
          !o["Review Requested At"],
      );
    opportunities.forEach((opportunity) => {
      const matches = subscribers.filter((s) =>
        subscriberMatches_(s, opportunity),
      );
      if (!matches.length) return;
      const batchId = Utilities.getUuid();
      sheets.queue
        .getRange(sheets.queue.getLastRow() + 1, 1, matches.length, 5)
        .setValues(
          matches.map((s) => [
            batchId,
            opportunity["Opportunity ID"],
            s["Subscriber ID"],
            "Pending",
            "",
          ]),
        );
      const token = issueLifecycleToken_(
        "review",
        batchId,
        opportunity["Opportunity ID"],
      );
      const url =
        lifecycleConfig_().webAppUrl +
        "?token=" +
        encodeURIComponent(token) +
        "&view=review";
      MailApp.sendEmail({
        to: lifecycleConfig_().reviewer,
        subject: "Review notification recipients: " + opportunity.Title,
        htmlBody:
          "<p>" +
          matches.length +
          " eligible subscriber(s) matched <strong>" +
          escapeLifecycle_(opportunity.Title) +
          '</strong>.</p><p><a href="' +
          url +
          '">Review recipients</a></p><p>The link is opaque and expires automatically.</p>',
      });
      sheets.opportunities.getRange(opportunity._row, 7).setValue(new Date());
      auditLifecycle_(
        opportunity["Opportunity ID"],
        "REVIEW_REQUESTED",
        matches.length + " matches",
      );
    });
  } finally {
    lock.releaseLock();
  }
}

function getNotificationReview(token) {
  requireReviewer_();
  const ref = readLifecycleToken_(token, "review", false),
    queue = lifecycleObjects_("queue").filter(
      (q) =>
        String(q["Batch ID"]) === ref.subjectId &&
        String(q.Decision) === "Pending",
    ),
    subscribers = lifecycleObjects_("subscribers"),
    opportunity = lifecycleObjects_("opportunities").find(
      (o) => String(o["Opportunity ID"]) === ref.contextId,
    );
  if (!opportunity) throw new Error("Opportunity not found.");
  return {
    title: String(opportunity.Title),
    recipients: queue
      .map((q) => {
        const s = subscribers.find(
          (x) => String(x["Subscriber ID"]) === String(q["Subscriber ID"]),
        );
        return s
          ? {
              id: String(s["Subscriber ID"]),
              name: String(s.Name),
              email: String(s.Email),
            }
          : null;
      })
      .filter(Boolean),
  };
}

function approveNotificationRecipients(token, subscriberIds) {
  requireReviewer_();
  const ref = readLifecycleToken_(token, "review", true),
    approved = new Set((subscriberIds || []).map(String)),
    sheets = lifecycleSheets_(),
    opportunity = lifecycleObjects_("opportunities").find(
      (o) => String(o["Opportunity ID"]) === ref.contextId,
    ),
    subscribers = lifecycleObjects_("subscribers"),
    queue = lifecycleObjects_("queue").filter(
      (q) =>
        String(q["Batch ID"]) === ref.subjectId &&
        String(q.Decision) === "Pending",
    );
  let sent = 0;
  queue.forEach((item) => {
    const subscriber = subscribers.find(
        (s) => String(s["Subscriber ID"]) === String(item["Subscriber ID"]),
      ),
      isApproved =
        subscriber &&
        approved.has(String(item["Subscriber ID"])) &&
        String(subscriber["Consent Status"]).toLowerCase() === "subscribed";
    if (isApproved) {
      sendOpportunityEmail_(subscriber, opportunity);
      sent++;
    }
    sheets.queue
      .getRange(item._row, 4, 1, 2)
      .setValues([
        [isApproved ? "Approved" : "Declined", isApproved ? new Date() : ""],
      ]);
  });
  sheets.opportunities.getRange(opportunity._row, 8).setValue(new Date());
  auditLifecycle_(
    opportunity["Opportunity ID"],
    "NOTIFICATIONS_REVIEWED",
    sent + " sent",
  );
  return { sent };
}

function sendOpportunityEmail_(subscriber, opportunity) {
  const token = issueLifecycleToken_(
      "unsubscribe",
      subscriber["Subscriber ID"],
      "",
    ),
    url =
      lifecycleConfig_().webAppUrl +
      "?token=" +
      encodeURIComponent(token) +
      "&view=preference";
  MailApp.sendEmail({
    to: String(subscriber.Email),
    subject: String(opportunity.Title),
    htmlBody:
      "<p>Hello " +
      escapeLifecycle_(subscriber.Name) +
      ",</p><p>A new opportunity matches your saved preferences: <strong>" +
      escapeLifecycle_(opportunity.Title) +
      "</strong>.</p><p>Category: " +
      escapeLifecycle_(opportunity.Category) +
      "<br>Region: " +
      escapeLifecycle_(opportunity.Region) +
      "<br>Closing: " +
      escapeLifecycle_(
        new Date(opportunity["Closing At"]).toLocaleDateString(),
      ) +
      '</p><p><a href="' +
      url +
      '">Stop these notifications</a></p>',
  });
}

function escapeLifecycle_(v) {
  return String(v || "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}
function requireReviewer_() {
  if (
    Session.getActiveUser().getEmail().toLowerCase() !==
    lifecycleConfig_().reviewer.toLowerCase()
  )
    throw new Error("Reviewer access is required.");
}
