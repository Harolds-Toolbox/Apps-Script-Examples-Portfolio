function completionMatch_(event, completions) {
  return (
    completions.find(
      (c) => event.externalId && c.sourceId === event.externalId,
    ) ||
    completions.find(
      (c) =>
        normaliseContact_(event.email) &&
        normaliseContact_(c.email) === normaliseContact_(event.email),
    ) ||
    completions.find(
      (c) =>
        normalisePhone_(event.phone) &&
        normalisePhone_(c.phone) === normalisePhone_(event.phone),
    ) ||
    completions.find((c) => nameSimilarity_(event.name, c.name) >= 0.92) ||
    null
  );
}
function normaliseContact_(v) {
  return String(v || "")
    .trim()
    .toLowerCase();
}
function normalisePhone_(v) {
  return String(v || "")
    .replace(/\D/g, "")
    .slice(-10);
}
function nameSimilarity_(a, b) {
  a = normaliseContact_(a).replace(/[^a-z0-9]/g, "");
  b = normaliseContact_(b).replace(/[^a-z0-9]/g, "");
  if (!a || !b) return 0;
  if (a === b) return 1;
  let d = Array(b.length + 1)
    .fill(0)
    .map((_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let previous = d[0];
    d[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const old = d[j];
      d[j] = Math.min(
        d[j] + 1,
        d[j - 1] + 1,
        previous + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      previous = old;
    }
  }
  return 1 - d[b.length] / Math.max(a.length, b.length);
}
