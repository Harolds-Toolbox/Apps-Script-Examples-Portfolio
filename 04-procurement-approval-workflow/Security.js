function createProcurementToken_(reference, action, version, expirySeconds) {
  const expires = Math.floor(Date.now() / 1000) + (expirySeconds || PROCUREMENT.linkLifetimeSeconds);
  const payload = [reference, action, String(version), String(expires)].join('|');
  return { expires: expires, signature: signProcurementPayload_(payload) };
}

function verifyProcurementToken_(reference, action, version, expires, suppliedSignature) {
  const numericExpiry = Number(expires);
  if (!isFinite(numericExpiry) || numericExpiry < Math.floor(Date.now() / 1000)) throw new Error('This action link has expired.');
  const payload = [reference, action, String(version), String(numericExpiry)].join('|');
  const expected = signProcurementPayload_(payload);
  if (!constantTimeProcurementEqual_(expected, String(suppliedSignature || ''))) throw new Error('This action link is invalid.');
  return true;
}

function signProcurementPayload_(payload) {
  const secret = procurementProperty_('PROCUREMENT_LINK_SECRET');
  if (secret.length < 32) throw new Error('PROCUREMENT_LINK_SECRET must contain at least 32 characters.');
  const bytes = Utilities.computeHmacSha256Signature(payload, secret);
  return Utilities.base64EncodeWebSafe(bytes).replace(/=+$/, '');
}

function constantTimeProcurementEqual_(left, right) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return mismatch === 0;
}

function buildProcurementActionUrl_(request, action) {
  const token = createProcurementToken_(request.reference, action, request.version);
  return procurementProperty_('PROCUREMENT_WEB_APP_URL') + '?' + [
    'mode=action',
    'ref=' + encodeURIComponent(request.reference),
    'action=' + encodeURIComponent(action),
    'version=' + encodeURIComponent(String(request.version)),
    'expires=' + encodeURIComponent(String(token.expires)),
    'signature=' + encodeURIComponent(token.signature)
  ].join('&');
}
