"use client";

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Alert, Paper } from "@mui/material";
import { ArrowLeft } from "lucide-react";
import TransactionWrapper from "@/components/ui/TransactionWrapper";
import type { TransactionAction } from "@/components/ui/TransactionWrapper";
import {
	buildApprovalTransactionActions,
	useRejectDialog,
	useUnsavedChanges,
	AutoResizeTextarea,
} from "@/components/ui/transaction";
import { fetchWithCookie } from "@/utils/apiClient2";
import { apiRoutesPortalMasters } from "@/utils/api";
import useSelectedCompanyCoId from "@/hooks/use-selected-company-coid";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogFooter,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import type { SRHeader, SRLineItem, SRHeaderRaw, SRLineItemRaw, WarehouseOption, AdditionalChargeOption, SRAdditionalChargeRaw } from "./types/srTypes";
import { mapSRHeader, mapSRLineItems } from "./utils/srMappers";
import { calculateTotals } from "./utils/srCalculations";
import { getStatusColor } from "./utils/srConstants";
import { useSRFormState } from "./hooks/useSRFormState";
import { useSRLineItems } from "./hooks/useSRLineItems";
import { useSRApproval } from "./hooks/useSRApproval";
import { useSRAdditionalCharges } from "./hooks/useSRAdditionalCharges";
import { SRHeaderForm } from "./components/SRHeaderForm";
import { useSRLineItemColumns } from "./components/SRLineItemsTable";
import { SRTotalsDisplay } from "./components/SRTotalsDisplay";
import { SRPreview } from "./components/SRPreview";
import { SRAdditionalCharges } from "./components/SRAdditionalCharges";

// Loading fallback for Suspense
function SRPageLoading() {
	return (
		<div className="flex items-center justify-center min-h-100">
			<div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
		</div>
	);
}

export default function SRTransactionPage() {
	return (
		<Suspense fallback={<SRPageLoading />}>
			<SRTransactionPageContent />
		</Suspense>
	);
}

function SRTransactionPageContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const inwardId = searchParams?.get("id") || "";
	const modeParam = searchParams?.get("mode") || "edit";
	const isViewMode = modeParam === "view";
	const { coId } = useSelectedCompanyCoId();

	// State
	const [header, setHeader] = React.useState<SRHeader | null>(null);
	const [loading, setLoading] = React.useState(true);
	const [pageError, setPageError] = React.useState<string | null>(null);
	const [warehouseOptions, setWarehouseOptions] = React.useState<WarehouseOption[]>([]);
	const [additionalChargeOptions, setAdditionalChargeOptions] = React.useState<AdditionalChargeOption[]>([]);

	// Form state hook
	const { srDate, setSRDate, srRemarks, setSRRemarks, resetFormState } = useSRFormState();

	// Line items hook
	const { lineItems, setLineItems, handleLineItemChange } = useSRLineItems({ header });

	// Additional charges hook
	const mode = isViewMode ? "view" : "edit";
	const {
		charges: additionalCharges,
		addCharge,
		removeCharge,
		updateCharge,
		replaceCharges,
		mapRawToCharges,
		getChargesToSave,
		totalChargesAmount,
		chargesTotals,
	} = useSRAdditionalCharges({ mode, header });

	// Unsaved changes tracking
	const getComparableLineData = React.useCallback(
		(item: SRLineItem) => ({
			accepted_rate: item.accepted_rate,
			discount_mode: item.discount_mode,
			discount_value: item.discount_value,
			warehouse_id: item.warehouse_id,
			hsn_code: item.hsn_code,
		}),
		[],
	);

	const { hasUnsavedChanges, resetBaseline, setBaseline } = useUnsavedChanges({
		formValues: { srDate, srRemarks },
		lineItems,
		getComparableLineData,
		enabled: !isViewMode,
	});

	// Fetch SR data
	const fetchSRData = React.useCallback(async () => {
		if (!inwardId) {
			setPageError("No inward ID provided");
			setLoading(false);
			return;
		}

		setLoading(true);
		setPageError(null);

		try {
			const query = new URLSearchParams();
			if (coId) query.set("co_id", String(coId));

			const url = `${apiRoutesPortalMasters.SR_GET_BY_INWARD_ID}/${inwardId}?${query.toString()}`;
			const { data, error } = await fetchWithCookie(url, "GET");

			if (error) {
				throw new Error(error);
			}

			const result = data as {
				header?: SRHeaderRaw;
				line_items?: SRLineItemRaw[];
				warehouses?: Array<{ warehouse_id: number; warehouse_name: string; warehouse_path?: string; branch_id?: number }>;
				additional_charges_options?: AdditionalChargeOption[];
				additional_charges?: SRAdditionalChargeRaw[];
			};

			// Map header
			const mappedHeader = mapSRHeader(result.header);
			setHeader(mappedHeader);

			// Reset form state with header values
			resetFormState(mappedHeader);

			// Map line items
			const mappedItems = mapSRLineItems(result.line_items, mappedHeader);
			setLineItems(mappedItems);

			// Set baseline for unsaved changes tracking
			setBaseline(
				{ srDate: mappedHeader.sr_date, srRemarks: mappedHeader.sr_remarks },
				mappedItems,
			);

			// Map warehouse options (filter by branch if needed, dedupe by warehouse_id)
			const warehouseData = result.warehouses ?? [];
			const branchId = mappedHeader.branch_id;
			const filteredWarehouses = branchId
				? warehouseData.filter((wh) => !wh.branch_id || wh.branch_id === branchId)
				: warehouseData;

			// Dedupe by warehouse_id to avoid duplicate key errors
			const seenIds = new Set<string>();
			const uniqueWarehouses = filteredWarehouses.filter((wh) => {
				const id = String(wh.warehouse_id);
				if (seenIds.has(id)) return false;
				seenIds.add(id);
				return true;
			});

			const mappedWarehouses: WarehouseOption[] = uniqueWarehouses.map((wh) => ({
				label: wh.warehouse_path || wh.warehouse_name,
				value: String(wh.warehouse_id),
				branchId: wh.branch_id,
			}));

			// Ensure any warehouse referenced by line items is included in options
			const warehouseValueSet = new Set(mappedWarehouses.map((w) => w.value));
			for (const li of mappedItems) {
				if (li.warehouse_id && !warehouseValueSet.has(String(li.warehouse_id))) {
					mappedWarehouses.push({
						label: li.warehouse_path || li.warehouse_name || `Warehouse ${li.warehouse_id}`,
						value: String(li.warehouse_id),
					});
					warehouseValueSet.add(String(li.warehouse_id));
				}
			}

			setWarehouseOptions(mappedWarehouses);

			// Map additional charge options
			setAdditionalChargeOptions(result.additional_charges_options ?? []);

			// Map existing additional charges
			if (result.additional_charges && result.additional_charges.length > 0) {
				const mappedCharges = mapRawToCharges(result.additional_charges);
				replaceCharges(mappedCharges);
			}
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to load SR data";
			setPageError(message);
		} finally {
			setLoading(false);
		}
	}, [inwardId, coId, resetFormState, setLineItems, setBaseline, mapRawToCharges, replaceCharges]);

	// Initial fetch
	React.useEffect(() => {
		fetchSRData();
	}, [fetchSRData]);

	// Approval hook
	const {
		saving,
		canEdit,
		approvalInfo,
		approvalPermissions,
		handleSave,
		handleOpen,
		handleApprove,
		handleReject,
	} = useSRApproval({
		inwardId,
		header,
		srDate,
		srRemarks,
		lineItems,
		additionalCharges,
		getChargesToSave,
		onRefresh: fetchSRData,
	});

	// Reject dialog
	const {
		rejectDialogOpen,
		rejectReason,
		setRejectReason,
		openRejectDialog,
		handleRejectConfirm,
		handleRejectCancel,
	} = useRejectDialog(handleReject);

	// Reset baseline when header changes (after approval actions refresh data)
	React.useEffect(() => {
		if (!header) return;
		const timer = setTimeout(() => resetBaseline(), 0);
		return () => clearTimeout(timer);
	}, [header, resetBaseline]);

	// Column definitions
	const columns = useSRLineItemColumns({
		canEdit: canEdit && !isViewMode,
		onLineItemChange: handleLineItemChange,
		warehouseOptions,
	});

	// Calculate totals
	const totals = React.useMemo(() => calculateTotals(lineItems), [lineItems]);

	// Navigation
	const handleBack = React.useCallback(() => {
		router.push("/dashboardportal/procurement/sr");
	}, [router]);

	// Unified primary actions: Save Changes OR Approval buttons (never both)
	const primaryActions = React.useMemo<TransactionAction[] | undefined>(() => {
		if (pageError || !header) return undefined;

		// Edit mode with unsaved changes -> Save button only
		if (!isViewMode && canEdit && hasUnsavedChanges) {
			return [{
				label: "Save Changes",
				onClick: handleSave,
				disabled: saving,
				loading: saving,
			}];
		}

		// View mode, or edit mode without unsaved changes -> Approval buttons
		const approvalActions = buildApprovalTransactionActions({
			approvalInfo,
			permissions: approvalPermissions,
			handlers: {
				onOpen: handleOpen,
				onApprove: handleApprove,
				onReject: openRejectDialog,
			},
			loading: saving,
			disabled: saving || loading,
		});

		return approvalActions.length ? approvalActions : undefined;
	}, [
		pageError, header, isViewMode, canEdit, hasUnsavedChanges, saving, loading,
		approvalInfo, approvalPermissions, handleSave, handleOpen, handleApprove, openRejectDialog,
	]);

	// Error state
	if (pageError && !loading) {
		return (
			<Box sx={{ p: 3 }}>
				<Alert severity="error" sx={{ mb: 2 }}>
					{pageError}
				</Alert>
				<button
					type="button"
					className="inline-flex items-center gap-2 text-sm"
					onClick={handleBack}
				>
					<ArrowLeft size={16} />
					Back to List
				</button>
			</Box>
		);
	}

	return (
		<>
			<TransactionWrapper
				title="Stores Receipt"
				subtitle="Enter accepted rates and approve stores receipt"
				statusChip={
					header
						? {
								label: header.sr_no ? `SR: ${header.sr_no} - ${header.sr_status_name}` : header.sr_status_name || "Pending",
								color: getStatusColor(header.sr_status || 0),
							}
						: undefined
				}
				backAction={{
					label: "Back to List",
					onClick: handleBack,
				}}
				loading={loading}
				primaryActions={primaryActions}
				lineItems={{
					title: "Line Items",
					subtitle: "Items from inspected GRN",
					items: lineItems,
					getItemId: (item: SRLineItem) => item.id,
					canEdit: canEdit && !isViewMode,
					columns,
					selectable: false,
				}}
				footer={
					<Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
						<SRAdditionalCharges
							charges={additionalCharges}
							options={additionalChargeOptions}
							canEdit={canEdit && !isViewMode}
							onAddCharge={addCharge}
							onRemoveCharge={removeCharge}
							onChargeChange={updateCharge}
						/>
						<SRTotalsDisplay totals={totals} chargesTotals={chargesTotals} />
					</Box>
				}
				preview={
					<SRPreview
						header={header}
						lineItems={lineItems}
						totals={totals}
						srDate={srDate}
						srRemarks={srRemarks}
					/>
				}
			>
				<Paper variant="outlined" sx={{ p: 3 }}>
					<SRHeaderForm
						header={header}
						srDate={srDate}
						onSRDateChange={setSRDate}
						srRemarks={srRemarks}
						onSRRemarksChange={setSRRemarks}
						canEdit={canEdit && !isViewMode}
					/>
				</Paper>
			</TransactionWrapper>

			{/* Reject dialog */}
			<Dialog open={rejectDialogOpen} onOpenChange={(open) => { if (!open) handleRejectCancel(); }}>
				<DialogContent className="sm:max-w-125">
					<DialogHeader>
						<DialogTitle>Reject SR</DialogTitle>
						<DialogDescription>Please provide a reason for rejecting this Stores Receipt.</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div className="space-y-2">
							<label htmlFor="reject-reason" className="text-sm font-medium leading-none">
								Rejection Reason *
							</label>
							<AutoResizeTextarea
								id="reject-reason"
								placeholder="Enter rejection reason..."
								value={rejectReason}
								onChange={(e) => setRejectReason(e.target.value)}
								className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
								minHeight={80}
								maxHeight={200}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={handleRejectCancel}>Cancel</Button>
						<Button variant="destructive" onClick={handleRejectConfirm} disabled={!rejectReason.trim()}>Reject</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
}
