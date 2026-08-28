// Main flow: authorise viewer → read both feeds → reconcile latest values → return UI model.
function runDashboardRefresh() {
  return getDashboardData();
}
