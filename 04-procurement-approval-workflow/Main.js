// Main flow: submit → review transition → audit/notify → optional approved PDF.
function runProcurementSubmission(input) {
  return submitProcurementRequest(input);
}

function runProcurementAction(input) {
  return performProcurementAction(input);
}

function runApprovedProcurementPdf(reference) {
  return generateApprovedProcurementPdf(reference);
}
