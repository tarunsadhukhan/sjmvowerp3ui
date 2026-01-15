"use client";

/**
 * @page JuteGateEntryCreatePage
 * @description Create/Edit/View page for Jute Gate Entry.
 * Features:
 * - Header form with branch, date, time, challan details, vehicle, supplier, party, weights
 * - Line items table with challan and actual columns
 * - IN button for create mode, OUT button for edit mode
 * - Auto-fill from PO selection
 * - Weight calculations based on proportions
 */

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Alert, CircularProgress } from "@mui/material";
import { ArrowLeft, Save, LogIn, LogOut } from "lucide-react";
import TransactionWrapper from "@/components/ui/TransactionWrapper";
import useSelectedCompanyCoId from "@/hooks/use-selected-company-coid";
import { fetchWithCookie } from "@/utils/apiClient2";
import { apiRoutesPortalMasters } from "@/utils/api";

// Types
import type {
	MuiFormMode,
	GateEntryFormValues,
	GateEntryLineItem,
	GateEntrySetupData,
	GateEntryDetails,
	Option,
	JuteQualityRecord,
	PODetailsForGateEntry,
} from "./types/gateEntryTypes";
import { GATE_ENTRY_STATUS } from "./types/gateEntryTypes";

// Constants and Utils
import {
	GATE_ENTRY_STATUS_LABELS,
	UOM_OPTIONS,
} from "./utils/gateEntryConstants";
import { calculateNetWeight, calculateLineItemTotals } from "./utils/gateEntryCalculations";
import {
	mapGateEntrySetupResponse,
	buildBranchOptions,
	buildSupplierOptions,
	buildMukamOptions,
	buildPOOptions,
	extractFormValuesFromDetails,
	mapLineItemsFromAPI,
	mapFormToCreatePayload,
	mapFormToUpdatePayload,
} from "./utils/gateEntryMappers";

// Hooks
import { useGateEntryFormState } from "./hooks/useGateEntryFormState";
import { useGateEntryLineItems } from "./hooks/useGateEntryLineItems";
import { useGateEntryFormSchemas } from "./hooks/useGateEntryFormSchemas";
import { useGateEntryLineItemColumns } from "./hooks/useGateEntryLineItemColumns";

// Components
import { GateEntryHeaderForm } from "./components";

export default function JuteGateEntryCreatePage() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const { coId } = useSelectedCompanyCoId();

	// Derive mode and ID from URL
	const modeParam = searchParams?.get("mode") ?? "create";
	const mode: MuiFormMode = modeParam === "edit" ? "edit" : modeParam === "view" ? "view" : "create";
	const gateEntryId = searchParams?.get("id") ?? null;
	const isEditMode = mode === "edit" || (mode === "view" && gateEntryId);

	// Page-level state
	const [loading, setLoading] = React.useState(true);
	const [saving, setSaving] = React.useState(false);
	const [pageError, setPageError] = React.useState<string | null>(null);
	const [isMounted, setIsMounted] = React.useState(false);

	// Prevent hydration mismatch
	React.useEffect(() => {
		setIsMounted(true);
	}, []);

	// Setup data state
	const [setupData, setSetupData] = React.useState<GateEntrySetupData | null>(null);
	const [details, setDetails] = React.useState<GateEntryDetails | null>(null);

	// Cascading dropdown state
	const [parties, setParties] = React.useState<Option[]>([]);
	const [qualitiesByItem, setQualitiesByItem] = React.useState<Record<string, JuteQualityRecord[]>>({});

	// Derived options
	const branchOptions = React.useMemo(
		() => (setupData ? buildBranchOptions(setupData.branches) : []),
		[setupData]
	);
	const isSingleBranch = branchOptions.length === 1;

	const supplierOptions = React.useMemo(
		() => (setupData ? buildSupplierOptions(setupData.suppliers) : []),
		[setupData]
	);

	const mukamOptions = React.useMemo(
		() => (setupData ? buildMukamOptions(setupData.mukams) : []),
		[setupData]
	);



	// Form state hook
	const {
		initialValues,
		setInitialValues,
		formValues,
		setFormValues,
		formKey,
		bumpFormKey,
		formRef,
	} = useGateEntryFormState({ mode });

	// PO options - filtered by selected branch only (must be after formValues is available)
	const poOptions = React.useMemo(() => {
		if (!setupData) return [];
		const selectedBranchId = formValues.branch;
		
		// Filter POs by selected branch only
		let filteredPOs = setupData.open_pos;
		
		if (selectedBranchId) {
			filteredPOs = filteredPOs.filter(
				(po) => String(po.branch_id) === selectedBranchId
			);
		}
		
		return buildPOOptions(filteredPOs);
	}, [setupData, formValues.branch]);

	// Calculate header weights:
	// net_weight = gross_weight - tare_weight
	// actual_weight = net_weight - variable_shortage (used for line item distribution)
	const headerChallanWeight = parseFloat(formValues.challanWeight) || 0;
	const grossWeight = parseFloat(formValues.grossWeight) || 0;
	const tareWeight = parseFloat(formValues.tareWeight) || 0;
	const variableShortage = parseFloat(formValues.variableShortage) || 0;
	const headerNetWeight = grossWeight > 0 && tareWeight > 0 && grossWeight > tareWeight 
		? calculateNetWeight(grossWeight, tareWeight) 
		: 0;
	const headerActualWeight = headerNetWeight > 0 
		? Math.max(0, headerNetWeight - variableShortage)
		: 0;

	// Line items hook
	const {
		lineItems,
		setLineItems,
		replaceItems: replaceLineItems,
		removeLineItems,
		handleLineFieldChange,
	} = useGateEntryLineItems({
		mode,
		headerChallanWeight,
		headerActualWeight,
		getQualityOptions: (itemId) =>
			(qualitiesByItem[itemId] ?? []).map((q) => ({
				label: q.quality_name,
				value: String(q.quality_id),
			})),
	});

	// Label resolvers for display
	const getItemLabel = React.useCallback(
		(itemId: string) =>
			setupData?.jute_items.find((i) => String(i.item_id) === itemId)?.item_name ?? itemId,
		[setupData]
	);

	const getQualityLabel = React.useCallback(
		(qualityId: string) => {
			for (const qualities of Object.values(qualitiesByItem)) {
				const found = qualities.find((q) => String(q.quality_id) === qualityId);
				if (found) return found.quality_name;
			}
			return qualityId;
		},
		[qualitiesByItem]
	);

	// Form schema hook
	const formSchema = useGateEntryFormSchemas({
		mode,
		branchOptions,
		mukamOptions,
		supplierOptions,
		partyOptions: parties,
		poOptions,
		uomOptions: UOM_OPTIONS,
		hasSupplierSelected: Boolean(formValues.supplier),
		isSingleBranch,
		isEditMode: Boolean(isEditMode),
	});

	// Line item columns
	const lineItemColumns = useGateEntryLineItemColumns({
		canEdit: mode !== "view",
		juteItems: setupData?.jute_items ?? [],
		qualitiesByItem,
		handleLineFieldChange,
		getItemLabel,
		getQualityLabel,
	});

	// Status info
	const statusId = details?.status_id ?? (mode === "create" ? null : GATE_ENTRY_STATUS.IN);
	const isVehicleIn = statusId === GATE_ENTRY_STATUS.IN;
	const isVehicleOut = statusId === GATE_ENTRY_STATUS.OUT;

	// Calculate net weight when gross/tare changes
	// Only calculate when both values are provided and valid
	React.useEffect(() => {
		const gross = parseFloat(formValues.grossWeight) || 0;
		const tare = parseFloat(formValues.tareWeight) || 0;
		
		// Only calculate if both values are provided and valid
		if (gross > 0 && tare > 0 && gross > tare) {
			const net = calculateNetWeight(gross, tare);
			setFormValues((prev) => {
				// Only update if the value actually changed
				if (prev.netWeight !== String(net)) {
					return { ...prev, netWeight: String(net) };
				}
				return prev;
			});
		} else if (!formValues.grossWeight && !formValues.tareWeight) {
			// Clear net weight if both inputs are empty
			setFormValues((prev) => {
				if (prev.netWeight !== "") {
					return { ...prev, netWeight: "" };
				}
				return prev;
			});
		}
	}, [formValues.grossWeight, formValues.tareWeight, setFormValues]);

	// Auto-select single branch
	React.useEffect(() => {
		if (mode === "create" && isSingleBranch && !formValues.branch && branchOptions[0]) {
			setFormValues((prev) => ({ ...prev, branch: branchOptions[0].value }));
		}
	}, [mode, isSingleBranch, formValues.branch, branchOptions, setFormValues]);

	// Fetch parties when supplier changes
	const prevSupplierRef = React.useRef<string>("");
	React.useEffect(() => {
		const supplierId = formValues.supplier;
		if (supplierId === prevSupplierRef.current) return;
		prevSupplierRef.current = supplierId;

		// Clear party when supplier changes (don't clear PO - supplier is auto-filled from PO)
		setFormValues((prev) => ({ ...prev, party: "" }));

		if (!supplierId || !coId) {
			setParties([]);
			return;
		}

		const fetchParties = async () => {
			try {
				const url = `${apiRoutesPortalMasters.JUTE_GATE_ENTRY_PARTIES_BY_SUPPLIER}/${supplierId}?co_id=${coId}`;
				const { data, error } = await fetchWithCookie(url, "GET");
				if (error) {
					console.error("Error fetching parties:", error);
					return;
				}
				const result = data as Record<string, unknown>;
				const partyList = (result.parties as Array<Record<string, unknown>>) ?? [];
				setParties(
					partyList.map((p) => ({
						label: String(p.party_name ?? ""),
						value: String(p.party_id ?? ""),
					}))
				);
			} catch (err) {
				console.error("Error fetching parties:", err);
			}
		};

		void fetchParties();
	}, [formValues.supplier, coId, setFormValues]);

	// Fetch qualities when item is selected in line items
	const fetchQualitiesForItem = React.useCallback(
		async (itemId: string) => {
			if (!itemId || !coId || qualitiesByItem[itemId]) return;

			try {
				const url = `${apiRoutesPortalMasters.JUTE_GATE_ENTRY_QUALITIES_BY_ITEM}/${itemId}?co_id=${coId}`;
				const { data, error } = await fetchWithCookie(url, "GET");
				if (error) {
					console.error("Error fetching qualities:", error);
					return;
				}
				const result = data as Record<string, unknown>;
				const qualityList = (result.qualities as Array<Record<string, unknown>>) ?? [];
				setQualitiesByItem((prev) => ({
					...prev,
					[itemId]: qualityList.map((q) => ({
						quality_id: Number(q.quality_id),
						quality_name: String(q.quality_name ?? ""),
						item_id: Number(q.item_id),
					})),
				}));
			} catch (err) {
				console.error("Error fetching qualities:", err);
			}
		},
		[coId, qualitiesByItem]
	);

	// Watch line items for item changes to fetch qualities
	React.useEffect(() => {
		for (const li of lineItems) {
			if (li.challanItem && !qualitiesByItem[li.challanItem]) {
				void fetchQualitiesForItem(li.challanItem);
			}
			if (li.actualItem && !qualitiesByItem[li.actualItem]) {
				void fetchQualitiesForItem(li.actualItem);
			}
		}
	}, [lineItems, qualitiesByItem, fetchQualitiesForItem]);

	// Handle PO selection - auto-fill data
	const prevPoIdRef = React.useRef<string>("");
	React.useEffect(() => {
		const poId = formValues.poId;
		if (poId === prevPoIdRef.current) return;
		prevPoIdRef.current = poId;

		if (!poId || !coId || mode === "view") return;

		const fetchPODetails = async () => {
			try {
				const url = `${apiRoutesPortalMasters.JUTE_GATE_ENTRY_PO_DETAILS}/${poId}?co_id=${coId}`;
				const { data, error } = await fetchWithCookie(url, "GET");
				if (error) {
					console.error("Error fetching PO details:", error);
					return;
				}
				const poData = data as PODetailsForGateEntry;

				// Auto-fill supplier, mukam, and uom from PO
				// Clear party since supplier is changing - will be refetched by useEffect
				setFormValues((prev) => ({
					...prev,
					supplier: String(poData.supplier_id ?? prev.supplier),
					mukam: poData.mukam_id ? String(poData.mukam_id) : prev.mukam,
					juteUom: poData.jute_uom ?? prev.juteUom,
					party: "", // Clear party - will need to re-select
				}));

				// Auto-fill line items from PO
				if (poData.line_items && poData.line_items.length > 0) {
					const newLineItems: GateEntryLineItem[] = poData.line_items.map((poli) => ({
						id: `ge-line-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
						jutePoLiId: String(poli.jute_po_li_id),  // Link to PO line item
						challanItem: poli.item_id ? String(poli.item_id) : "",
						challanQuality: poli.quality_id ? String(poli.quality_id) : "",
						challanQty: poli.quantity ? String(poli.quantity) : "",
						challanWeight: "",
						actualItem: poli.item_id ? String(poli.item_id) : "",
						actualQuality: poli.quality_id ? String(poli.quality_id) : "",
						actualQty: poli.quantity ? String(poli.quantity) : "",
						actualWeight: "",
						allowableMoisture: poli.allowable_moisture != null ? String(poli.allowable_moisture) : "",  // Copy from PO
						remarks: "",
					}));
					replaceLineItems(newLineItems);
				}
			} catch (err) {
				console.error("Error fetching PO details:", err);
			}
		};

		void fetchPODetails();
	}, [formValues.poId, coId, mode, setFormValues, replaceLineItems]);

	// Fetch setup data
	React.useEffect(() => {
		if (!coId) return;

		const fetchSetup = async () => {
			setLoading(true);
			setPageError(null);

			try {
				const url = `${apiRoutesPortalMasters.JUTE_GATE_ENTRY_CREATE_SETUP}?co_id=${coId}`;
				const { data, error } = await fetchWithCookie(url, "GET");

				if (error) {
					setPageError(error);
					setLoading(false);
					return;
				}

				const setup = mapGateEntrySetupResponse(data);
				setSetupData(setup);

				// If edit/view mode and we have an ID, fetch details
				if (gateEntryId && (mode === "edit" || mode === "view")) {
					const detailsUrl = `${apiRoutesPortalMasters.JUTE_GATE_ENTRY_BY_ID}/${gateEntryId}?co_id=${coId}`;
					const { data: detailsData, error: detailsError } = await fetchWithCookie(
						detailsUrl,
						"GET"
					);

					if (detailsError) {
						setPageError(detailsError);
						setLoading(false);
						return;
					}

					const entryDetails = detailsData as GateEntryDetails;
					setDetails(entryDetails);

					// Map details to form values
					const mappedFormValues = extractFormValuesFromDetails(entryDetails);
					setInitialValues(mappedFormValues);
					setFormValues(mappedFormValues);

					// Map line items
					if (entryDetails.line_items && entryDetails.line_items.length > 0) {
						const mappedLineItems = mapLineItemsFromAPI(entryDetails.line_items);
						replaceLineItems(mappedLineItems);
					}

					bumpFormKey();
				}

				setLoading(false);
			} catch (err) {
				setPageError(err instanceof Error ? err.message : "Failed to load setup data");
				setLoading(false);
			}
		};

		void fetchSetup();
	}, [coId, gateEntryId, mode, setInitialValues, setFormValues, replaceLineItems, bumpFormKey]);

	// Form submission
	const handleFormSubmit = React.useCallback(async () => {
		if (!coId) return;

		// Validate required fields for IN action
		// Only branch, entryDate, entryTime, vehicleNo, driverName, transporter, grossWeight are mandatory
		// Other fields (supplier, challanNo, challanDate, juteUom, mukam, challanWeight) are optional at IN time
		const requiredFields = [
			"branch",
			"entryDate",
			"entryTime",
			"vehicleNo",
			"driverName",
			"transporter",
			"grossWeight",
		] as const;

		for (const field of requiredFields) {
			if (!formValues[field]) {
				setPageError(`Please fill in the required field: ${field}`);
				return;
			}
		}

		// Validate weights are positive
		const grossWeight = parseFloat(formValues.grossWeight) || 0;
		const tareWeight = parseFloat(formValues.tareWeight) || 0;

		if (grossWeight <= 0) {
			setPageError("Gross weight must be greater than 0");
			return;
		}
		// Only validate gross > tare if tare weight is provided
		if (tareWeight > 0 && grossWeight <= tareWeight) {
			setPageError("Gross weight must be greater than tare weight");
			return;
		}

		// Line items are optional for IN action

		setSaving(true);
		setPageError(null);

		try {
			if (mode === "create") {
				const payload = mapFormToCreatePayload(formValues, lineItems, parseInt(coId, 10));
				const { data, error } = await fetchWithCookie(
					apiRoutesPortalMasters.JUTE_GATE_ENTRY_CREATE,
					"POST",
					payload
				);

				if (error) {
					setPageError(error);
					setSaving(false);
					return;
				}

				const result = data as { jute_gate_entry_id: number };
				// Redirect to edit mode
				router.push(
					`/dashboardportal/jutePurchase/gateEntry/createGateEntry?mode=edit&id=${result.jute_gate_entry_id}`
				);
			} else if (mode === "edit" && gateEntryId) {
				const payload = mapFormToUpdatePayload(formValues, lineItems);
				const { error } = await fetchWithCookie(
					`${apiRoutesPortalMasters.JUTE_GATE_ENTRY_UPDATE}/${gateEntryId}?co_id=${coId}`,
					"PUT",
					payload
				);

				if (error) {
					setPageError(error);
					setSaving(false);
					return;
				}

				// Refresh page
				window.location.reload();
			}
		} catch (err) {
			setPageError(err instanceof Error ? err.message : "Failed to save gate entry");
		} finally {
			setSaving(false);
		}
	}, [coId, formValues, lineItems, mode, gateEntryId, router]);

	// Handle IN action (create mode submit)
	const handleInAction = React.useCallback(async () => {
		await handleFormSubmit();
	}, [handleFormSubmit]);

	// Handle OUT action (edit mode)
	const handleOutAction = React.useCallback(async () => {
		if (!coId || !gateEntryId) return;

		// Validate tare weight is filled
		const tareWeight = parseFloat(formValues.tareWeight as string) || 0;
		if (tareWeight <= 0) {
			setPageError("Please fill in Tare Weight before marking as OUT");
			return;
		}

		// Validate out date/time
		if (!formValues.outDate || !formValues.outTime) {
			setPageError("Please fill in Out Date and Out Time before marking as OUT");
			return;
		}

		// Validate out time > in time
		const inDateTime = new Date(`${formValues.entryDate}T${formValues.entryTime}`);
		const outDateTime = new Date(`${formValues.outDate}T${formValues.outTime}`);

		if (outDateTime <= inDateTime) {
			setPageError("Out date/time must be after entry date/time");
			return;
		}

		setSaving(true);
		setPageError(null);

		try {
			const payload = {
				out_date: formValues.outDate,
				out_time: formValues.outTime,
				action: "OUT",
			};

			const { error } = await fetchWithCookie(
				`${apiRoutesPortalMasters.JUTE_GATE_ENTRY_UPDATE}/${gateEntryId}?co_id=${coId}`,
				"PUT",
				payload
			);

			if (error) {
				setPageError(error);
				setSaving(false);
				return;
			}

			// Redirect to view mode
			router.push(
				`/dashboardportal/jutePurchase/gateEntry/createGateEntry?mode=view&id=${gateEntryId}`
			);
		} catch (err) {
			setPageError(err instanceof Error ? err.message : "Failed to mark as OUT");
		} finally {
			setSaving(false);
		}
	}, [coId, gateEntryId, formValues, router]);

	// Handle back button
	const handleBack = React.useCallback(() => {
		router.push("/dashboardportal/jutePurchase/gateEntry");
	}, [router]);

	// Line item totals
	const lineItemTotals = React.useMemo(() => calculateLineItemTotals(lineItems), [lineItems]);

	// Actions - using TransactionAction type expected by TransactionWrapper
	type TransactionAction = {
		label: string;
		onClick: () => void;
		disabled?: boolean;
		loading?: boolean;
		hidden?: boolean;
		variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
		startIcon?: React.ReactNode;
	};

	const actions = React.useMemo((): TransactionAction[] => {
		const actionButtons: TransactionAction[] = [];

		// Back button
		actionButtons.push({
			label: "Back",
			onClick: handleBack,
			variant: "outline",
			startIcon: <ArrowLeft className="h-4 w-4" />,
		});

		if (mode === "view") {
			// View mode - no action buttons except back
			return actionButtons;
		}

		if (mode === "create") {
			// Create mode - IN button
			actionButtons.push({
				label: "IN",
				onClick: handleInAction,
				disabled: saving,
				loading: saving,
				variant: "default",
				startIcon: <LogIn className="h-4 w-4" />,
			});
		} else if (mode === "edit") {
			// Edit mode - Save and OUT buttons
			actionButtons.push({
				label: "Save",
				onClick: handleFormSubmit,
				disabled: saving,
				loading: saving,
				variant: "outline",
				startIcon: <Save className="h-4 w-4" />,
			});

			// OUT button - only enabled if out time and tare weight are filled
			const tareWeight = parseFloat(formValues.tareWeight as string) || 0;
			const canMarkOut = Boolean(formValues.outDate && formValues.outTime && tareWeight > 0);
			actionButtons.push({
				label: "OUT",
				onClick: handleOutAction,
				disabled: saving || !canMarkOut,
				loading: saving,
				variant: "default",
				startIcon: <LogOut className="h-4 w-4" />,
			});
		}

		return actionButtons;
	}, [mode, saving, formValues.outDate, formValues.outTime, formValues.tareWeight, handleBack, handleInAction, handleFormSubmit, handleOutAction]);

	// Status chip - using object format expected by TransactionWrapper
	type StatusChipType = { label: string; color?: "default" | "primary" | "secondary" | "success" | "error" | "warning" | "info" };

	const statusChip = React.useMemo((): StatusChipType => {
		if (mode === "create") {
			return { label: "New Entry", color: "default" };
		}
		if (isVehicleOut) {
			return { label: "OUT", color: "success" };
		}
		if (isVehicleIn) {
			return { label: "IN", color: "info" };
		}
		return { label: GATE_ENTRY_STATUS_LABELS[statusId ?? 1] ?? "Unknown", color: "default" };
	}, [mode, statusId, isVehicleIn, isVehicleOut]);

	// Title
	const pageTitle = React.useMemo(() => {
		if (mode === "create") return "New Gate Entry";
		if (mode === "edit") return `Edit Gate Entry #${details?.entry_branch_seq ?? gateEntryId}`;
		return `Gate Entry #${details?.entry_branch_seq ?? gateEntryId}`;
	}, [mode, details, gateEntryId]);

	// Loading state
	if (loading) {
		return (
			<div className="flex h-64 items-center justify-center">
				<CircularProgress />
			</div>
		);
	}

	// Error state
	if (pageError && !setupData) {
		return (
			<div className="p-4">
				<Alert severity="error">{pageError}</Alert>
			</div>
		);
	}

	return (
		<TransactionWrapper
			title={pageTitle}
			loading={loading}
			statusChip={statusChip}
			primaryActions={actions}
			lineItems={{
				items: lineItems,
				columns: lineItemColumns,
				getItemId: (item: GateEntryLineItem) => item.id,
				canEdit: mode !== "view",
				onRemoveSelected: removeLineItems,
				title: "Line Items",
				subtitle: `${lineItemTotals.validLineCount} items | Challan Qty: ${lineItemTotals.totalChallanQty.toFixed(2)} | Actual Qty: ${lineItemTotals.totalActualQty.toFixed(2)}`,
			}}
			alerts={
				pageError ? (
					<Alert severity="error" onClose={() => setPageError(null)}>
						{pageError}
					</Alert>
				) : null
			}
		>

			{isMounted && (
				<GateEntryHeaderForm
					schema={formSchema}
					formKey={formKey}
					initialValues={formValues}
					mode={mode}
					formRef={formRef}
					onSubmit={handleFormSubmit}
					onValuesChange={setFormValues}
				/>
			)}
		</TransactionWrapper>
	);
}
