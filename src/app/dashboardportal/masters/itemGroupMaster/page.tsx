"use client";

import { Button } from "@/components/ui/button";
import { PencilIcon, Search } from "lucide-react";
import { apiRoutes, apiRoutesconsole } from "@/utils/api";
import { fetchWithCookie } from "@/utils/apiClient2";
import MuiDataGrid from '@/components/ui/muiDataGrid';
import { Box, TextField, InputAdornment } from '@mui/material';
import { useState, useEffect } from 'react';
import { GridColDef, GridPaginationModel, GridRenderCellParams } from '@mui/x-data-grid';
import CreateItemGroup from './createItemGroup';



type Company = {
  co_id: number;
  co_name: string;
  co_email_id: string;
  co_prefix: string;
};

export default function CompanyManagement() {
  const [rows, setRows] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0,
  });
  const [totalRows, setTotalRows] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState<Company | null>(null);

  // Helper function to create URL for editing
  const createEditUrl = (company: Company) => {
    const params = new URLSearchParams({
      coId: company.co_id.toString(),
      coName: encodeURIComponent(company.co_name),
    });

    return `/dashboardportal/masters/itemGroupMaster/createItemGroup?${params.toString()}`;
  };

  // Fetch companies from API with pagination and search
  const fetchCompanies = async () => {
    setLoading(true);
    
    try {
      const queryParams = new URLSearchParams({
        page: (paginationModel.page + 1).toString(), // Convert from 0-based to 1-based indexing
        limit: paginationModel.pageSize.toString(),
      });
      
      if (searchQuery) {
        queryParams.append('search', searchQuery);
      }

      const { data, error } = await fetchWithCookie(
        `${apiRoutesconsole.GET_CO_ALL}?${queryParams}`,
        "GET"
      );

      if (error || !data) {
        throw new Error(error || 'Failed to fetch item groups');
      }

      // API returns data in { data: [...], total: number } format
      setRows(data.data || []);
      setTotalRows(data.total || 0);
    } catch (error) {
      console.error("Error fetching item groups:", error);
    } finally {
      setLoading(false);
    }
  };

  // Effect to fetch data when pagination or search changes
  useEffect(() => {
    fetchCompanies();
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
    setEditData(null);
    setDialogOpen(true);
  };

  // Open dialog for edit
  const handleOpenEdit = (company: Company) => {
    setEditData(company);
    setDialogOpen(true);
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditData(null);
  };

  // Handle dialog submit
  const handleDialogSubmit = (data: { co_name: string; co_email_id: string; co_id?: number }) => {
    console.log('Submitted:', data);
    handleDialogClose();
    fetchCompanies(); // reload table
  };

  // Column definitions for the DataGrid
  const columns: GridColDef[] = [
    { 
      field: 'co_name', 
      headerName: 'Item Group Code', 
      flex: 1,
      minWidth: 180,
      headerClassName: 'bg-[#3ea6da] text-white',
    },
    { 
      field: 'co_email_id', 
      headerName: 'Item Group Name', 
      flex: 1,
      minWidth: 200,
      headerClassName: 'bg-[#3ea6da] text-white',
    },
    {
      field: 'actions',
      headerName: 'edit',
      width: 100,
      headerClassName: 'bg-[#3ea6da] text-white',
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleOpenEdit(params.row as Company)}
        >
          <PencilIcon className="h-4 w-4" />
        </Button>
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
        <CreateItemGroup
          open={dialogOpen}
          onClose={handleDialogClose}
          onSubmit={handleDialogSubmit}
          initialData={editData}
        />
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
      </div>
    </div>
  );
}
