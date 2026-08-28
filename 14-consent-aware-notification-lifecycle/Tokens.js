function issueLifecycleToken_(purpose, subjectId, contextId) {
  const token =
      Utilities.getUuid().replace(/-/g, "") +
      Utilities.getUuid().replace(/-/g, ""),
    expires = new Date(Date.now() + lifecycleConfig_().tokenHours * 3600000);
  lifecycleSheets_().tokens.appendRow([
    hashLifecycleToken_(token),
    purpose,
    subjectId,
    contextId || "",
    expires,
    "",
  ]);
  return token;
}

function hashLifecycleToken_(token) {
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(token || ""),
    Utilities.Charset.UTF_8,
  );
  return Utilities.base64EncodeWebSafe(digest).replace(/=+$/, "");
}

function readLifecycleToken_(token, purpose) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    return readLifecycleTokenUnlocked_(token, purpose);
  } finally {
    lock.releaseLock();
  }
}

function readLifecycleTokenUnlocked_(token, purpose) {
  const sheet = lifecycleSheets_().tokens;
  if (sheet.getLastRow() < 2) throw new Error("Invalid or expired link.");
  const rows = sheet
      .getRange(2, 1, sheet.getLastRow() - 1, LIFECYCLE.headers.tokens.length)
      .getValues(),
    tokenHash = hashLifecycleToken_(token),
    index = rows.findIndex(
      (row) => String(row[0]) === tokenHash && String(row[1]) === purpose,
    );
  if (
    index < 0 ||
    rows[index][5] ||
    !Number.isFinite(new Date(rows[index][4]).getTime()) ||
    new Date(rows[index][4]).getTime() < Date.now()
  ) {
    throw new Error("Invalid or expired link.");
  }
  return {
    subjectId: String(rows[index][2]),
    contextId: String(rows[index][3]),
    tokenRow: index + 2,
  };
}

function consumeLifecycleTokenUnlocked_(tokenRow) {
  lifecycleSheets_().tokens.getRange(tokenRow, 6).setValue(new Date());
}

function invalidateLifecycleTokens_(purpose, subjectId) {
  const sheet = lifecycleSheets_().tokens;
  if (sheet.getLastRow() < 2) return;
  const rows = sheet
    .getRange(2, 1, sheet.getLastRow() - 1, LIFECYCLE.headers.tokens.length)
    .getValues();
  rows.forEach((row, index) => {
    if (
      String(row[1]) === purpose &&
      String(row[2]) === String(subjectId) &&
      !row[5]
    ) {
      sheet.getRange(index + 2, 6).setValue(new Date());
    }
  });
}
