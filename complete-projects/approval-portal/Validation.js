function validateNewRequest_(input, actor) {
  const value = input || {};
  const title = String(value.title || '').trim();
  const details = String(value.details || '').trim();
  const amount = Number(value.amount);

  if (!title || title.length > PORTAL.maxTitleLength) throw new Error('Enter a shorter title');
  if (!details || details.length > PORTAL.maxDetailsLength) throw new Error('Enter valid details');
  if (!isFinite(amount) || amount < 0) throw new Error('Amount must be zero or greater');

  return {
    reference: 'REQ-' + Utilities.getUuid().split('-')[0].toUpperCase(),
    title: title,
    details: details,
    amount: Math.round(amount * 100) / 100,
    requesterEmail: actor,
    status: PORTAL.statuses.pending,
    createdAt: new Date(),
    updatedAt: new Date(),
    reviewerEmail: ''
  };
}
