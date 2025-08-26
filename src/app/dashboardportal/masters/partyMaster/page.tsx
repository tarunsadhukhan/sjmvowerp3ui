"use client";

import React, { useEffect, useState } from 'react';
import MuiDataGrid from '@/components/ui/muiDataGrid';
import { apiRoutesPortalMasters } from '@/utils/api';
import { fetchWithCookie } from '@/utils/apiClient2';
import { Box, TextField, InputAdornment, Snackbar, Alert, Switch, IconButton } from '@mui/material';
import { Search, Edit } from 'lucide-react';
import CreateParty from './createParty';
import { Button } from '@/components/ui/button';
import { GridColDef, GridPaginationModel } from '@mui/x-data-grid';

type PartyRow = {
  id: number | string;
  party_id?: number;
  party_name?: string;
  party_code?: string;
  [key: string]: any;
}

export default function PartyMasterPage() {
  const [rows, setRows] = useState<PartyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ pageSize: 10, page: 0 });
  const [totalRows, setTotalRows] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [openCreate, setOpenCreate] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | string | undefined>(undefined);

  const fetchParties = async () => {
    setLoading(true);
    try {
      const selectedCompany = localStorage.getItem('sidebar_selectedCompany');
      const co_id = selectedCompany ? JSON.parse(selectedCompany).co_id : '';

      const params = new URLSearchParams({
        page: (paginationModel.page + 1).toString(),
        limit: paginationModel.pageSize.toString(),
        co_id: co_id,
      });
      if (searchQuery) params.append('search', searchQuery);

      const { data, error } = await fetchWithCookie(`${apiRoutesPortalMasters.PARTY_TABLE}?${params}`, 'GET');
      if (error || !data) throw new Error(error || 'Failed to fetch parties');

      // party types may be returned alongside the data
      const partyTypes = data.party_types ?? data.partyTypes ?? [];
      const typeMap = new Map<string | number, string>();
      for (const t of partyTypes) {
        const id = t.party_types_mst_id ?? t.id ?? t.party_type_id;
        const name = t.party_types_mst_name ?? t.name ?? t.party_type_name;
        if (typeof id !== 'undefined') typeMap.set(String(id), String(name ?? ''));
      }

      const parseTypeIds = (val: any) => {
        if (!val) return [] as string[];
        if (Array.isArray(val)) return val.map(String);
        if (typeof val === 'string') {
          // handles formats like "{4,5}" or "4,5"
          const cleaned = val.replace(/[{}]/g, '');
          return cleaned.split(',').map(s => s.trim()).filter(Boolean);
        }
        return [String(val)];
      };

      const mapped = (data.data || []).map((r: any) => {
        const ids = parseTypeIds(r.party_type_id ?? r.party_type_ids ?? r.party_type);
        const typeNames = ids.map((i: string) => typeMap.get(String(i)) ?? '').filter(Boolean);
        return {
          ...r,
          id: r.party_id ?? r.id,
          party_name: r.supp_name ?? r.party_name ?? r.party_display ?? r.name,
          party_code: r.supp_code ?? r.party_code ?? r.code,
          contact_person: r.supp_contact_person ?? r.contact_person ?? r.contact,
          contact_email: r.supp_email_id ?? r.contact_email ?? r.email,
          party_type_display: typeNames.join(', '),
          active: r.active === 1 || r.active === '1' || r.active === true,
        };
      });
      setRows(mapped);
      setTotalRows(data.total ?? data.total_count ?? mapped.length);
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Error fetching parties', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchParties();   }, [paginationModel.page, paginationModel.pageSize, searchQuery]);

  const handlePaginationModelChange = (newModel: GridPaginationModel) => setPaginationModel(newModel);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (searchTimeout) clearTimeout(searchTimeout);
    const t = setTimeout(() => { setSearchQuery(v); setPaginationModel(prev => ({ ...prev, page: 0 })); }, 500);
    setSearchTimeout(t);
  };

  const handleToggleActive = (row: any) => {
    setRows(prev => prev.map(r => r.id === row.id ? { ...r, active: !r.active } : r));
    setSnackbar({ open: true, message: `Active toggled for ${row.party_code ?? row.party_name ?? row.id}`, severity: 'success' });
  };

  const handleEdit = (row: any) => {
  // open the CreateParty dialog in edit mode with the selected party id
  setEditingId(row.id ?? row.party_id ?? undefined);
  setDialogMode('edit');
  setOpenCreate(true);
  };

  const columns: GridColDef[] = [
    { field: 'party_code', headerName: 'Party Code', flex: 1, minWidth: 140, headerClassName: 'bg-[#3ea6da] text-white' },
    { field: 'party_name', headerName: 'Party Name', flex: 1, minWidth: 240, headerClassName: 'bg-[#3ea6da] text-white' },
    { field: 'party_type_display', headerName: 'Party Type', flex: 1, minWidth: 220, headerClassName: 'bg-[#3ea6da] text-white' },
    { field: 'contact_person', headerName: 'Contact Person', flex: 1, minWidth: 180, headerClassName: 'bg-[#3ea6da] text-white' },
    { field: 'contact_email', headerName: 'Contact Email', flex: 1, minWidth: 220, headerClassName: 'bg-[#3ea6da] text-white' },
    {
      field: 'active', headerName: 'Active', width: 120, headerClassName: 'bg-[#3ea6da] text-white', sortable: false, filterable: false,
      renderCell: (params) => (
        <Switch size="small" checked={Boolean(params.value)} onChange={() => handleToggleActive(params.row)} />
      ),
    },
    {
      field: 'actions', headerName: 'Actions', width: 80, sortable: false, filterable: false, headerClassName: 'bg-[#3ea6da] text-white',
      renderCell: (params) => (
        <IconButton size="small" onClick={() => handleEdit(params.row)}>
          <Edit size={14} />
        </IconButton>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#0C3C60]">Party Master</h1>
          <div>
              <Button size="sm" onClick={() => { setDialogMode('create'); setEditingId(undefined); setOpenCreate(true); }}>Create</Button>
          </div>
        </div>

        <Box sx={{ width: '100%', mb: 2 }}>
          <TextField
            placeholder="Search parties..."
            onChange={handleSearchChange}
            fullWidth
            variant="outlined"
            size="small"
            sx={{ maxWidth: 420 }}
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
  <CreateParty open={openCreate} onClose={() => setOpenCreate(false)} mode={dialogMode} editId={editingId} onSaved={() => { setOpenCreate(false); fetchParties(); }} />
      </div>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} sx={{ width: '100%' }}>{snackbar.message}</Alert>
      </Snackbar>
    </div>
  );
}
