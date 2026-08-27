function generateApiCatalogue() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;
  try {
    const generatedAt = new Date();
    const endpointRows = [];
    const allFields = [];
    catalogueEndpoints_().forEach(function (endpoint) {
      const records = fetchCatalogueEndpoint_(endpoint);
      const fields = discoverCatalogueSchema_(endpoint, records);
      Array.prototype.push.apply(allFields, fields);
      endpointRows.push([endpoint.name, endpoint.path, endpoint.itemsPath, endpoint.sampleSize, records.length, generatedAt]);
    });
    const fieldRows = allFields.map(function (field) {
      return [field.endpoint, field.path, field.types.join(', '), field.nullable, field.example, field.occurrences];
    });
    const relationshipRows = inferCatalogueRelationships_(allFields).map(function (relationship) {
      return [relationship.endpoint, relationship.fieldPath, relationship.possibleTarget, relationship.confidence];
    });
    writeApiCatalogue_(endpointRows, fieldRows, relationshipRows);
    console.log(JSON.stringify({ event: 'catalogue_generated', endpoints: endpointRows.length, fields: fieldRows.length, relationships: relationshipRows.length }));
    return { endpoints: endpointRows.length, fields: fieldRows.length, relationships: relationshipRows.length };
  } finally {
    lock.releaseLock();
  }
}
