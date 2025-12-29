"use client";

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Alert, Paper, CircularProgress } from "@mui/material";
import { ArrowLeft } from "lucide-react";
import TransactionWrapper from "@/components/ui/TransactionWrapper";
import { fetchWithCookie } from "@/utils/apiClient2";
import { apiRoutesPortalMasters } from "@/utils/api";
import useSelectedCompanyCoId from "@/hooks/use-selected-company-coid";

import type { SRHeader, SRLineItem, SRHeaderRaw, SRLineItemRaw } from "./types/srTypes";
import { mapSRHeader, mapSRLineItems } from "./utils/srMappers";
import { calculateTotals } from "./utils/srCalculations";
import { getStatusColor } from "./utils/srConstants";
import { useSRFormState } from "./hooks/useSRFormState";
import { useSRLineItems } from "./hooks/useSRLineItems";
import { useSRApproval } from "./hooks/useSRApproval";
import { SRHeaderForm } from "./components/SRHeaderForm";
import { useSRLineItemColumns } from "./components/SRLineItemsTable";
import { SRTotalsDisplay } from "./components/SRTotalsDisplay";
import { SRPreview } from "./components/SRPreview";

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

	// Form state hook
	const { srDate, setSRDate, srRemarks, setSRRemarks, resetFormState } = useSRFormState();

	// Line items hook
	const { lineItems, setLineItems, handleLineItemChange } = useSRLineItems({ header });

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

			const result = data as { header?: SRHeaderRaw; line_items?: SRLineItemRaw[] };

			// Map header
			const mappedHeader = mapSRHeader(result.header);
			setHeader(mappedHeader);

			// Reset form state with header values
			resetFormState(mappedHeader);

			// Map line items
			const mappedItems = mapSRLineItems(result.line_items, mappedHeader);
			setLineItems(mappedItems);
		} catch (err) {
			const message = err instanceof Error ? err.message : "Failed to load SR data";
			setPageError(message);
		} finally {
			setLoading(false);
		}
	}, [inwardId, coId, resetFormState, setLineItems]);

	// Initial fetch
	React.useEffect(() => {
		fetchSRData();
	}, [fetchSRData]);

	// Approval hook
	const {
		saving,
		canEdit,
		isDraft,
		isOpen,
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
		onRefresh: fetchSRData,
	});

	// Column definitions
	const columns = useSRLineItemColumns({
		canEdit: canEdit && !isViewMode,
		onLineItemChange: handleLineItemChange,
	});

	// Calculate totals
	const totals = React.useMemo(() => calculateTotals(lineItems), [lineItems]);

	// Navigation
	const handleBack = React.useCallback(() => {
		router.push("/dashboardportal/procurement/sr");
	}, [router]);

	// Build actions for TransactionWrapper
	const primaryActions = React.useMemo(() => {
		const actions = [];

		if (canEdit && !isViewMode && isDraft) {
			actions.push({
				label: "Save Draft",
				onClick: handleSave,
				disabled: saving,
				loading: saving,
				variant: "outline" as const,
			});
			actions.push({
				label: "Open for Approval",
				onClick: handleOpen,
				disabled: saving,
				loading: saving,
				variant: "default" as const,
			});
		}

		if (isOpen) {
			actions.push({
				label: "Reject",
				onClick: handleReject,
				disabled: saving,
				loading: saving,
				variant: "destructive" as const,
			});
			actions.push({
				label: "Approve",
				onClick: handleApprove,
				disabled: saving,
				loading: saving,
				variant: "default" as const,
			});
		}

		return actions;
	}, [canEdit, isViewMode, isDraft, isOpen, saving, handleSave, handleOpen, handleApprove, handleReject]);

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
					<SRTotalsDisplay totals={totals} />
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
	);
}
