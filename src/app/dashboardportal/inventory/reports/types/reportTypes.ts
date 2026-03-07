export interface InventoryStockRow {
  item_id: number;
  item_name: string;
  item_grp_name: string;
  uom_name: string;
  opening_qty: number;
  receipt_qty: number;
  issue_qty: number;
  closing_qty: number;
}

export interface InventoryStockParams {
  page: number;
  limit: number;
  co_id: string;
  branch_id?: string;
  item_grp_id?: string;
  date_from: string;
  date_to: string;
  search?: string;
}

export interface InventoryStockApiResponse {
  data: InventoryStockRow[];
  total: number;
}

export interface IssueItemwiseRow {
  issue_li_id: number;
  issue_id: number;
  issue_no: string;
  issue_date: string;
  branch_name: string;
  department: string;
  item_name: string;
  item_grp_name: string;
  uom_name: string;
  req_quantity: number;
  issue_qty: number;
  expense_type_name: string;
  cost_factor_name: string;
  machine_name: string;
  status_name: string;
}

export interface IssueItemwiseParams {
  page: number;
  limit: number;
  co_id: string;
  branch_id?: string;
  item_grp_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface IssueItemwiseApiResponse {
  data: IssueItemwiseRow[];
  total: number;
}
