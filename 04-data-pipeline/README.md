# Data pipeline

**Problem:** Turn inconsistent source records into a clean reporting table without leaving a half-written Sheet.

**Architecture:** Extract → normalize → validate → batch-load to a staging tab → replace output.

**Configure:** Add `PIPELINE_SPREADSHEET_ID` to Script Properties. Create tabs named `Raw Input`, `Staging`, and `Reporting`.

Run `runCustomerPipeline()`.
