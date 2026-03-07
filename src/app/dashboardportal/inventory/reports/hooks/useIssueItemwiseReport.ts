import { useState, useCallback } from "react";
import { fetchIssueItemwiseReport } from "@/utils/inventoryReportService";
import type {
  IssueItemwiseRow,
  IssueItemwiseParams,
} from "../types/reportTypes";

export function useIssueItemwiseReport() {
  const [rows, setRows] = useState<IssueItemwiseRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async (params: IssueItemwiseParams) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchIssueItemwiseReport(params);
      setRows(result.data);
      setTotal(result.total);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load report";
      setError(message);
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  return { rows, total, loading, error, loadReport };
}
