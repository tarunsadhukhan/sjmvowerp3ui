"use client";

import * as React from "react";
import { Alert, Box, Card, CardContent, Chip, Typography, useMediaQuery, useTheme } from "@mui/material";
import type { GridColDef, GridPaginationModel, GridRenderCellParams } from "@mui/x-data-grid";
import { fetchWithCookie } from "@/utils/apiClient2";
import { apiRoutesPortalMasters } from "@/utils/api";
import IndexWrapper from "@/components/ui/IndexWrapper";
import { useRouter } from "next/navigation";
import { ChevronRight, Clipboard } from "lucide-react";
import useSelectedCompanyCoId from "@/hooks/use-selected-company-coid";

/**
 * @component JuteMaterialInspectionIndexPage
 * @description Mobile-friendly index page for jute material inspection.
 * Shows gate entries where qc_check = 'N' (pending QC).
 * Columns: Gate Entry No, Gate Entry Date, Unit Conversion, Mukam
 * Touch-friendly design optimized for mobile and touch screens.
 */

type MaterialInspectionRow = {
	id: string | number;
	gate_entry_id: number;
	entry_branch_seq: number | null;
	gate_entry_date: string;
	unit_conversion: string;
	mukam: string;
	vehicle_no: string;
	net_weight: number | null;
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

const formatShortDate = (value?: string | null) => {
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
	}).format(date);
};

/**
 * Mobile Card Component for touch-friendly display
 */
function InspectionCard({
	row,
	onEdit,
}: {
	row: MaterialInspectionRow;
	onEdit: (id: number) => void;
}) {
	return (
		<Card
			sx={{
				mb: 1.5,
				cursor: "pointer",
				transition: "all 0.2s ease",
				"&:hover": {
					boxShadow: 4,
					transform: "translateY(-1px)",
				},
				"&:active": {
					transform: "translateY(0)",
					boxShadow: 2,
				},
			}}
			onClick={() => onEdit(row.gate_entry_id)}
		>
			<CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
				<Box display="flex" justifyContent="space-between" alignItems="flex-start">
					<Box flex={1}>
						{/* Gate Entry No - Primary identifier */}
						<Typography
							variant="subtitle1"
							fontWeight={700}
							color="primary"
							sx={{ fontSize: "1.1rem", mb: 0.5 }}
						>
							GE-{row.gate_entry_id}
						</Typography>

						{/* Date and Mukam Row */}
						<Box display="flex" gap={2} mb={1} flexWrap="wrap">
							<Typography variant="body2" color="text.secondary">
								📅 {formatShortDate(row.gate_entry_date)}
							</Typography>
							{row.mukam && (
								<Typography variant="body2" color="text.secondary">
									📍 {row.mukam}
								</Typography>
							)}
						</Box>

						{/* Unit Conversion and Weight */}
						<Box display="flex" gap={2} flexWrap="wrap">
							{row.unit_conversion && (
								<Chip
									label={row.unit_conversion}
									size="small"
									variant="outlined"
									color="info"
									sx={{ height: 24, fontSize: "0.75rem" }}
								/>
							)}
							{row.net_weight != null && row.net_weight > 0 && (
								<Typography variant="body2" color="text.secondary">
									⚖️ {row.net_weight.toLocaleString()} kg
								</Typography>
							)}
						</Box>

						{/* Vehicle No if available */}
						{row.vehicle_no && (
							<Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: "block" }}>
								🚚 {row.vehicle_no}
							</Typography>
						)}
					</Box>

					{/* Action indicator */}
					<Box display="flex" alignItems="center" sx={{ ml: 1 }}>
						<ChevronRight size={24} color="#666" />
					</Box>
				</Box>
			</CardContent>
		</Card>
	);
}

export default function JuteMaterialInspectionIndexPage() {
	const router = useRouter();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));
	const { coId } = useSelectedCompanyCoId();

	const [rows, setRows] = React.useState<MaterialInspectionRow[]>([]);
	const [totalRows, setTotalRows] = React.useState(0);
	const [loading, setLoading] = React.useState(false);
	const [paginationModel, setPaginationModel] = React.useState<GridPaginationModel>({ page: 0, pageSize: 10 });
	const [searchValue, setSearchValue] = React.useState("");
	const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

	// Desktop DataGrid columns
	const columns = React.useMemo<GridColDef<MaterialInspectionRow>[]>(
		() => [
			{
				field: "gate_entry_id",
				headerName: "Gate Entry No",
				minWidth: 140,
				flex: 1,
				renderCell: (params: GridRenderCellParams<MaterialInspectionRow, number>) => (
					<Typography component="span" variant="body2" color="primary" sx={{ fontWeight: 700 }}>
						GE-{params.value ?? "-"}
					</Typography>
				),
			},
			{
				field: "gate_entry_date",
				headerName: "Gate Entry Date",
				minWidth: 140,
				flex: 1,
				renderCell: (params: GridRenderCellParams<MaterialInspectionRow, string>) => (
					<Typography variant="body2">{formatDate(params.value)}</Typography>
				),
			},
			{
				field: "unit_conversion",
				headerName: "Unit Conversion",
				minWidth: 140,
				flex: 1,
				renderCell: (params: GridRenderCellParams<MaterialInspectionRow, string>) => (
					<Chip
						label={params.value || "-"}
						size="small"
						variant="outlined"
						color={params.value ? "info" : "default"}
					/>
				),
			},
			{
				field: "mukam",
				headerName: "Mukam",
				minWidth: 160,
				flex: 1.2,
				renderCell: (params: GridRenderCellParams<MaterialInspectionRow, string>) => (
					<Typography variant="body2">{params.value || "-"}</Typography>
				),
			},
			{
				field: "net_weight",
				headerName: "Net Weight (kg)",
				minWidth: 130,
				flex: 1,
				align: "right",
				headerAlign: "right",
				renderCell: (params: GridRenderCellParams<MaterialInspectionRow, number>) => (
					<Typography variant="body2">
						{params.value != null ? params.value.toLocaleString() : "-"}
					</Typography>
				),
			},
		],
		[],
	);

	const fetchData = React.useCallback(async () => {
		if (!coId) {
			setErrorMessage("Company ID not available");
			return;
		}

		setLoading(true);
		setErrorMessage(null);

		try {
			const params = new URLSearchParams({
				co_id: coId,
				page: String(paginationModel.page + 1),
				limit: String(paginationModel.pageSize),
			});
			if (searchValue.trim()) {
				params.set("search", searchValue.trim());
			}

			const { data, error } = await fetchWithCookie<{
				data: Array<Record<string, unknown>>;
				total: number;
				page: number;
				page_size: number;
			}>(`${apiRoutesPortalMasters.JUTE_MATERIAL_INSPECTION_TABLE}?${params.toString()}`, "GET");

			if (error) {
				setErrorMessage(error);
				setRows([]);
				setTotalRows(0);
				return;
			}

			if (!data) {
				setErrorMessage("No data received from server");
				setRows([]);
				setTotalRows(0);
				return;
			}

			const mapped: MaterialInspectionRow[] = (data.data ?? []).map((row) => ({
				id: row.jute_gate_entry_id as number,
				gate_entry_id: row.jute_gate_entry_id as number,
				entry_branch_seq: row.entry_branch_seq as number | null,
				gate_entry_date: row.jute_gate_entry_date as string,
				unit_conversion: row.unit_conversion as string,
				mukam: row.mukam as string,
				vehicle_no: row.vehicle_no as string,
				net_weight: row.net_weight as number | null,
				status: row.status as string,
			}));

			setRows(mapped);
			setTotalRows(data.total ?? 0);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to fetch data";
			setErrorMessage(message);
			setRows([]);
			setTotalRows(0);
		} finally {
			setLoading(false);
		}
	}, [coId, paginationModel.page, paginationModel.pageSize, searchValue]);

	React.useEffect(() => {
		if (coId) {
			fetchData();
		}
	}, [fetchData, coId]);

	const handleEdit = React.useCallback(
		(gateEntryId: number) => {
			router.push(`/dashboardportal/jutePurchase/materialInspection/edit?id=${gateEntryId}`);
		},
		[router],
	);

	const handleRowClick = React.useCallback(
		(params: { row: MaterialInspectionRow }) => {
			handleEdit(params.row.gate_entry_id);
		},
		[handleEdit],
	);

	const handleSearchChange = React.useCallback((value: string) => {
		setSearchValue(value);
		setPaginationModel((prev) => ({ ...prev, page: 0 }));
	}, []);

	// Mobile view with cards
	if (isMobile) {
		return (
			<Box
				sx={{
					minHeight: "100vh",
					bgcolor: "background.default",
					pb: 2,
				}}
			>
				{/* Header */}
				<Box
					sx={{
						bgcolor: "primary.main",
						color: "primary.contrastText",
						p: 2,
						position: "sticky",
						top: 0,
						zIndex: 10,
					}}
				>
					<Box display="flex" alignItems="center" gap={1} mb={1}>
						<Clipboard size={24} />
						<Typography variant="h6" fontWeight={700}>
							Material Inspection
						</Typography>
					</Box>
					<Typography variant="body2" sx={{ opacity: 0.9 }}>
						{totalRows} entries pending QC
					</Typography>
				</Box>

				{/* Search */}
				<Box sx={{ p: 2, pb: 1 }}>
					<input
						type="search"
						placeholder="Search by Gate Entry, Mukam..."
						value={searchValue}
						onChange={(e) => handleSearchChange(e.target.value)}
						style={{
							width: "100%",
							padding: "12px 16px",
							fontSize: "16px",
							border: "1px solid #ddd",
							borderRadius: "8px",
							outline: "none",
						}}
					/>
				</Box>

				{/* Error */}
				{errorMessage && (
					<Box sx={{ px: 2 }}>
						<Alert severity="error" sx={{ mb: 2 }}>
							{errorMessage}
						</Alert>
					</Box>
				)}

				{/* Loading */}
				{loading && (
					<Box sx={{ p: 2, textAlign: "center" }}>
						<Typography color="text.secondary">Loading...</Typography>
					</Box>
				)}

				{/* Cards List */}
				{!loading && rows.length > 0 && (
					<Box sx={{ px: 2 }}>
						{rows.map((row) => (
							<InspectionCard key={row.id} row={row} onEdit={handleEdit} />
						))}
					</Box>
				)}

				{/* Empty state */}
				{!loading && rows.length === 0 && !errorMessage && (
					<Box sx={{ p: 4, textAlign: "center" }}>
						<Typography color="text.secondary" sx={{ mb: 1 }}>
							No entries pending inspection
						</Typography>
						<Typography variant="body2" color="text.disabled">
							All gate entries have been inspected
						</Typography>
					</Box>
				)}

				{/* Pagination info for mobile */}
				{!loading && totalRows > 0 && (
					<Box sx={{ p: 2, textAlign: "center" }}>
						<Typography variant="body2" color="text.secondary">
							Showing {rows.length} of {totalRows} entries
						</Typography>
						{totalRows > paginationModel.pageSize && (
							<Box display="flex" justifyContent="center" gap={2} mt={2}>
								<button
									type="button"
									onClick={() =>
										setPaginationModel((prev) => ({ ...prev, page: Math.max(0, prev.page - 1) }))
									}
									disabled={paginationModel.page === 0}
									style={{
										padding: "10px 24px",
										fontSize: "16px",
										border: "1px solid #ddd",
										borderRadius: "8px",
										background: paginationModel.page === 0 ? "#f5f5f5" : "#fff",
										cursor: paginationModel.page === 0 ? "not-allowed" : "pointer",
									}}
								>
									Previous
								</button>
								<button
									type="button"
									onClick={() => setPaginationModel((prev) => ({ ...prev, page: prev.page + 1 }))}
									disabled={(paginationModel.page + 1) * paginationModel.pageSize >= totalRows}
									style={{
										padding: "10px 24px",
										fontSize: "16px",
										border: "1px solid #ddd",
										borderRadius: "8px",
										background:
											(paginationModel.page + 1) * paginationModel.pageSize >= totalRows
												? "#f5f5f5"
												: "#fff",
										cursor:
											(paginationModel.page + 1) * paginationModel.pageSize >= totalRows
												? "not-allowed"
												: "pointer",
									}}
								>
									Next
								</button>
							</Box>
						)}
					</Box>
				)}
			</Box>
		);
	}

	// Search config for IndexWrapper
	const searchConfig = React.useMemo(
		() => ({
			value: searchValue,
			onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleSearchChange(e.target.value),
			placeholder: "Search by Gate Entry, Mukam...",
			debounceDelayMs: 500,
		}),
		[searchValue, handleSearchChange],
	);

	// Desktop view with DataGrid
	return (
		<>
			{errorMessage && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{errorMessage}
				</Alert>
			)}
			<IndexWrapper<MaterialInspectionRow>
				title="Material Inspection"
				subtitle="Gate entries pending QC inspection"
				rows={rows}
				columns={columns}
				rowCount={totalRows}
				loading={loading}
				paginationModel={paginationModel}
				onPaginationModelChange={setPaginationModel}
				search={searchConfig}
				onEdit={(row) => handleEdit(row.gate_entry_id)}
			/>
		</>
	);
}
