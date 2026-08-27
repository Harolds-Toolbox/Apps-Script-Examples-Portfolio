function validatePipelineSchema_(values, route) {
  const headers = values[0].map(normalizePipelineHeader_);
  const duplicates = headers.filter(function (header, index) { return header && headers.indexOf(header) !== index; });
  if (duplicates.length) throw new Error('Duplicate headers: ' + uniquePipelineValues_(duplicates).join(', '));
  const required = route.requiredHeaders.map(normalizePipelineHeader_);
  const missing = required.filter(function (header) { return headers.indexOf(header) === -1; });
  if (missing.length) throw new Error('Missing required headers: ' + missing.join(', '));
  return {
    headers: values[0].map(function (value) { return String(value).trim(); }),
    hash: pipelineSchemaHash_(headers),
    rowCount: Math.max(values.length - 1, 0)
  };
}

function normalizePipelineHeader_(value) {
  return String(value == null ? '' : value).trim().toLowerCase().replace(/\s+/g, ' ');
}

function pipelineSchemaHash_(headers) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, headers.join('\u001f'));
  return bytes.map(function (byte) { return ('0' + (byte & 255).toString(16)).slice(-2); }).join('');
}

function uniquePipelineValues_(values) {
  return values.filter(function (value, index) { return values.indexOf(value) === index; });
}
