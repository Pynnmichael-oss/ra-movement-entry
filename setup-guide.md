# SharePoint List Setup Guide — RA_Movements

Site: `https://capspire.sharepoint.com/sites/Michael-Test`

---

## Step 1 — Create the List

1. Go to **Site Contents → New → List**
2. Choose **Blank list**
3. Name it exactly: `RA_Movements`
4. Click **Create**

---

## Step 2 — Column Reference

Create each column below via **List Settings → Create Column** (or the column header **+ Add column** shortcut). **Column internal names are set at creation and cannot be changed**, so match the names below exactly.

> The built-in `Title` column is repurposed as `ExternalDocumentNumber`. Rename its display name but leave the internal name as `Title`.

### Rename the Title column

| Action | Value |
|--------|-------|
| Edit existing `Title` column | Change display name to `ExternalDocumentNumber` |
| Required | Yes (leave as-is) |

---

### Columns to Create

| Display / Internal Name | Type | Required | Notes |
|-------------------------|------|----------|-------|
| `MovementDate` | Single line of text | No | Stores datetime-local string e.g. `2024-01-15T14:30` |
| `MovementDocumentDate` | Single line of text | No | Stores date string e.g. `2024-01-15` |
| `Location0` | Single line of text | No | Internal name `Location0` — "Location" is reserved in SP |
| `MovedProduct` | Single line of text | No | |
| `NetVolume` | Number | No | Decimal places: 2 |
| `VolumeUOM` | Single line of text | No | e.g. `bbl`, `gal`, `mcf` |
| `MovementType` | Single line of text | No | e.g. `Production`, `Delivery` — "Type" is reserved in SP |
| `DeliveryBA` | Single line of text | No | Counterparty / supplier name |
| `RowStatus` | Single line of text | No | App-level status: `pending` or `sent` |
| `EnteredBy` | Single line of text | No | Username of person who created the record |
| `EnteredAt` | Single line of text | No | ISO timestamp of creation e.g. `2024-01-15T14:30:00.000Z` |
| `ExportBatch` | Single line of text | No | e.g. `BATCH-1705330000000` — set on export |
| `SentAt` | Single line of text | No | ISO timestamp set when exported |

**Total custom columns:** 13 (plus the renamed `Title`)

---

## Step 3 — Permissions

The app uses SharePoint's built-in cookie-based authentication. No API keys or OAuth setup is required.

- Users must have at least **Contribute** permission on the `RA_Movements` list to add/edit movements.
- Users must have **Edit** permission to delete rows.
- The files (`index.html`, `email-processor.html`) should be hosted in a SharePoint document library on the same site so session cookies are shared automatically.

---

## Step 4 — Host the App Files

1. Navigate to any document library on `https://capspire.sharepoint.com/sites/Michael-Test`
2. Upload `index.html` and `email-processor.html`
3. Open either file directly in the browser via its SharePoint URL

Because the files are served from the same SharePoint site as the list, all REST API calls go to the same origin and session cookies are sent automatically — no CORS configuration needed.

---

## Column Name Mapping Reference

| JS Field | SP Internal Name | Type |
|----------|-----------------|------|
| `ExternalDocumentNumber` | `Title` | Text |
| `MovementDate` | `MovementDate` | Text |
| `MovementDocumentDate` | `MovementDocumentDate` | Text |
| `Location` | `Location0` | Text |
| `MovedProduct` | `MovedProduct` | Text |
| `NetVolume` | `NetVolume` | Number |
| `VolumeUOM` | `VolumeUOM` | Text |
| `Type` | `MovementType` | Text |
| `DeliveryBA` | `DeliveryBA` | Text |
| `status` (pending/sent) | `RowStatus` | Text |
| `enteredBy` | `EnteredBy` | Text |
| `enteredAt` | `EnteredAt` | Text |
| `exportBatch` | `ExportBatch` | Text |
| `sentAt` | `SentAt` | Text |

---

## Why These Column Names?

- **`Title` → ExternalDocumentNumber**: `Title` is the only required built-in column in every SP list. Repurposing it avoids making it a meaningless placeholder.
- **`Location0` instead of `Location`**: SharePoint reserves `Location` internally in some site templates. Using `Location0` avoids conflicts while the app maps it transparently.
- **`RAStatus` instead of `Status`**: The JS schema has two "status" concepts — the app-level row status (`pending`/`sent`) stored in `RowStatus`, and the RightAngle Status field stored in `RAStatus`. SharePoint column names are case-insensitive, so both can't be named `Status`.
- **All dates as Text**: Dates are stored as plain strings (e.g., `2024-01-15T14:30`) rather than SP DateTime columns to avoid UTC/local timezone conversion issues when round-tripping through the REST API.
