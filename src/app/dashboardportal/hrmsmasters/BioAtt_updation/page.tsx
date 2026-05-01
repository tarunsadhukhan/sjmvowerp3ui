"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Snackbar, Alert, Button, Tabs, Tab } from "@mui/material";
import { GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import { fetchWithCookie } from "@/utils/apiClient2";
import { apiRoutesPortalMasters } from "@/utils/api";
import IndexWrapper from "@/components/ui/IndexWrapper";
import BioAttUploadDialog from "./BioAttUploadDialog";
import BioAttProcessDialog from "./BioAttProcessDialog";
import BioAttFinalProcessDialog from "./BioAttFinalProcessDialog";
import BioAttEtrackDialog from "./BioAttEtrackDialog";
import BioAttEtrackProcessDialog from "./BioAttEtrackProcessDialog";

type BioAttRow = {
	id: number;
	bio_att_id: number;
	emp_code: string;
	emp_anme: string;
	bio_id: number | null;
	log_date: string;
	company_name: string;
	department: string;
	designation: string;
	employement_type: string;
	device_direction: string;
	device_name: string;
	[key: string]: unknown;
};

type DailyAttRow = {
	id: number;
	daily_att_proc_id: number;
	eb_id: number | null;
	bio_id: number | null;
	emp_code: string;
	emp_name: string;
	department: string;
	designation: string;
	attendance_date: string;
	spell_name: string;
	attendance_type: string;
	attendance_source: string;
	check_in: string;
	check_out: string;
	Time_duration: number | null;
	Working_hours: number | null;
	Ot_hours: number | null;
	spell_start_time: string;
	spell_end_time: string;
	spell_hours: number | null;
	processed: number | null;
	device_name: string;
	[key: string]: unknown;
};

type TabKey = "bio" | "daily";

export default function BioAttUpdationListPage() {
	const [activeTab, setActiveTab] = useState<TabKey>("bio");
	const [rows, setRows] = useState<BioAttRow[]>([]);
	const [dailyRows, setDailyRows] = useState<DailyAttRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [totalRows, setTotalRows] = useState(0);
	const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
		pageSize: 10,
		page: 0,
	});
	const [searchQuery, setSearchQuery] = useState("");
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		message: string;
		severity: "success" | "error";
	}>({ open: false, message: "", severity: "success" });

	const [uploadOpen, setUploadOpen] = useState(false);
	const [processOpen, setProcessOpen] = useState(false);
	const [finalProcessOpen, setFinalProcessOpen] = useState(false);
	const [etrackOpen, setEtrackOpen] = useState(false);
	const [etrackProcessOpen, setEtrackProcessOpen] = useState(false);
	const pollersRef = React.useRef<Set<string>>(new Set());

	const getCoId = useCallback((): string => {
		const selectedCompany = localStorage.getItem("sidebar_selectedCompany");
		return selectedCompany ? JSON.parse(selectedCompany).co_id : "";
	}, []);

	const fetchBioAtt = useCallback(async () => {
		setLoading(true);
		try {
			const co_id = getCoId();
			if (!co_id) throw new Error("No company selected");

			const queryParams = new URLSearchParams({
				co_id,
				page: String((paginationModel.page ?? 0) + 1),
				limit: String(paginationModel.pageSize ?? 10),
			});
			if (searchQuery) queryParams.append("search", searchQuery);

			const { data, error } = await fetchWithCookie(
				`${apiRoutesPortalMasters.BIO_ATT_LIST}?${queryParams}`,
				"GET",
			);
			if (error || !data) throw new Error(error || "Failed to fetch bio attendance");

			const mapped: BioAttRow[] = (data.data || []).map(
				(r: Record<string, unknown>) => ({
					...r,
					id: r.bio_att_id as number,
					bio_att_id: r.bio_att_id as number,
					emp_code: (r.emp_code as string) ?? "",
					emp_anme: (r.emp_anme as string) ?? "",
					bio_id: (r.bio_id as number | null) ?? null,
					log_date: (r.log_date as string) ?? "",
					company_name: (r.company_name as string) ?? "",
					department: (r.department as string) ?? "",
					designation: (r.designation as string) ?? "",
					employement_type: (r.employement_type as string) ?? "",
					device_direction: (r.device_direction as string) ?? "",
					device_name: (r.device_name as string) ?? "",
				}),
			);

			setRows(mapped);
			setTotalRows(data.total || 0);
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : "Error fetching bio attendance";
			setSnackbar({ open: true, message, severity: "error" });
		} finally {
			setLoading(false);
		}
	}, [paginationModel.page, paginationModel.pageSize, searchQuery, getCoId]);

	const fetchDailyAtt = useCallback(async () => {
		setLoading(true);
		try {
			const co_id = getCoId();
			if (!co_id) throw new Error("No company selected");

			const queryParams = new URLSearchParams({
				co_id,
				page: String((paginationModel.page ?? 0) + 1),
				limit: String(paginationModel.pageSize ?? 10),
			});
			if (searchQuery) queryParams.append("search", searchQuery);

			const { data, error } = await fetchWithCookie(
				`${apiRoutesPortalMasters.DAILY_ATT_LIST}?${queryParams}`,
				"GET",
			);
			if (error || !data) throw new Error(error || "Failed to fetch daily attendance");

			const mapped: DailyAttRow[] = (data.data || []).map(
				(r: Record<string, unknown>) => ({
					...(r as Record<string, unknown>),
					id: r.daily_att_proc_id as number,
					daily_att_proc_id: r.daily_att_proc_id as number,
					eb_id: (r.eb_id as number | null) ?? null,
					bio_id: (r.bio_id as number | null) ?? null,
					emp_code: (r.emp_code as string) ?? "",
					emp_name: (r.emp_name as string) ?? "",
					department: (r.department as string) ?? "",
					designation: (r.designation as string) ?? "",
					attendance_date: (r.attendance_date as string) ?? "",
					spell_name: (r.spell_name as string) ?? "",
					attendance_type: (r.attendance_type as string) ?? "",
					attendance_source: (r.attendance_source as string) ?? "",
					check_in: (r.check_in as string) ?? "",
					check_out: (r.check_out as string) ?? "",
					Time_duration: (r.Time_duration as number | null) ?? null,
					Working_hours: (r.Working_hours as number | null) ?? null,
					Ot_hours: (r.Ot_hours as number | null) ?? null,
					spell_start_time: (r.spell_start_time as string) ?? "",
					spell_end_time: (r.spell_end_time as string) ?? "",
					spell_hours: (r.spell_hours as number | null) ?? null,
					processed: (r.processed as number | null) ?? null,
					device_name: (r.device_name as string) ?? "",
				}),
			);

			setDailyRows(mapped);
			setTotalRows(data.total || 0);
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : "Error fetching daily attendance";
			setSnackbar({ open: true, message, severity: "error" });
		} finally {
			setLoading(false);
		}
	}, [paginationModel.page, paginationModel.pageSize, searchQuery, getCoId]);

	useEffect(() => {
		if (activeTab === "bio") {
			fetchBioAtt();
		} else {
			fetchDailyAtt();
		}
	}, [activeTab, fetchBioAtt, fetchDailyAtt]);

	// Poll the temp table every 5s — alert the user while staging rows are pending.
	const [tempCount, setTempCount] = useState(0);
	useEffect(() => {
		const co_id = getCoId();
		if (!co_id) return;
		const url = `${apiRoutesPortalMasters.BIO_ATT_TEMP_COUNT}?co_id=${encodeURIComponent(co_id)}`;
		let cancelled = false;
		const tick = async () => {
			const { data } = await fetchWithCookie<{ count: number }>(url, "GET");
			if (cancelled) return;
			const cnt = data?.count ?? 0;
			setTempCount(cnt);
			if (cnt > 0) {
				setSnackbar({
					open: true,
					message: `Staging table has ${cnt} row(s) pending. Click Clear to wipe.`,
					severity: "error",
				});
			}
		};
		void tick();
		const id = window.setInterval(tick, 5000);
		return () => {
			cancelled = true;
			window.clearInterval(id);
		};
	}, [getCoId]);

	const handlePaginationModelChange = (newModel: GridPaginationModel) => {
		setPaginationModel(newModel);
	};

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchQuery(e.target.value);
		setPaginationModel((prev) => ({ ...prev, page: 0 }));
	};

	const handleSnackbarClose = () => {
		setSnackbar((prev) => ({ ...prev, open: false }));
	};

	const handleExcelUploadClick = useCallback(() => setUploadOpen(true), []);
	const handleUploadClose = useCallback(() => setUploadOpen(false), []);
	const handleProcessClick = useCallback(() => setProcessOpen(true), []);
	const handleFinalProcessClick = useCallback(() => setFinalProcessOpen(true), []);
	const handleFinalProcessClose = useCallback(() => setFinalProcessOpen(false), []);
	const handleProcessClose = useCallback(() => setProcessOpen(false), []);
	const handleEtrackClick = useCallback(() => setEtrackOpen(true), []);
	const handleEtrackClose = useCallback(() => setEtrackOpen(false), []);
	const handleEtrackProcessClick = useCallback(() => setEtrackProcessOpen(true), []);
	const handleEtrackProcessClose = useCallback(() => setEtrackProcessOpen(false), []);
	const handleProcessSuccess = useCallback(
		(message: string) => {
			setSnackbar({ open: true, message, severity: "success" });
			if (activeTab === "bio") fetchBioAtt();
			else fetchDailyAtt();
		},
		[activeTab, fetchBioAtt, fetchDailyAtt],
	);

	const handleClearClick = useCallback(async () => {
		const co_id = getCoId();
		if (!co_id) {
			setSnackbar({ open: true, message: "No company selected", severity: "error" });
			return;
		}
		if (!window.confirm("Clear all rows from the staging (temp) table?")) return;
		try {
			const url = `${apiRoutesPortalMasters.BIO_ATT_CLEAR}?co_id=${encodeURIComponent(co_id)}`;
			const { data, error } = await fetchWithCookie<{ deleted: number }>(url, "POST");
			if (error || !data) {
				setSnackbar({ open: true, message: error ?? "Clear failed", severity: "error" });
				return;
			}
			setSnackbar({
				open: true,
				message: `Staging table cleared (${data.deleted} row(s) removed).`,
				severity: "success",
			});
		} catch (e) {
			setSnackbar({
				open: true,
				message: e instanceof Error ? e.message : String(e),
				severity: "error",
			});
		}
	}, [getCoId]);

	const handleSubmitted = useCallback(
		({ jobId, queued }: { jobId: string; queued: number }) => {
			if (pollersRef.current.has(jobId)) return;
			pollersRef.current.add(jobId);

			setSnackbar({
				open: true,
				message: `Upload accepted. Processing ${queued} row(s) in the background…`,
				severity: "success",
			});

			const poll = async () => {
				try {
					while (true) {
						await new Promise((r) => setTimeout(r, 2000));
						const { data: status, error } = await fetchWithCookie<{
							status: string;
							inserted: number;
							duplicates: number;
							invalid: number;
							total: number;
							error?: string;
						}>(apiRoutesPortalMasters.BIO_ATT_EXCEL_STATUS(jobId), "GET");
						if (error || !status) continue;
						if (status.status === "queued" || status.status === "running") continue;
						if (status.status === "completed") {
							setSnackbar({
								open: true,
								message: `Bio attendance upload completed: ${status.inserted} inserted, ${status.duplicates} duplicate(s) ignored, ${status.invalid} invalid.`,
								severity: "success",
							});
							fetchBioAtt();
						} else {
							setSnackbar({
								open: true,
								message: `Background upload failed: ${status.error ?? "unknown error"}`,
								severity: "error",
							});
						}
						break;
					}
				} finally {
					pollersRef.current.delete(jobId);
				}
			};
			void poll();
		},
		[fetchBioAtt],
	);

	const columns = useMemo<GridColDef<BioAttRow>[]>(
		() => [
			{ field: "emp_code", headerName: "Emp Code", flex: 1, minWidth: 110 },
			{ field: "emp_anme", headerName: "Employee Name", flex: 1.5, minWidth: 160 },
			{ field: "bio_id", headerName: "Bio ID", flex: 0.8, minWidth: 90 },
			{ field: "log_date", headerName: "Log Date", flex: 1.4, minWidth: 160 },
			{ field: "department", headerName: "Department", flex: 1, minWidth: 120 },
			{ field: "designation", headerName: "Designation", flex: 1.2, minWidth: 140 },
			{ field: "device_direction", headerName: "Direction", flex: 0.7, minWidth: 90 },
			{ field: "device_name", headerName: "Device", flex: 1.2, minWidth: 140 },
		],
		[],
	);

	const dailyColumns = useMemo<GridColDef<DailyAttRow>[]>(
		() => [
			{ field: "daily_att_proc_id", headerName: "ID", flex: 0.6, minWidth: 80 },
			{ field: "emp_code", headerName: "Emp Code", flex: 0.9, minWidth: 110 },
			{ field: "emp_name", headerName: "Employee Name", flex: 1.4, minWidth: 160 },
			{ field: "department", headerName: "Department", flex: 1, minWidth: 120 },
			{ field: "designation", headerName: "Designation", flex: 1.2, minWidth: 140 },
			{ field: "eb_id", headerName: "Emp ID", flex: 0.7, minWidth: 90 },
			{ field: "bio_id", headerName: "Bio ID", flex: 0.7, minWidth: 90 },
			{ field: "attendance_date", headerName: "Date", flex: 1, minWidth: 110 },
			{ field: "spell_name", headerName: "Spell", flex: 0.6, minWidth: 80 },
			{ field: "attendance_type", headerName: "Type", flex: 0.6, minWidth: 80 },
			{ field: "check_in", headerName: "Check In", flex: 0.9, minWidth: 100 },
			{ field: "check_out", headerName: "Check Out", flex: 0.9, minWidth: 100 },
			{ field: "Time_duration", headerName: "Duration", flex: 0.8, minWidth: 100 },
			{ field: "Working_hours", headerName: "Working Hrs", flex: 0.9, minWidth: 110 },
			{ field: "Ot_hours", headerName: "OT Hrs", flex: 0.7, minWidth: 90 },
			{ field: "device_name", headerName: "Device", flex: 1, minWidth: 120 },
		],
		[],
	);

	const handleTabChange = useCallback((_: React.SyntheticEvent, value: TabKey) => {
		setActiveTab(value);
		setPaginationModel((prev) => ({ ...prev, page: 0 }));
	}, []);

	const tabsContent = (
		<Tabs
			value={activeTab}
			onChange={handleTabChange}
			textColor="primary"
			indicatorColor="primary"
		>
			<Tab value="bio" label="BIO Metric" />
			<Tab value="daily" label="Attendance" />
		</Tabs>
	);

	return (
		<>
			{activeTab === "bio" ? (
				<IndexWrapper
					title="Bio Attendance Updation"
					rows={rows}
					columns={columns}
					rowCount={totalRows}
					paginationModel={paginationModel}
					onPaginationModelChange={handlePaginationModelChange}
					loading={loading}
					showLoadingUntilLoaded
					toolbarContent={tabsContent}
					search={{
						value: searchQuery,
						onChange: handleSearchChange,
						placeholder: "Search by emp code, name, dept, device",
						debounceDelayMs: 500,
					}}
					extraActions={
						<>
							<Button variant="contained" color="success" onClick={handleFinalProcessClick}>
								Final Process
							</Button>
							<Button variant="outlined" color="warning" onClick={handleClearClick}>
								Clear
							</Button>
							<Button variant="outlined" color="info" onClick={handleEtrackClick}>
								Etrack Data
							</Button>
							<Button variant="contained" color="secondary" onClick={handleEtrackProcessClick}>
								Etrack Process
							</Button>
						</>
					}
				>
					<BioAttUploadDialog
						open={uploadOpen}
						onClose={handleUploadClose}
						onSubmitted={handleSubmitted}
					/>
					<BioAttProcessDialog
						open={processOpen}
						onClose={handleProcessClose}
						onSuccess={handleProcessSuccess}
					/>
					<BioAttFinalProcessDialog
						open={finalProcessOpen}
						onClose={handleFinalProcessClose}
						onSuccess={handleProcessSuccess}
					/>
					<BioAttEtrackDialog
						open={etrackOpen}
						onClose={handleEtrackClose}
						onSuccess={handleProcessSuccess}
					/>
					<BioAttEtrackProcessDialog
						open={etrackProcessOpen}
						onClose={handleEtrackProcessClose}
						onSuccess={handleProcessSuccess}
					/>
					<Snackbar
						open={snackbar.open}
						autoHideDuration={4000}
						onClose={handleSnackbarClose}
						anchorOrigin={{ vertical: "top", horizontal: "center" }}
					>
						<Alert
							severity={snackbar.severity}
							onClose={handleSnackbarClose}
							sx={{ width: "100%" }}
						>
							{snackbar.message}
						</Alert>
					</Snackbar>
				</IndexWrapper>
			) : (
				<IndexWrapper
					title="Daily Attendance"
					rows={dailyRows}
					columns={dailyColumns}
					rowCount={totalRows}
					paginationModel={paginationModel}
					onPaginationModelChange={handlePaginationModelChange}
					loading={loading}
					showLoadingUntilLoaded
					toolbarContent={tabsContent}
					search={{
						value: searchQuery,
						onChange: handleSearchChange,
						placeholder: "Search by emp code, name, spell, type, device, date",
						debounceDelayMs: 500,
					}}
				>
					<Snackbar
						open={snackbar.open}
						autoHideDuration={4000}
						onClose={handleSnackbarClose}
						anchorOrigin={{ vertical: "top", horizontal: "center" }}
					>
						<Alert
							severity={snackbar.severity}
							onClose={handleSnackbarClose}
							sx={{ width: "100%" }}
						>
							{snackbar.message}
						</Alert>
					</Snackbar>
				</IndexWrapper>
			)}
		</>
	);
}
