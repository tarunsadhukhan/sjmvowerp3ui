import { useState, useCallback } from "react";
import { fetchIndentItemwiseReport } from "@/utils/procurementReportService";
import type {
  IndentReportRow,
  IndentReportParams,
} from "../types/reportTypes";

export function useIndentReport() {
  const [rows, setRows] = useState<IndentReportRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async (params: IndentReportParams) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchIndentItemwiseReport(params);
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
