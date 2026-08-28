import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import vm from "node:vm";

const root = new URL("..", import.meta.url).pathname.replace(/\/$/, "");

function loadScript(relativePath, context) {
  vm.createContext(context);
  vm.runInContext(readFileSync(join(root, relativePath), "utf8"), context, {
    filename: relativePath,
  });
  return context;
}

function webhookQueueHarness() {
  const queueKey = "WEBHOOK_QUEUE:1";
  const stored = {
    [queueKey]: JSON.stringify({
      receivedAt: "2026-01-15T09:30:00.000Z",
      eventId: "evt_test_1042",
      eventType: "record.updated",
      rawBody: '{"id":"evt_test_1042"}',
      source: "WEBHOOK",
    }),
  };
  const rows = [[
    "Received At",
    "Event ID",
    "Event Type",
    "Payload JSON",
    "Status",
    "Attempts",
    "Next Retry At",
    "Last Error",
    "Processed At",
    "Source",
  ]];
  const state = { failWrite: false, failFlush: false };
  const sheet = {
    getLastRow: () => rows.length,
    getRange(row, column, rowCount, columnCount) {
      return {
        getValues: () => rows.slice(row - 1, row - 1 + rowCount).map((item) => item.slice(column - 1, column - 1 + columnCount)),
        getDisplayValues: () => rows.slice(row - 1, row - 1 + rowCount).map((item) => item.slice(column - 1, column - 1 + columnCount).map(String)),
        setValues(values) {
          if (state.failWrite) throw new Error("simulated Sheet write failure");
          values.forEach((value, offset) => {
            rows[row - 1 + offset] = value.slice();
          });
        },
      };
    },
  };
  const properties = {
    getProperties: () => ({ ...stored }),
    getProperty: (key) => stored[key] || null,
    setProperty: (key, value) => {
      stored[key] = String(value);
    },
    deleteProperty: (key) => {
      delete stored[key];
    },
  };
  const context = {
    WEBHOOK_CONFIG: { queuePrefix: "WEBHOOK_QUEUE:", dedupPrefix: "WEBHOOK_SEEN:" },
    WEBHOOK_HEADERS: rows[0].slice(),
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock() {} }) },
    PropertiesService: { getScriptProperties: () => properties },
    SpreadsheetApp: { flush: () => { if (state.failFlush) throw new Error("simulated flush failure"); } },
    webhookInbox_: () => sheet,
    console,
    Date,
    JSON,
    String,
    Boolean,
    Object,
  };
  loadScript("05-reliable-webhook-inbox/Queue.js", context);
  return { context, queueKey, rows, state, stored };
}

test("project 05 retains the temporary queue item when the Sheet write fails", () => {
  const harness = webhookQueueHarness();
  harness.state.failWrite = true;
  assert.throws(() => harness.context.flushWebhookQueue(), /simulated Sheet write failure/);
  assert.ok(harness.stored[harness.queueKey]);
  assert.equal(harness.stored["WEBHOOK_SEEN:evt_test_1042"], undefined);
  assert.equal(harness.rows.length, 1);
});

test("project 05 retries idempotently after the Sheet commit succeeds but cleanup is interrupted", () => {
  const harness = webhookQueueHarness();
  harness.state.failFlush = true;
  assert.throws(() => harness.context.flushWebhookQueue(), /simulated flush failure/);
  assert.equal(harness.rows.length, 2);
  assert.ok(harness.stored[harness.queueKey]);

  harness.state.failFlush = false;
  harness.context.flushWebhookQueue();
  assert.equal(harness.rows.length, 2);
  assert.equal(harness.stored[harness.queueKey], undefined);
  assert.ok(harness.stored["WEBHOOK_SEEN:evt_test_1042"]);
});

test("project 11 consumes every provider webhook page", () => {
  const context = loadScript("11-self-healing-webhook-manager/Api.js", {
    webhookManagerConfig_: () => ({ baseUrl: "https://provider.test/api", maxPages: 5 }),
    console,
    Array,
    Object,
    String,
    JSON,
    RegExp,
    Error,
  });
  const pages = {
    "https://provider.test/api/webhooks": { items: [{ id: "one" }], next: "/api/webhooks?page=2" },
    "https://provider.test/api/webhooks?page=2": { items: [{ id: "two" }] },
  };
  context.webhookApi_ = (_method, url) => pages[url];
  assert.deepEqual(
    Array.from(context.listProviderWebhooks_(), (item) => item.id),
    ["one", "two"],
  );
});

test("project 11 refuses incomplete or cross-origin pagination", () => {
  const context = loadScript("11-self-healing-webhook-manager/Api.js", {
    webhookManagerConfig_: () => ({ baseUrl: "https://provider.test/api", maxPages: 2 }),
    console,
    Array,
    Object,
    String,
    JSON,
    RegExp,
    Error,
  });
  context.webhookApi_ = () => ({ items: [], next: "?page=next" });
  assert.throws(() => context.listProviderWebhooks_(), /exceeded WEBHOOK_MAX_PAGES/);
  context.webhookApi_ = () => ({ items: [], next: "https://attacker.test/hooks" });
  assert.throws(() => context.listProviderWebhooks_(), /configured origin/);
});

function webhookManagerHarness(makeReplacementVisible) {
  const config = {
    callbackUrl: "https://portfolio.test/webhook",
    events: ["record.created", "record.updated"],
    scope: {},
    failureThreshold: 3,
    alert: "",
  };
  let hooks = [{
    id: "old",
    url: config.callbackUrl,
    events: config.events.slice(),
    scope: {},
    status: "failed",
    failureCount: 9,
  }];
  const operations = [];
  const context = {
    webhookManagerConfig_: () => config,
    listProviderWebhooks_: () => {
      operations.push("list");
      return hooks.map((hook) => ({ ...hook }));
    },
    createProviderWebhook_: () => {
      operations.push("create:new");
      if (makeReplacementVisible) {
        hooks.push({
          id: "new",
          url: config.callbackUrl,
          events: config.events.slice(),
          scope: {},
          status: "active",
        });
      }
      return { id: "new" };
    },
    deleteProviderWebhook_: (id) => {
      operations.push(`delete:${id}`);
      hooks = hooks.filter((hook) => hook.id !== id);
    },
    updateProviderWebhook_: () => {},
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    Utilities: { sleep() {} },
    MailApp: { sendEmail() {} },
    console,
    Array,
    Object,
    String,
    JSON,
    RegExp,
    Error,
    Number,
    Math,
  };
  loadScript("11-self-healing-webhook-manager/Manager.js", context);
  return { context, operations, getHooks: () => hooks };
}

test("project 11 verifies a replacement before deleting the failing webhook", () => {
  const harness = webhookManagerHarness(true);
  assert.deepEqual({ ...harness.context.reconcileProviderWebhook() }, { action: "rotated", id: "new" });
  assert.ok(harness.operations.indexOf("list", 1) < harness.operations.indexOf("delete:old"));
  assert.deepEqual(harness.getHooks().map((hook) => hook.id), ["new"]);
});

test("project 11 preserves the old webhook when the replacement is not visible", () => {
  const harness = webhookManagerHarness(false);
  assert.throws(
    () => harness.context.reconcileProviderWebhook(),
    /Created webhook was not visible/,
  );
  assert.equal(harness.operations.includes("delete:old"), false);
  assert.deepEqual(harness.getHooks().map((hook) => hook.id), ["old"]);
});

function reconciliationContext(source) {
  const context = loadScript("12-cross-system-completion-reconciliation/Clients.js", {
    console,
    Array,
    Object,
    String,
    JSON,
    RegExp,
    Error,
  });
  context.fetchReconciliationUrl_ = (url) => ({
    getContentText: () => JSON.stringify(source[url]),
  });
  return context;
}

test("project 12 consumes every source page", () => {
  const source = {
    "https://source.test/events": { items: [{ id: 1 }], next: "/events?page=2" },
    "https://source.test/events?page=2": { items: [{ id: 2 }] },
  };
  const context = reconciliationContext(source);
  assert.deepEqual(
    Array.from(
      context.fetchPagedRecords_({ url: "https://source.test/events", token: "test", maxPages: 5 }),
      (item) => item.id,
    ),
    [1, 2],
  );
});

test("project 12 rejects page-limit truncation, loops and cross-origin next links", () => {
  let context = reconciliationContext({
    "https://source.test/events": { items: [], next: "?page=2" },
    "https://source.test/events?page=2": { items: [], next: "?page=3" },
  });
  assert.throws(
    () => context.fetchPagedRecords_({ url: "https://source.test/events", token: "test", maxPages: 2 }),
    /refusing an incomplete result/,
  );

  context = reconciliationContext({
    "https://source.test/events": { items: [], next: "/events" },
  });
  assert.throws(
    () => context.fetchPagedRecords_({ url: "https://source.test/events", token: "test", maxPages: 5 }),
    /pagination loop detected/,
  );

  context = reconciliationContext({
    "https://source.test/events": { items: [], next: "https://attacker.test/events" },
  });
  assert.throws(
    () => context.fetchPagedRecords_({ url: "https://source.test/events", token: "test", maxPages: 5 }),
    /configured origin/,
  );
});
