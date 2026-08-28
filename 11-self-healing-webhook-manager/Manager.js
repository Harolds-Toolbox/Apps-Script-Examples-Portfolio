function reconcileProviderWebhook() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const c = webhookManagerConfig_(),
      hooks = listProviderWebhooks_().filter((h) =>
        webhookCallbackMatches_(h, c),
      ),
      configuredHooks = hooks.filter((h) => webhookDefinitionMatches_(h, c));
    if (!hooks.length) {
      const created = createProviderWebhook_(c);
      const verified = verifyProviderWebhookPresent_(
        c,
        providerWebhookId_(created),
      );
      notifyWebhookManager_(
        "Webhook created",
        "Created replacement webhook " + verified.id,
      );
      return { action: "created", id: verified.id };
    }
    const healthy = configuredHooks.find(webhookIsHealthy_);
    if (healthy) {
      const healthyId = providerWebhookId_(healthy);
      hooks
        .filter((h) => providerWebhookId_(h) !== healthyId)
        .forEach((h) => deleteProviderWebhook_(providerWebhookId_(h)));
      verifyOnlyProviderWebhookRemains_(c, healthyId);
      return { action: "healthy", id: healthyId };
    }
    const candidate = configuredHooks[0] || hooks[0],
      candidateId = providerWebhookId_(candidate),
      failures = Number(
        candidate.consecutiveFailures || candidate.failureCount || 0,
      );
    if (
      webhookDefinitionMatches_(candidate, c) &&
      ["suspended", "disabled", "paused"].includes(
        String(candidate.status).toLowerCase(),
      ) &&
      failures < c.failureThreshold
    ) {
      updateProviderWebhook_(candidateId, { status: "active" });
      verifyProviderWebhookHealthy_(c, candidateId);
      hooks
        .filter((h) => providerWebhookId_(h) !== candidateId)
        .forEach((h) => deleteProviderWebhook_(providerWebhookId_(h)));
      verifyOnlyProviderWebhookRemains_(c, candidateId);
      return { action: "reactivated", id: candidateId };
    }
    const replacement = createProviderWebhook_(c);
    const replacementId = providerWebhookId_(replacement);
    verifyProviderWebhookPresent_(c, replacementId);
    hooks
      .filter((h) => providerWebhookId_(h) !== replacementId)
      .forEach((h) => deleteProviderWebhook_(providerWebhookId_(h)));
    verifyOnlyProviderWebhookRemains_(c, replacementId);
    notifyWebhookManager_(
      "Webhook rotated",
      "Replaced failing webhook " +
        candidateId +
        " with " +
        replacementId,
    );
    return { action: "rotated", id: replacementId };
  } finally {
    lock.releaseLock();
  }
}

function webhookCallbackMatches_(hook, c) {
  return String(hook.url || hook.callbackUrl || "") === c.callbackUrl;
}

function webhookDefinitionMatches_(hook, c) {
  if (!webhookCallbackMatches_(hook, c)) return false;
  const hookEvents = hook.events || hook.eventTypes;
  if (
    Array.isArray(hookEvents) &&
    stableWebhookJson_(hookEvents.slice().sort()) !==
      stableWebhookJson_(c.events.slice().sort())
  )
    return false;
  const hookScope = hook.scope || hook.filters;
  return (
    hookScope == null ||
    stableWebhookJson_(hookScope) === stableWebhookJson_(c.scope)
  );
}

function stableWebhookJson_(value) {
  if (Array.isArray(value))
    return "[" + value.map(stableWebhookJson_).join(",") + "]";
  if (value && typeof value === "object")
    return (
      "{" +
      Object.keys(value)
        .sort()
        .map(
          (key) => JSON.stringify(key) + ":" + stableWebhookJson_(value[key]),
        )
        .join(",") +
      "}"
    );
  return JSON.stringify(value);
}

function webhookIsHealthy_(hook) {
  return ["active", "enabled", "healthy"].includes(
    String(hook.status || "").toLowerCase(),
  );
}

function providerWebhookId_(hook) {
  const id = String((hook && (hook.id || hook.webhookId)) || "").trim();
  if (!id)
    throw new Error("Provider webhook response did not include a stable ID.");
  return id;
}

function verifyProviderWebhookPresent_(c, expectedId) {
  return verifyProviderWebhookState_(function (hooks) {
    return hooks.find(
      (hook) =>
        providerWebhookId_(hook) === expectedId &&
        webhookDefinitionMatches_(hook, c),
    );
  }, "Created webhook was not visible with the configured callback, events and scope.");
}

function verifyProviderWebhookHealthy_(c, expectedId) {
  return verifyProviderWebhookState_(function (hooks) {
    return hooks.find(
      (hook) =>
        providerWebhookId_(hook) === expectedId &&
        webhookDefinitionMatches_(hook, c) &&
        webhookIsHealthy_(hook),
    );
  }, "Reactivated webhook did not become healthy.");
}

function verifyOnlyProviderWebhookRemains_(c, expectedId) {
  return verifyProviderWebhookState_(function (hooks) {
    const matching = hooks.filter((hook) => webhookCallbackMatches_(hook, c));
    return matching.length === 1 && providerWebhookId_(matching[0]) === expectedId
      ? matching[0]
      : null;
  }, "Webhook reconciliation did not leave exactly one configured callback registration.");
}

function verifyProviderWebhookState_(predicate, errorMessage) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const match = predicate(listProviderWebhooks_());
    if (match) return match;
    if (attempt < 2) Utilities.sleep(500 * Math.pow(2, attempt));
  }
  throw new Error(errorMessage);
}
function notifyWebhookManager_(subject, body) {
  const recipient = webhookManagerConfig_().alert;
  if (recipient) MailApp.sendEmail(recipient, subject, body);
}
