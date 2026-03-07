import { useState, useCallback } from "react";
import { fetchPoItemwiseReport } from "@/utils/procurementReportService";
import type {
  PoReportRow,
  PoReportParams,
} from "../types/reportTypes";

export function usePoReport() {
  const [rows, setRows] = useState<PoReportRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async (params: PoReportParams) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchPoItemwiseReport(params);
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
