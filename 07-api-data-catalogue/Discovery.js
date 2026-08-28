function discoverCatalogueSchema_(endpoint, records) {
  const fields = {};
  records.forEach(function (record) {
    visitCatalogueValue_(record, "", fields, 0);
  });
  return Object.keys(fields)
    .sort()
    .map(function (path) {
      const field = fields[path];
      return {
        endpoint: endpoint.name,
        path: path,
        types: Object.keys(field.types).sort(),
        nullable: field.nullable,
        example: field.example,
        occurrences: field.occurrences,
      };
    });
}

function visitCatalogueValue_(value, path, fields, depth) {
  if (depth > CATALOGUE.maxDepth) return;
  const type = catalogueValueType_(value);
  if (path) {
    if (!fields[path])
      fields[path] = {
        types: {},
        nullable: false,
        example: "",
        occurrences: 0,
      };
    fields[path].types[type] = true;
    fields[path].nullable = fields[path].nullable || value == null;
    fields[path].occurrences += 1;
    if (
      !fields[path].example &&
      value != null &&
      type !== "object" &&
      type !== "array"
    ) {
      fields[path].example = String(value).slice(0, CATALOGUE.maxExampleLength);
    }
  }

  if (type === "object") {
    Object.keys(value).forEach(function (key) {
      visitCatalogueValue_(
        value[key],
        path ? path + "." + key : key,
        fields,
        depth + 1,
      );
    });
  } else if (type === "array") {
    value.slice(0, 10).forEach(function (item) {
      visitCatalogueValue_(item, path + "[]", fields, depth + 1);
    });
  }
}

function catalogueValueType_(value) {
  if (value === null || value === undefined) return "null";
  if (Array.isArray(value)) return "array";
  if (value instanceof Date) return "date";
  if (typeof value === "number")
    return Number.isInteger(value) ? "integer" : "number";
  return typeof value;
}

function inferCatalogueRelationships_(fields) {
  return fields
    .filter(function (field) {
      const leaf = field.path.replace(/\[\]/g, "").split(".").pop();
      return (
        /(?:_id|Id)$/i.test(leaf) &&
        field.types.some(function (type) {
          return type === "string" || type === "integer";
        })
      );
    })
    .map(function (field) {
      const leaf = field.path
        .replace(/\[\]/g, "")
        .split(".")
        .pop()
        .replace(/(?:_id|Id)$/i, "");
      return {
        endpoint: field.endpoint,
        fieldPath: field.path,
        possibleTarget: leaf || "Unknown",
        confidence: "Review required",
      };
    });
}
