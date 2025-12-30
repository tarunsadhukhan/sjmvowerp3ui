# Plan: Procurement Module Flow - Inward → Material Inspection → SR → DRCR Note → Bill Pass

This plan documents the complete flow for the procurement receiving workflow, covering five interconnected pages: **Inward (GRN)**, **Material Inspection**, **Stores Receipt (SR)**, **Debit/Credit Note**, and **Bill Pass**. Each page represents a stage in the goods receiving process, with data flowing from one stage to the next via the `proc_inward` and related tables.

---

## Workflow Overview

```
PO (Approved)
    ↓
[1] INWARD/GRN Entry (Goods Arrival)
    │   - Records physical receipt from supplier
    │   - No approval workflow; just data entry
    │   - Sets inspection_check = false
    ↓
[2] MATERIAL INSPECTION
    │   - QC checks approved_qty vs rejected_qty
    │   - Updates inspection_check = true on completion
    │   - Auto-creates DRCR Note if rejection or rate variance
    ↓
[3] STORES RECEIPT (SR)
    │   - Accountant adds rates, taxes, accepted_rate
    │   - Creates official accounting entry
    │   - Updates sr_no, sr_date, sr_status
    ↓
[4] DRCR NOTE (if needed)
    │   - Raises debit note for rejected qty, rate difference
    │   - Links to inward line items via inward_dtl_id
    ↓
[5] BILL PASS
        - Consolidates SR + DR/CR Notes for final payment
        - Shows net payable after adjustments
        - Final step before payment processing
```

---

## [1] Inward/GRN Entry

**Purpose**: Record physical receipt of goods from supplier.

### Index Page (inward/page.tsx)
| Column | Source |
|--------|--------|
| Branch | `branch_id` → `branch_mst.branch_name` |
| Inward Entry No | `inward_no` |
| Inward Date | `inward_date` |
| Supplier | `party_id` → `party_mst.party_name` |
| Status | `status_id` → `status_mst.status_desc` |

**Note**: PO number is NOT shown in the index page. It is displayed at the line item level in the create/edit pages since one inward can have items from multiple POs.

**Filter**: Show all inwards in descending `inward_date`, paginated.

### Create Page (inward/createInward/page.tsx)

**Header Fields** (extend existing):
| Field | Column | Required | Notes |
|-------|--------|----------|-------|
| Branch | `branch_id` | Yes | |
| Inward Date | `inward_date` | Yes | |
| Supplier | `party_id` | Yes | |
| PO Reference | (derived) | Yes | For PO item selection |
| Challan No | `challan_no` | No | |
| Challan Date | `challan_date` | No | |
| **Vehicle Number** | `vehicle_number` | No | **ADD** |
| **Driver Name** | `driver_name` | No | **ADD** |
| **Driver Contact** | `driver_contact_no` | No | **ADD** |
| **Consignment No** | `consignment_no` | No | **ADD** |
| **Consignment Date** | `consignment_date` | No | **ADD** |
| **E-Way Bill No** | `ewaybillno` | No | **ADD** |
| **E-Way Bill Date** | `ewaybill_date` | No | **ADD** |
| **Invoice Received Date** | `invoice_recvd_date` | No | **ADD** |
| **Despatch Remarks** | `despatch_remarks` | No | **ADD** |
| **Receipt Remarks** | `receipts_remarks` | No | **ADD** |

**Line Items** (simplified for entry stage):
| Column | Source | Notes |
|--------|--------|-------|
| **PO Number** | `po_dtl_id` → lookup | Display formatted PO number (e.g., "PO-000123") |
| Item Group | (from PO) | Read-only |
| Item | `item_id` | Read-only from PO |
| Item Make | `item_make_id` | Read-only from PO |
| UOM | `uom_id` | Read-only from PO |
| PO Qty (Pending) | (calculated) | Display only |
| **Challan Qty** | `challan_qty` | Editable |
| **Inward Qty** | `inward_qty` | Editable - actual received |
| Remarks | `remarks` | Editable |

**No Approval Workflow**: `status_id` not used at this stage. Just save and proceed.

---

## [2] Material Inspection

**Purpose**: Quality check of received goods. Update accepted/rejected quantities.

### Index Page (materialInspection/page.tsx - **CREATE**)
| Column | Source |
|--------|--------|
| Inward No | `inward_no` |
| Inward Date | `inward_date` |
| Supplier | `party_id` → label |
| Material Inspection Date | `material_inspection_date` |
| Inspection Check | `inspection_check` |

**Filter**: Show only where `inspection_check = false` (pending inspection).  
**No Create Button**: User clicks a row to open inspection form for that inward.

### Edit Page (materialInspection/[inwardId]/page.tsx - **CREATE**)

**Header Fields** (read-only display):
| Field | Source |
|-------|--------|
| Inward No | `inward_no` |
| Inward Date | `inward_date` |
| Supplier | `party_id` → `party_mst.party_name` |

**Line Items** (editable):
| Column | Source | Notes |
|--------|--------|-------|
| Item | `item_id` | Read-only |
| Item Make (PO) | `item_make_id` | Read-only |
| **Accepted Item Make** | `accepted_item_make_id` | Editable - can differ from PO |
| UOM | `uom_id` | Read-only |
| Inward Qty | `inward_qty` | Read-only |
| **Rejected Qty** | `rejected_qty` | Editable, default = 0 |
| **Approved Qty** | `approved_qty` | Read-only, auto-calc: `inward_qty - rejected_qty` |
| **Reasons** | `reasons` | Editable - required if rejected_qty > 0 |
| Remarks | `remarks` | Editable |

**Auto-Calculation Logic**:
```typescript
// rejected_qty defaults to 0 if not entered
const rejected = rejected_qty || 0;
approved_qty = inward_qty - rejected;
```

**On Submit**:
1. Update `proc_inward_dtl` with `approved_qty`, `rejected_qty`, `accepted_item_make_id`, `reasons`
2. Set `proc_inward.inspection_check = true`
3. Set `proc_inward.material_inspection_date = today`
4. **If any line has `rejected_qty > 0`**: Auto-create `drcr_note` with `auto_drcr = 1`

---

## [3] Stores Receipt (SR)

**Purpose**: Accountant reviews inspected goods, adds rates/taxes, creates official receipt.

### Index Page (sr/page.tsx - **MODIFY**)
| Column | Source |
|--------|--------|
| Inward No | `inward_no` |
| Inward Date | `inward_date` |
| Supplier | `party_id` |
| Material Inspection Date | `material_inspection_date` |
| SR No | `sr_no` |
| SR Date | `sr_date` |
| SR Status | `sr_status` → `status_mst.status_desc` |

**Filter**: Show only where `inspection_check = true` (inspection complete).

### Create/Edit Page (sr/createSR/page.tsx - **CREATE**)

**Header Fields**:
| Field | Source | Notes |
|-------|--------|-------|
| Inward No | `inward_no` | Read-only |
| Inward Date | `inward_date` | Read-only |
| Supplier | `party_id` | Read-only |
| **SR No** | `sr_no` | Auto-generated or manual |
| **SR Date** | `sr_date` | Editable |
| Billing Branch | `billing_branch_id` | Editable |
| Shipping Branch | `shipping_branch_id` | Editable |
| Invoice No | (from supplier) | For reference |
| Invoice Date | `invoice_date` | Editable |
| Invoice Amount | `invoice_amt` | Editable |
| Freight | `freight` | Editable |

**Line Items** (similar to PO with rates/taxes):
| Column | Source | Notes |
|--------|--------|-------|
| Item | `item_id` | Read-only |
| Accepted Item Make | `accepted_item_make_id` | Read-only (from inspection) |
| UOM | `uom_id` | Read-only |
| Approved Qty | `approved_qty` | Read-only |
| **Rate (PO)** | `rate` | Read-only - from PO |
| **Accepted Rate** | `accepted_rate` | Editable - actual invoice rate |
| Amount | (calculated) | `approved_qty × accepted_rate` |
| Discount Mode | `discount_mode` | Editable |
| Discount Value | `discount_value` | Editable |
| Discount Amount | `discount_amount` | Calculated |
| Taxable Amount | (calculated) | |
| GST % | (from item) | |
| GST Amount | (calculated) | |
| Total | (calculated) | |

**Rate Variance Check**:
```typescript
if (accepted_rate !== rate) {
  // Flag for DRCR Note creation
  // rate_difference = rate - accepted_rate
}
```

**Approval Workflow**: SR uses `sr_status` field with standard Draft → Open → Approved flow.

**On Approve**:
1. Update `proc_inward.sr_status` to approved
2. If any line has `rate ≠ accepted_rate`: Create DRCR Note for rate difference

---

## [4] DRCR Note (Debit/Credit Note)

**Purpose**: Raise debit note for rejected quantities or rate differences.

### Index Page (drcrNote/page.tsx - **CREATE**)
| Column | Source |
|--------|--------|
| DRCR Note No | `drcr_note_id` (formatted) |
| Date | `drcr_note_date` |
| Type | `drcr_type` (1=Debit, 2=Credit) |
| Inward No | `inward_id` → `proc_inward.inward_no` |
| Supplier | (via inward) |
| Total Amount | `total_amount` |
| Status | `status_id` |

**Create Options**:
1. **Auto-created**: From Material Inspection (rejected qty) or SR (rate difference) - `auto_drcr = 1`
2. **Manual**: User creates directly - `auto_drcr = 0`

### Create/Edit Page (drcrNote/createDrcrNote/page.tsx - **CREATE**)

**Header Fields**:
| Field | Source | Notes |
|-------|--------|-------|
| Date | `drcr_note_date` | Editable |
| Type | `drcr_type` | Select: Debit/Credit |
| Inward Reference | `inward_id` | Select from inwards |
| Remarks | `remarks` | Editable |
| Freight | `freight` | Editable |

**Line Items** (`drcr_note_dtl`):
| Column | Source | Notes |
|--------|--------|-------|
| Inward Line Ref | `inward_dtl_id` | FK to `proc_inward_dtl` |
| Item | (from inward_dtl) | Display only |
| Adjustment Type | `qty_rate_flag` | Select: Qty/Rate/Both |
| **Adjustment Qty** | `adjustment_qty` | = `rejected_qty` if qty issue |
| **Rate (Original)** | `rate` (from inward_dtl) | Display |
| **Accepted Rate** | `accepted_rate` (from inward_dtl) | Display |
| **Adjustment Rate** | `adjustment_rate` | = `rate - accepted_rate` |
| UOM | `uom_id` | |
| Amount | (calculated) | `adjustment_qty × adjustment_rate` |
| GST | (from `drcr_note_dtl_gst`) | CGST, SGST, IGST |
| Total | (calculated) | |

**Calculation Logic**:
```typescript
// For rejected quantity:
adjustment_qty = rejected_qty;
adjustment_rate = rate; // Full rate of rejected items
amount = adjustment_qty × adjustment_rate;

// For rate difference:
adjustment_qty = approved_qty;
adjustment_rate = rate - accepted_rate;
amount = adjustment_qty × adjustment_rate;

// For both:
// Combine the above
```

**Approval Workflow**: Standard Draft → Open → Approved using `status_id`.

---

## [5] Bill Pass

**Purpose**: Consolidate SR and DRCR Notes into a single view for final payment processing. Shows the net amount payable to supplier after all adjustments.

### Concept

Bill Pass acts as a **summary document** that aggregates:
- **SR Total**: Amount owed to supplier for accepted goods (from approved SR)
- **Debit Note Total**: Amount supplier owes us (rejected qty, lower rates)
- **Credit Note Total**: Additional amount we owe supplier (higher rates)
- **Net Payable**: `SR Total - Debit Notes + Credit Notes`

All linked via the same `invoice_no` on the Inward.

### Database Considerations

Option A: **Virtual/Computed View** (Recommended for MVP)
- No new table; Bill Pass is a computed view joining SR + DRCR data
- Bill Pass No. = SR No. (since SR is the primary document)
- Pros: No data duplication, always in sync
- Cons: Cannot add Bill Pass-specific fields

Option B: **Dedicated `proc_bill_pass` Table** (For future flexibility)
```sql
CREATE TABLE proc_bill_pass (
    bill_pass_id INT PRIMARY KEY AUTO_INCREMENT,
    bill_pass_no VARCHAR(50),
    bill_pass_date DATE,
    inward_id INT,              -- FK to proc_inward
    sr_id INT,                  -- FK to proc_inward (via sr fields) or separate sr table
    invoice_no VARCHAR(50),
    invoice_date DATE,
    sr_total DECIMAL(15,2),
    dr_total DECIMAL(15,2),
    cr_total DECIMAL(15,2),
    net_payable DECIMAL(15,2),
    status_id INT,              -- Draft → Approved
    remarks TEXT,
    created_by INT,
    created_at DATETIME,
    updated_by INT,
    updated_at DATETIME
);
```

### Index Page (billPass/page.tsx - **CREATE**)
| Column | Source |
|--------|--------|
| Bill Pass No | `bill_pass_no` or SR No |
| Bill Pass Date | `bill_pass_date` or SR Date |
| Inward No | `inward_id` → `proc_inward.inward_no` |
| Inward Date | `proc_inward.inward_date` |
| Supplier | `proc_inward.supplier_id` → `party_mst.party_name` |
| Invoice No | `proc_inward.invoice_no` |
| Invoice Date | `proc_inward.invoice_date` |
| SR Total | Sum of SR line amounts |
| DR Total | Sum of linked Debit Note amounts |
| CR Total | Sum of linked Credit Note amounts |
| Net Payable | `SR Total - DR Total + CR Total` |
| Status | `status_id` → status label |

**Filter**: Show only where SR is approved (`sr_status = 3`) and all linked DRCR Notes are approved.

**No Create Button**: Bill Pass is auto-generated when SR is approved. User clicks row to view/print.

### View/Detail Page (billPass/[id]/page.tsx - **CREATE**)

**Header Section**:
| Field | Source |
|-------|--------|
| Bill Pass No | Generated or SR No |
| Bill Pass Date | Current date or SR approval date |
| Inward No | From linked inward |
| Inward Date | From linked inward |
| Supplier | From linked inward |
| Invoice No | From linked inward |
| Invoice Date | From linked inward |

**Summary Cards**:
```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   SR TOTAL      │  │  DEBIT NOTES    │  │  CREDIT NOTES   │  │  NET PAYABLE    │
│   ₹ 1,50,000    │  │  ₹ 5,000        │  │  ₹ 2,000        │  │  ₹ 1,47,000     │
│   (14 items)    │  │  (2 items)      │  │  (1 item)       │  │                 │
└─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘
```

**SR Line Items Section**:
| Column | Notes |
|--------|-------|
| Item | Item name |
| Accepted Make | From inspection |
| Approved Qty | From inspection |
| Accepted Rate | From SR |
| Amount | Qty × Rate |
| Tax | GST amounts |
| Total | Amount + Tax |

**Debit Note Adjustments Section** (if any):
| Column | Notes |
|--------|-------|
| DR Note No | Debit note reference |
| Reason | Qty rejection / Rate difference |
| Item | Affected item |
| Adjustment Qty | Rejected quantity |
| Adjustment Rate | Rate difference |
| Amount | Deduction amount |

**Credit Note Adjustments Section** (if any):
| Column | Notes |
|--------|-------|
| CR Note No | Credit note reference |
| Reason | Rate difference (supplier charged more) |
| Item | Affected item |
| Adjustment Qty | Applicable quantity |
| Adjustment Rate | Rate increase |
| Amount | Additional payable |

**Footer Totals**:
```
SR Subtotal:           ₹ 1,27,118.64
SR Tax (CGST):         ₹   11,440.68
SR Tax (SGST):         ₹   11,440.68
─────────────────────────────────────
SR Total:              ₹ 1,50,000.00

Less: Debit Notes:     ₹   5,000.00
Add: Credit Notes:     ₹   2,000.00
─────────────────────────────────────
NET PAYABLE:           ₹ 1,47,000.00
```

**Actions**:
- Print Bill Pass
- Export to PDF
- Mark as Paid (optional future feature)

### Linking Logic

```typescript
// All documents linked via invoice_no on proc_inward
const billPassData = {
  inward: getInwardByInvoiceNo(invoiceNo),
  sr: getSRByInwardId(inwardId), // approved only
  debitNotes: getDRCRNotesByInwardId(inwardId, type: 'debit', approved: true),
  creditNotes: getDRCRNotesByInwardId(inwardId, type: 'credit', approved: true),
  
  // Computed
  srTotal: sumLineAmounts(sr.lines),
  drTotal: sumNoteAmounts(debitNotes),
  crTotal: sumNoteAmounts(creditNotes),
  netPayable: srTotal - drTotal + crTotal,
};
```

### Backend Query (Computed View Approach)

```python
def get_bill_pass_list_query():
    sql = """
    SELECT
        pi.inward_id,
        pi.inward_no,
        pi.inward_date,
        pi.sr_no AS bill_pass_no,
        pi.sr_date AS bill_pass_date,
        pi.invoice_no,
        pi.invoice_date,
        pm.party_id AS supplier_id,
        pm.supp_name AS supplier_name,
        -- SR Total (sum from proc_inward_dtl)
        COALESCE(sr_totals.sr_total, 0) AS sr_total,
        -- Debit Note Total
        COALESCE(dr_totals.dr_total, 0) AS dr_total,
        -- Credit Note Total  
        COALESCE(cr_totals.cr_total, 0) AS cr_total,
        -- Net Payable
        (COALESCE(sr_totals.sr_total, 0) - COALESCE(dr_totals.dr_total, 0) + COALESCE(cr_totals.cr_total, 0)) AS net_payable
    FROM proc_inward pi
    LEFT JOIN party_mst pm ON pm.party_id = pi.supplier_id
    LEFT JOIN (
        SELECT inward_id, SUM(total_amount) AS sr_total
        FROM proc_inward_dtl
        GROUP BY inward_id
    ) sr_totals ON sr_totals.inward_id = pi.inward_id
    LEFT JOIN (
        SELECT inward_id, SUM(total_amount) AS dr_total
        FROM proc_drcr_note
        WHERE drcr_type = 1 AND status_id = 3  -- Debit, Approved
        GROUP BY inward_id
    ) dr_totals ON dr_totals.inward_id = pi.inward_id
    LEFT JOIN (
        SELECT inward_id, SUM(total_amount) AS cr_total
        FROM proc_drcr_note
        WHERE drcr_type = 2 AND status_id = 3  -- Credit, Approved
        GROUP BY inward_id
    ) cr_totals ON cr_totals.inward_id = pi.inward_id
    WHERE pi.sr_status = 3  -- Only approved SRs
    ORDER BY pi.sr_date DESC, pi.inward_id DESC
    LIMIT :limit OFFSET :offset;
    """
    return text(sql)
```

---

## Steps to Implement

1. **Backend: Extend inward router** in `src/procurement/inward.py` to include update endpoint with all header fields (vehicle, driver, consignment, etc.)

2. **Backend: Create material inspection endpoints** - `get_pending_inspection_list`, `update_inspection` (updates `approved_qty`, `rejected_qty`, `inspection_check`)

3. **Backend: Create SR endpoints** in `src/procurement/sr.py` - `get_sr_pending_list`, `create_sr`, `update_sr`, approval actions

4. **Backend: Create DRCR Note endpoints** - Full CRUD with `drcr_note` and `drcr_note_dtl` tables

5. **Backend: Create Bill Pass endpoints** in `src/procurement/billpass.py`:
   - `get_bill_pass_list` - Paginated list of approved SRs with computed totals
   - `get_bill_pass_by_id` - Full detail view with SR lines, DR/CR adjustments
   - Query joins proc_inward with DRCR notes to compute net payable

6. **Backend: Create PO number lookup utility** - Function to get formatted PO number from `po_dtl_id`:
   ```python
   def get_po_number_by_dtl_id(db: Session, po_dtl_id: int) -> Optional[str]:
       """
       Get formatted PO number from po_dtl_id.
       Joins: proc_po_dtl → proc_po → formats po_no
       """
       result = db.execute(
           text("""
               SELECT CONCAT('PO-', LPAD(po.po_no, 6, '0')) as formatted_po_no
               FROM proc_po_dtl dtl
               JOIN proc_po po ON dtl.po_id = po.po_id
               WHERE dtl.po_dtl_id = :po_dtl_id
           """),
           {"po_dtl_id": po_dtl_id}
       ).fetchone()
       return result.formatted_po_no if result else None
   ```
   This utility is used when displaying inward line items to show which PO the item came from.

7. **Frontend: Extend createInward** - Add missing header fields to `useInwardFormSchemas.ts` and update `InwardHeaderForm.tsx`

8. **Frontend: Create Material Inspection pages** - Index (filter `inspection_check = false`) + Edit form following createInward pattern

9. **Frontend: Create SR transaction pages** - Follow createPO pattern for rates/taxes

10. **Frontend: Create DRCR Note pages** - Index + Create with line item calculations

11. **Frontend: Create Bill Pass pages** - Index (read-only list) + Detail view with summary cards and line breakdowns

---

## Further Considerations

1. **Auto-DRCR creation**: DRCR Note is auto-created when SR is approved (not at material inspection). The `updated_by` field will be set to the user approving the SR. Manual creation is also available for cases where issues are discovered after inspection has passed.

2. **Rate acceptance flow**: 
   - `accepted_rate` defaults to PO `rate` in SR
   - If `accepted_rate === rate`: No DRCR Note needed (difference is 0)
   - If `accepted_rate > rate` (supplier invoiced higher): Create **Credit Note** (we owe supplier more)
   - If `accepted_rate < rate` (supplier invoiced lower): Create **Debit Note** (supplier owes us refund)
   - Both note types are managed in the same DRCR Note menu with `drcr_type` distinguishing them

3. **Bill Pass generation**: 
   - Bill Pass is a **read-only computed view** (no separate creation workflow)
   - Appears automatically when SR is approved
   - Shows in Bill Pass index only after all linked DRCR Notes are also approved
   - Serves as the final document for payment authorization
   - Can be printed/exported for accounts payable processing

4. **Invoice linkage**: All documents (Inward, SR, DRCR Notes, Bill Pass) are linked via `invoice_no` on `proc_inward`. This ensures:
   - One invoice = One Inward = One SR = Multiple possible DRCR Notes = One Bill Pass
   - Easy audit trail from payment back to original PO
