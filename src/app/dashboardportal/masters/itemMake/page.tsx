"use client";

import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { apiRoutesPortalMasters } from "@/utils/api";
import { fetchWithCookie } from "@/utils/apiClient2";
import MuiDataGrid from '@/components/ui/muiDataGrid';
import { Box, TextField, InputAdornment, Snackbar, Alert } from '@mui/material';
import { useState, useEffect } from 'react';
import { GridColDef, GridPaginationModel, GridRenderCellParams } from '@mui/x-data-grid';
import CreateItemMake from './createItemMake';

type ItemMakeRow = {
  id: number | string;
  item_make_id?: number;
  item_group_code_display?: string;
  item_group_display?: string;
  item_make?: string;
  [key: string]: any;
}

export default function ItemMakePage() {
  const [rows, setRows] = useState<ItemMakeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState({ pageSize: 10, page: 0 });
  const [totalRows, setTotalRows] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [openCreate, setOpenCreate] = useState(false);

  const fetchItemMakes = async () => {
    setLoading(true);
    try {
      const selectedCompany = localStorage.getItem('sidebar_selectedCompany');
      const co_id = selectedCompany ? JSON.parse(selectedCompany).co_id : '';

      const queryParams = new URLSearchParams({
        page: (paginationModel.page + 1).toString(),
        limit: paginationModel.pageSize.toString(),
        co_id: co_id,
      });
      if (searchQuery) queryParams.append('search', searchQuery);

      const { data, error } = await fetchWithCookie(`${apiRoutesPortalMasters.ITEM_MAKE_TABLE}?${queryParams}`, 'GET');
      if (error || !data) throw new Error(error || 'Failed to fetch item makes');

      const mappedRows = (data.data || []).map((row: any) => ({
        ...row,
        id: row.item_make_id ?? row.id,
        // normalize item make field name from API
        item_make: row.item_make_name ?? row.item_make ?? row.item_make_name_display ?? "",
        item_group_code_display: row.item_group_code_display ?? row.item_grp_code_display ?? row.item_group_code ?? "",
        item_group_display: row.item_group_display ?? row.item_group_name ?? row.item_group ?? "",
      }));
      setRows(mappedRows);
      setTotalRows(data.total || 0);
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Error fetching item makes', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItemMakes();   }, [paginationModel.page, paginationModel.pageSize, searchQuery]);

  const handlePaginationModelChange = (newPaginationModel: GridPaginationModel) => {
    setPaginationModel(newPaginationModel);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchValue = event.target.value;
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeout = setTimeout(() => {
      setSearchQuery(newSearchValue);
      setPaginationModel(prev => ({ ...prev, page: 0 }));
    }, 500);
    setSearchTimeout(timeout);
  };

  const columns: GridColDef[] = [
    {
      field: 'item_group_code_display',
      headerName: 'Item Group Code',
      flex: 1,
      minWidth: 180,
      headerClassName: 'bg-[#3ea6da] text-white',
      renderCell: (params: GridRenderCellParams) => (
        <span className="text-blue-700">{params.value ?? ''}</span>
      ),
    },
    {
      field: 'item_group_display',
      headerName: 'Item Group Name',
      flex: 1,
      minWidth: 200,
      headerClassName: 'bg-[#3ea6da] text-white',
      renderCell: (params: GridRenderCellParams) => (
        <span>{params.value ?? ''}</span>
      ),
    },
    {
      field: 'item_make',
      headerName: 'Item Make',
      flex: 1,
      minWidth: 200,
      headerClassName: 'bg-[#3ea6da] text-white',
    },
  // actions column removed per request
  ];

  const _handleEdit = (row: any) => {
    // placeholder: open edit modal or navigate to edit page
    setSnackbar({ open: true, message: `Edit clicked for ${row.item_make_id ?? row.id}`, severity: 'success' });
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[#0C3C60]">Item Make Master</h1>
            <div>
              <Button size="sm" onClick={() => setOpenCreate(true)}>Create</Button>
            </div>
          </div>
          <Box sx={{ width: '100%', mb: 2 }}>
            <TextField
              placeholder="Search item makes..."
              onChange={handleSearchChange}
              fullWidth
              variant="outlined"
              size="small"
              sx={{ maxWidth: 350 }}
              InputProps={{ startAdornment: (<InputAdornment position="start"><Search className="h-4 w-4"/></InputAdornment>) }}
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
  <CreateItemMake open={openCreate} onClose={() => setOpenCreate(false)} onCreated={() => { setOpenCreate(false); fetchItemMakes(); }} />

  <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </>
  );
}
