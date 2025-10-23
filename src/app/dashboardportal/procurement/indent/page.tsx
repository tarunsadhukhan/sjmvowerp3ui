"use client";

import * as React from "react";
import Link from "next/link";
import { Box, Chip, Stack, TextField, Typography } from "@mui/material";
import { Button } from "@/components/ui/button";
import MuiDataGrid from "@/components/ui/muiDataGrid";
import type { GridColDef, GridPaginationModel, GridRenderCellParams } from "@mui/x-data-grid";
import { fetchWithCookie } from "@/utils/apiClient2";
import { apiRoutesPortalMasters } from "@/utils/api";

type IndentRow = {
	id: string | number;
	indent_no: string;
	indent_date: string;
	branch_name: string;
	expense_type: string;
	status: string;
	raised_by?: string;
};

const initialPagination: GridPaginationModel = {
	page: 0,
	pageSize: 10,
};

const formatDate = (value?: string) => {
	if (!value) return "-";
	const date = new Date(value);
	return Number.isNaN(date.getTime())
		? value
		: new Intl.DateTimeFormat("en-GB", {
				day: "2-digit",
				month: "short",
				year: "numeric",
			}).format(date);
};

export default function ProcurementIndentIndexPage() {
	const [rows, setRows] = React.useState<IndentRow[]>([]);
	const [totalRows, setTotalRows] = React.useState(0);
	const [loading, setLoading] = React.useState(false);
	const [paginationModel, setPaginationModel] = React.useState<GridPaginationModel>(initialPagination);
	const [searchValue, setSearchValue] = React.useState("");
	const searchTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
	const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

	const columns = React.useMemo<GridColDef[]>(() => [
		{
			field: "indent_no",
			headerName: "Indent No.",
			flex: 1,
			minWidth: 140,
			headerClassName: "bg-[#3ea6da] text-white",
					renderCell: (params: GridRenderCellParams<IndentRow, string>) => (
				<Typography component="span" variant="body2" color="primary" sx={{ fontWeight: 600 }}>
					{params.value || "-"}
				</Typography>
			),
		},
		{
			field: "indent_date",
			headerName: "Indent Date",
			minWidth: 140,
			valueGetter: ({ value }) => formatDate(typeof value === "string" ? value : ""),
			valueFormatter: ({ value }) => value,
			headerClassName: "bg-[#3ea6da] text-white",
		},
		{
			field: "branch_name",
			headerName: "Branch",
			flex: 1,
			minWidth: 160,
			headerClassName: "bg-[#3ea6da] text-white",
		},
		{
			field: "expense_type",
			headerName: "Expense Type",
			flex: 1,
			minWidth: 160,
			headerClassName: "bg-[#3ea6da] text-white",
		},
		{
			field: "status",
			headerName: "Status",
			minWidth: 130,
			headerClassName: "bg-[#3ea6da] text-white",
					renderCell: (params: GridRenderCellParams<IndentRow, string>) => (
				<Chip size="small" color={params.value === "Approved" ? "success" : params.value === "Rejected" ? "error" : "default"} label={params.value || "Pending"} />
			),
		},
		{
			field: "raised_by",
			headerName: "Raised By",
			flex: 1,
			minWidth: 150,
			headerClassName: "bg-[#3ea6da] text-white",
			valueGetter: ({ value }) => value || "-",
		},
	], []);

	const fetchIndents = React.useCallback(async () => {
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
			if (searchValue.trim()) query.set("search", searchValue.trim());

			const url = `${apiRoutesPortalMasters.INDENT_TABLE}?${query.toString()}`;
			const { data, error } = await fetchWithCookie(url, "GET");

			if (error) {
				throw new Error(error);
			}

			const rawRows = Array.isArray((data as any)?.data) ? (data as any).data : Array.isArray(data) ? data : [];
			const mappedRows: IndentRow[] = rawRows.map((row: any) => ({
				id: row.indent_id ?? row.id ?? row.indentId ?? `${row.indent_no ?? "indent"}-${Math.random().toString(36).slice(2, 8)}`,
				indent_no: row.indent_no ?? row.indentNo ?? "",
				indent_date: row.indent_date ?? row.indentDate ?? row.created_at ?? "",
				branch_name: row.branch_name ?? row.branchName ?? row.branch ?? "",
				expense_type: row.expense_type ?? row.expenseType ?? row.expense_type_name ?? "",
				status: row.status ?? row.status_name ?? row.current_status ?? "Pending",
				raised_by: row.raised_by ?? row.created_by ?? row.createdBy ?? "",
			}));

			setRows(mappedRows);
			const total = Number((data as any)?.total ?? mappedRows.length ?? 0);
			setTotalRows(Number.isNaN(total) ? mappedRows.length : total);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to load indents";
			setErrorMessage(message);
			setRows([]);
			setTotalRows(0);
		} finally {
			setLoading(false);
		}
	}, [paginationModel.page, paginationModel.pageSize, searchValue]);

	React.useEffect(() => {
		fetchIndents();
	}, [fetchIndents]);

	React.useEffect(() => {
		return () => {
			if (searchTimeoutRef.current) {
				clearTimeout(searchTimeoutRef.current);
			}
		};
	}, []);

	const handlePaginationModelChange = (model: GridPaginationModel) => {
		setPaginationModel(model);
	};

	const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const value = event.target.value;
		if (searchTimeoutRef.current) {
			clearTimeout(searchTimeoutRef.current);
		}
		searchTimeoutRef.current = setTimeout(() => {
			setPaginationModel((prev) => ({ ...prev, page: 0 }));
			setSearchValue(value);
		}, 400);
	};

	return (
		<div className="min-h-screen bg-gray-50 p-8">
			<div className="mx-auto max-w-7xl">
				<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
					<div>
						<Typography variant="h5" sx={{ fontWeight: 600, color: "#0C3C60" }}>
							Procurement Indents
						</Typography>
						<Typography variant="body2" color="text.secondary">
							Review existing indents or raise a new one.
						</Typography>
					</div>
					<Button asChild className="btn-primary">
						<Link href="/dashboardportal/procurement/indent/createIndent">+ Create Indent</Link>
					</Button>
				</Stack>

				<Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }} alignItems={{ xs: "stretch", sm: "center" }}>
					<TextField
						placeholder="Search by indent no., branch, or expense type"
						size="small"
						fullWidth
						sx={{ maxWidth: 360 }}
						onChange={handleSearchChange}
					/>
					{errorMessage && (
						<Typography variant="body2" color="error">
							{errorMessage}
						</Typography>
					)}
				</Stack>

				<MuiDataGrid
					rows={rows}
					columns={columns}
					rowCount={totalRows}
					paginationModel={paginationModel}
					onPaginationModelChange={handlePaginationModelChange}
					loading={loading}
					showLoadingUntilLoaded
				/>
			</div>
		</div>
	);
}
