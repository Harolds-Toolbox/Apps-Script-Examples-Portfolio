function validateNewProcurementRequest_(input, requesterEmail) {
  const value = input || {};
  const currency = String(value.currency || "")
    .trim()
    .toUpperCase();
  const amount = Number(value.amount);
  const supplier = cleanProcurementText_(value.supplier, 160);
  const description = cleanProcurementText_(value.description, 2000);
  if (!supplier) throw new Error("Supplier is required.");
  if (!description) throw new Error("Description is required.");
  if (PROCUREMENT.currencies.indexOf(currency) === -1)
    throw new Error("Unsupported currency.");
  if (!isFinite(amount) || amount <= 0)
    throw new Error("Amount must be greater than zero.");
  const now = new Date();
  return {
    reference: "PR-" + Utilities.getUuid().split("-")[0].toUpperCase(),
    requesterEmail: requesterEmail,
    supplier: supplier,
    description: description,
    currency: currency,
    amount: Math.round(amount * 100) / 100,
    status: PROCUREMENT.statuses.pending,
    informationRequest: "",
    informationResponse: "",
    createdAt: now,
    updatedAt: now,
    reviewerEmail: "",
    version: 1,
  };
}

function transitionProcurementRequest_(reference, action, actor, message) {
  return withProcurementLock_(function () {
    const found = findProcurementRequest_(reference);
    if (!found) throw new Error("Request not found.");
    const request = found.request;
    const previousStatus = request.status;
    const next = procurementTransitionTarget_(request.status, action);
    request.status = next;
    request.updatedAt = new Date();
    request.version += 1;

    if (action === "REQUEST_INFORMATION") {
      request.informationRequest = cleanProcurementText_(message, 2000);
      request.informationResponse = "";
      request.reviewerEmail = actor;
      if (!request.informationRequest)
        throw new Error("An information request message is required.");
    } else if (action === "RESPOND_INFORMATION") {
      request.informationResponse = cleanProcurementText_(message, 2000);
      if (!request.informationResponse)
        throw new Error("A response is required.");
    } else {
      request.reviewerEmail = actor;
    }

    saveProcurementRequest_(found.rowNumber, request);
    appendProcurementAudit_(reference, action, actor, {
      from: previousStatus,
      to: next,
    });
    return request;
  });
}

function procurementTransitionTarget_(current, action) {
  const transitions = {};
  transitions[PROCUREMENT.statuses.pending] = {
    APPROVE: PROCUREMENT.statuses.approved,
    REJECT: PROCUREMENT.statuses.rejected,
    REQUEST_INFORMATION: PROCUREMENT.statuses.needsInformation,
  };
  transitions[PROCUREMENT.statuses.needsInformation] = {
    RESPOND_INFORMATION: PROCUREMENT.statuses.pending,
  };
  const target = transitions[current] && transitions[current][action];
  if (!target)
    throw new Error(
      "Action " + action + " is not allowed while request is " + current + ".",
    );
  return target;
}

function cleanProcurementText_(value, maxLength) {
  const text = String(value == null ? "" : value)
    .replace(/\s+/g, " ")
    .trim();
  if (text.length > maxLength)
    throw new Error("A submitted value is too long.");
  return text;
}
