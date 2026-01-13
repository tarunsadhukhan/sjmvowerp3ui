"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Alert, CircularProgress } from "@mui/material";
import TransactionWrapper from "@/components/ui/TransactionWrapper";
import { fetchWithCookie } from "@/utils/apiClient2";
import { apiRoutesPortalMasters } from "@/utils/api";
import useSelectedCompanyCoId from "@/hooks/use-selected-company-coid";
import { InspectionHeaderForm } from "../components/InspectionHeaderForm";
import { MoistureReadingDialog } from "../components/MoistureReadingDialog";
import { useMaterialInspectionLineItems } from "../hooks/useMaterialInspectionLineItems";
import type {
	JuteMaterialInspectionHeader,
	JuteMaterialInspectionLineItemAPI,
	InspectionLineItem,
	MoistureReadingState,
} from "../types/materialInspectionTypes";

type MaterialInspectionDetailsResponse = {
	header: JuteMaterialInspectionHeader;
	line_items: JuteMaterialInspectionLineItemAPI[];
};

type MuiFormMode = "create" | "edit" | "view";

export default function JuteMaterialInspectionEditPage() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const { coId } = useSelectedCompanyCoId();

	const gateEntryIdParam = searchParams?.get("id");
	const modeParam = searchParams?.get("mode") ?? "edit";
	const mode: MuiFormMode = modeParam === "view" ? "view" : "edit";

	const [loading, setLoading] = React.useState(true);
	const [pageError, setPageError] = React.useState<string | null>(null);
	const [header, setHeader] = React.useState<JuteMaterialInspectionHeader | null>(null);
	const [lineItems, setLineItems] = React.useState<InspectionLineItem[]>([]);
	const [moistureState, setMoistureState] = React.useState<Record<string, MoistureReadingState>>({});
	const [dialogOpenFor, setDialogOpenFor] = React.useState<string | null>(null);
	const [saving, setSaving] = React.useState(false);

	// Build line item columns
	const lineItemColumns = useMaterialInspectionLineItems({
		onOpenMoistureDialog: (lineItemId) => setDialogOpenFor(lineItemId),
	});

	const loadData = React.useCallback(async () => {
		if (!coId || !gateEntryIdParam) return;
		setLoading(true);
		setPageError(null);

		try {
			const url = `${apiRoutesPortalMasters.JUTE_MATERIAL_INSPECTION_BY_ID}?id=${gateEntryIdParam}`;
			const { data, error } = await fetchWithCookie<MaterialInspectionDetailsResponse>(url, "GET");
			if (error) {
				setPageError(error);
				setLoading(false);
				return;
			}
			if (!data) {
				setPageError("No data received from server");
				setLoading(false);
				return;
			}

			setHeader(data.header);

			const mappedLineItems: InspectionLineItem[] = data.line_items.map((li) => {
				const actualName = li.actual_item_name || li.challan_item_name || "";
				const actualQualityName = li.actual_quality_name || li.challan_quality_name || "";
				return {
					id: `insp-li-${li.jute_gate_entry_li_id}`,
					gateEntryLineItemId: li.jute_gate_entry_li_id,
					actualItemId: li.actual_item_id,
					actualItemName: actualName,
					actualQualityId: li.actual_jute_quality_id,
					actualQualityName,
					actualQty: li.actual_quantity,
					actualWeight: li.actual_weight,
					allowableMoisture: li.allowable_moisture,
					juteUom: li.jute_uom,
					remarks: li.remarks,
					averageMoisture: null,
					hasMoisture: false,
				};
			});

			setLineItems(mappedLineItems);
			setMoistureState({});
		} catch (err) {
			setPageError(err instanceof Error ? err.message : "Failed to load inspection data");
		} finally {
			setLoading(false);
		}
	}, [coId, gateEntryIdParam]);

	React.useEffect(() => {
		void loadData();
	}, [loadData]);

	const handleMoistureChange = (lineItemId: string, readings: number[], average: number | null) => {
		setMoistureState((prev) => ({
			...prev,
			[lineItemId]: { lineItemId, readings, average },
		}));
		setLineItems((prev) =>
			prev.map((li) =>
				li.id === lineItemId
					? {
							...li,
							averageMoisture: average,
							hasMoisture: !!(readings.length && average != null),
					  }
					: li,
			),
		);
	};

	const allLinesHaveMoisture = React.useMemo(
		() => lineItems.length > 0 && lineItems.every((li) => li.hasMoisture),
		[lineItems],
	);

	const handleQcComplete = React.useCallback(async () => {
		if (!coId || !header) return;
		if (!allLinesHaveMoisture) {
			setPageError("Please enter moisture readings for all line items before completing QC.");
			return;
		}

		setSaving(true);
		setPageError(null);

		try {
			const payload = {
				gate_entry_id: header.jute_gate_entry_id,
				mr_weight: header.net_weight,
				remarks: header.remarks,
				line_items: lineItems.map((li) => {
					const moisture = moistureState[li.id];
					const avg = moisture?.average ?? null;
					const avgStr = avg != null ? avg.toFixed(2) : null;

					const apiSource = header && {
						// We need challan and actual data from the original API response; for now
						// we use actual fields only and leave challan-related fields null.
					};

					return {
						gate_entry_line_item_id: li.gateEntryLineItemId,
						challan_item_id: null,
						challan_quality_id: null,
						challan_quantity: null,
						challan_weight: null,
						actual_item_id: li.actualItemId,
						actual_quality_id: li.actualQualityId,
						actual_qty: li.actualQty,
						actual_weight: li.actualWeight,
						allowable_moisture: li.allowableMoisture,
						actual_moisture: avgStr,
						moisture_readings: (moisture?.readings ?? []).map((v) => ({
							moisture_percentage: v,
						})),
						accepted_weight: null,
						rate: null,
						warehouse_id: null,
						marka: null,
						crop_year: null,
						remarks: li.remarks,
					};
				}),
			};

			const url = `${apiRoutesPortalMasters.JUTE_MATERIAL_INSPECTION_COMPLETE}?co_id=${coId}`;
			const { error } = await fetchWithCookie(url, "POST", payload);
			if (error) {
				setPageError(error);
				setSaving(false);
				return;
			}

			router.push("/dashboardportal/jutePurchase/materialInspection");
		} catch (err) {
			setPageError(err instanceof Error ? err.message : "Failed to complete QC");
		} finally {
			setSaving(false);
		}
	}, [coId, header, lineItems, moistureState, allLinesHaveMoisture, router]);

	if (!gateEntryIdParam) {
		return <Alert severity="error">Gate entry id is required in URL.</Alert>;
	}

	if (loading || !header) {
		return (
			<div className="flex h-64 items-center justify-center">
				<CircularProgress />
			</div>
		);
	}

	const actions = [
		{
			label: "Back",
			onClick: () => router.push("/dashboardportal/jutePurchase/materialInspection"),
			variant: "outline" as const,
		},
		{
			label: "QC Complete",
			onClick: handleQcComplete,
			disabled: saving || !allLinesHaveMoisture,
			loading: saving,
			variant: "default" as const,
		},
	];

	const statusChip = {
		label: header.status || "Pending",
		color: header.qc_check === "Y" ? ("success" as const) : ("info" as const),
	};

	const openLineItem = dialogOpenFor ? lineItems.find((li) => li.id === dialogOpenFor) : null;
	const openMoisture = dialogOpenFor ? moistureState[dialogOpenFor] : undefined;

	return (
		<TransactionWrapper
			title={`Material Inspection - Gate Entry #${header.branch_gate_entry_no ?? header.jute_gate_entry_id}`}
			loading={loading}
			statusChip={statusChip}
			primaryActions={actions}
			lineItems={{
				items: lineItems,
				columns: lineItemColumns,
				getItemId: (item: InspectionLineItem) => item.id,
				canEdit: mode !== "view",
				onRemoveSelected: () => {},
				title: "Line Items",
				subtitle: `${lineItems.length} items`,
			}}
			alerts={
				pageError ? (
					<Alert severity="error" onClose={() => setPageError(null)}>
						{pageError}
					</Alert>
				) : null
			}
		>
			<InspectionHeaderForm header={header} />

			{openLineItem && (
				<MoistureReadingDialog
					open={Boolean(dialogOpenFor)}
					onClose={() => setDialogOpenFor(null)}
					readings={openMoisture?.readings ?? []}
					onChange={(readings, average) => handleMoistureChange(openLineItem.id, readings, average)}
				/>
			)}
		</TransactionWrapper>
	);
}

