import { fetchWithCookie } from "./apiClient2";
import { apiRoutesPortalMasters } from "./api";
import type {
  InventoryStockRow,
  InventoryStockParams,
  InventoryStockApiResponse,
  IssueItemwiseRow,
  IssueItemwiseParams,
  IssueItemwiseApiResponse,
} from "@/app/dashboardportal/inventory/reports/types/reportTypes";

export async function fetchInventoryStockReport(
  params: InventoryStockParams,
): Promise<{ data: InventoryStockRow[]; total: number }> {
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("limit", String(params.limit));
  query.set("co_id", params.co_id);
  query.set("date_from", params.date_from);
  query.set("date_to", params.date_to);
  if (params.branch_id) query.set("branch_id", params.branch_id);
  if (params.item_grp_id) query.set("item_grp_id", params.item_grp_id);
  if (params.search) query.set("search", params.search);

  const url = `${apiRoutesPortalMasters.INVENTORY_REPORT_STOCK}?${query.toString()}`;
  const result = await fetchWithCookie<InventoryStockApiResponse>(url);

  if (result.error || !result.data) {
    throw new Error(
      result.error ?? "Failed to fetch inventory stock report",
    );
  }

  return { data: result.data.data, total: result.data.total };
}

export async function fetchIssueItemwiseReport(
  params: IssueItemwiseParams,
): Promise<{ data: IssueItemwiseRow[]; total: number }> {
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("limit", String(params.limit));
  query.set("co_id", params.co_id);
  if (params.branch_id) query.set("branch_id", params.branch_id);
  if (params.item_grp_id) query.set("item_grp_id", params.item_grp_id);
  if (params.date_from) query.set("date_from", params.date_from);
  if (params.date_to) query.set("date_to", params.date_to);
  if (params.search) query.set("search", params.search);

  const url = `${apiRoutesPortalMasters.INVENTORY_REPORT_ISSUE_ITEMWISE}?${query.toString()}`;
  const result = await fetchWithCookie<IssueItemwiseApiResponse>(url);

  if (result.error || !result.data) {
    throw new Error(
      result.error ?? "Failed to fetch issue itemwise report",
    );
  }

  return { data: result.data.data, total: result.data.total };
}
