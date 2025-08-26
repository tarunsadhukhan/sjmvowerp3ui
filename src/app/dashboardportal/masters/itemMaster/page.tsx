
"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Box, TextField, Snackbar, Alert, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Stack, Button as MuiButton } from "@mui/material";
import { Edit } from 'lucide-react';
import CreateItem from "./createItem";
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
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const handleOpenCreate = () => {
    setCreateDialogOpen(true);
  };
  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
    fetchItems(); // Optionally refresh grid after create
  };
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
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewData, setViewData] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editItemData, setEditItemData] = useState<any>(null);
  const [editItemId, setEditItemId] = useState<number | null>(null);

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

  // Open dialog for create (handled by CreateItem component)
  // ...existing code...

  // Handler to open view dialog and fetch edit/setup payload then show CreateItem in view mode
  const handleOpenView = async (item_id: number) => {
    setViewDialogOpen(true);
    setViewLoading(true);
    setViewData(null);
    try {
      const selectedCompany = localStorage.getItem("sidebar_selectedCompany");
      const co_id = selectedCompany ? JSON.parse(selectedCompany).co_id : "";
      const params = new URLSearchParams({ item_id: String(item_id), co_id: co_id });
      const apiUrl = `${apiRoutesPortalMasters.ITEM_EDIT_SETUP}?${params}`;
      const { data, error } = await fetchWithCookie(apiUrl, 'GET') as any;
      if (error || !data) throw new Error(error || 'Failed to fetch view payload');
      setViewData(data);
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Failed to load item for view', severity: 'error' });
      setViewDialogOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  // Handler to open edit dialog: fetch ITEM_EDIT_SETUP and open the edit form with prefetched data
  const handleOpenEdit = async (item_id: number) => {
    setEditDialogOpen(true);
    setEditItemData(null);
    setEditItemId(item_id);
    try {
      const selectedCompany = localStorage.getItem("sidebar_selectedCompany");
      const co_id = selectedCompany ? JSON.parse(selectedCompany).co_id : "";
      const params = new URLSearchParams({ item_id: String(item_id), co_id: co_id });
      const apiUrl = `${apiRoutesPortalMasters.ITEM_EDIT_SETUP}?${params}`;
      const { data, error } = await fetchWithCookie(apiUrl, 'GET') as any;
      if (error || !data) {
        throw new Error(error || 'Failed to fetch edit setup');
      }
      // store the prefetched payload so we can pass it to the edit dialog
      setEditItemData(data);
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Failed to load edit setup', severity: 'error' });
      setEditDialogOpen(false);
      setEditItemId(null);
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
              onClick={() => handleOpenView(params.row.id)}
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
              onClick={() => handleOpenView(params.row.id)}
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
  // 'active' column intentionally removed per requirements
    {
      field: "actions",
      headerName: "Actions",
      width: 120,
      sortable: false,
      filterable: false,
      headerClassName: "bg-[#3ea6da] text-white",
      renderCell: (params: GridRenderCellParams) => (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => handleOpenEdit(params.row.id)}>
              <Edit size={16} />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#0C3C60]">Item Master</h1>
          <Button
            className="btn-primary"
            onClick={handleOpenCreate}
          >
            + Create Item
          </Button>
          <CreateItem open={createDialogOpen} onClose={handleCloseCreateDialog} />
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
      {/* View dialog: show CreateItem form in view mode (inputs disabled) */}
      <CreateItem
        open={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false);
          setViewData(null);
        }}
        mode="view"
        itemId={viewData?.item_details?.item_id ?? viewData?.item_id ?? undefined}
        prefetchedSetup={viewData}
        prefetchedItem={viewData}
      />

      {/* Edit dialog: use CreateItem form in edit mode with prefetched setup/item */}
      <CreateItem
        open={editDialogOpen}
        onClose={() => {
          setEditDialogOpen(false);
          setEditItemData(null);
          setEditItemId(null);
          fetchItems();
        }}
        mode="edit"
        itemId={editItemId ?? undefined}
        prefetchedSetup={editItemData}
        prefetchedItem={editItemData}
      />
    </>
  );
}