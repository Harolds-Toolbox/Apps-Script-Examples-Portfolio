# Google Sheet template

Create a Google Spreadsheet with a tab named `Project Summary`, then lay out the following fictional one-page form. Tokens can sit in individual cells or appear inside other text.

| Range | Value or instruction |
| --- | --- |
| `A1:F2` | Merge; `SAMPLE PROJECT SERVICES` |
| `A3:F3` | Merge; `Project confirmation` |
| `A5:B5` | `Reference` |
| `C5:F5` | `{{REFERENCE}}` |
| `A6:B6` | `Created` |
| `C6:F6` | `{{CREATED_DATE}}` |
| `A8:B8` | `Customer` |
| `C8:F8` | `{{CUSTOMER_NAME}}` |
| `A9:B11` | Merge; `Address` |
| `C9:F11` | Merge, wrap; `{{CUSTOMER_ADDRESS}}` |
| `A13:B13` | `Project` |
| `C13:F13` | `{{PROJECT_TITLE}}` |
| `A14:B14` | `Start date` |
| `C14:F14` | `{{START_DATE}}` |
| `A16:B16` | `Currency` |
| `C16:D16` | `{{CURRENCY}}` |
| `E16:F16` | `{{TOTAL}}` |
| `A18:B21` | Merge; `Notes` |
| `C18:F21` | Merge, wrap; `{{NOTES}}` |
| `A23:F23` | Merge; `Generated from the {{REFERENCE}} project record` |

Suggested presentation: hide gridlines; set columns A–F to a combined A4-friendly width; use a dark-blue fill for rows 1–3; apply borders around the detail sections; set rows 9–11 and 18–21 tall enough for wrapped text; and configure print settings for A4 portrait, fit to width, normal margins, and no sheet name.

Store the Spreadsheet file ID in `SPREADSHEET_TEMPLATE_ID`. If the desired template is not the first tab, also set `SPREADSHEET_TEMPLATE_SHEET_NAME` to `Project Summary`.
