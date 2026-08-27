function doGet(event) {
  const parameters = event && event.parameter ? event.parameter : {};
  if (parameters.mode === 'action') {
    const template = HtmlService.createTemplateFromFile('Action');
    template.payloadBase64 = Utilities.base64EncodeWebSafe(JSON.stringify({
      reference: String(parameters.ref || ''), action: String(parameters.action || ''),
      version: Number(parameters.version), expires: Number(parameters.expires),
      signature: String(parameters.signature || '')
    }));
    return template.evaluate().setTitle('Confirm procurement action').addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }
  return HtmlService.createTemplateFromFile('Index').evaluate().setTitle('Procurement workflow')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function getProcurementBootstrap() {
  const email = procurementUser_();
  return { email: email, reviewer: isProcurementReviewer_(email), requests: listProcurementRequests_(email) };
}

function submitProcurementRequest(input) {
  const request = createProcurementRequest_(validateNewProcurementRequest_(input, procurementUser_()));
  appendProcurementAudit_(request.reference, 'CREATED', request.requesterEmail, {});
  sendProcurementReviewEmail_(request);
  return request;
}

function performProcurementAction(input) {
  const actor = procurementUser_();
  const action = String(input && input.action || '').toUpperCase();
  const reference = String(input && input.reference || '');
  if (action === 'RESPOND_INFORMATION') {
    const found = findProcurementRequest_(reference);
    if (!found || String(found.request.requesterEmail).toLowerCase() !== actor) throw new Error('Only the requester can submit this response.');
  } else if (!isProcurementReviewer_(actor)) {
    throw new Error('Reviewer access is required.');
  }
  const updated = transitionProcurementRequest_(reference, action, actor, input && input.message);
  sendProcurementOutcomeEmail_(updated, action);
  return updated;
}

function executeSignedProcurementAction(payload) {
  const actor = procurementUser_();
  if (!isProcurementReviewer_(actor)) throw new Error('Reviewer access is required.');
  const value = payload || {};
  const reference = String(value.reference || '');
  const action = String(value.action || '').toUpperCase();
  if (['APPROVE', 'REJECT'].indexOf(action) === -1) throw new Error('Unsupported signed action.');
  verifyProcurementToken_(reference, action, Number(value.version), Number(value.expires), value.signature);
  const found = findProcurementRequest_(reference);
  if (!found || found.request.version !== Number(value.version)) throw new Error('This link has already been used or replaced.');
  const updated = transitionProcurementRequest_(reference, action, actor, '');
  sendProcurementOutcomeEmail_(updated, action);
  return { reference: updated.reference, status: updated.status };
}

function refreshProcurementRequests() {
  return listProcurementRequests_(procurementUser_());
}
