"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import MuiDataGrid from "@/components/ui/muiDataGrid";
import { Box, TextField, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Switch, Snackbar, Alert } from "@mui/material";
import { GridColDef, GridPaginationModel, GridRenderCellParams } from "@mui/x-data-grid";
import { fetchWithCookie } from "@/utils/apiClient2";
import { apiRoutesPortalMasters } from "@/utils/api";

type WarehouseRow = {
  id?: number | string;
  warehouse_id?: number;
  warehouse_name?: string;
  sub_warehouse_name?: string;
  active?: number | string | boolean;
  [key: string]: any;
};

export default function WarehouseMasterPage() {
  const [rows, setRows] = useState<WarehouseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ pageSize: 10, page: 0 });
  const [totalRows, setTotalRows] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({ open: false, message: "", severity: "success" });
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsData, setDetailsData] = useState<any>(null);

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const selectedCompany = localStorage.getItem("sidebar_selectedCompany");
      const co_id = selectedCompany ? JSON.parse(selectedCompany).co_id : "";
      const queryParams = new URLSearchParams({
        page: String((paginationModel.page ?? 0) + 1),
        limit: String(paginationModel.pageSize ?? 10),
        co_id,
      });
      if (searchQuery) queryParams.append("search", searchQuery);

      const { data, error } = await fetchWithCookie(`${apiRoutesPortalMasters.GET_WAREHOUSE_TABLE}?${queryParams}`, "GET");
      if (error || !data) throw new Error(error || "Failed to fetch warehouses");

      // API expected shape: { data: [...], total: number }
      const mapped = (data.data || []).map((r: any) => ({
        ...r,
        id: r.warehouse_id ?? r.id,
        active: typeof r.active === "string" ? Number(r.active) : r.active,
      }));
      setRows(mapped);
      setTotalRows(data.total || 0);
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || "Error fetching warehouses", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationModel.page, paginationModel.pageSize, searchQuery]);

  const handlePaginationModelChange = (newModel: GridPaginationModel) => setPaginationModel(newModel);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (searchTimeout) clearTimeout(searchTimeout);
    const t = setTimeout(() => {
      setSearchQuery(v);
      setPaginationModel(prev => ({ ...prev, page: 0 }));
    }, 500);
    setSearchTimeout(t);
  };

  const handleOpenDetails = (id: number | string) => {
    setDetailsDialogOpen(true);
    setDetailsLoading(true);
    setDetailsData(null);
    try {
      const row = rows.find(r => r.id === id);
      setDetailsData(row || { error: "No details found" });
    } catch (err: any) {
      setDetailsData({ error: err.message || "Failed to load details" });
    } finally {
      setDetailsLoading(false);
    }
  };

  const columns: GridColDef[] = [
    {
      field: "warehouse_name",
      headerName: "Warehouse Name",
      flex: 1,
      minWidth: 180,
      headerClassName: "bg-[#3ea6da] text-white",
      renderCell: (params: GridRenderCellParams) => (
        <Tooltip title="View details">
          <span className="text-blue-700 underline cursor-pointer" onClick={() => handleOpenDetails(params.row.id)}>
            {params.value}
          </span>
        </Tooltip>
      ),
    },
    {
      field: "sub_warehouse_name",
      headerName: "Subwarehouse Name",
      flex: 1,
      minWidth: 180,
      headerClassName: "bg-[#3ea6da] text-white",
    },
    {
      field: "active",
      headerName: "Active",
      width: 120,
      headerClassName: "bg-[#3ea6da] text-white",
      renderCell: (params: GridRenderCellParams) => (
        <span>{params.value ? "Yes" : "No"}</span>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#0C3C60]">Warehouse Master</h1>
          <Button className="btn-primary" onClick={() => { /* create flow can be added */ }}>
            + Create Warehouse
          </Button>
        </div>

        <Box sx={{ width: "100%", mb: 2 }}>
          <TextField placeholder="Search warehouses..." onChange={handleSearchChange} fullWidth variant="outlined" size="small" sx={{ maxWidth: 350 }} />
        </Box>

        <MuiDataGrid
          rows={rows}
          columns={columns}
          rowCount={totalRows}
          paginationModel={paginationModel}
          onPaginationModelChange={handlePaginationModelChange}
          loading={loading}
          showLoadingUntilLoaded={true}
        />

        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </div>

      <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Warehouse Details</DialogTitle>
        <DialogContent>
          {detailsLoading ? (
            <div>Loading...</div>
          ) : detailsData && !detailsData.error ? (
            <pre>{JSON.stringify(detailsData, null, 2)}</pre>
          ) : (
            <div>{detailsData?.error || "No details found"}</div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialogOpen(false)} autoFocus>Okay</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
