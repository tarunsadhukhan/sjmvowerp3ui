"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import MuiDataGrid from "@/components/ui/muiDataGrid";
import {
	Box,
	TextField,
	Snackbar,
	Alert,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Switch,
	FormControlLabel,
	MenuItem,
} from "@mui/material";
import { GridColDef, GridPaginationModel, GridRenderCellParams } from "@mui/x-data-grid";
import { fetchWithCookie } from "@/utils/apiClient2";
import { apiRoutesPortalMasters } from "@/utils/api";
import CreateDepartmentPage from "./CreateDepartmentPage";

type DeptRow = {
	id?: number | string;
	dept_master_id?: number;
	dept_code?: string;
	dept_name?: string;
	active?: number | boolean | string;
	branch_display?: string;
	branch_id?: string | number;
	[key: string]: any;
};

export default function DepartmentMasterPage() {
	const [rows, setRows] = useState<DeptRow[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ pageSize: 10, page: 0 });
	const [totalRows, setTotalRows] = useState<number>(0);
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [searchTimeout, setSearchTimeout] = useState<any>(null);

	const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>(
		{ open: false, message: "", severity: "success" }
	);

	// Create dialog state
	const [createOpen, setCreateOpen] = useState<boolean>(false);

	// Branch options
	const [branchOptions, setBranchOptions] = useState<any[]>([]);

	// View/Edit states
	const [viewDialogOpen, setViewDialogOpen] = useState<boolean>(false);
	const [viewLoading, setViewLoading] = useState<boolean>(false);
	const [viewData, setViewData] = useState<any>(null);

	const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
	const [editLoading, setEditLoading] = useState<boolean>(false);
	const [editDeptId, setEditDeptId] = useState<number | string | null>(null);
	const [editDeptName, setEditDeptName] = useState<string>("");
	const [editDeptCode, setEditDeptCode] = useState<string>("");
	const [editDeptActive, setEditDeptActive] = useState<boolean>(true);
	const [editBranchId, setEditBranchId] = useState<string | number | "">("");
	const [editNameError, setEditNameError] = useState<string | null>(null);
	const [editCodeError, setEditCodeError] = useState<string | null>(null);

	const fetchDepartments = async (): Promise<void> => {
		void 0;

		setLoading(true);
		try {
			const selectedCompany = localStorage.getItem("sidebar_selectedCompany");
			const co_id = selectedCompany ? JSON.parse(selectedCompany).co_id : "";
			const selectedBranches = localStorage.getItem("sidebar_selectedBranches");
			void 0;
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
					} 
				} catch (e) {
					void 0;
				}
			}
			const queryParams = new URLSearchParams({
				page: String((paginationModel.page ?? 0) + 1),
				limit: String(paginationModel.pageSize ?? 10),
				co_id,
				branch_id: branch_ids
			});
			if (searchQuery) queryParams.append("search", searchQuery);

			const { data, error } = await fetchWithCookie(`${apiRoutesPortalMasters.DEPT_MASTER_TABLE}?${queryParams}`, "GET");
			if (error || !data) throw new Error(error || "Failed to fetch departments");

			const mapped = (data.data || []).map((r: any) => ({
				...r,
				id: r.dept_master_id ?? r.dept_id ?? r.id,
				active: typeof r.active === "string" ? Number(r.active) : r.active,
				branch_display: r.branch_name ?? r.branch_desc ?? r.branch_display ?? r.branch ?? "",
				branch_id: r.branch_id ?? r.branch ?? r.b_id ?? r.branchId ?? null,
			}));
			setRows(mapped);
			setTotalRows(data.total || 0);
		} catch (err: any) {
			setSnackbar({ open: true, message: err?.message || "Error fetching departments", severity: "error" });
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		console.log('localstorage', localStorage.sidebar_selectedBranches);
		fetchDepartments();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [paginationModel.page, paginationModel.pageSize, searchQuery]);







	const handlePaginationModelChange = (newModel: GridPaginationModel) => setPaginationModel(newModel);

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const v = e.target.value;
		if (searchTimeout) clearTimeout(searchTimeout);
		const t = setTimeout(() => {
			setSearchQuery(v);
			setPaginationModel((prev) => ({ ...prev, page: 0 }));
		}, 500);
		setSearchTimeout(t);
	};



	const openCreate = (): void => {
		setCreateOpen(true);
	};
	const closeCreate = (): void => {
		setCreateOpen(false);
	};

	const closeEdit = (): void => {
		setEditDialogOpen(false);
		setEditNameError(null);
		setEditCodeError(null);
	};



	const handleOpenView = async (id: number | string): Promise<void> => {
		setViewDialogOpen(true);
		setViewLoading(true);
		setViewData(null);
		try {
			const selectedCompany = localStorage.getItem("sidebar_selectedCompany");
			const co_id = selectedCompany ? JSON.parse(selectedCompany).co_id : "";
			const params = new URLSearchParams({ dept_master_id: String(id), co_id });
			const { data, error } = await fetchWithCookie(`${apiRoutesPortalMasters.DEPT_MASTER_VIEW}?${params}`, "GET") as any;
			if (error || !data) throw new Error(error || "Failed to fetch view payload");
			setViewData(data);
		} catch (err: any) {
			setSnackbar({ open: true, message: err?.message || "Failed to load department for view", severity: "error" });
			setViewDialogOpen(false);
		} finally {
			setViewLoading(false);
		}
	};

	const handleOpenEdit = async (id: number | string): Promise<void> => {
		setEditDialogOpen(true);
		setEditLoading(true);
		setEditDeptId(id);
		setEditDeptName("");
		setEditDeptCode("");
		setEditDeptActive(true);
		setEditBranchId("");
		setEditNameError(null);
		setEditCodeError(null);
		try {
			const selectedCompany = localStorage.getItem("sidebar_selectedCompany");
			const co_id = selectedCompany ? JSON.parse(selectedCompany).co_id : "";
			const params = new URLSearchParams({ dept_master_id: String(id), co_id });
			const [{ data: viewDataRes }, { data: setupData }] = await Promise.all([
				fetchWithCookie(`${apiRoutesPortalMasters.DEPT_MASTER_VIEW}?${params}`, "GET"),
				fetchWithCookie(`${apiRoutesPortalMasters.DEPT_MASTER_CREATE_SETUP}?${new URLSearchParams({ co_id })}`, "GET"),
			]) as any;
			if (!viewDataRes) throw new Error("Failed to load department data");
			const d = viewDataRes;
			const dept = d?.dept_details ?? d?.dept_master ?? d?.department ?? d?.data ?? d;
			setEditDeptName(dept?.dept_name ?? dept?.dept_name_display ?? "");
			setEditDeptCode(dept?.dept_code ?? "");
			setEditDeptActive(typeof dept?.active === "string" ? Number(dept.active) === 1 : !!dept?.active);
			setEditBranchId(dept?.branch_id ?? dept?.branch ?? "");
			const branches = setupData?.branchs || setupData?.branches || setupData?.branch_list || [];
			setBranchOptions(Array.isArray(branches) ? branches : []);
		} catch (err: any) {
			setSnackbar({ open: true, message: err?.message || "Failed to load edit data", severity: "error" });
			setEditDialogOpen(false);
		} finally {
			setEditLoading(false);
		}
	};

	const handleSaveEdit = async (): Promise<void> => {
		if (!editDeptId) return;
		setEditLoading(true);
		try {
			const selectedCompany = localStorage.getItem("sidebar_selectedCompany");
			const co_id = selectedCompany ? JSON.parse(selectedCompany).co_id : "";
			const payload = {
				co_id,
				dept_master_id: editDeptId,
				dept_name: editDeptName,
				dept_code: editDeptCode,
				active: editDeptActive ? 1 : 0,
				branch_id: editBranchId,
			};
			const { data, error } = await fetchWithCookie(apiRoutesPortalMasters.DEPT_MASTER_CREATE, "POST", payload) as any;
			if (error || !data) throw new Error(error || "Failed to save department");
			setSnackbar({ open: true, message: data?.message || "Department updated", severity: "success" });
			setEditDialogOpen(false);
			fetchDepartments();
		} catch (err: any) {
			setSnackbar({ open: true, message: err?.message || "Update failed", severity: "error" });
		} finally {
			setEditLoading(false);
		}
	};

	const columns: GridColDef[] = [
		{ field: "dept_code", headerName: "Dept Code", flex: 1, minWidth: 140, headerClassName: "bg-[#3ea6da] text-white" },
		{ field: "dept_name", headerName: "Department", flex: 1, minWidth: 220, headerClassName: "bg-[#3ea6da] text-white" },
		{ field: "branch_display", headerName: "Branch", flex: 1, minWidth: 180, headerClassName: "bg-[#3ea6da] text-white" },
		{ field: "active", headerName: "Active", width: 120, headerClassName: "bg-[#3ea6da] text-white", renderCell: (params: GridRenderCellParams) => <span>{params.value ? "Yes" : "No"}</span> },
		{
			field: "actions",
			headerName: "Actions",
			width: 140,
			sortable: false,
			filterable: false,
			headerClassName: "bg-[#3ea6da] text-white",
			renderCell: (params: GridRenderCellParams) => (
				<div className="flex items-center gap-2">
					<button className="text-blue-600 underline" onClick={() => handleOpenView(params.row.id)}>View</button>
					<button className="text-green-600 underline" onClick={() => handleOpenEdit(params.row.id)}>Edit</button>
				</div>
			),
		},
	];

	return (
		<div className="min-h-screen bg-gray-50 p-8">
			<div className="mx-auto max-w-7xl">
				<div className="mb-8 flex items-center justify-between">
					<h1 className="text-2xl font-bold text-[#0C3C60]">Department Master</h1>
					<Button className="btn-primary" onClick={openCreate}>+ Create Department</Button>
				</div>

				<Box sx={{ width: "100%", mb: 2 }}>
					<TextField placeholder="Search departments..." onChange={handleSearchChange} fullWidth variant="outlined" size="small" sx={{ maxWidth: 350 }} />
				</Box>

				<MuiDataGrid rows={rows} columns={columns} rowCount={totalRows} paginationModel={paginationModel} onPaginationModelChange={handlePaginationModelChange} loading={loading} showLoadingUntilLoaded={true} />

				<Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: "top", horizontal: "center" }}>
					<Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} sx={{ width: "100%" }}>{snackbar.message}</Alert>
				</Snackbar>
			</div>

			<CreateDepartmentPage open={createOpen} onClose={() => { closeCreate(); fetchDepartments(); }} existingRows={rows} />

			<Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
				<DialogTitle>Department Details</DialogTitle>
				<DialogContent>{viewLoading ? <div>Loading...</div> : viewData ? <pre>{JSON.stringify(viewData, null, 2)}</pre> : <div>No details</div>}</DialogContent>
				<DialogActions><Button onClick={() => setViewDialogOpen(false)}>Close</Button></DialogActions>
			</Dialog>

			<Dialog open={editDialogOpen} onClose={closeEdit} maxWidth="sm" fullWidth>
				<DialogTitle>Edit Department</DialogTitle>
				<DialogContent>
					<Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
						<TextField label="Department Name" value={editDeptName} onChange={(e) => { setEditDeptName(e.target.value); if (editNameError) setEditNameError(null); }} error={!!editNameError} helperText={editNameError ?? undefined} fullWidth />
						<TextField label="Department Code" value={editDeptCode} onChange={(e) => { setEditDeptCode(e.target.value); if (editCodeError) setEditCodeError(null); }} error={!!editCodeError} helperText={editCodeError ?? undefined} fullWidth />
						<TextField select label="Branch" value={editBranchId} onChange={(e) => setEditBranchId(e.target.value)} fullWidth>
							{branchOptions.map((b: any) => (
								<MenuItem key={b.id} value={b.id}>{b.label}</MenuItem>
							))}
						</TextField>
						<FormControlLabel control={<Switch checked={editDeptActive} onChange={(e) => setEditDeptActive(e.target.checked)} />} label="Active" />
					</Box>
				</DialogContent>
				<DialogActions>
					<Button onClick={closeEdit} disabled={editLoading}>Cancel</Button>
					<Button className="btn-primary" onClick={handleSaveEdit} disabled={editLoading || !editDeptName || !editDeptCode || !!editNameError || !!editCodeError}>Save</Button>
				</DialogActions>
			</Dialog>
		</div>
	);
}

