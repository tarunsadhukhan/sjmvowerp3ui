import { useState, useCallback } from "react";
import { fetchInventoryStockReport } from "@/utils/inventoryReportService";
import type {
  InventoryStockRow,
  InventoryStockParams,
} from "../types/reportTypes";

export function useInventoryStockReport() {
  const [rows, setRows] = useState<InventoryStockRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async (params: InventoryStockParams) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchInventoryStockReport(params);
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
