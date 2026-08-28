// Runtime configuration normally adjusted per deployment.
const TRACKER = Object.freeze({
  active: "Active Projects",
  archive: "Archived Projects",
  config: "Tracker Config",
  marker: "PROJECT_ID:",
  columns: ["Work Item", "Owner", "Status", "Priority", "Due Date", "Notes"],
  defaults: {
    statuses: ["Not started", "In progress", "Blocked", "Complete"],
    priorities: ["Low", "Normal", "High", "Urgent"],
  },
});

function trackerSpreadsheet_() {
  return SpreadsheetApp.getActive();
}
function trackerOptions_() {
  const sheet = trackerSpreadsheet_().getSheetByName(TRACKER.config);
  if (!sheet) return TRACKER.defaults;
  const rows = sheet.getDataRange().getValues().slice(1),
    values = (type) =>
      rows.filter((r) => r[0] === type && r[1]).map((r) => String(r[1]));
  return {
    statuses: values("Status").length
      ? values("Status")
      : TRACKER.defaults.statuses,
    priorities: values("Priority").length
      ? values("Priority")
      : TRACKER.defaults.priorities,
  };
}
