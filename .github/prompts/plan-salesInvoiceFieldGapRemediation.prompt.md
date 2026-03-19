# Plan: Sales Invoice Field Gap Remediation (Re-implementation)

> Re-implementing the original 6-phase plan on `dev` (BE) / `devqa2` (FE) branches after merge changes.
> Branches: vowerp3be `dev` | vowerp3ui `devqa2`

---

## TL;DR

Backend on `dev` is mostly complete (ORM, queries, router, tests all present). Frontend on `devqa2` has partial work but still has TCS present across ~7 files and is missing dormant header fields in types/mappers/factories/schemas/submission. Also: 2 SQL duplicate-column bugs to fix, and 5 new extension table ORM models to create (hessian header+dtl, juteyarn header+dtl, govtskg dtl).

**Approach:** Fix backend bugs + add missing extension models (Phase A), then complete frontend gaps (Phase B: TCS removal + dormant fields), then tests (Phase C). Phases A and B run in parallel.

---

## Phase A: Backend — Fix Bugs & Add Missing Extension Tables

**A1. Fix duplicate column bugs in `query.py`** *(no dependencies)*
- File: `c:\code\vowerp3be\src\sales\query.py`
- In `insert_sales_invoice()` (~line 1581): Remove duplicate `status_id` from INSERT column list + VALUES
- In `insert_invoice_line_item()` (~line 1621): Remove duplicate `amount_without_tax`, `total_amount`, `sales_weight` from INSERT column list + VALUES
- Detection: Search for the duplicated column names in each function

**A2. Add hessian invoice extension ORM models** *(no dependencies)*
- File: `c:\code\vowerp3be\src\models\sales.py`
- `SalesInvoiceHessian` (table: `sales_invoice_hessian`): `sales_invoice_hessian_id` PK, `invoice_id` FK→sales_invoice, `qty_bales` Double, `rate_per_bale` Double, `billing_rate_mt` Double, `billing_rate_bale` Double, `updated_by` Integer, `updated_date_time` String
- `SalesInvoiceHessianDtl` (table: `sales_invoice_hessian_dtl`): `sales_invoice_hessian_dtl_id` PK, `invoice_line_item_id` FK→sales_invoice_dtl, `qty_bales` Double, `rate_per_bale` Double, `billing_rate_mt` Double, `billing_rate_bale` Double, `updated_by` Integer, `updated_date_time` String
- Template: Mirror `SalesOrderDtlHessian` (~line 485 in sales.py) column structure
- Add relationships to `InvoiceHdr` and `InvoiceLineItem`

**A3. Add jute yarn invoice extension ORM models** *(no dependencies)*
- File: `c:\code\vowerp3be\src\models\sales.py`
- `SalesInvoiceJuteYarn` (table: `sales_invoice_juteyarn`): `sales_invoice_juteyarn_id` PK, `invoice_id` FK→sales_invoice, `pcso_no` String, `container_no` String, `customer_ref_no` String, `updated_by` Integer, `updated_date_time` String
- `SalesInvoiceJuteYarnDtl` (table: `sales_invoice_juteyarn_dtl`): `sales_invoice_juteyarn_dtl_id` PK, `invoice_line_item_id` FK→sales_invoice_dtl, `updated_by` Integer, `updated_date_time` String
- Add relationships to `InvoiceHdr` and `InvoiceLineItem`

**A4. Add govtskg detail ORM model** *(no dependencies)*
- File: `c:\code\vowerp3be\src\models\sales.py`
- `SaleInvoiceGovtskgDtl` (table: `sale_invoice_govtskg_dtl`): `sale_invoice_govtskg_dtl_id` PK, `invoice_line_item_id` FK→sales_invoice_dtl, `pack_sheet` Double, `net_weight` Double, `total_weight` Double, `updated_by` Integer, `updated_date_time` String
- Add relationship to `InvoiceLineItem`

**A5. Create migration SQL** *(depends on A2-A4)*
- New file: `c:\code\vowerp3be\dbqueries\migrations\add_invoice_extension_tables.sql`
- CREATE TABLE for all 5 new tables with FKs and indexes
- Include rollback (DROP TABLE) as SQL comments

**A6. Add basic query stubs for new tables** *(depends on A2-A4)*
- File: `c:\code\vowerp3be\src\sales\query.py`
- For each of the 5 tables: add insert, delete, get functions following the exact same pattern as the existing jute functions (`insert_sales_invoice_jute_v2`, `delete_sales_invoice_jute`, `get_sales_invoice_jute_by_id_v2`)
- ~15 new functions total

---

## Phase B: Frontend — Complete Field Gaps & Remove TCS *(parallel with Phase A)*

**B1. Update service types** *(no dependencies)*
- File: `c:\code\vowerp3ui\src\utils\salesInvoiceService.ts`
- Add to `InvoiceDetails` interface: `due_date`, `type_of_sale`, `tax_id`, `transporter_address`, `transporter_state_code`, `transporter_state_name`, `container_no`, `contract_no`, `contract_date`, `consignment_no`, `consignment_date`
- Fix billing/shipping: ensure field names match backend (`billing_to_id` / `shipping_to_id` — verify with backend response)
- Remove from `InvoiceDetails` + `CreateInvoiceRequest`: `tcs_percentage`, `tcs_amount`
- Add dormant fields to `CreateInvoiceRequest`

**B2. Update factories** *(depends on B1 type defs)*
- File: `c:\code\vowerp3ui\src\app\dashboardportal\sales\salesInvoice\createSalesInvoice\utils\salesInvoiceFactories.ts`
- `buildDefaultFormValues()`: Add defaults for all dormant fields (`due_date: ""`, `type_of_sale: ""`, `tax_id: ""`, `transporter_address: ""`, `transporter_state_code: ""`, `transporter_state_name: ""`, `container_no: ""`, `contract_no: ""`, `contract_date: ""`, `consignment_no: ""`, `consignment_date: ""`)
- Remove: `tcs_percentage: ""`, `tcs_amount: ""`

**B3. Update mappers** *(depends on B1 type defs)*
- File: `c:\code\vowerp3ui\src\app\dashboardportal\sales\salesInvoice\createSalesInvoice\utils\salesInvoiceMappers.ts`
- `mapInvoiceDetailsToFormValues()`: Add mappings `api.due_date → due_date`, `api.type_of_sale → type_of_sale`, `api.tax_id → tax_id`, `api.transporter_address → transporter_address`, etc.
- Remove TCS mappings

**B4. Update calculations — remove TCS** *(no dependencies)*
- File: `c:\code\vowerp3ui\src\app\dashboardportal\sales\salesInvoice\createSalesInvoice\utils\salesInvoiceCalculations.ts`
- `calculateInvoiceTotals()`: Remove 4th `tcsAmount` parameter, remove from return value, update `net_amount` to not include TCS

**B5. Update form schemas — remove TCS from footer** *(depends on B1)*
- File: `c:\code\vowerp3ui\src\app\dashboardportal\sales\salesInvoice\createSalesInvoice\hooks\useSalesInvoiceFormSchemas.ts`
- Remove `tcs_percentage` and `tcs_amount` from footer schema fields array
- Consider adding dormant transport/contract fields as conditional schema entries based on `invoice_type`

**B6. Update submission hook** *(depends on B1, B4)*
- File: `c:\code\vowerp3ui\src\app\dashboardportal\sales\salesInvoice\createSalesInvoice\hooks\useSalesInvoiceFormSubmission.ts`
- Add all dormant header fields to the payload sent to backend
- Remove `tcs_percentage`, `tcs_amount` from payload

**B7. Update footer component** *(depends on B4, B5)*
- File: `c:\code\vowerp3ui\src\app\dashboardportal\sales\salesInvoice\createSalesInvoice\_components\SalesInvoiceFooter.tsx`
- Remove TCS input fields and TCS amount display from the totals section

**B8. Update preview component** *(no dependencies)*
- File: `c:\code\vowerp3ui\src\app\dashboardportal\sales\salesInvoice\createSalesInvoice\_components\SalesInvoicePreview.tsx`
- Remove TCS amount row from the preview totals

**B9. Update page.tsx** *(depends on B4)*
- File: `c:\code\vowerp3ui\src\app\dashboardportal\sales\salesInvoice\createSalesInvoice\page.tsx`
- Remove `const tcsAmount = Number(formValues.tcs_amount) || 0;`
- Update `calculateInvoiceTotals()` call to omit TCS parameter

---

## Phase C: Tests *(depends on A and B)*

**C1. Verify existing backend tests**
- Run `pytest src/test/test_sales_invoice_fields.py src/test/test_sales_invoice_jute.py src/test/test_sales_invoice_setup_invoice_types.py -v`
- Fix any failures from bug fixes in A1
- Add test verifying duplicate columns are gone

**C2. Create frontend test file**
- File: `c:\code\vowerp3ui\src\app\dashboardportal\sales\salesInvoice\createSalesInvoice\utils\salesInvoiceFields.test.ts`
- Tests for `buildDefaultFormValues()`: dormant fields present, no TCS defaults
- Tests for `createBlankLine()`: jute dtl defaults, discount defaults
- Tests for `mapInvoiceDetailsToFormValues()`: dormant field mapping, no TCS mapping, null safety
- Tests for `calculateInvoiceTotals()`: 3 params (no TCS), correct sums, zero edge cases
- Tests for `calculateLineTax()`: IGST vs CGST/SGST distribution

---

## Relevant Files

### Backend (modify)
- `src/models/sales.py` — Add 5 new extension ORM models (hessian hdr+dtl, juteyarn hdr+dtl, govtskg dtl)
- `src/sales/query.py` — Fix 2 duplicate-column bugs, add ~15 query stubs
- `dbqueries/migrations/add_invoice_extension_tables.sql` — New migration file (CREATE TABLE x5)

### Backend (reference only)
- `src/sales/salesInvoice.py` — Router already complete, verify jute function names match
- `src/test/test_sales_invoice_fields.py` — Existing 15 tests
- `src/test/test_sales_invoice_jute.py` — Existing 9 tests

### Frontend (modify)
- `src/utils/salesInvoiceService.ts` — Types: add dormant, remove TCS
- `src/app/.../utils/salesInvoiceFactories.ts` — Defaults: add dormant, remove TCS
- `src/app/.../utils/salesInvoiceMappers.ts` — Mappings: add dormant, remove TCS
- `src/app/.../utils/salesInvoiceCalculations.ts` — Remove TCS param
- `src/app/.../hooks/useSalesInvoiceFormSchemas.ts` — Remove TCS from footer
- `src/app/.../hooks/useSalesInvoiceFormSubmission.ts` — Add dormant fields to payload, remove TCS
- `src/app/.../_components/SalesInvoiceFooter.tsx` — Remove TCS display
- `src/app/.../_components/SalesInvoicePreview.tsx` — Remove TCS display
- `src/app/.../page.tsx` — Remove TCS from calculation
- `src/app/.../utils/salesInvoiceFields.test.ts` — New test file

---

## Verification

1. **Backend tests**: `pytest src/test/test_sales_invoice_fields.py src/test/test_sales_invoice_jute.py src/test/test_sales_invoice_setup_invoice_types.py -v` — all pass
2. **Frontend tests**: `pnpm vitest run src/app/dashboardportal/sales/salesInvoice/createSalesInvoice/utils/salesInvoiceFields.test.ts` — all pass
3. **TypeScript**: `npx tsc --noEmit` — no errors
4. **TCS eradication**: `grep -r "tcs" src/app/dashboardportal/sales/salesInvoice/` — zero matches
5. **SQL bugs**: Verify no duplicate columns in insert functions
6. **Build**: `pnpm build` — no errors

---

## Decisions

- **Jute CRUD**: Keep existing insert/delete in create/update endpoints (already working on `dev`)
- **SQL bugs**: Fix both duplicate-column issues
- **Extension tables**: Create ORM models + basic queries for hessian, juteyarn, govtskg_dtl. Router CRUD for these is DEFERRED (future work)
- **TCS**: Remove completely from all frontend files
- **Export fields**: On hold (future)
- **Invoice-type conditional UI**: Deferred — only structural groundwork (models + queries) now; conditional form rendering is a separate task

## Scope Boundaries

- **In scope**: SQL bug fixes, 5 extension ORM models, migration SQL, ~15 query stubs, FE TCS removal (7+ files), FE dormant field additions (types/mappers/factories/schemas/submission), FE test file
- **Out of scope**: Router CRUD for hessian/juteyarn/govtskg (future), invoice-type-conditional form UI rendering, export fields, new backend tests for extension tables (only basic models)
