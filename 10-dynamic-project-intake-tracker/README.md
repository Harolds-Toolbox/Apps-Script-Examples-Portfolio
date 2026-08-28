# Dynamic project intake tracker

This bound-Sheet tool creates repeating project blocks with stable UUID markers, configured status/priority validation and a JSON archive for closed projects.

## Flow

```text
custom Sheet menu → project dialog → validate input → create formatted block with UUID
                                             ├→ add/reformat work rows
Tracker Config → dropdown values ────────────┘
close project → serialise complete block → Archived Projects → remove active block
```

`Main.js` contains wrappers for the three state-changing flows. Structural edits use the document lock so two users cannot insert or archive blocks at the same time.

## One-time setup

This project must be bound to a Google Sheet.

1. Create a blank Google Sheet inside the intended Drive area.
2. Create or clone a bound Apps Script project for that Sheet and push these files to it.
3. Set `SETUP_FOLDER_ID` in `Setup.js` to the folder that should own the Sheet.
4. Run `setupProject()` from the script editor.
5. Approve Drive and Sheets access, then reload the spreadsheet.
6. The **Project tracker** menu should appear.

There are no Script Properties. Editable sheet names, columns, statuses and priorities live in `Helpers/Consts.js`; day-to-day dropdown options live on `Tracker Config`.

## Testing the workflow

1. Choose **Project tracker → New project** and create a fictional project with five rows.
2. Confirm the block contains a UUID marker, metadata, headers and dropdown validation.
3. Add enough work items to use the blank rows, then add one more and confirm the block expands without damaging the next block.
4. Create a second project and run `formatAllProjects()`.
5. Close the first project with `runProjectArchive(projectId)` and inspect the JSON stored in `Archived Projects`.
6. Confirm the second block remains intact.

Apps Script project files may be organised locally in folders, but the script itself must remain bound to the Sheet for menus and dialogs to work.
