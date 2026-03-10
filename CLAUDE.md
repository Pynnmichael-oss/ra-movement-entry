# RA Movement Entry — Project Brief

## Current Status — Last Updated 2026-03-10

### What's Working
- ✅ Manual entry form with required field validation
- ✅ localStorage persistence (survives page refresh)
- ✅ Pending / Sent status tracking with SENT badge
- ✅ Export XML button — exports pending only, marks as sent
- ✅ Username prompt on first load
- ✅ Editable/deletable pending rows, read-only sent rows

### What's Next
- ⬜ Phase 2: email-processor.html — paste Outlook email, Claude API parses to movements
- ⬜ Phase 3: SharePoint backend to replace localStorage

### Known Issues / Notes
- localStorage is dev/testing only — data lost if browser storage cleared
- No sample email yet for parser prompt design


## What This Is
A web application for entering petroleum movement data and exporting it as a flat Excel file accepted by RightAngle (ETRM system).

This project is being built as a hands-on exercise while completing the **Anthropic Claude Code in Action** course on Skilljar.

---

## Business Context
RightAngle is an Energy Trading & Risk Management (ETRM) system. It accepts movement data imports in a specific format. This tool replaces manual data entry by giving users a clean web form to log movements, review them in a table, and export to Excel.

---

## Target Users
- Back-office / operations staff at oil & gas companies
- Entering physical commodity movements (Crude Oil, NGL/Refined Products)
- Non-technical users — the UI must be simple and clear

---

## Commodities Supported
- Crude Oil
- NGL / Refined Products (Gasoline, Diesel, Jet Fuel, etc.)

---

## Movement Types
- Production
- Receipt
- Delivery
- Inventory

---

## Required Fields (must be filled to submit)
- ExternalDocumentNumber
- MovementDate
- Location
- MovedProduct
- NetVolume
- VolumeUOM (unit of measure: bbl, gal, mcf)

## Optional Fields
- Type (Production / Receipt / Delivery / Inventory)
- GrossVolume
- SpecificGravity
- APIGravity
- ReceiptDealNumber / ReceiptDealDetail / ReceiptBA
- DeliveryDealNumber / DeliveryDealDetail / DeliveryBA
- Status
- MovementExpenses
- Notes
- InternalDocumentNumber
- MovementDocumentDate
- TaxOrigin / TaxDestination
- CarrierBusinessAssociate
- LiftingNumber
- ReasonCode

---

## Export Format — XML wrapped in Excel (.xlsx)
RightAngle does NOT accept flat Excel. It requires XML content stored inside an .xlsx file.

### XML Structure
Each movement is a `<Row>` element inside a `<Data>` root, wrapped in standard XML declaration:

```xml
<?xml version="1.0" encoding="utf-16"?>
<Data>
  <Row>
    <ExternalDocumentNumber>Production Actual 1/1</ExternalDocumentNumber>
    <Line_x0023_>1</Line_x0023_>
    <Status>Matched</Status>
    <MovementDate>1/1/2026 12:00 AM</MovementDate>
    <Location>Superior CVE RFN WI</Location>
    <MovedProduct>Gasoline</MovedProduct>
    <Type>Production</Type>
    <NetVolume>15,166.00</NetVolume>
    <GrossVolume>15,166.0000</GrossVolume>
    <VolumeUOM>bbl</VolumeUOM>
    <NetMass />
    <GrossMass />
    <MassUOM>lbs</MassUOM>
    <SpecificGravity>0.7300</SpecificGravity>
    <APIGravity>62.3356</APIGravity>
    <ReceiptDealNumber>SUV24TP0003</ReceiptDealNumber>
    <ReceiptDealDetail>1</ReceiptDealDetail>
    <ReceiptBA>SRC</ReceiptBA>
    <DeliveryDealNumber>SUV24BD0001</DeliveryDealNumber>
    <DeliveryDealDetail>2</DeliveryDealDetail>
    <DeliveryBA>SRC</DeliveryBA>
    <MovementExpenses>0</MovementExpenses>
    <LCLeaseName>(Empty)</LCLeaseName>
    <LCLeaseNumber>(Empty)</LCLeaseNumber>
    <LeaseProduct>(Empty)</LeaseProduct>
    <PrimaryProvisionValueOverride />
    <SecondaryProvisionValueOverride />
    <Description />
    <TaxOrigin>(Empty)</TaxOrigin>
    <TaxDestination>(Empty)</TaxDestination>
    <CarrierBusinessAssociate>(Empty)</CarrierBusinessAssociate>
    <LabAnalysis />
    <LiftingNumber />
    <AncillaryNumber />
    <AutomatchStatus>Successfully Automatched</AutomatchStatus>
    <LoadMeasurementType>(Empty)</LoadMeasurementType>
    <ReasonCode>(Empty)</ReasonCode>
    <Notes />
    <InternalDocumentNumber>0000162675</InternalDocumentNumber>
    <MovementDocumentDate>1/1/2026</MovementDocumentDate>
  </Row>
</Data>
```

### Export Rules
- Build the full XML string in JavaScript from the rows in the table
- Write the XML string as a single cell (A1) in an .xlsx sheet named "Sheet1"
- Use SheetJS: set cell value to the XML string, sheet range to A1 only
- Line_x0023_ is RightAngle's encoding of "Line#" — auto-increment per row (1, 2, 3...)
- Date format for MovementDate: M/D/YYYY 12:00 AM
- Date format for MovementDocumentDate: M/D/YYYY
- Empty optional fields that RA expects as "(Empty)": LCLeaseName, LCLeaseNumber, LeaseProduct, TaxOrigin, TaxDestination, CarrierBusinessAssociate, LoadMeasurementType, ReasonCode
- Truly empty optional fields (no value, self-closing tag): NetMass, GrossMass, PrimaryProvisionValueOverride, SecondaryProvisionValueOverride, Description, LabAnalysis, LiftingNumber, AncillaryNumber, Notes
- MassUOM always = "lbs"
- AutomatchStatus always = "Successfully Automatched"

---

## Data Store — localStorage (movements)
All movements persist in the browser via `localStorage` under the key `"ra_movements"`.
This is the single source of truth shared across the manual entry app and (in Phase 2) the email processor.

### Movement Record Schema
Every saved movement contains all RA fields PLUS these metadata fields:
```json
{
  "id": "uuid-v4",
  "status": "pending",
  "enteredBy": "string (username)",
  "enteredAt": "ISO 8601 timestamp",
  "exportBatch": null,
  "sentAt": null,
  "...all RA fields..."
}
```

### Status Values
- `"pending"` — not yet exported to RightAngle
- `"sent"` — included in a completed export batch

### Export Batch Behavior
- On export: only `status === "pending"` rows are included in the XML
- After successful export: all exported rows are updated to `status = "sent"`, `sentAt = now`, `exportBatch = "BATCH-{timestamp}"`
- The full movement table always shows ALL rows (pending + sent) with a visible status indicator
- Sent rows are visually distinct (dimmed / tagged) but never deleted

### Username
- On first load, prompt the user once for their name and store in `localStorage` under `"ra_username"`
- Prepopulate the "Entered By" field automatically on every submission

---

## Tech Stack
- Plain HTML + CSS + Vanilla JavaScript (single file per app)
- No SheetJS needed — export uses `Blob` with `application/vnd.ms-excel` type
- No backend, no framework — runs entirely in the browser
- Fonts via Google Fonts

---

## Design Direction
- Industrial / utilitarian aesthetic — this is an internal ops tool
- Dark theme with amber/orange accent color
- Monospace font for data fields, clean sans-serif for labels
- Dense but readable — operators enter many rows at a time

---

## File Structure
```
ra-movement-entry/
├── CLAUDE.md               ← this file
├── index.html              ← manual entry app
├── email-processor.html    ← Phase 2: email parsing app (shares same localStorage)
└── sample/
    └── XML_version_RA_data.xlsx   ← reference import template from RightAngle
```

---

## Current Build Phase
**Phase 1 (current):** Manual entry web form with localStorage persistence, status tracking, and XML export of pending movements only
**Phase 2 (next):** Email processor — paste Outlook plain-text email, Claude API parses it into movement records, auto-saves to same localStorage

---

## Key Conventions
- localStorage key for movements: `"ra_movements"` (array of movement objects)
- localStorage key for username: `"ra_username"`
- Always generate a UUID for each new movement `id` (use `crypto.randomUUID()`)
- Validate required fields client-side before saving
- Export button disabled when no pending movements exist
- Sent rows shown in table but visually dimmed with a "SENT" badge
- Each pending row should be editable and deletable; sent rows are read-only
- Export filename format: `RA_movements_{YYYY-MM-DD}.xlsx`

---

## Decisions Log
- 2026-03-10: XML-in-Excel confirmed as export format (not flat Excel)
- 2026-03-10: Export uses Blob download, not SheetJS
- 2026-03-10: localStorage chosen as data store for Phase 1 (browser-only, no backend)
- 2026-03-10: Email source is Outlook / plain-text prose format
- 2026-03-10: Email processor will auto-parse and save without human review step
