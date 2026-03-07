export interface IndentReportRow {
  indent_dtl_id: number;
  indent_id: number;
  indent_no: string;
  indent_date: string;
  branch_name: string;
  item_name: string;
  item_grp_name: string;
  uom_name: string;
  indent_qty: number;
  po_consumed_qty: number;
  outstanding_qty: number;
  indent_type_id: string;
  expense_type_name: string;
  status_name: string;
}

export interface IndentReportParams {
  page: number;
  limit: number;
  co_id: string;
  branch_id?: string;
  date_from?: string;
  date_to?: string;
  indent_type?: string;
  outstanding_filter?: string;
  search?: string;
}

export interface IndentReportApiResponse {
  data: IndentReportRow[];
  total: number;
}

export interface PoReportRow {
  po_dtl_id: number;
  po_id: number;
  po_no: string;
  po_date: string;
  branch_name: string;
  supplier_name: string;
  item_name: string;
  item_grp_name: string;
  uom_name: string;
  po_qty: number;
  rate: number;
  inward_consumed_qty: number;
  outstanding_qty: number;
  po_type: string;
  expense_type_name: string;
  status_name: string;
}

export interface PoReportParams {
  page: number;
  limit: number;
  co_id: string;
  branch_id?: string;
  date_from?: string;
  date_to?: string;
  po_type?: string;
  outstanding_filter?: string;
  search?: string;
}

export interface PoReportApiResponse {
  data: PoReportRow[];
  total: number;
}

export interface SrReportRow {
  inward_dtl_id: number;
  inward_id: number;
  inward_no: string;
  inward_date: string;
  branch_name: string;
  supplier_name: string;
  item_name: string;
  item_grp_name: string;
  uom_name: string;
  approved_qty: number;
  rejected_qty: number;
  rate: number;
  amount: number;
  status_name: string;
}

export interface SrReportParams {
  page: number;
  limit: number;
  co_id: string;
  branch_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface SrReportApiResponse {
  data: SrReportRow[];
  total: number;
}
