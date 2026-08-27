const FILE_PIPELINE = Object.freeze({
  queueSheet: 'File Queue',
  maxAttempts: 4,
  maxRunMilliseconds: 4.5 * 60 * 1000,
  batchSize: 10,
  retryBaseMinutes: 5
});

const FILE_QUEUE_HEADERS = Object.freeze([
  'File ID', 'File Name', 'Status', 'Attempts', 'Next Retry At', 'Last Error',
  'Route', 'Uploaded At', 'Processed At', 'Schema Hash', 'Row Count'
]);

function filePipelineProperty_(name) {
  const value = String(PropertiesService.getScriptProperties().getProperty(name) || '').trim();
  if (!value) throw new Error('Missing Script Property: ' + name);
  return value;
}

function filePipelineRoutes_() {
  let routes;
  try { routes = JSON.parse(filePipelineProperty_('PIPELINE_ROUTES_JSON')); }
  catch (error) { throw new Error('PIPELINE_ROUTES_JSON must contain valid JSON.'); }
  if (!Array.isArray(routes) || !routes.length) throw new Error('At least one pipeline route is required.');
  return routes.map(function (route) {
    if (!route.name || !route.filePattern || !route.destinationSheet || !Array.isArray(route.requiredHeaders)) {
      throw new Error('Each route requires name, filePattern, destinationSheet and requiredHeaders.');
    }
    return route;
  });
}

function fileQueueSheet_() {
  const sheet = SpreadsheetApp.openById(filePipelineProperty_('PIPELINE_CONTROL_SPREADSHEET_ID')).getSheetByName(FILE_PIPELINE.queueSheet);
  if (!sheet) throw new Error('Missing sheet: ' + FILE_PIPELINE.queueSheet);
  return sheet;
}
