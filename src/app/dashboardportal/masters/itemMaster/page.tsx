
"use client";

import React, { useState, useEffect } from "react";
import { Box, Button, TextField, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Tooltip } from "@mui/material";
import MuiDataGrid from "@/components/ui/muiDataGrid";
import { GridColDef, GridPaginationModel, GridRenderCellParams } from "@mui/x-data-grid";
import { fetchWithCookie } from "@/utils/apiClient2";
import { apiRoutesPortalMasters } from "@/utils/api";

type Item = {
  id: number;
  item_code: string;
  item_name: string;
  item_type: string;
  active: number;
  [key: string]: any;
};

export default function ItemMasterPage() {
  const [rows, setRows] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });
  const [totalRows, setTotalRows] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({ open: false, message: "", severity: "success" });
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsData, setDetailsData] = useState<any>(null);

  // Fetch items from API with pagination and search
  const fetchItems = async () => {
    setLoading(true);
    try {
      const selectedCompany = localStorage.getItem("sidebar_selectedCompany");
      const co_id = selectedCompany ? JSON.parse(selectedCompany).co_id : "";
      const queryParams = new URLSearchParams({
        page: (paginationModel.page + 1).toString(),
        limit: paginationModel.pageSize.toString(),
        co_id: co_id,
      });
      if (searchQuery) {
        queryParams.append("search", searchQuery);
      }
      const { data, error } = await fetchWithCookie(
        `${apiRoutesPortalMasters.GET_ITEM_TABLE}?${queryParams}`,
        "GET"
      );
      if (error || !data) {
        throw new Error(error || "Failed to fetch items");
      }
      // API returns data in { data: [...], total: number } format
      // Add 'id' property for MUI DataGrid and ensure 'active' is a number
      const mappedRows = (data.data || []).map((row: any) => ({
        ...row,
        id: row.item_id ?? row.id,
        active: typeof row.active === "string" ? Number(row.active) : row.active,
      }));
      setRows(mappedRows);
      setTotalRows(data.total || 0);
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message || "Error fetching items", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Effect to fetch data when pagination or search changes
  useEffect(() => {
    fetchItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginationModel.page, paginationModel.pageSize, searchQuery]);

  // Handle pagination model change
  const handlePaginationModelChange = (newPaginationModel: GridPaginationModel) => {
    setPaginationModel(newPaginationModel);
  };

  // Handle search with debounce
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchValue = event.target.value;
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    const timeout = setTimeout(() => {
      setSearchQuery(newSearchValue);
      setPaginationModel(prev => ({ ...prev, page: 0 }));
    }, 500);
    setSearchTimeout(timeout);
  };

  // Open dialog for create
  const handleOpenCreate = () => {
    window.location.href = "/dashboardportal/masters/itemMaster/CreateItem";
  };

  // Handler to open details dialog and fetch data
  const handleOpenDetails = async (item_id: number) => {
    setDetailsDialogOpen(true);
    setDetailsLoading(true);
    setDetailsData(null);
    try {
      // You may need to implement a details API for items if not present
      // For now, just show row data
      const row = rows.find(r => r.id === item_id);
      setDetailsData(row || { error: "No details found" });
    } catch (err: any) {
      setDetailsData({ error: err.message || "Failed to fetch details" });
    } finally {
      setDetailsLoading(false);
    }
  };

  // Column definitions for the DataGrid
  const columns: GridColDef[] = [
    {
      field: "item_code",
      headerName: "Item Code",
      flex: 1,
      minWidth: 120,
      headerClassName: "bg-[#3ea6da] text-white",
      renderCell: (params: GridRenderCellParams) => (
        <Tooltip title="View details">
          <span
            className="text-blue-700 underline cursor-pointer"
            onClick={() => handleOpenDetails(params.row.id)}
          >
            {params.value}
          </span>
        </Tooltip>
      ),
    },
    {
      field: "item_name",
      headerName: "Item Name",
      flex: 1,
      minWidth: 180,
      headerClassName: "bg-[#3ea6da] text-white",
      renderCell: (params: GridRenderCellParams) => (
        <Tooltip title="View details">
          <span
            className="text-blue-700 underline cursor-pointer"
            onClick={() => handleOpenDetails(params.row.id)}
          >
            {params.value}
          </span>
        </Tooltip>
      ),
    },
    {
      field: "item_group_code_display",
      headerName: "Group Code",
      flex: 1,
      minWidth: 120,
      headerClassName: "bg-[#3ea6da] text-white",
    },
    {
      field: "item_group_display",
      headerName: "Group Name",
      flex: 1,
      minWidth: 180,
      headerClassName: "bg-[#3ea6da] text-white",
    },
    {
      field: "active",
      headerName: "Active",
      width: 100,
      headerClassName: "bg-[#3ea6da] text-white",
      renderCell: (params: GridRenderCellParams) => (
        <span>{params.value ? "Yes" : "No"}</span>
      ),
    },
  ];

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#0C3C60]">Item Master</h1>
            <Button className="btn-primary" onClick={handleOpenCreate}>
              + Create Item
            </Button>
          </div>
          <Box sx={{ width: "100%", mb: 2 }}>
            <TextField
              placeholder="Search items..."
              onChange={handleSearchChange}
              fullWidth
              variant="outlined"
              size="small"
              sx={{ maxWidth: 350 }}
            />
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
        </div>
      </div>
      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Item Details</DialogTitle>
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
    </>
  );
}