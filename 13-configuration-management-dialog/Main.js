// Main UI flows: open the editor and persist its validated, ordered configuration.
function runConfigurationManager() {
  return openConfigurationManager();
}

function runConfigurationSave(payload) {
  return saveConfigurationItems(payload);
}
