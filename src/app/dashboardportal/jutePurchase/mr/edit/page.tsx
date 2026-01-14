"use client";

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Alert, CircularProgress, Box } from "@mui/material";
import TransactionWrapper from "@/components/ui/TransactionWrapper";
import { fetchWithCookie } from "@/utils/apiClient2";
import { apiRoutesPortalMasters } from "@/utils/api";
import useSelectedCompanyCoId from "@/hooks/use-selected-company-coid";
import { MRHeaderForm } from "../components/MRHeaderForm";
import { useMRLineItems } from "../hooks/useMRLineItems";
import type { JuteMRHeader, JuteMRLineItemAPI, MRLineItem, MuiFormMode } from "../types/mrTypes";

type JuteMRDetailsResponse = {
	header: JuteMRHeader;
	line_items: JuteMRLineItemAPI[];
};

/**
 * Calculate shortage_kgs and accepted_weight based on formulas:
 * shortage_kgs = actual_weight * (difference of allowable moisture and actual moisture % + claim_dust%)
 * accepted_weight = actual_weight - shortage_kgs
 */
function calculateShortageAndAcceptedWeight(
	actualWeight: number | null,
	allowableMoisture: number | null,
	actualMoisture: number | null,
	claimDust: number | null
): { shortageKgs: number | null; acceptedWeight: number | null } {
	if (actualWeight == null || actualWeight <= 0) {
		return { shortageKgs: null, acceptedWeight: null };
	}

	const allowable = allowableMoisture ?? 0;
	const actual = actualMoisture ?? 0;
	const dust = claimDust ?? 0;

	// Calculate moisture difference (only if actual > allowable)
	const moistureDiff = actual > allowable ? actual - allowable : 0;

	// Total deduction percentage
	const deductionPercentage = moistureDiff + dust;

	if (deductionPercentage <= 0) {
		return { shortageKgs: 0, acceptedWeight: actualWeight };
	}

	// Formula: shortage_kgs = actual_weight * (moisture diff % + claim_dust%)
	const shortageKgs = actualWeight * deductionPercentage / 100.0;
	
	// Formula: accepted_weight = actual_weight - shortage_kgs
	const acceptedWeight = Math.max(0, actualWeight - shortageKgs); // Ensure non-negative
	
	return { shortageKgs, acceptedWeight };
}

export default function JuteMREditPage() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const { coId } = useSelectedCompanyCoId();

	const mrIdParam = searchParams?.get("id");
	const modeParam = searchParams?.get("mode") ?? "edit";
	const mode: MuiFormMode = modeParam === "view" ? "view" : "edit";

	const [loading, setLoading] = React.useState(true);
	const [pageError, setPageError] = React.useState<string | null>(null);
	const [header, setHeader] = React.useState<JuteMRHeader | null>(null);
	const [lineItems, setLineItems] = React.useState<MRLineItem[]>([]);
	const [saving, setSaving] = React.useState(false);
	const [agentOptions, setAgentOptions] = React.useState<Array<{ value: number; label: string }>>([]);
	const [warehouseOptions, setWarehouseOptions] = React.useState<Array<{ value: number; label: string }>>([]);

	const handleHeaderChange = React.useCallback(
		(field: keyof JuteMRHeader, value: string | number | null) => {
			setHeader((prev) => (prev ? { ...prev, [field]: value } : null));
		},
		[]
	);

	// Build line item columns
	const handleLineFieldChange = React.useCallback(
		(id: string, field: keyof MRLineItem, value: string | number | null) => {
			setLineItems((prev) =>
				prev.map((li) => {
					if (li.id !== id) return li;

					const updated = { ...li, [field]: value };

					// Recalculate shortage_kgs and accepted_weight when relevant fields change
					if (
						field === "actualWeight" ||
						field === "allowableMoisture" ||
						field === "actualMoisture" ||
						field === "claimDust"
					) {
						const { shortageKgs, acceptedWeight } = calculateShortageAndAcceptedWeight(
							updated.actualWeight,
							updated.allowableMoisture,
							updated.actualMoisture,
							updated.claimDust
						);
						updated.shortageKgs = shortageKgs;
						updated.acceptedWeight = acceptedWeight;
					}

					return updated;
				})
			);
		},
		[]
	);

	const lineItemColumns = useMRLineItems({
		canEdit: mode !== "view",
		handleLineFieldChange,
		warehouseOptions,
	});

	// Calculate total accepted weight (MR weight)
	const totalAcceptedWeight = React.useMemo(() => {
		return lineItems.reduce((sum, li) => sum + (li.acceptedWeight ?? 0), 0);
	}, [lineItems]);

	// Update header MR weight when total changes
	React.useEffect(() => {
		if (header && mode === "edit") {
			setHeader((prev) => (prev ? { ...prev, mr_weight: totalAcceptedWeight } : null));
		}
	}, [totalAcceptedWeight, mode]);

	const loadAgentOptions = React.useCallback(async () => {
		if (!coId) return;
		try {
			const url = `${apiRoutesPortalMasters.JUTE_MR_AGENT_OPTIONS}?co_id=${coId}`;
			const { data, error } = await fetchWithCookie<{ branches: Array<{ branch_id: number; company_name: string; branch_name: string }> }>(url, "GET");
			if (error || !data) return;
			
			const options = data.branches.map((b) => ({
				value: b.branch_id,
				label: `${b.company_name} - ${b.branch_name}`,
			}));
			setAgentOptions(options);
		} catch (err) {
			console.error("Error loading agent options:", err);
		}
	}, [coId]);

	const loadWarehouseOptions = React.useCallback(async (branchId: number) => {
		try {
			const url = `${apiRoutesPortalMasters.JUTE_MR_WAREHOUSE_OPTIONS}?branch_id=${branchId}`;
			const { data, error } = await fetchWithCookie<{ warehouses: Array<{ warehouse_id: number; warehouse_name: string; warehouse_path: string }> }>(url, "GET");
			if (error || !data) return;
			
			const options = data.warehouses.map((w) => ({
				value: w.warehouse_id,
				label: w.warehouse_path || w.warehouse_name,
			}));
			setWarehouseOptions(options);
		} catch (err) {
			console.error("Error loading warehouse options:", err);
		}
	}, []);

	const loadData = React.useCallback(async () => {
		if (!coId || !mrIdParam) return;
		setLoading(true);
		setPageError(null);

		try {
			const url = `${apiRoutesPortalMasters.JUTE_MR_BY_ID}?id=${mrIdParam}`;
			const { data, error } = await fetchWithCookie<JuteMRDetailsResponse>(url, "GET");
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

			const mappedLineItems: MRLineItem[] = data.line_items.map((li) => {
				const actualMoistureNum = li.actual_moisture
					? parseFloat(li.actual_moisture)
					: null;

				const { shortageKgs, acceptedWeight } = calculateShortageAndAcceptedWeight(
					li.actual_weight,
					li.allowable_moisture,
					actualMoistureNum,
					li.claim_dust
				);

				return {
					id: `mr-li-${li.jute_mr_li_id}`,
					juteMrLiId: li.jute_mr_li_id,
					actualItemId: li.actual_item_id,
					actualItemName: li.actual_item_name || "-",
					actualQualityId: li.actual_quality,
					actualQualityName: li.actual_quality_name || "-",
					actualQty: li.actual_qty,
					actualWeight: li.actual_weight,
					allowableMoisture: li.allowable_moisture,
					actualMoisture: actualMoistureNum,
					claimDust: li.claim_dust,
					shortageKgs: shortageKgs ?? li.shortage_kgs,
					acceptedWeight,
					rate: li.rate,
					claimRate: li.claim_rate,
					claimQuality: li.claim_quality,
					waterDamageAmount: li.water_damage_amount,
					premiumAmount: li.premium_amount,
					remarks: li.remarks,
					warehouseId: li.warehouse_id,
					warehousePath: li.warehouse_path,
				};
			});

			setLineItems(mappedLineItems);
		} catch (err) {
			setPageError(err instanceof Error ? err.message : "Failed to load MR data");
		} finally {
			setLoading(false);
		}
	}, [coId, mrIdParam]);

	React.useEffect(() => {
		void loadData();
		void loadAgentOptions();
	}, [loadData, loadAgentOptions]);

	// Load warehouse options when header is available
	React.useEffect(() => {
		if (header?.branch_id) {
			void loadWarehouseOptions(header.branch_id);
		}
	}, [header?.branch_id, loadWarehouseOptions]);

	const handleSave = React.useCallback(async () => {
		if (!coId || !header) return;

		setSaving(true);
		setPageError(null);

		try {
			const payload = {
				mr_weight: header.mr_weight,
				remarks: header.remarks,
				src_com_id: header.src_com_id,
				line_items: lineItems.map((li) => ({
					jute_mr_li_id: li.juteMrLiId,
					actual_item_id: li.actualItemId,
					actual_quality: li.actualQualityId,
					actual_qty: li.actualQty,
					actual_weight: li.actualWeight,
					allowable_moisture: li.allowableMoisture,
					actual_moisture: li.actualMoisture != null ? li.actualMoisture.toFixed(2) : null,
					claim_dust: li.claimDust,
					shortage_kgs: li.shortageKgs,
					accepted_weight: li.acceptedWeight,
					rate: li.rate,
					claim_rate: li.claimRate,
					claim_quality: li.claimQuality,
					water_damage_amount: li.waterDamageAmount,
					premium_amount: li.premiumAmount,
					remarks: li.remarks,
					warehouse_id: li.warehouseId,
				})),
			};

			const url = `${apiRoutesPortalMasters.JUTE_MR_UPDATE}/${header.jute_mr_id}?co_id=${coId}`;
			const { error } = await fetchWithCookie(url, "PUT", payload);
			if (error) {
				setPageError(error);
				setSaving(false);
				return;
			}

			// Reload data to get updated values
			await loadData();
		} catch (err) {
			setPageError(err instanceof Error ? err.message : "Failed to save MR");
		} finally {
			setSaving(false);
		}
	}, [coId, header, lineItems, loadData]);

	if (!mrIdParam) {
		return <Alert severity="error">MR id is required in URL.</Alert>;
	}

	if (loading || !header) {
		return (
			<div className="flex h-64 items-center justify-center">
				<CircularProgress />
			</div>
		);
	}

	const actions: Array<{
		label: string;
		onClick: () => void;
		variant: "default" | "outline";
		disabled?: boolean;
		loading?: boolean;
	}> = [
		{
			label: "Back",
			onClick: () => router.push("/dashboardportal/jutePurchase/mr"),
			variant: "outline",
		},
	];

	if (mode === "edit") {
		actions.push({
			label: "Save",
			onClick: handleSave,
			disabled: saving,
			loading: saving,
			variant: "default",
		});
	}

	const statusChip = {
		label: header.status || "Open",
		color: (header.status_id === 3 ? "success" : "info") as "success" | "info",
	};

	return (
		<TransactionWrapper
			title={`Material Receipt - MR #${header.branch_mr_no ?? header.jute_mr_id}`}
			loading={loading}
			statusChip={statusChip}
			primaryActions={actions}
			lineItems={{
				items: lineItems,
				columns: lineItemColumns,
				getItemId: (item: MRLineItem) => item.id,
				canEdit: mode !== "view",
				onRemoveSelected: () => {},
				title: "Line Items",
				subtitle: `${lineItems.length} items | Total Accepted Weight: ${totalAcceptedWeight.toFixed(2)}`,
			}}
			alerts={
				pageError ? (
					<Alert severity="error" onClose={() => setPageError(null)}>
						{pageError}
					</Alert>
				) : null
			}
			contentClassName="max-w-full"
		>
			<Box sx={{ maxHeight: "calc(100vh - 300px)", overflowY: "auto", pr: 1 }}>
				<MRHeaderForm header={header} mode={mode} onHeaderChange={handleHeaderChange} agentOptions={agentOptions} />
			</Box>
		</TransactionWrapper>
	);
}
