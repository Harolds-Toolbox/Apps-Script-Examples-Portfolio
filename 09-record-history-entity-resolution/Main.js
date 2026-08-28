// Main flow: read sources → snapshot → append history → score matches → publish review queue.
function snapshotAndResolveEntities() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const records = readEntitySources_();
    writeEntitySnapshot_(records);
    updateRecordHistory_(records);
    const count = publishPossibleMatches_(findPossibleMatches_(records));
    const recipient = entityConfig_().alertRecipient;
    if (recipient && count)
      MailApp.sendEmail(
        recipient,
        "Possible duplicate records found",
        count + " unacknowledged match(es) are ready for review.",
      );
    return { records: records.length, matches: count };
  } finally {
    lock.releaseLock();
  }
}
