function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('PDF document generator')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * Client-callable entry point. Returns a small PDF as Base64 so the browser can
 * download it without retaining an output file in Drive.
 */
function generateDocumentPdf(input) {
  const model = validateDocumentInput_(input);
  const config = getDocumentGeneratorConfig_();
  const tokens = buildDocumentTokens_(model);
  const pdf = model.templateType === DOCUMENT_GENERATOR.templateTypes.document
    ? createPdfFromDocumentTemplate_(config.documentTemplateId, model, tokens)
    : createPdfFromSpreadsheetTemplate_(config, model, tokens);

  console.log(JSON.stringify({
    event: 'pdf_generated',
    reference: model.reference,
    templateType: model.templateType
  }));

  return buildPdfDownloadResponse_(pdf, model.templateType);
}

function buildPdfDownloadResponse_(pdf, templateType) {
  if (!pdf || pdf.getContentType() !== MimeType.PDF) {
    throw new Error('The template could not be converted to PDF.');
  }

  return {
    fileName: pdf.getName(),
    mimeType: pdf.getContentType(),
    base64: Utilities.base64Encode(pdf.getBytes()),
    templateType: templateType
  };
}
