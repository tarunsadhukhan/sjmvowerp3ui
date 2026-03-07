import { fetchWithCookie } from "./apiClient2";
import { apiRoutesPortalMasters } from "./api";
import type {
  IndentReportRow,
  IndentReportParams,
  IndentReportApiResponse,
} from "@/app/dashboardportal/procurement/reports/types/reportTypes";

export async function fetchIndentItemwiseReport(
  params: IndentReportParams,
): Promise<{ data: IndentReportRow[]; total: number }> {
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("limit", String(params.limit));
  query.set("co_id", params.co_id);
  if (params.branch_id) query.set("branch_id", params.branch_id);
  if (params.date_from) query.set("date_from", params.date_from);
  if (params.date_to) query.set("date_to", params.date_to);
  if (params.indent_type) query.set("indent_type", params.indent_type);
  if (params.outstanding_filter)
    query.set("outstanding_filter", params.outstanding_filter);
  if (params.search) query.set("search", params.search);

  const url = `${apiRoutesPortalMasters.PROCUREMENT_REPORT_INDENT_ITEMWISE}?${query.toString()}`;
  const result = await fetchWithCookie<IndentReportApiResponse>(url);

  if (result.error || !result.data) {
    throw new Error(
      result.error ?? "Failed to fetch indent itemwise report",
    );
  }

  return { data: result.data.data, total: result.data.total };
}
