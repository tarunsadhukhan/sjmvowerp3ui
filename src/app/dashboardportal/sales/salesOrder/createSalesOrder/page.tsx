"use client";

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TextField } from "@mui/material";
import TransactionWrapper from "@/components/ui/TransactionWrapper";
import { Button } from "@/components/ui/button";
import type { MuiFormMode } from "@/components/ui/muiform";
import {
	useDeferredOptionCache,
	useTransactionSetup,
	useTransactionPreview,
} from "@/components/ui/transaction";
import { useBranchOptions } from "@/utils/branchUtils";
import {
	fetchSalesOrderSetup1,
	fetchSalesOrderSetup2,
	getQuotationLines,
	getSalesOrderById,
	type SalesOrderDetails,
} from "@/utils/salesOrderService";
import useSelectedCompanyCoId from "@/hooks/use-selected-company-coid";
import { toast } from "@/hooks/use-toast";
import { useSidebarContext } from "@/components/dashboard/sidebarContext";
import { useMenuId } from "@/hooks/useMenuId";
import { useCompanyName } from "@/hooks/useCompanyName";

import { SalesOrderHeaderForm } from "./components/SalesOrderHeaderForm";
import { SalesOrderTotalsDisplay } from "./components/SalesOrderTotalsDisplay";
import { SalesOrderApprovalBar } from "./components/SalesOrderApprovalBar";
import SalesOrderPreview from "./components/SalesOrderPreview";
import { useSalesOrderLineItemColumns } from "./components/SalesOrderLineItemsTable";

import { useSalesOrderFormState } from "./hooks/useSalesOrderFormState";
import { useSalesOrderTaxCalculations } from "./hooks/useSalesOrderTaxCalculations";
import { useSalesOrderSelectOptions } from "./hooks/useSalesOrderSelectOptions";
import { useSalesOrderHeaderSchema } from "./hooks/useSalesOrderFormSchemas";
import { useSalesOrderFormSubmission } from "./hooks/useSalesOrderFormSubmission";
import { useSalesOrderApproval } from "./hooks/useSalesOrderApproval";
import { useSalesOrderLineItems } from "./hooks/useSalesOrderLineItems";
import type { ItemGroupCacheEntry, SalesOrderSetupData } from "./types/salesOrderTypes";

import { mapItemGroupDetailResponse, mapSalesOrderSetupResponse, mapSalesOrderDetailsToFormValues } from "./utils/salesOrderMappers";
import { buildDefaultFormValues, createBlankLine } from "./utils/salesOrderFactories";
import {
	EMPTY_BRANCH_ADDRESSES,
	EMPTY_BROKERS,
	EMPTY_CUSTOMERS,
	EMPTY_INVOICE_TYPES,
	EMPTY_ITEM_GROUPS,
	EMPTY_QUOTATIONS,
	EMPTY_SETUP_PARAMS,
	EMPTY_TRANSPORTERS,
} from "./utils/salesOrderConstants";

function SOPageLoading() {
	return (
		<div className="flex items-center justify-center min-h-100">
			<div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
		</div>
	);
}

export default function SalesOrderTransactionPage() {
	return (
		<Suspense fallback={<SOPageLoading />}>
			<SalesOrderTransactionPageContent />
		</Suspense>
	);
}

function SalesOrderTransactionPageContent() {
	const router = useRouter();
	const searchParams = useSearchParams();

	const modeParam = (searchParams?.get("mode") || "create").toLowerCase();
	const requestedId = searchParams?.get("id") || "";
	const branchIdFromUrl = searchParams?.get("branch_id") || "";
	const menuIdFromUrl = searchParams?.get("menu_id") || "";

	const mode: MuiFormMode = modeParam === "edit" ? "edit" : modeParam === "view" ? "view" : "create";

	const branchOptions = useBranchOptions();
	const { coId } = useSelectedCompanyCoId();
	const { selectedBranches } = useSidebarContext();
	const [isMounted, setIsMounted] = React.useState(false);
	const branchPrefillAppliedRef = React.useRef(false);
	const [lockedBranchId, setLockedBranchId] = React.useState<string | null>(() => (mode !== "create" && branchIdFromUrl ? String(branchIdFromUrl) : null));

	React.useEffect(() => {
		setIsMounted(true);
	}, []);

	const { getMenuId } = useMenuId({ transactionType: "salesOrder", menuIdFromUrl });
	const companyName = useCompanyName();

	const {
		initialValues,
		setInitialValues,
		formValues,
		setFormValues,
		formKey,
		bumpFormKey,
		formRef,
		handleFormValuesChange,
	} = useSalesOrderFormState({
		mode,
		buildDefaultFormValues,
		branchIdFromUrl,
	});

	const [soDetails, setSODetails] = React.useState<SalesOrderDetails | null>(null);
	const [loading, setLoading] = React.useState<boolean>(mode !== "create");
	const [pageError, setPageError] = React.useState<string | null>(null);

	// Branch value resolution
	const branchValue = React.useMemo(() => {
		if (lockedBranchId) return lockedBranchId;
		const fromForm = formValues.branch != null ? String(formValues.branch) : "";
		if (fromForm) return fromForm;
		return branchIdFromUrl ? String(branchIdFromUrl) : "";
	}, [formValues.branch, branchIdFromUrl, lockedBranchId]);

	const resolvedBranchOptions = React.useMemo(() => {
		if (!branchValue) return branchOptions;
		const exists = branchOptions.some((opt) => String(opt.value) === String(branchValue));
		if (exists) return branchOptions;
		const fallbackLabel =
			(soDetails?.branch && typeof soDetails.branch === "string" ? soDetails.branch : undefined) ||
			branchValue;
		return [...branchOptions, { label: fallbackLabel, value: branchValue }];
	}, [branchOptions, branchValue, soDetails?.branch]);

	const branchIdForSetup = React.useMemo(() => {
		if (!branchValue || !/^\d+$/.test(branchValue)) return undefined;
		return branchValue;
	}, [branchValue]);

	// Setup params with stable reference
	const setupParamsRef = React.useRef<typeof EMPTY_SETUP_PARAMS>(EMPTY_SETUP_PARAMS);
	const setupParams = React.useMemo(() => {
		const currentBranchId = branchIdForSetup;
		const prevBranchId = setupParamsRef.current.branchId;
		if (currentBranchId === prevBranchId) return setupParamsRef.current;
		if (!currentBranchId) {
			setupParamsRef.current = EMPTY_SETUP_PARAMS;
			return EMPTY_SETUP_PARAMS;
		}
		setupParamsRef.current = { branchId: currentBranchId };
		return setupParamsRef.current;
	}, [branchIdForSetup]);

	const memoizedMapSetupResponse = React.useCallback(mapSalesOrderSetupResponse, []);
	const memoizedFetchSetup1 = React.useCallback(fetchSalesOrderSetup1, []);

	const setupEnabled = React.useMemo(() => Boolean(coId && branchIdForSetup), [coId, branchIdForSetup]);

	const { data: setupData, loading: setupLoading, error: setupError } = useTransactionSetup<{ branchId?: string }, Record<string, unknown>, SalesOrderSetupData>({
		coId: coId || undefined,
		params: setupParams,
		fetcher: memoizedFetchSetup1,
		mapData: memoizedMapSetupResponse,
		enabled: setupEnabled,
	});

	const headerFieldsDisabled = React.useMemo(() => {
		if (mode === "view") return true;
		if (mode === "edit") return false;
		return !branchIdForSetup;
	}, [mode, branchIdForSetup]);

	// Extract setup data
	const customers = setupData?.customers ?? EMPTY_CUSTOMERS;
	const brokers = setupData?.brokers ?? EMPTY_BROKERS;
	const transporters = setupData?.transporters ?? EMPTY_TRANSPORTERS;
	const approvedQuotations = setupData?.approvedQuotations ?? EMPTY_QUOTATIONS;
	const itemGroups = setupData?.itemGroups ?? EMPTY_ITEM_GROUPS;
	const coConfig = setupData?.coConfig;
	const invoiceTypes = setupData?.invoiceTypes ?? EMPTY_INVOICE_TYPES;
	const branchAddresses = setupData?.branchAddresses ?? EMPTY_BRANCH_ADDRESSES;

	const quotationRequired = React.useMemo(
		() => Boolean(coConfig?.quotation_required),
		[coConfig?.quotation_required],
	);

	// Item group cache
	const fetchItemGroupDetail = React.useCallback(async (itemGroupId: string) => {
		if (!itemGroupId || !/^\d+$/.test(itemGroupId)) {
			throw new Error(`Invalid item group identifier: ${itemGroupId}`);
		}
		const response = await fetchSalesOrderSetup2(itemGroupId);
		return mapItemGroupDetailResponse(response);
	}, []);

	// Sync lockedBranchId for edit/view mode
	React.useEffect(() => {
		if (mode === "create") return;
		if (branchPrefillAppliedRef.current) return;
		if (!branchIdFromUrl) return;
		branchPrefillAppliedRef.current = true;
		setLockedBranchId(String(branchIdFromUrl));
	}, [branchIdFromUrl, mode]);

	const handleItemGroupError = React.useCallback((error: unknown) => {
		const description = error instanceof Error ? error.message : "Please try again.";
		toast({ variant: "destructive", title: "Unable to load item options", description });
	}, []);

	const { cache: itemGroupCache, loading: itemGroupLoading, ensure: ensureItemGroupData } =
		useDeferredOptionCache<string, ItemGroupCacheEntry>({
			fetcher: fetchItemGroupDetail,
			onError: handleItemGroupError,
		});

	// Derive customer branches from selected customer
	const customerBranches = React.useMemo(() => {
		const selectedPartyId = String(formValues.party ?? "");
		if (!selectedPartyId) return [];
		const customer = customers.find((c) => c.id === selectedPartyId);
		return customer?.branches ?? [];
	}, [formValues.party, customers]);

	// Derive billing/shipping state from party (customer) branches
	const billingToState = React.useMemo(() => {
		const billingId = String(formValues.billing_to ?? "");
		if (!billingId) return undefined;
		return customerBranches.find((b) => b.id === billingId)?.stateName;
	}, [formValues.billing_to, customerBranches]);

	const shippingToState = React.useMemo(() => {
		const shippingId = String(formValues.shipping_to ?? "");
		if (!shippingId) return undefined;
		return customerBranches.find((b) => b.id === shippingId)?.stateName;
	}, [formValues.shipping_to, customerBranches]);

	// Clear party-dependent fields when customer changes
	const prevPartyRef = React.useRef<string>("");
	React.useEffect(() => {
		if (mode === "view") return;
		const currentParty = String(formValues.party ?? "");
		if (prevPartyRef.current !== "" && prevPartyRef.current !== currentParty) {
			setFormValues((prev) => ({ ...prev, party_branch: "", billing_to: "", shipping_to: "" }));
		}
		prevPartyRef.current = currentParty;
	}, [formValues.party, mode, setFormValues]);

	// Line items
	const {
		lineItems,
		setLineItems,
		replaceItems,
		removeLineItems,
		handleLineFieldChange,
		handleQuotationItemsConfirm,
		mapLineToEditable,
		filledLineItems,
		lineItemsValid,
		itemGroupsFromLineItems,
	} = useSalesOrderLineItems({
		mode,
		coConfig,
		billingToState,
		shippingToState,
		itemGroupCache,
		itemGroupLoading,
		ensureItemGroupData,
		itemGroups,
	});

	// Seed an initial blank line in create mode
	const initialLineSeededRef = React.useRef(false);
	React.useEffect(() => {
		if (mode !== "create") {
			initialLineSeededRef.current = false;
			return;
		}
		if (initialLineSeededRef.current) return;
		setLineItems((prev) => {
			if (prev.length) return prev;
			initialLineSeededRef.current = true;
			return [createBlankLine()];
		});
	}, [mode, setLineItems]);

	const { taxType } = useSalesOrderTaxCalculations({
		mode,
		coConfig,
		billingToState,
		shippingToState,
		setLineItems,
	});

	// Calculate totals
	const totals = React.useMemo(() => {
		const grossAmount = filledLineItems.reduce((sum, li) => sum + (li.amount ?? 0), 0);
		const totalTax = filledLineItems.reduce((sum, li) => sum + (li.taxAmount ?? 0), 0);
		const freightCharges = Number(formValues.freight_charges) || 0;
		const netAmount = grossAmount + totalTax + freightCharges;
		return { grossAmount, totalTax, freightCharges, netAmount };
	}, [filledLineItems, formValues.freight_charges]);

	// Fetch details for edit/view
	const detailsFetchKey = React.useMemo(
		() => [mode, requestedId || "", branchIdForSetup || branchIdFromUrl || "", coId || ""].join("|"),
		[mode, requestedId, branchIdForSetup, branchIdFromUrl, coId],
	);

	const lastDetailsKeyRef = React.useRef<string | null>(null);
	const detailsFetchedRef = React.useRef(false);

	React.useEffect(() => {
		if (lastDetailsKeyRef.current !== detailsFetchKey) {
			lastDetailsKeyRef.current = detailsFetchKey;
			detailsFetchedRef.current = false;
		}
	}, [detailsFetchKey]);

	React.useEffect(() => {
		if (mode === "create") {
			setSODetails(null);
			setPageError(null);
			setLoading(false);
			return;
		}

		if (!requestedId) {
			setSODetails(null);
			setPageError("Sales order id is required to load details.");
			setLoading(false);
			return;
		}

		if (!setupEnabled) return;
		if (setupLoading) return;
		if (!setupData) return;
		if (detailsFetchedRef.current) return;

		detailsFetchedRef.current = true;

		let cancelled = false;
		const fetchDetails = async () => {
			setLoading(true);
			try {
				const details = await getSalesOrderById(requestedId, coId || undefined, getMenuId() || undefined);
				if (cancelled) return;

				setSODetails(details);
				const defaultFormValues = buildDefaultFormValues();
				const nextValues = mapSalesOrderDetailsToFormValues(details, defaultFormValues);

				const detailsBranch = details as unknown as { branch_id?: unknown; branchId?: unknown };
				const branchIdFromDetails = detailsBranch?.branch_id ?? detailsBranch?.branchId ?? details?.branch;
				const resolvedBranchValue = (() => {
					if (branchIdFromDetails != null && branchIdFromDetails !== "") return String(branchIdFromDetails);
					if (branchIdFromUrl) return String(branchIdFromUrl);
					if (branchValue && /^\d+$/.test(branchValue)) return branchValue;
					const mappedValue = nextValues.branch != null ? String(nextValues.branch) : "";
					return /^\d+$/.test(mappedValue) ? mappedValue : "";
				})();

				if (resolvedBranchValue) {
					nextValues.branch = resolvedBranchValue;
					setLockedBranchId(resolvedBranchValue);
				}

				setInitialValues(nextValues);
				setFormValues(nextValues);
				bumpFormKey();

				const normalizedLines = (details.lines ?? []).map((line) => mapLineToEditable(line));
				replaceItems(normalizedLines);

				setPageError(null);
			} catch (error) {
				if (cancelled) return;
				const description = error instanceof Error ? error.message : "Unable to load sales order.";
				setSODetails(null);
				setPageError(description);
				toast({ variant: "destructive", title: "Unable to load sales order", description });
			} finally {
				if (!cancelled) setLoading(false);
			}
		};

		void fetchDetails();

		return () => {
			cancelled = true;
		};
	}, [
		mode, requestedId, coId, getMenuId,
		setInitialValues, setFormValues, bumpFormKey,
		replaceItems, mapLineToEditable,
		setupEnabled, setupLoading, setupData,
		branchIdFromUrl, branchValue,
	]);

	// Pre-load item group data for existing line items
	React.useEffect(() => {
		if (!soDetails?.lines?.length) return;
		const uniqueGroups = new Set(
			soDetails.lines
				.map((line) => (line.itemGroup ? String(line.itemGroup) : ""))
				.filter((groupId) => groupId && /^\d+$/.test(groupId)),
		);
		uniqueGroups.forEach((groupId) => ensureItemGroupData(groupId));
	}, [soDetails, ensureItemGroupData]);

	const isLineItemsReady = React.useMemo(() => {
		if (mode === "view" || pageError || setupError) return true;
		return lineItemsValid;
	}, [lineItemsValid, mode, pageError, setupError]);

	// Quotation load handler
	const handleQuotationSelect = React.useCallback(async () => {
		const quotationId = String(formValues.quotation ?? "");
		if (!quotationId) {
			toast({ variant: "destructive", title: "Please select a quotation first" });
			return;
		}
		try {
			const result = await getQuotationLines(quotationId);
			const items = Array.isArray(result?.data) ? result.data : [];
			if (!items.length) {
				toast({ title: "No line items found in the selected quotation" });
				return;
			}
			handleQuotationItemsConfirm(items);
			toast({ title: `Loaded ${items.length} item(s) from quotation` });
		} catch (error) {
			toast({ variant: "destructive", title: "Failed to load quotation items", description: error instanceof Error ? error.message : "Please try again." });
		}
	}, [formValues.quotation, handleQuotationItemsConfirm]);

	// Select options
	const {
		customerOptions,
		customerBranchOptions,
		brokerOptions,
		transporterOptions,
		quotationOptions,
		invoiceTypeOptions,
		itemGroupOptions,
		getItemGroupLabel,
		getItemOptions,
		getMakeOptions,
		getUomOptions,
		getUomConversions,
		getItemLabel,
		getUomLabel,
	} = useSalesOrderSelectOptions({
		customers,
		customerBranches,
		brokers,
		transporters,
		approvedQuotations,
		branchAddresses,
		invoiceTypes,
		itemGroupsFromLineItems,
		itemGroupCache,
	});

	const headerSchema = useSalesOrderHeaderSchema({
		branchOptions: resolvedBranchOptions,
		customerOptions,
		customerBranchOptions,
		brokerOptions,
		transporterOptions,
		quotationOptions,
		invoiceTypeOptions,
		quotationRequired,
		mode,
		headerFieldsDisabled,
	});

	const canEdit = mode !== "view";

	const lineItemColumns = useSalesOrderLineItemColumns({
		canEdit,
		invoiceTypeId: String(formValues.invoice_type ?? ""),
		itemGroupOptions,
		itemGroupLoading,
		getItemOptions,
		getMakeOptions,
		getUomOptions,
		getUomConversions,
		getItemGroupLabel,
		handleLineFieldChange,
	});

	const {
		approvalLoading,
		approvalInfo,
		approvalPermissions,
		statusChipProps,
		handleApprove,
		handleReject,
		handleOpen,
		handleCancelDraft,
		handleReopen,
		handleSendForApproval,
		handleViewApprovalLog,
	} = useSalesOrderApproval({
		mode,
		requestedId,
		formValues,
		details: soDetails,
		coId: coId || undefined,
		getMenuId,
		setDetails: setSODetails,
	});

	// Preview data
	const previewHeader = React.useMemo(
		() => ({
			salesNo: soDetails?.salesNo,
			salesOrderDate: (formValues.date as string) || soDetails?.salesOrderDate,
			branch: resolvedBranchOptions.find((o) => String(o.value) === branchValue)?.label ?? branchValue,
			customerName: customerOptions.find((o) => String(o.value) === String(formValues.party))?.label ?? soDetails?.partyName,
			brokerName: brokerOptions.find((o) => String(o.value) === String(formValues.broker))?.label ?? soDetails?.brokerName ?? undefined,
			transporterName: transporterOptions.find((o) => String(o.value) === String(formValues.transporter))?.label ?? soDetails?.transporterName ?? undefined,
			status: statusChipProps?.label ?? soDetails?.status,
			companyName,
		}),
		[
			soDetails, formValues.date, formValues.party, formValues.broker, formValues.transporter,
			branchValue, resolvedBranchOptions, customerOptions, brokerOptions, transporterOptions,
			statusChipProps?.label, companyName,
		],
	);

	const previewItems = React.useMemo(() => {
		return filledLineItems.map((line, index) => {
			const itemLabel = getItemLabel(line.itemGroup, line.item);
			const uomOptions = getUomOptions(line.itemGroup, line.item);
			const uomLabel = uomOptions.find((opt) => opt.value === line.uom)?.label ?? line.uom ?? "-";
			return {
				index: index + 1,
				itemName: itemLabel !== "-" ? itemLabel : line.item || "-",
				quantity: line.quantity || "-",
				uom: uomLabel,
				rate: line.rate || "-",
				amount: line.amount ?? "-",
				gst: line.taxAmount ?? "-",
				total: ((line.amount ?? 0) + (line.taxAmount ?? 0)) || "-",
			};
		});
	}, [filledLineItems, getItemLabel, getUomOptions]);

	const previewRemarks = React.useMemo(() => {
		return (formValues.internal_note as string) || soDetails?.internalNote || (formValues.footer_note as string) || soDetails?.footerNote || "";
	}, [formValues.internal_note, formValues.footer_note, soDetails?.internalNote, soDetails?.footerNote]);

	const { metadata } = useTransactionPreview({
		header: previewHeader,
		fields: [
			{ label: "SO No", accessor: (header) => header.salesNo || "Pending" },
			{ label: "Order Date", accessor: (header) => header.salesOrderDate || "-" },
			{ label: "Customer", accessor: (header) => header.customerName || "-" },
			{ label: "Status", accessor: (header) => header.status || "-", includeWhen: (header) => Boolean(header.status) },
		],
	});

	const {
		saving,
		handleFormSubmit,
	} = useSalesOrderFormSubmission({
		mode,
		pageError,
		setupError,
		filledLineItems,
		isLineItemsReady,
		requestedId,
	});

	const primaryActionLabel = mode === "create" ? "Create" : "Save";
	const handleSaveClick = React.useCallback(() => {
		if (!formRef.current?.submit) return;
		void formRef.current.submit();
	}, [formRef]);

	// Wrap submit to inject notes fields (rendered outside MuiForm) into the submitted values
	const handleFormSubmitWithNotes = React.useCallback(
		async (values: Record<string, unknown>) => {
			const merged = {
				...values,
				footer_note: formValues.footer_note ?? "",
				internal_note: formValues.internal_note ?? "",
				terms_conditions: formValues.terms_conditions ?? "",
			};
			await handleFormSubmit(merged);
		},
		[handleFormSubmit, formValues.footer_note, formValues.internal_note, formValues.terms_conditions],
	);

	const pageTitle = React.useMemo(() => {
		if (mode === "create") return "Create Sales Order";
		if (mode === "edit") {
			return soDetails?.salesNo ? `Edit SO ${soDetails.salesNo}` : "Edit Sales Order";
		}
		return soDetails?.salesNo ? `Sales Order ${soDetails.salesNo}` : "Sales Order Details";
	}, [mode, soDetails?.salesNo]);

	return (
		<TransactionWrapper
			title={pageTitle}
			subtitle={mode === "create" ? "Create a new sales order" : mode === "edit" ? "Edit sales order" : "View sales order details"}
			metadata={metadata}
			statusChip={statusChipProps}
			backAction={{ onClick: () => router.push("/dashboardportal/sales/salesOrder") }}
			loading={loading || setupLoading}
			alerts={pageError ? <div role="alert" aria-live="assertive" className="text-red-600">{pageError}</div> : undefined}
			preview={
				<SalesOrderPreview
					header={previewHeader}
					items={previewItems}
					remarks={previewRemarks}
				/>
			}
			lineItems={{
				items: lineItems,
				getItemId: (item) => item.id,
				canEdit,
				columns: lineItemColumns,
				placeholder: "Add line items to the sales order",
				selectionColumnWidth: "28px",
			}}
				footer={
					<div className="space-y-6 pt-4 border-t">
						<SalesOrderTotalsDisplay
							grossAmount={totals.grossAmount}
							totalTax={totals.totalTax}
							freightCharges={totals.freightCharges}
							netAmount={totals.netAmount}
							taxType={taxType || undefined}
						/>
						<div className="grid grid-cols-1 gap-4 pt-2">
							<TextField
								label="Footer Note"
								multiline
								minRows={2}
								fullWidth
								size="small"
								value={String(formValues.footer_note ?? "")}
								onChange={(e) => setFormValues((prev) => ({ ...prev, footer_note: e.target.value }))}
								disabled={mode === "view"}
							/>
							<TextField
								label="Internal Note"
								multiline
								minRows={2}
								fullWidth
								size="small"
								value={String(formValues.internal_note ?? "")}
								onChange={(e) => setFormValues((prev) => ({ ...prev, internal_note: e.target.value }))}
								disabled={mode === "view"}
							/>
							<TextField
								label="Terms and Conditions"
								multiline
								minRows={3}
								fullWidth
								size="small"
								value={String(formValues.terms_conditions ?? "")}
								onChange={(e) => setFormValues((prev) => ({ ...prev, terms_conditions: e.target.value }))}
								disabled={mode === "view"}
							/>
						</div>
						<SalesOrderApprovalBar
							approvalInfo={approvalInfo}
							permissions={approvalPermissions}
							loading={approvalLoading}
							onApprove={handleApprove}
							onReject={handleReject}
							onOpen={handleOpen}
							onCancelDraft={handleCancelDraft}
							onReopen={handleReopen}
							onSendForApproval={handleSendForApproval}
							onViewApprovalLog={handleViewApprovalLog}
						/>
						{mode !== "view" ? (
							<div className="flex justify-end pt-2">
								<Button type="button" onClick={handleSaveClick} disabled={saving || setupLoading || !isLineItemsReady}>
									{saving ? "Processing..." : primaryActionLabel}
								</Button>
							</div>
						) : null}
					</div>
				}
		>
			<SalesOrderHeaderForm
				schema={headerSchema}
				formKey={formKey}
				initialValues={initialValues}
				mode={mode}
				formRef={formRef}
				onSubmit={handleFormSubmitWithNotes}
				onValuesChange={handleFormValuesChange}
				showQuotationButton={quotationRequired && mode !== "view"}
				onQuotationSelect={handleQuotationSelect}
				quotationButtonDisabled={!isMounted || !formValues.quotation}
			/>
		</TransactionWrapper>
	);
}
