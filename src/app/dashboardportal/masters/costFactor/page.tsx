"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import MuiDataGrid from "@/components/ui/muiDataGrid";
import { Box, TextField, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert, IconButton } from "@mui/material";
import { GridColDef, GridPaginationModel, GridRenderCellParams } from "@mui/x-data-grid";
import { fetchWithCookie } from "@/utils/apiClient2";
import { apiRoutesPortalMasters } from "@/utils/api";
import { Edit } from 'lucide-react';
import CreateCostFactor from './createCostFactor';

type CostFactorRow = {
  id?: number | string;
  cost_factor?: string | number;
  description?: string;
  department?: string;
  branch_id?: number | string;
  branch_name?: string;
  [key: string]: any;
};

export default function CostFactorPage() {
  const [rows, setRows] = useState<CostFactorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ pageSize: 10, page: 0 });
  const [totalRows, setTotalRows] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({ open: false, message: "", severity: "success" });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const fetchCostFactors = async () => {
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

      // Add branches param from localStorage
      const selectedBranches = localStorage.getItem("sidebar_selectedBranches");
      if (selectedBranches) {
        try {
          const branchesArr = JSON.parse(selectedBranches);
          if (Array.isArray(branchesArr) && branchesArr.length > 0) {
            queryParams.append("branches", branchesArr.join(","));
          }
        } catch {}
      }

      const { data, error } = await fetchWithCookie(`${apiRoutesPortalMasters.COSTFACTOR_TABLE}?${queryParams}`, "GET");
      if (error || !data) throw new Error(error || "Failed to fetch cost factors");

      // build branch map from response if present
      const branchList = data.branches ?? data.branch_list ?? [];
      const branchMap = new Map<string | number, string>();
      for (const b of branchList) {
        const id = b.branch_id ?? b.id;
        const name = b.branch_name ?? b.name ?? '';
        if (typeof id !== 'undefined') branchMap.set(String(id), String(name));
      }

      const mapped = (data.data || []).map((r: any) => ({
        ...r,
        id: r.cost_factor_id ?? r.id,
        // prefer explicit API fields when present
        cost_factor: r.cost_factor_name ?? r.cost_factor ?? r.name,
        description: r.cost_factor_desc ?? r.description ?? r.desc ?? r.note,
  // prefer dept_desc, then dept_name from API; fallback to dept_id string or any available department field
  department: r.dept_desc ?? r.dept_name ?? r.department_name ?? (typeof r.dept_id !== 'undefined' ? String(r.dept_id) : r.department),
        branch_id: r.branch_id,
        branch_name: branchMap.get(String(r.branch_id)) ?? String(r.branch_id ?? ''),
      }));

      setRows(mapped);
      setTotalRows(data.total || 0);
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || "Error fetching cost factors", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCostFactors();
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

  const handleEdit = (row: any) => {
  setEditData(row);
  // open create dialog in edit mode; do not open the details JSON dialog
  setCreateOpen(true);
  setEditDialogOpen(false);
  };

  const columns: GridColDef[] = [
    { field: 'branch_name', headerName: 'Branch', flex: 1, minWidth: 160, headerClassName: 'bg-[#3ea6da] text-white' },
    { field: 'cost_factor', headerName: 'Cost Factor', flex: 1, minWidth: 160, headerClassName: 'bg-[#3ea6da] text-white' },
    { field: 'description', headerName: 'Description', flex: 1.5, minWidth: 220, headerClassName: 'bg-[#3ea6da] text-white' },
    { field: 'department', headerName: 'Department', flex: 1, minWidth: 180, headerClassName: 'bg-[#3ea6da] text-white' },
    {
      field: 'actions', headerName: 'Actions', width: 80, sortable: false, filterable: false, headerClassName: 'bg-[#3ea6da] text-white',
      renderCell: (params: GridRenderCellParams) => (
        <Tooltip title="Edit">
          <IconButton size="small" onClick={() => handleEdit(params.row)}>
            <Edit size={14} />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#0C3C60]">Cost Factor Master</h1>
          <Button className="btn-primary" onClick={() => setCreateOpen(true)}>
            + Create Cost Factor
          </Button>
        </div>

        <Box sx={{ width: "100%", mb: 2 }}>
          <TextField placeholder="Search cost factors..." onChange={handleSearchChange} fullWidth variant="outlined" size="small" sx={{ maxWidth: 350 }} />
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

  <CreateCostFactor open={createOpen} onClose={() => setCreateOpen(false)} onSaved={() => { setCreateOpen(false); fetchCostFactors(); }} editId={editData?.cost_factor_id ?? editData?.id} />

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cost Factor Details</DialogTitle>
        <DialogContent>
          {editData ? <pre>{JSON.stringify(editData, null, 2)}</pre> : <div>No details</div>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
