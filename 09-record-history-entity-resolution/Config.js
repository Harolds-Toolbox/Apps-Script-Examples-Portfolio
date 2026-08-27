function entityConfig_() {
  const p = PropertiesService.getScriptProperties();
  const spreadsheetId = p.getProperty('ENTITY_SPREADSHEET_ID');
  const snapshotFolderId = p.getProperty('ENTITY_SNAPSHOT_FOLDER_ID');
  if (!spreadsheetId || !snapshotFolderId) throw new Error('Set ENTITY_SPREADSHEET_ID and ENTITY_SNAPSHOT_FOLDER_ID.');
  return { spreadsheetId, snapshotFolderId, sources: JSON.parse(p.getProperty('ENTITY_SOURCES_JSON') || '[{"sheet":"Customers","id":"Customer ID"}]'), retention: Number(p.getProperty('SNAPSHOT_RETENTION_COUNT') || 30), alertRecipient: p.getProperty('ENTITY_ALERT_RECIPIENT') || '' };
}

const ENTITY = Object.freeze({ history: 'Record History', matches: 'Possible Matches', acknowledgements: '_Match Acknowledgements' });
