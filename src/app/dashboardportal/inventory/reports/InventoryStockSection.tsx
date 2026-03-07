"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Autocomplete,
  Button,
  Alert,
} from "@mui/material";
import type { GridPaginationModel } from "@mui/x-data-grid";
import { Download } from "lucide-react";
import { useInventoryStockReport } from "./hooks/useInventoryStockReport";
import InventoryStockReport from "./_components/InventoryStockReport";
import { exportToCSV } from "@/utils/exportToCSV";
import { fetchInventoryStockReport } from "@/utils/inventoryReportService";
import { fetchWithCookie } from "@/utils/apiClient2";
import { apiRoutesPortalMasters } from "@/utils/api";

interface BranchOption {
  branch_id: number;
  branch_name: string;
}

interface ItemGroupOption {
  item_grp_id: number;
  item_grp_name: string;
}

interface InventoryStockSectionProps {
  selectedCompany: {
    co_id?: number;
    branches?: { branch_id: number; branch_name: string }[];
  } | null;
}

function getFirstOfMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

export default function InventoryStockSection({ selectedCompany }: InventoryStockSectionProps) {
  const { rows, total, loading, error, loadReport } = useInventoryStockReport();

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedBranch, setSelectedBranch] = useState<BranchOption | null>(null);
  const [selectedItemGroup, setSelectedItemGroup] = useState<ItemGroupOption | null>(null);
  const [itemGroupOptions, setItemGroupOptions] = useState<ItemGroupOption[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 25,
  });
  const [exporting, setExporting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setDateFrom(getFirstOfMonth());
    setDateTo(getToday());
    setMounted(true);
  }, []);

  const coId = selectedCompany?.co_id ? String(selectedCompany.co_id) : "";

  // Load item groups when company changes
  useEffect(() => {
    if (!coId) return;
    const loadItemGroups = async () => {
      try {
        const url = `${apiRoutesPortalMasters.GET_ALL_ITEM_GRP}?co_id=${coId}`;
        const result = await fetchWithCookie<{ data: ItemGroupOption[] }>(url);
        if (result.data?.data) {
          setItemGroupOptions(result.data.data);
        }
      } catch {
        // Silently fail - item group filter is optional
      }
    };
    loadItemGroups();
  }, [coId]);

  const branchOptions: BranchOption[] = useMemo(
    () =>
      (selectedCompany?.branches ?? []).map((b) => ({
        branch_id: b.branch_id,
        branch_name: b.branch_name,
      })),
    [selectedCompany?.branches],
  );

  useEffect(() => {
    if (!coId || !dateFrom || !dateTo) return;
    loadReport({
      page: paginationModel.page + 1,
      limit: paginationModel.pageSize,
      co_id: coId,
      branch_id: selectedBranch ? String(selectedBranch.branch_id) : undefined,
      item_grp_id: selectedItemGroup ? String(selectedItemGroup.item_grp_id) : undefined,
      date_from: dateFrom,
      date_to: dateTo,
      search: searchValue.trim() || undefined,
    });
  }, [
    coId,
    selectedBranch,
    selectedItemGroup,
    dateFrom,
    dateTo,
    searchValue,
    paginationModel.page,
    paginationModel.pageSize,
    loadReport,
  ]);

  const handleExport = useCallback(async () => {
    if (!coId || !dateFrom || !dateTo) return;
    setExporting(true);
    try {
      const result = await fetchInventoryStockReport({
        page: 1,
        limit: 10000,
        co_id: coId,
        branch_id: selectedBranch ? String(selectedBranch.branch_id) : undefined,
        item_grp_id: selectedItemGroup ? String(selectedItemGroup.item_grp_id) : undefined,
        date_from: dateFrom,
        date_to: dateTo,
        search: searchValue.trim() || undefined,
      });
      exportToCSV(result.data, "inventory_stock_report.csv");
    } catch {
      // Export failed silently
    } finally {
      setExporting(false);
    }
  }, [coId, selectedBranch, selectedItemGroup, dateFrom, dateTo, searchValue]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchValue(e.target.value);
      setPaginationModel((prev) => ({ ...prev, page: 0 }));
    },
    [],
  );

  if (!mounted) return null;

  return (
    <>
      <Paper elevation={1} sx={{ mb: 3, p: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1.5, color: "#666" }}>
          Current Inventory Report
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", mb: 2 }}>
          <TextField
            type="date"
            label="Date From"
            value={dateFrom}
            onChange={(e) => {
              setDateFrom(e.target.value);
              setPaginationModel((prev) => ({ ...prev, page: 0 }));
            }}
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ width: 160 }}
          />
          <TextField
            type="date"
            label="Date To"
            value={dateTo}
            onChange={(e) => {
              setDateTo(e.target.value);
              setPaginationModel((prev) => ({ ...prev, page: 0 }));
            }}
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{ width: 160 }}
          />
          <Autocomplete
            options={branchOptions}
            getOptionLabel={(option) => option.branch_name}
            isOptionEqualToValue={(option, value) => option.branch_id === value.branch_id}
            value={selectedBranch}
            onChange={(_, newValue) => {
              setSelectedBranch(newValue);
              setPaginationModel((prev) => ({ ...prev, page: 0 }));
            }}
            renderInput={(params) => (
              <TextField {...params} label="Branch" size="small" placeholder="All Branches" />
            )}
            sx={{ minWidth: 220 }}
          />
          <Autocomplete
            options={itemGroupOptions}
            getOptionLabel={(option) => option.item_grp_name}
            isOptionEqualToValue={(option, value) => option.item_grp_id === value.item_grp_id}
            value={selectedItemGroup}
            onChange={(_, newValue) => {
              setSelectedItemGroup(newValue);
              setPaginationModel((prev) => ({ ...prev, page: 0 }));
            }}
            renderInput={(params) => (
              <TextField {...params} label="Item Group" size="small" placeholder="All Groups" />
            )}
            sx={{ minWidth: 220 }}
          />
          <TextField
            label="Search"
            placeholder="Item, group..."
            value={searchValue}
            onChange={handleSearchChange}
            size="small"
            sx={{ minWidth: 200 }}
          />
          <Box sx={{ ml: "auto" }}>
            <Button
              variant="outlined"
              startIcon={<Download size={18} />}
              onClick={handleExport}
              disabled={exporting || !coId}
              size="small"
            >
              {exporting ? "Exporting..." : "Export CSV"}
            </Button>
          </Box>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!coId && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Please select a company from the sidebar to view reports.
        </Alert>
      )}

      {coId && (
        <InventoryStockReport
          rows={rows}
          rowCount={total}
          loading={loading}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
        />
      )}
    </>
  );
}
