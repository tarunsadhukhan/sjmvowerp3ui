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
