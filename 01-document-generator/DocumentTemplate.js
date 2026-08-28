function createPdfFromDocumentTemplate_(templateId, model, tokens) {
  const templateFile = DriveApp.getFileById(templateId);
  if (templateFile.getMimeType() !== MimeType.GOOGLE_DOCS) {
    throw new Error("DOCUMENT_TEMPLATE_ID must point to a Google Doc.");
  }

  const temporaryFile = templateFile.makeCopy(
    "Temporary PDF source - " + model.reference,
  );

  try {
    const document = DocumentApp.openById(temporaryFile.getId());
    const containers = [
      document.getBody(),
      document.getHeader(),
      document.getFooter(),
    ].filter(Boolean);

    assertDocumentHasTemplateTokens_(containers, tokens);
    containers.forEach(function (container) {
      replaceDocumentTokens_(container, tokens);
    });

    document.saveAndClose();
    return temporaryFile
      .getAs(MimeType.PDF)
      .setName(buildGeneratedPdfName_(model, "Google Doc template"));
  } finally {
    temporaryFile.setTrashed(true);
  }
}

function assertDocumentHasTemplateTokens_(containers, tokens) {
  const hasToken = Object.keys(tokens).some(function (key) {
    const pattern = escapeDocumentPattern_("{{" + key + "}}");
    return containers.some(function (container) {
      return Boolean(container.findText(pattern));
    });
  });

  if (!hasToken)
    throw new Error(
      "The Google Doc template does not contain any supported {{TOKEN}} placeholders.",
    );
}

function replaceDocumentTokens_(container, tokens) {
  Object.keys(tokens).forEach(function (key) {
    container.replaceText(
      escapeDocumentPattern_("{{" + key + "}}"),
      safeDocumentReplacement_(tokens[key]),
    );
  });
}
