/**
 * Bill Pass Service
 *
 * API service functions for Bill Pass (payment consolidation) module.
 * Bill Pass is a read-only view that consolidates SR and DRCR Notes for final payment.
 */

import { fetchWithCookie } from "./apiClient2";
import { apiRoutesPortalMasters } from "./api";

// =============================================================================
// TYPES
// =============================================================================

/** Bill Pass list item */
export type BillPassListItem = {
  id: number;
  inward_id: number;
  bill_pass_no: string;
  bill_pass_date: string | null;
  inward_no: string;
  inward_date: string | null;
  supplier_id: number | null;
  supplier_name: string;
  invoice_no: string;
  invoice_date: string | null;
  branch_name: string;
  sr_status_name: string;
  // Totals
  sr_total: number;
  sr_taxable: number;
  sr_tax: number;
  dr_total: number;
  dr_count: number;
  cr_total: number;
  cr_count: number;
  net_payable: number;
};

/** Bill Pass list response */
export type BillPassListResponse = {
  data: BillPassListItem[];
  total: number;
  page: number;
  page_size: number;
};

/** SR Line item in Bill Pass detail */
export type BillPassSRLine = {
  inward_dtl_id: number;
  item_id: number;
  item_name: string;
  item_code: string;
  item_group_name: string;
  accepted_make_name: string;
  uom_name: string;
  approved_qty: number;
  po_rate: number;
  accepted_rate: number;
  line_amount: number;
  discount_amount: number;
  cgst_percent: number;
  cgst_amount: number;
  sgst_percent: number;
  sgst_amount: number;
  igst_percent: number;
  igst_amount: number;
  tax_amount: number;
  line_total: number;
};

/** DRCR Note line item in Bill Pass detail */
export type BillPassDRCRLine = {
  drcr_note_dtl_id: number;
  inward_dtl_id: number;
  adjustment_reason: string;
  debitnote_type: number;
  quantity: number;
  rate: number;
  discount_amount: number;
  line_amount: number;
  item_name: string;
  item_code: string;
};

/** DRCR Note in Bill Pass detail */
export type BillPassDRCRNote = {
  drcr_note_id: number;
  note_date: string | null;
  note_type: number;
  note_type_name: string;
  remarks: string;
  gross_amount: number;
  net_amount: number;
  status_name: string;
  line_count: number;
  lines: BillPassDRCRLine[];
};

/** Bill Pass summary totals */
export type BillPassSummary = {
  sr_taxable: number;
  sr_cgst: number;
  sr_sgst: number;
  sr_igst: number;
  sr_tax: number;
  sr_total: number;
  sr_line_count: number;
  dr_total: number;
  dr_count: number;
  cr_total: number;
  cr_count: number;
  net_payable: number;
};

/** Bill Pass detail response */
export type BillPassDetail = {
  inward_id: number;
  bill_pass_no: string;
  bill_pass_date: string | null;
  inward_no: string;
  inward_date: string | null;
  supplier_id: number | null;
  supplier_name: string;
  invoice_no: string;
  invoice_date: string | null;
  invoice_amt: number;
  branch_name: string;
  sr_status_name: string;
  sr_remarks: string;
  challan_no: string;
  challan_date: string | null;
  freight: number;
  summary: BillPassSummary;
  sr_lines: BillPassSRLine[];
  debit_notes: BillPassDRCRNote[];
  credit_notes: BillPassDRCRNote[];
};

// =============================================================================
// API FUNCTIONS
// =============================================================================

/**
 * Fetch paginated list of Bill Pass entries.
 * Bill Pass shows approved SRs with computed DRCR adjustments.
 */
export async function fetchBillPassList(
  coId: string,
  params: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}
): Promise<{ data: BillPassListResponse | null; error: string | null }> {
  const { page = 1, limit = 10, search } = params;

  const queryParams = new URLSearchParams();
  queryParams.append("co_id", coId);
  queryParams.append("page", String(page));
  queryParams.append("limit", String(limit));
  if (search) {
    queryParams.append("search", search);
  }

  const url = `${apiRoutesPortalMasters.BILL_PASS_LIST}?${queryParams.toString()}`;
  return fetchWithCookie(url, "GET");
}

/**
 * Fetch Bill Pass detail by inward_id.
 * Returns full detail with SR lines and DRCR notes.
 */
export async function fetchBillPassById(
  inwardId: number | string
): Promise<{ data: BillPassDetail | null; error: string | null }> {
  const url = `${apiRoutesPortalMasters.BILL_PASS_GET_BY_ID}/${inwardId}`;
  return fetchWithCookie(url, "GET");
}

// =============================================================================
// FORMATTING HELPERS
// =============================================================================

/**
 * Format amount as Indian currency.
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return "₹ 0.00";
  return `₹ ${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format date string to display format.
 */
export function formatBillPassDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  try {
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return dateStr;
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  } catch {
    return dateStr;
  }
}
