# Plan: Procurement Module Flow - Inward → Material Inspection → SR → DRCR Note

This plan documents the complete flow for the procurement receiving workflow, covering four interconnected pages: **Inward (GRN)**, **Material Inspection**, **Stores Receipt (SR)**, and **Debit/Credit Note**. Each page represents a stage in the goods receiving process, with data flowing from one stage to the next via the `proc_inward` and related tables.

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
        - Raises debit note for rejected qty, rate difference
        - Links to inward line items via inward_dtl_id
```

---

## [1] Inward/GRN Entry

**Purpose**: Record physical receipt of goods from supplier.

### Index Page (inward/page.tsx)
| Column | Source |
|--------|--------|
| Inward Entry No | `inward_no` |
| Inward Date | `inward_date` |
| Supplier | `party_id` → `party_mst.party_name` |
| Inspection Check | `inspection_check` (Boolean: true/false) |
| SR Status | `sr_status` (from `status_mst`) |

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

## Steps to Implement

1. **Backend: Extend inward router** in `src/procurement/inward.py` to include update endpoint with all header fields (vehicle, driver, consignment, etc.)

2. **Backend: Create material inspection endpoints** - `get_pending_inspection_list`, `update_inspection` (updates `approved_qty`, `rejected_qty`, `inspection_check`)

3. **Backend: Create SR endpoints** in `src/procurement/sr.py` - `get_sr_pending_list`, `create_sr`, `update_sr`, approval actions

4. **Backend: Create DRCR Note endpoints** - Full CRUD with `drcr_note` and `drcr_note_dtl` tables

5. **Backend: Create PO number lookup utility** - Function to get formatted PO number from `po_dtl_id`:
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

6. **Frontend: Extend createInward** - Add missing header fields to `useInwardFormSchemas.ts` and update `InwardHeaderForm.tsx`

7. **Frontend: Create Material Inspection pages** - Index (filter `inspection_check = false`) + Edit form following createInward pattern

8. **Frontend: Create SR transaction pages** - Follow createPO pattern for rates/taxes

9. **Frontend: Create DRCR Note pages** - Index + Create with line item calculations

---

## Further Considerations

1. **Auto-DRCR creation**: DRCR Note is auto-created when SR is approved (not at material inspection). The `updated_by` field will be set to the user approving the SR. Manual creation is also available for cases where issues are discovered after inspection has passed.

2. **Rate acceptance flow**: 
   - `accepted_rate` defaults to PO `rate` in SR
   - If `accepted_rate === rate`: No DRCR Note needed (difference is 0)
   - If `accepted_rate > rate` (supplier invoiced higher): Create **Credit Note** (we owe supplier more)
   - If `accepted_rate < rate` (supplier invoiced lower): Create **Debit Note** (supplier owes us refund)
   - Both note types are managed in the same DRCR Note menu with `drcr_type` distinguishing them
