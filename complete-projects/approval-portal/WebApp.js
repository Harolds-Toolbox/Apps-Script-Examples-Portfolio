function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Request portal')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.DEFAULT);
}

function getPortalBootstrap() {
  const email = signedInEmail_();
  return {
    userEmail: email,
    reviewer: isReviewer_(email),
    requests: listVisibleRequests_(email)
  };
}

function submitPortalRequest(input) {
  const actor = signedInEmail_();
  const request = validateNewRequest_(input, actor);
  const saved = createRequest_(request);
  appendAudit_(saved.reference, 'CREATED', actor, { title: saved.title });
  notifyReviewers_(saved);
  return saved;
}

function decidePortalRequest(input) {
  const actor = signedInEmail_();
  if (!isReviewer_(actor)) throw new Error('Reviewer access is required');
  const decision = String(input && input.decision || '').toUpperCase();
  if ([PORTAL.statuses.approved, PORTAL.statuses.rejected].indexOf(decision) === -1) {
    throw new Error('Decision must be approved or rejected');
  }
  const updated = transitionRequest_(String(input.reference || ''), decision, actor);
  appendAudit_(updated.reference, decision, actor, {});
  notifyRequester_(updated);
  return updated;
}

function refreshPortalRequests() {
  return listVisibleRequests_(signedInEmail_());
}
