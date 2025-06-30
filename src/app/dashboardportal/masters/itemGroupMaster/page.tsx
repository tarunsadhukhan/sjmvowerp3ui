"use client";

import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { apiRoutesPortalMasters } from "@/utils/api";
import { fetchWithCookie } from "@/utils/apiClient2";
import MuiDataGrid from '@/components/ui/muiDataGrid';
import { Box, TextField, InputAdornment, Switch, Snackbar, Alert } from '@mui/material';
import { useState, useEffect } from 'react';
import { GridColDef, GridPaginationModel, GridRenderCellParams } from '@mui/x-data-grid';





type ItemGroup =  {
  item_grp_id: number;
  active: number;
  item_grp_name_parent: string;
  item_sub_grp_name: string;
  item_grp_code_display: string;
  item_type_id: number;
}

export default function CompanyManagement() {
  const [rows, setRows] = useState<ItemGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });
  const [totalRows, setTotalRows] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  // Fetch companies from API with pagination and search
  const fetchItemGrps = async () => {
    setLoading(true);
    
    try {
      const selectedCompany = localStorage.getItem('sidebar_selectedCompany');
      const co_id = selectedCompany ? JSON.parse(selectedCompany).co_id : '';
      
      const queryParams = new URLSearchParams({
        page: (paginationModel.page + 1).toString(), // Convert from 0-based to 1-based indexing
        limit: paginationModel.pageSize.toString(),
        co_id: co_id,
      });
      
      if (searchQuery) {
        queryParams.append('search', searchQuery);
      }

      const { data, error } = await fetchWithCookie(
        `${apiRoutesPortalMasters.GET_ALL_ITEM_GRP}?${queryParams}`,
        "GET"
      );

      if (error || !data) {
        throw new Error(error || 'Failed to fetch item groups');
      }

      // API returns data in { data: [...], total: number } format
      // Add 'id' property for MUI DataGrid and ensure 'active' is a number
      const mappedRows = (data.data || []).map((row: any) => ({
        ...row,
        id: row.item_grp_id,
        active: typeof row.active === 'string' ? Number(row.active) : row.active,
      }));
      setRows(mappedRows);
      setTotalRows(data.total || 0);
    } catch (error) {
      console.error("Error fetching item groups:", error);
    } finally {
      setLoading(false);
    }
  };

  // Effect to fetch data when pagination or search changes
  useEffect(() => {
    fetchItemGrps();
  }, [paginationModel.page, paginationModel.pageSize, searchQuery]);

  // Handle pagination model change
  const handlePaginationModelChange = (newPaginationModel: GridPaginationModel) => {
    setPaginationModel(newPaginationModel);
  };

  // Handle search with debounce
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchValue = event.target.value;
    
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set new timeout for debouncing
    const timeout = setTimeout(() => {
      setSearchQuery(newSearchValue);
      setPaginationModel(prev => ({
        ...prev,
        page: 0 // Reset to first page on new search
      }));
    }, 500); // 500ms debounce
    
    setSearchTimeout(timeout);
  };

  // Open dialog for create
  const handleOpenCreate = () => {
    window.location.href = "/dashboardportal/masters/itemGroupMaster/CreateItemGroup";
  };

  // Toggle active status handler
  const handleToggleActive = async (item_grp_id: number, currentActive: number) => {
    setLoading(true);
    try {
      const selectedCompany = localStorage.getItem('sidebar_selectedCompany');
      const co_id = selectedCompany ? JSON.parse(selectedCompany).co_id : '';
      const { data, error } = await fetchWithCookie(
        apiRoutesPortalMasters.UPDATE_ITEM_GRP_ACTIVE,
        'POST',
        { item_grp_id, active: currentActive ? 0 : 1, co_id }
      );
      if (error) {
        setSnackbar({ open: true, message: error, severity: 'error' });
      } else {
        setSnackbar({ open: true, message: 'Status updated successfully', severity: 'success' });
        fetchItemGrps(); // Refresh data
      }
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Failed to update status', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Column definitions for the DataGrid
  const columns: GridColDef[] = [
    { 
      field: 'item_grp_code_display', 
      headerName: 'Item Group Code', 
      flex: 1,
      minWidth: 180,
      headerClassName: 'bg-[#3ea6da] text-white',
    },
    { 
        field: 'item_grp_name_parent', 
        headerName: 'Item Group Name', 
        flex: 1,
        minWidth: 200,
        headerClassName: 'bg-[#3ea6da] text-white',
    },
    { 
      field: 'item_sub_grp_name', 
      headerName: 'Item Sub Group Name', 
      flex: 1,
      minWidth: 200,
      headerClassName: 'bg-[#3ea6da] text-white',
    },
    {
      field: 'active',
      headerName: 'Active',
      width: 120,
      headerClassName: 'bg-[#3ea6da] text-white',
      renderCell: (params: GridRenderCellParams) => (
        <Switch
          checked={!!params.value}
          color="primary"
          onChange={() => handleToggleActive(params.row.item_grp_id, params.value)}
          disabled={loading}
        />
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#0C3C60]">Item Group Master</h1>
          <Button
            className="btn-primary"
            onClick={handleOpenCreate}
          >
            + Create Item Group
          </Button>
        </div>
        <Box sx={{ width: '100%', mb: 2 }}>
          <TextField
            placeholder="Search item groups..."
            onChange={handleSearchChange}
            fullWidth
            variant="outlined"
            size="small"
            sx={{ maxWidth: 350 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search className="h-4 w-4" />
                </InputAdornment>
              ),
            }}
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
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </div>
    </div>
  );
}
