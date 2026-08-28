function doPost(e) {
  try {
    const body = e.postData ? e.postData.contents : "",
      signature = String((e.parameter || {}).signature || "");
    if (!validWebhookSignature_(body, signature))
      return jsonWebhookResponse_({ ok: false, error: "invalid_signature" });
    const event = JSON.parse(body);
    PropertiesService.getScriptProperties().setProperty(
      "WEBHOOK_LAST_RECEIVED_AT",
      new Date().toISOString(),
    );
    console.log(
      JSON.stringify({
        eventId: event.id || "",
        type: event.type || "unknown",
      }),
    );
    return jsonWebhookResponse_({ ok: true });
  } catch (error) {
    console.error(error);
    return jsonWebhookResponse_({ ok: false, error: "invalid_request" });
  }
}
function validWebhookSignature_(body, provided) {
  const c = webhookManagerConfig_(),
    expected = Utilities.base64EncodeWebSafe(
      Utilities.computeHmacSha256Signature(body, c.secret),
    ).replace(/=+$/, "");
  return constantTimeEqual_(expected, provided);
}
function constantTimeEqual_(a, b) {
  a = String(a);
  b = String(b);
  let result = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++)
    result |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return result === 0;
}
function jsonWebhookResponse_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
