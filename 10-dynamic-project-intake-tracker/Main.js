// Main UI flows: create a project block, add work, or archive the completed block.
function runProjectCreation(input) {
  return createProject(input);
}

function runWorkItemCreation(projectId, item) {
  return addWorkItem(projectId, item);
}

function runProjectArchive(projectId) {
  return closeProject(projectId);
}
