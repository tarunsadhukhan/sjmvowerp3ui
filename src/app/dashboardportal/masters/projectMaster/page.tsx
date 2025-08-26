"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import MuiDataGrid from "@/components/ui/muiDataGrid";
import { Box, TextField, Snackbar, Alert } from "@mui/material";
import { GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import { fetchWithCookie } from "@/utils/apiClient2";
import CreateProjectPage from "./CreateProjectPage";
import ViewProjectPage from "./ViewProjectPage";
import EditProjectPage from "./EditProjectPage";
import { apiRoutesPortalMasters } from "@/utils/api";

type Row = { id?: string | number; prj_name?: string; prj_desc?: string; prj_start_dt?: string; prj_end_dt?: string; branch_display?: string; dept_name?: string; status?: string; active?: number | boolean };

export default function ProjectMasterPage(){
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ pageSize: 10, page: 0 });
  const [totalRows, setTotalRows] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({ open: false, message: "", severity: "success" });

  const [createOpen, setCreateOpen] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [viewOpen, setViewOpen] = useState<boolean>(false);
  const [editOpen, setEditOpen] = useState<boolean>(false);

  const fetchProjects = async () => {
    setLoading(true);
    try {
                const selectedCompany = localStorage.getItem("sidebar_selectedCompany");
            const co_id = selectedCompany ? JSON.parse(selectedCompany).co_id : "";
            const selectedBranches = localStorage.getItem("sidebar_selectedBranches");
            let branch_ids = "";
            if (selectedBranches) {
                try {
                    const parsed = JSON.parse(selectedBranches);
                    branch_ids=parsed
                    if (Array.isArray(parsed)) {
                        // support array of objects [{ branch_id: 1 }] OR array of primitives [1,2] OR mixed
                        const ids = parsed
                            .map((b: any) => {
                                if (b && typeof b === 'object') return b.branch_id ?? b.id ?? b.value ?? '';
                                // allow numeric 0 as valid id
                                if (b === 0) return '0';
                                if (b) return String(b);
                                return '';
                            })
                            .map(String)
                            .filter(Boolean);
                        branch_ids = ids.join(',');
                        // branch_ids prepared for API
                    } 
                } catch (e) {
                    console.warn("Failed to parse selectedBranches:", e);
                }
            }
            const queryParams = new URLSearchParams({
                page: String((paginationModel.page ?? 0) + 1),
                limit: String(paginationModel.pageSize ?? 10),
                co_id,
                branch_id: branch_ids
            });
            if (searchQuery) queryParams.append("search", searchQuery);
      const { data, error } = await fetchWithCookie(`${apiRoutesPortalMasters.PROJECT_MASTER_TABLE}?${queryParams}`, 'GET') as any;
      if (error || !data) throw new Error(error || 'Failed to fetch projects');
      const mapped = (data.data || []).map((r:any)=> ({ ...r, id: r.project_id ?? r.prj_id ?? r.id, prj_name: r.prj_name ?? r.prj_desc ?? r.prj_name_display ?? r.name, prj_desc: r.prj_desc ?? r.desc ?? '', prj_start_dt: r.prj_start_dt ?? r.start_date, prj_end_dt: r.prj_end_dt ?? r.end_date, branch_display: r.branch_display ?? r.branch_desc ?? r.branch, dept_name: r.dept_name ?? r.department, status: r.status_name ?? r.status ?? (r.status_id ? (r.status_id === 1 ? 'OPEN' : 'DEACTIVE') : ''), active: typeof r.active === 'string' ? Number(r.active) : r.active }));
      setRows(mapped);
      setTotalRows(data.total || 0);
    } catch(err:any){ setSnackbar({ open: true, message: err?.message || 'Error fetching projects', severity: 'error' }); } finally { setLoading(false); }
  }

  useEffect(()=>{ fetchProjects(); }, [paginationModel.page, paginationModel.pageSize, searchQuery]);

  const handlePaginationModelChange = (newModel: GridPaginationModel) => setPaginationModel(newModel);
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => { const v = e.target.value; if (searchTimeout) clearTimeout(searchTimeout); const t = setTimeout(()=>{ setSearchQuery(v); setPaginationModel((p)=>({ ...p, page: 0 })); }, 500); setSearchTimeout(t); };

  const openCreate = () => setCreateOpen(true);
  const closeCreate = () => setCreateOpen(false);
  const handleOpenView = (id: string | number) => { setSelectedId(id); setViewOpen(true); };
  const handleOpenEdit = (id: string | number) => { setSelectedId(id); setEditOpen(true); };
  const handleCloseView = (saved?: boolean) => { setViewOpen(false); setSelectedId(null); };

  const columns: GridColDef[] = [
    { field: 'prj_name', headerName: 'Project', flex: 1, minWidth: 220, headerClassName: 'bg-[#3ea6da] text-white' },
    { field: 'prj_desc', headerName: 'Description', flex: 1, minWidth: 220, headerClassName: 'bg-[#3ea6da] text-white' },
    { field: 'dept_name', headerName: 'Department', flex: 1, minWidth: 180, headerClassName: 'bg-[#3ea6da] text-white' },
    { field: 'branch_display', headerName: 'Branch', flex: 1, minWidth: 180, headerClassName: 'bg-[#3ea6da] text-white' },
    { field: 'status', headerName: 'Status', width: 140, headerClassName: 'bg-[#3ea6da] text-white' },
    { field: 'active', headerName: 'Active', width: 120, headerClassName: 'bg-[#3ea6da] text-white', renderCell: (params:any)=> <span>{params.value ? 'Yes' : 'No'}</span> },
    { field: 'actions', headerName: 'Actions', width: 200, sortable: false, filterable: false, headerClassName: 'bg-[#3ea6da] text-white', renderCell: (params:any)=> (
      <div className="flex items-center gap-2"><button className="text-blue-600 underline" onClick={()=>handleOpenView(params.row.id)}>View</button><button className="text-green-600 underline" onClick={()=>handleOpenEdit(params.row.id)}>Edit</button></div>
    ) }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#0C3C60]">Project Master</h1>
          <Button className="btn-primary" onClick={openCreate}>+ Create Project</Button>
        </div>

        <Box sx={{ width: '100%', mb: 2 }}>
          <TextField placeholder="Search projects..." onChange={handleSearchChange} fullWidth variant="outlined" size="small" sx={{ maxWidth: 350 }} />
        </Box>

        <MuiDataGrid rows={rows} columns={columns} rowCount={totalRows} paginationModel={paginationModel} onPaginationModelChange={handlePaginationModelChange} loading={loading} showLoadingUntilLoaded={true} />

        <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={()=> setSnackbar({ ...snackbar, open:false })} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <Alert severity={snackbar.severity} onClose={()=> setSnackbar({ ...snackbar, open:false })} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </div>

        <CreateProjectPage open={createOpen} onClose={() => { closeCreate(); fetchProjects(); }} existingRows={rows} />
      <ViewProjectPage open={viewOpen} project_id={selectedId ?? undefined} onClose={handleCloseView} />
  
  <EditProjectPage open={editOpen} project_id={selectedId ?? undefined} onClose={(saved?: boolean) => { setEditOpen(false); setSelectedId(null); if (saved) fetchProjects(); }} />
    </div>
  );
}
