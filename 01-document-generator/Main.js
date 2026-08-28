// Main flow: validate → choose renderer → populate template → export → download.
function runPdfGeneration(input) {
  return generateDocumentPdf(input);
}

function runDocumentGeneratorChecks() {
  return runDocumentGeneratorSelfTests();
}
