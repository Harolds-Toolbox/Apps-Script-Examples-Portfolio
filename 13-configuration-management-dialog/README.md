# Configuration management dialog

This bound-Sheet dialog edits a small ordered configuration table without exposing users to raw rows, formulas or sort-order maintenance. Bootstrap data is Base64-encoded before entering the HTML template, and the server validates again before saving.

## Flow

```text
custom menu → read Configuration rows → encoded HTML dialog → add/edit/delete/drag rows
                                                        ↓
server validation → document lock → atomic table rewrite → reapply calculated formula
```

`Main.js` contains the open and save wrappers. The calculated `Display Label` column is rebuilt with an R1C1 formula after each successful save.

## One-time setup

This project must be bound to a Google Sheet.

1. Create a blank Sheet and bind an Apps Script project to it.
2. Push these files to the bound project.
3. Set `SETUP_FOLDER_ID` in `Setup.js`.
4. Run `setupProject()` and approve Drive/Sheets access.
5. Reload the spreadsheet and open **Configuration → Manage items**.

There are no Script Properties. The editable headers and sheet name live in `Helpers/Consts.js`.

## Testing the workflow

1. Open the dialog and add three fictional items with regions and addresses.
2. Drag them into a new order and save.
3. Confirm `Sort Order` is sequential and `Display Label` contains formulas rather than pasted text.
4. Reopen the dialog, edit one item, deactivate another and delete the third.
5. Try duplicate names and a blank name; both saves should be rejected without partially changing the Sheet.
6. Open the Sheet in two sessions and confirm the document lock prevents overlapping structural writes.

The field schema is deliberately small. Changing it requires coordinated updates to `Helpers/Consts.js`, `Configuration.js` and `Index.html`.
