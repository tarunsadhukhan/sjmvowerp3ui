"use client";

import * as React from "react";
import { Alert, Chip, Typography } from "@mui/material";
import type { GridColDef, GridPaginationModel, GridRenderCellParams } from "@mui/x-data-grid";
import { fetchWithCookie } from "@/utils/apiClient2";
import { apiRoutesPortalMasters } from "@/utils/api";
import IndexWrapper from "@/components/ui/IndexWrapper";
import { useRouter } from "next/navigation";
import useSelectedCompanyCoId from "@/hooks/use-selected-company-coid";

/**
 * @component JuteIssueIndexPage
 * @description Index page displaying list of Jute Issue records with pagination and search.
 * Jute Issue tracks yarn issued against MR line items.
 */

type JuteIssueRow = {
	id: string | number;
	issue_id: number | null;
	issue_date: string;
	issue_date_raw?: string;
	branch_name: string;
	yarn_type_name: string | null;
	jute_quality: string | null;
	mr_no: number | null;
	quantity: number | null;
	weight: number | null;
	issue_value: number | null;
	status: string;
};

const formatDate = (value?: string) => {
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

const getStatusColor = (status: string): "success" | "error" | "warning" | "info" | "default" => {
	const normalized = status?.toLowerCase() ?? "";
	if (normalized.includes("approved") || normalized.includes("closed")) return "success";
	if (normalized.includes("rejected") || normalized.includes("cancelled")) return "error";
	if (normalized.includes("pending") || normalized.includes("open")) return "warning";
	if (normalized.includes("draft")) return "info";
	return "default";
};

export default function JuteIssueIndexPage() {
	const router = useRouter();
	const { coId } = useSelectedCompanyCoId();
	const [rows, setRows] = React.useState<JuteIssueRow[]>([]);
	const [totalRows, setTotalRows] = React.useState(0);
	const [loading, setLoading] = React.useState(false);
	const [paginationModel, setPaginationModel] = React.useState<GridPaginationModel>({ page: 0, pageSize: 10 });
	const [searchValue, setSearchValue] = React.useState("");
	const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

	const columns = React.useMemo<GridColDef<JuteIssueRow>[]>(
		() => [
			{
				field: "issue_id",
				headerName: "Issue No",
				flex: 0.7,
				minWidth: 100,
				renderCell: (params: GridRenderCellParams<JuteIssueRow, number | null>) => (
					<Typography component="span" variant="body2" color="primary" sx={{ fontWeight: 600 }}>
						{params.value ?? "-"}
					</Typography>
				),
			},
			{
				field: "issue_date",
				headerName: "Issue Date",
				minWidth: 120,
				renderCell: (params: GridRenderCellParams<JuteIssueRow, string>) => (
					<Typography component="span" variant="body2">
						{params.value || formatDate(params.row.issue_date_raw) || "-"}
					</Typography>
				),
			},
			{
				field: "branch_name",
				headerName: "Branch",
				flex: 1,
				minWidth: 120,
			},
			{
				field: "yarn_type_name",
				headerName: "Yarn Type",
				flex: 1.2,
				minWidth: 140,
				renderCell: (params: GridRenderCellParams<JuteIssueRow, string | null>) => (
					<Typography component="span" variant="body2">
						{params.value || "-"}
					</Typography>
				),
			},
			{
				field: "jute_quality",
				headerName: "Quality",
				flex: 1,
				minWidth: 120,
				renderCell: (params: GridRenderCellParams<JuteIssueRow, string | null>) => (
					<Typography component="span" variant="body2">
						{params.value || "-"}
					</Typography>
				),
			},
			{
				field: "mr_no",
				headerName: "MR No",
				minWidth: 100,
				renderCell: (params: GridRenderCellParams<JuteIssueRow, number | null>) => (
					<Typography component="span" variant="body2">
						{params.value ?? "-"}
					</Typography>
				),
			},
			{
				field: "quantity",
				headerName: "Quantity",
				minWidth: 100,
				type: "number",
				align: "right",
				headerAlign: "right",
				renderCell: (params: GridRenderCellParams<JuteIssueRow, number | null>) => (
					<Typography component="span" variant="body2">
						{params.value != null ? params.value.toFixed(2) : "-"}
					</Typography>
				),
			},
			{
				field: "weight",
				headerName: "Weight (kg)",
				minWidth: 110,
				type: "number",
				align: "right",
				headerAlign: "right",
				renderCell: (params: GridRenderCellParams<JuteIssueRow, number | null>) => (
					<Typography component="span" variant="body2">
						{params.value != null ? params.value.toFixed(2) : "-"}
					</Typography>
				),
			},
			{
				field: "issue_value",
				headerName: "Value",
				minWidth: 110,
				type: "number",
				align: "right",
				headerAlign: "right",
				renderCell: (params: GridRenderCellParams<JuteIssueRow, number | null>) => (
					<Typography component="span" variant="body2">
						{params.value != null ? `₹${params.value.toFixed(2)}` : "-"}
					</Typography>
				),
			},
			{
				field: "status",
				headerName: "Status",
				minWidth: 120,
				renderCell: (params: GridRenderCellParams<JuteIssueRow, string>) => (
					<Chip size="small" color={getStatusColor(params.value ?? "")} label={params.value || "Draft"} />
				),
			},
		],
		[]
	);

	const fetchJuteIssues = React.useCallback(async () => {
		if (!coId) {
			setErrorMessage("Company ID not available");
			return;
		}

		setLoading(true);
		setErrorMessage(null);

		try {
			const query = new URLSearchParams({
				co_id: coId,
				page: String(paginationModel.page + 1),
				limit: String(paginationModel.pageSize),
			});
			const trimmedSearch = searchValue.trim();
			if (trimmedSearch) query.set("search", trimmedSearch);

			const url = `${apiRoutesPortalMasters.JUTE_ISSUE_TABLE}?${query.toString()}`;
			const { data, error } = await fetchWithCookie(url, "GET");

			if (error) {
				throw new Error(error);
			}

			const response = data as {
				data?: Array<Record<string, unknown>>;
				total?: number;
			};

			const rawRows = Array.isArray(response?.data) ? response.data : [];

			const mappedRows: JuteIssueRow[] = rawRows.map((r: Record<string, unknown>) => {
				const rawDate = (r.issue_date ?? "") as string;
				const normalizedRaw = typeof rawDate === "string" ? rawDate : rawDate ? String(rawDate) : "";

				return {
					id: (r.jute_issue_id ?? `jute-issue-${Math.random().toString(36).slice(2, 8)}`) as string | number,
					issue_id: (r.jute_issue_id ?? null) as number | null,
					issue_date_raw: normalizedRaw,
					issue_date: formatDate(normalizedRaw),
					branch_name: (r.branch_name ?? "") as string,
					yarn_type_name: (r.yarn_type_name ?? null) as string | null,
					jute_quality: (r.jute_quality ?? null) as string | null,
					mr_no: (r.mr_no ?? null) as number | null,
					quantity: (r.quantity ?? null) as number | null,
					weight: (r.weight ?? null) as number | null,
					issue_value: (r.issue_value ?? null) as number | null,
					status: (r.status ?? "Draft") as string,
				};
			});

			setRows(mappedRows);
			const total = Number(response?.total ?? mappedRows.length ?? 0);
			setTotalRows(Number.isNaN(total) ? mappedRows.length : total);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to load Jute Issues";
			setErrorMessage(message);
			setRows([]);
			setTotalRows(0);
		} finally {
			setLoading(false);
		}
	}, [coId, paginationModel.page, paginationModel.pageSize, searchValue]);

	React.useEffect(() => {
		if (coId) {
			fetchJuteIssues();
		}
	}, [fetchJuteIssues, coId]);

	const handlePaginationModelChange = (model: GridPaginationModel) => {
		setPaginationModel(model);
	};

	const handleSearchChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
		const value = event.target.value;
		setPaginationModel((prev) => ({ ...prev, page: 0 }));
		setSearchValue(value);
	}, []);

	const handleView = React.useCallback(
		(row: JuteIssueRow) => {
			const id = row.id;
			if (!id) return;
			router.push(`/dashboardportal/jutePurchase/juteIssue/edit?mode=view&id=${encodeURIComponent(String(id))}`);
		},
		[router]
	);

	const handleEdit = React.useCallback(
		(row: JuteIssueRow) => {
			const id = row.id;
			if (!id) return;
			router.push(`/dashboardportal/jutePurchase/juteIssue/edit?mode=edit&id=${encodeURIComponent(String(id))}`);
		},
		[router]
	);

	const handleCreate = React.useCallback(() => {
		router.push("/dashboardportal/jutePurchase/juteIssue/create");
	}, [router]);

	return (
		<IndexWrapper
			title="Jute Issue"
			subtitle="Review and manage jute issues against yarn types."
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
				placeholder: "Search by issue number, yarn type, quality, or branch",
				debounceDelayMs: 500,
			}}
			onView={handleView}
			onEdit={handleEdit}
			createAction={{
				label: "New Issue",
				onClick: handleCreate,
			}}
		>
			{errorMessage ? (
				<Alert severity="error" sx={{ mt: 2 }}>
					{errorMessage}
				</Alert>
			) : null}
		</IndexWrapper>
	);
}
