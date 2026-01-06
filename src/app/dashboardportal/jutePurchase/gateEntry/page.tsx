"use client";

import * as React from "react";
import { Alert, Chip, Typography } from "@mui/material";
import type { GridColDef, GridPaginationModel, GridRenderCellParams } from "@mui/x-data-grid";
import { fetchWithCookie } from "@/utils/apiClient2";
import { apiRoutesPortalMasters } from "@/utils/api";
import IndexWrapper from "@/components/ui/IndexWrapper";
import { useRouter } from "next/navigation";

/**
 * @component JuteGateEntryIndexPage
 * @description Index page displaying list of Jute Gate Entries with pagination and search.
 * Columns: Gate Entry ID, Entry Seq No, PO No, Entry Date, Supplier Name, Party Name, Vehicle No, Entry DateTime, Exit DateTime
 */

type JuteGateEntryRow = {
	id: string | number;
	gate_entry_id: number;
	entry_branch_seq: number | null;
	po_no: string;
	entry_date: string;
	supplier_name: string;
	party_name: string;
	vehicle_no: string;
	entry_datetime: string;
	exit_datetime: string;
	status: string;
};

const formatDate = (value?: string | null) => {
	if (!value) return "-";
	const trimmed = value.trim();
	let date: Date | null = null;
	const ymdMatch = trimmed.match(/^([0-9]{4})-([0-9]{2})-([0-9]{2})$/);
	if (ymdMatch) {
		const [, year, month, day] = ymdMatch;
		date = new Date(Number(year), Number(month) - 1, Number(day));
	} else {
		const parsed = new Date(trimmed);
		if (!Number.isNaN(parsed.getTime())) {
			date = parsed;
		}
	}
	if (!date || Number.isNaN(date.getTime())) {
		return trimmed;
	}
	return new Intl.DateTimeFormat("en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	}).format(date);
};

const formatDateTime = (value?: string | null) => {
	if (!value) return "-";
	const trimmed = value.trim();
	const parsed = new Date(trimmed);
	if (Number.isNaN(parsed.getTime())) {
		return trimmed;
	}
	return new Intl.DateTimeFormat("en-GB", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hour12: true,
	}).format(parsed);
};

const getStatusColor = (status: string): "success" | "error" | "warning" | "info" | "default" => {
	const normalized = status?.toLowerCase() ?? "";
	if (normalized.includes("completed") || normalized.includes("closed")) return "success";
	if (normalized.includes("rejected") || normalized.includes("cancelled")) return "error";
	if (normalized.includes("pending") || normalized.includes("in progress")) return "warning";
	if (normalized.includes("draft") || normalized.includes("open")) return "info";
	return "default";
};

export default function JuteGateEntryIndexPage() {
	const router = useRouter();
	const [rows, setRows] = React.useState<JuteGateEntryRow[]>([]);
	const [totalRows, setTotalRows] = React.useState(0);
	const [loading, setLoading] = React.useState(false);
	const [paginationModel, setPaginationModel] = React.useState<GridPaginationModel>({ page: 0, pageSize: 10 });
	const [searchValue, setSearchValue] = React.useState("");
	const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

	const columns = React.useMemo<GridColDef<JuteGateEntryRow>[]>(
		() => [
			{
				field: "gate_entry_id",
				headerName: "Gate Entry ID",
				minWidth: 120,
				renderCell: (params: GridRenderCellParams<JuteGateEntryRow, number>) => (
					<Typography component="span" variant="body2" color="primary" sx={{ fontWeight: 600 }}>
						{params.value ?? "-"}
					</Typography>
				),
			},
			{
				field: "entry_branch_seq",
				headerName: "Entry Seq No",
				minWidth: 120,
				type: "number",
				renderCell: (params: GridRenderCellParams<JuteGateEntryRow, number | null>) => (
					<Typography component="span" variant="body2">
						{params.value ?? "-"}
					</Typography>
				),
			},
			{
				field: "po_no",
				headerName: "PO No",
				minWidth: 130,
				renderCell: (params: GridRenderCellParams<JuteGateEntryRow, string>) => (
					<Typography component="span" variant="body2">
						{params.value || "-"}
					</Typography>
				),
			},
			{
				field: "entry_date",
				headerName: "Entry Date",
				minWidth: 120,
				renderCell: (params: GridRenderCellParams<JuteGateEntryRow, string>) => (
					<Typography component="span" variant="body2">
						{params.value || "-"}
					</Typography>
				),
			},
			{
				field: "supplier_name",
				headerName: "Supplier Name",
				flex: 1,
				minWidth: 150,
			},
			{
				field: "party_name",
				headerName: "Party Name",
				flex: 1,
				minWidth: 150,
			},
			{
				field: "vehicle_no",
				headerName: "Vehicle No",
				minWidth: 120,
				renderCell: (params: GridRenderCellParams<JuteGateEntryRow, string>) => (
					<Typography component="span" variant="body2">
						{params.value || "-"}
					</Typography>
				),
			},
			{
				field: "entry_datetime",
				headerName: "Entry DateTime",
				minWidth: 160,
				renderCell: (params: GridRenderCellParams<JuteGateEntryRow, string>) => (
					<Typography component="span" variant="body2">
						{params.value || "-"}
					</Typography>
				),
			},
			{
				field: "exit_datetime",
				headerName: "Exit DateTime",
				minWidth: 160,
				renderCell: (params: GridRenderCellParams<JuteGateEntryRow, string>) => (
					<Typography component="span" variant="body2">
						{params.value || "-"}
					</Typography>
				),
			},
			{
				field: "status",
				headerName: "Status",
				minWidth: 120,
				renderCell: (params: GridRenderCellParams<JuteGateEntryRow, string>) => (
					<Chip size="small" color={getStatusColor(params.value ?? "")} label={params.value || "Pending"} />
				),
			},
		],
		[]
	);

	const fetchGateEntries = React.useCallback(async () => {
		setLoading(true);
		setErrorMessage(null);

		try {
			let co_id = "";
			try {
				const storedCompany = localStorage.getItem("sidebar_selectedCompany");
				if (storedCompany) {
					const parsed = JSON.parse(storedCompany);
					co_id = parsed?.co_id ? String(parsed.co_id) : "";
				}
			} catch {
				co_id = "";
			}

			const query = new URLSearchParams({
				page: String(paginationModel.page + 1),
				limit: String(paginationModel.pageSize),
			});
			if (co_id) query.set("co_id", co_id);
			const trimmedSearch = searchValue.trim();
			if (trimmedSearch) query.set("search", trimmedSearch);

			const url = `${apiRoutesPortalMasters.JUTE_GATE_ENTRY_TABLE}?${query.toString()}`;
			const { data, error } = await fetchWithCookie(url, "GET");

			if (error) {
				throw new Error(error);
			}

			const rawRows = Array.isArray((data as Record<string, unknown>)?.data)
				? ((data as Record<string, unknown>).data as unknown[])
				: Array.isArray(data)
					? data
					: [];

			const mappedRows: JuteGateEntryRow[] = rawRows.map((row: unknown) => {
				const r = row as Record<string, unknown>;
				const rawInDate = (r.jute_gate_entry_date ?? r.entry_date ?? "") as string;
				const rawInDateTime = (r.in_time ?? r.entry_datetime ?? r.jute_gate_entry_date ?? "") as string;
				const rawOutDateTime = (r.out_time ?? r.exit_datetime ?? r.out_date ?? "") as string;

				return {
					id: (r.jute_gate_entry_id ?? r.id ?? r.gate_entry_id ?? `ge-${Math.random().toString(36).slice(2, 8)}`) as string | number,
					gate_entry_id: (r.jute_gate_entry_id ?? r.gate_entry_id ?? 0) as number,
					entry_branch_seq: (r.entry_branch_seq ?? r.entry_company_seq ?? null) as number | null,
					po_no: (r.po_num ?? r.po_no ?? "") as string,
					entry_date: formatDate(rawInDate as string),
					supplier_name: (r.supplier_name ?? r.jute_supplier_name ?? "") as string,
					party_name: (r.party_name ?? "") as string,
					vehicle_no: (r.vehicle_no ?? "") as string,
					entry_datetime: formatDateTime(rawInDateTime as string),
					exit_datetime: formatDateTime(rawOutDateTime as string),
					status: (r.status ?? r.status_name ?? "Pending") as string,
				};
			});

			setRows(mappedRows);
			const total = Number((data as Record<string, unknown>)?.total ?? mappedRows.length ?? 0);
			setTotalRows(Number.isNaN(total) ? mappedRows.length : total);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to load Jute Gate Entries";
			setErrorMessage(message);
			setRows([]);
			setTotalRows(0);
		} finally {
			setLoading(false);
		}
	}, [paginationModel.page, paginationModel.pageSize, searchValue]);

	React.useEffect(() => {
		fetchGateEntries();
	}, [fetchGateEntries]);

	const handlePaginationModelChange = (model: GridPaginationModel) => {
		setPaginationModel(model);
	};

	const handleSearchChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
		const value = event.target.value;
		setPaginationModel((prev) => ({ ...prev, page: 0 }));
		setSearchValue(value);
	}, []);

	const handleCreateGateEntry = React.useCallback(() => {
		router.push("/dashboardportal/jutePurchase/gateEntry/createGateEntry");
	}, [router]);

	const handleView = React.useCallback(
		(row: JuteGateEntryRow) => {
			const id = row.id ?? row.gate_entry_id;
			if (!id) return;
			router.push(`/dashboardportal/jutePurchase/gateEntry/createGateEntry?mode=view&id=${encodeURIComponent(String(id))}`);
		},
		[router]
	);

	const handleEdit = React.useCallback(
		(row: JuteGateEntryRow) => {
			const id = row.id ?? row.gate_entry_id;
			if (!id) return;
			router.push(`/dashboardportal/jutePurchase/gateEntry/createGateEntry?mode=edit&id=${encodeURIComponent(String(id))}`);
		},
		[router]
	);

	return (
		<IndexWrapper
			title="Jute Gate Entries"
			subtitle="Review existing jute gate entries or create a new one."
			rows={rows}
			columns={columns}
			rowCount={totalRows}
			paginationModel={paginationModel}
			onPaginationModelChange={handlePaginationModelChange}
			loading={loading}
			showLoadingUntilLoaded
			search={{
				value: searchValue,
				onChange: handleSearchChange,
				placeholder: "Search by PO number, supplier, or vehicle no",
				debounceDelayMs: 500,
			}}
			createAction={{ onClick: handleCreateGateEntry, label: "Create Gate Entry" }}
			onView={handleView}
			onEdit={handleEdit}
		>
			{errorMessage ? (
				<Alert severity="error" sx={{ mt: 2 }}>
					{errorMessage}
				</Alert>
			) : null}
		</IndexWrapper>
	);
}
