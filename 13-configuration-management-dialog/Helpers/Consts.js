// Sheet structure normally adjusted per deployment.
const CONFIG_UI = Object.freeze({
  sheet: "Configuration",
  headers: [
    "Item",
    "Address",
    "Region",
    "Active",
    "Sort Order",
    "Display Label",
  ],
  editableColumns: 5,
  maxItems: 250,
  maxLengths: Object.freeze({ item: 160, address: 500, region: 120 }),
});
