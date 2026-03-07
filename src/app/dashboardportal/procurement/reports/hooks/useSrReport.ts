import { useState, useCallback } from "react";
import { fetchSrItemwiseReport } from "@/utils/procurementReportService";
import type {
  SrReportRow,
  SrReportParams,
} from "../types/reportTypes";

export function useSrReport() {
  const [rows, setRows] = useState<SrReportRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async (params: SrReportParams) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchSrItemwiseReport(params);
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
