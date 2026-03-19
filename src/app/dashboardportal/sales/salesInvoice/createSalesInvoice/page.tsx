"use client";

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
	fetchInvoiceSetup1,
	fetchInvoiceSetup2,
	getInvoiceById,
	type InvoiceDetails,
} from "@/utils/salesInvoiceService";
import useSelectedCompanyCoId from "@/hooks/use-selected-company-coid";
import { toast } from "@/hooks/use-toast";
import { useMenuId } from "@/hooks/useMenuId";
import { useCompanyName } from "@/hooks/useCompanyName";

import { SalesInvoiceHeaderForm } from "./components/SalesInvoiceHeaderForm";
import { SalesInvoiceFooterForm, SalesInvoiceTotalsDisplay } from "./components/SalesInvoiceFooter";
import { SalesInvoiceApprovalBar } from "./components/SalesInvoiceApprovalBar";
import SalesInvoicePreview from "./components/SalesInvoicePreview";
import { useInvoiceLineItemColumns } from "./components/SalesInvoiceLineItemsTable";
import { DeliveryOrderLinesDialog } from "./components/DeliveryOrderLinesDialog";

import { useSalesInvoiceFormState } from "./hooks/useSalesInvoiceFormState";
import { useSalesInvoiceLineItems } from "./hooks/useSalesInvoiceLineItems";
import { useSalesInvoiceSelectOptions } from "./hooks/useSalesInvoiceSelectOptions";
import { useSalesInvoiceHeaderSchema, useSalesInvoiceJuteHeaderSchema, useSalesInvoiceFooterSchema } from "./hooks/useSalesInvoiceFormSchemas";
import { useSalesInvoiceFormSubmission } from "./hooks/useSalesInvoiceFormSubmission";
import { useSalesInvoiceApproval } from "./hooks/useSalesInvoiceApproval";

import type { ItemGroupCacheEntry, InvoiceSetupData } from "./types/salesInvoiceTypes";
import { mapItemGroupDetailResponse, mapInvoiceSetupResponse, mapInvoiceDetailsToFormValues, buildMukamOptions } from "./utils/salesInvoiceMappers";
import { calculateInvoiceTotals } from "./utils/salesInvoiceCalculations";
import { buildDefaultFormValues, createBlankLine } from "./utils/salesInvoiceFactories";
import {
	EMPTY_CUSTOMERS,
	EMPTY_TRANSPORTERS,
	EMPTY_BROKERS,
	EMPTY_APPROVED_DELIVERY_ORDERS,
	EMPTY_APPROVED_SALES_ORDERS,
	EMPTY_ITEM_GROUPS,
	EMPTY_INVOICE_TYPES,
	EMPTY_SETUP_PARAMS,
	isRawJuteInvoice,
} from "./utils/salesInvoiceConstants";

function InvoicePageLoading() {
	return (
		<div className="flex items-center justify-center min-h-100">
			<div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
		</div>
	);
}

export default function InvoiceTransactionPage() {
	return (
		<Suspense fallback={<InvoicePageLoading />}>
			<InvoiceTransactionPageContent />
		</Suspense>
	);
}

function InvoiceTransactionPageContent() {
	const [mounted, setMounted] = React.useState(false);
	React.useEffect(() => { setMounted(true); }, []);

	const router = useRouter();
	const searchParams = useSearchParams();

	const modeParam = (searchParams?.get("mode") || "create").toLowerCase();
	const requestedId = searchParams?.get("id") || "";
	const branchIdFromUrl = searchParams?.get("branch_id") || "";
	const menuIdFromUrl = searchParams?.get("menu_id") || "";

	const mode: MuiFormMode = modeParam === "edit" ? "edit" : modeParam === "view" ? "view" : "create";

	const branchOptions = useBranchOptions();
	const { coId } = useSelectedCompanyCoId();
	const [lockedBranchId, setLockedBranchId] = React.useState<string | null>(() => (mode !== "create" && branchIdFromUrl ? String(branchIdFromUrl) : null));
	const branchPrefillAppliedRef = React.useRef(false);

	const { getMenuId } = useMenuId({ transactionType: "sales-invoice", menuIdFromUrl });
	const companyName = useCompanyName();

	const {
		initialValues, setInitialValues, formValues, setFormValues,
		formKey, bumpFormKey, formRef,
		handleMainFormValuesChange, handleFooterFormValuesChange,
	} = useSalesInvoiceFormState({ mode, buildDefaultFormValues, branchIdFromUrl });

	const [invoiceDetails, setInvoiceDetails] = React.useState<InvoiceDetails | null>(null);
	const [loading, setLoading] = React.useState<boolean>(mode !== "create");
	const [pageError, setPageError] = React.useState<string | null>(null);
	const [doDialogOpen, setDODialogOpen] = React.useState(false);

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
		const fallbackLabel = (invoiceDetails?.branch && typeof invoiceDetails.branch === "string" ? invoiceDetails.branch : undefined) || branchValue;
		return [...branchOptions, { label: fallbackLabel, value: branchValue }];
	}, [branchOptions, branchValue, invoiceDetails?.branch]);

	const branchIdForSetup = React.useMemo(() => {
		if (!branchValue || !/^\d+$/.test(branchValue)) return undefined;
		return branchValue;
	}, [branchValue]);

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

	const memoizedMapSetupResponse = React.useCallback(mapInvoiceSetupResponse, []);
	const memoizedFetchSetup1 = React.useCallback(fetchInvoiceSetup1, []);

	const setupEnabled = React.useMemo(() => Boolean(coId && branchIdForSetup), [coId, branchIdForSetup]);

	const { data: setupData, loading: setupLoading, error: setupError } = useTransactionSetup<{ branchId?: string }, Record<string, unknown>, InvoiceSetupData>({
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

	const customers = setupData?.customers ?? EMPTY_CUSTOMERS;
	const transporters = setupData?.transporters ?? EMPTY_TRANSPORTERS;
	const brokers = setupData?.brokers ?? EMPTY_BROKERS;
	const approvedDeliveryOrders = setupData?.approvedDeliveryOrders ?? EMPTY_APPROVED_DELIVERY_ORDERS;
	const approvedSalesOrders = setupData?.approvedSalesOrders ?? EMPTY_APPROVED_SALES_ORDERS;
	const itemGroups = setupData?.itemGroups ?? EMPTY_ITEM_GROUPS;
	const invoiceTypes = setupData?.invoiceTypes ?? EMPTY_INVOICE_TYPES;

	const fetchItemGroupDetail = React.useCallback(async (itemGroupId: string) => {
		if (!itemGroupId || !/^\d+$/.test(itemGroupId)) {
			throw new Error(`Invalid item group identifier: ${itemGroupId}`);
		}
		const response = await fetchInvoiceSetup2(itemGroupId);
		return mapItemGroupDetailResponse(response);
	}, []);

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

	const selectedPartyId = formValues.party ? String(formValues.party) : undefined;
	const selectedCustomer = React.useMemo(
		() => customers.find((c) => c.id === selectedPartyId),
		[customers, selectedPartyId],
	);
	const partyBranchId = formValues.party_branch ? String(formValues.party_branch) : undefined;
	const shippingBranchId = formValues.shipping_to ? String(formValues.shipping_to) : undefined;
	const partyState = React.useMemo(() => {
		if (!partyBranchId || !selectedCustomer?.branches) return undefined;
		return selectedCustomer.branches.find((b) => b.id === partyBranchId)?.stateName;
	}, [partyBranchId, selectedCustomer]);
	const shippingState = React.useMemo(() => {
		if (!shippingBranchId || !selectedCustomer?.branches) return partyState;
		return selectedCustomer.branches.find((b) => b.id === shippingBranchId)?.stateName ?? partyState;
	}, [shippingBranchId, selectedCustomer, partyState]);

	// Derive company branch state_code from setup data
	const companyBranchStateCode = React.useMemo(() => {
		if (!setupData?.branches || !branchValue) return undefined;
		const branch = setupData.branches.find((b) => String(b.branch_id) === branchValue);
		return branch?.state_code;
	}, [setupData, branchValue]);

	// Auto-fill shipping_state_code and intra_inter_state based on shipping_to selection
	React.useEffect(() => {
		if (mode === "view") return;
		const shippingBranch = shippingBranchId && selectedCustomer?.branches
			? selectedCustomer.branches.find((b) => b.id === shippingBranchId)
			: undefined;
		const shippingStateCode = shippingBranch?.stateCode ?? "";

		setFormValues((prev) => {
			const updates: Record<string, unknown> = {};
			if (prev.shipping_state_code !== shippingStateCode) {
				updates.shipping_state_code = shippingStateCode;
			}
			if (companyBranchStateCode && shippingStateCode) {
				const intraInter = companyBranchStateCode === shippingStateCode ? "0" : "1";
				if (prev.intra_inter_state !== intraInter) {
					updates.intra_inter_state = intraInter;
				}
			}
			if (Object.keys(updates).length === 0) return prev;
			return { ...prev, ...updates };
		});
	}, [shippingBranchId, selectedCustomer, companyBranchStateCode, mode, setFormValues]);

	// Auto-fill billing_state_code based on billing_to selection
	const billingBranchId = formValues.billing_to ? String(formValues.billing_to) : undefined;
	React.useEffect(() => {
		if (mode === "view") return;
		const billingBranch = billingBranchId && selectedCustomer?.branches
			? selectedCustomer.branches.find((b) => b.id === billingBranchId)
			: undefined;
		const billingStateCode = billingBranch?.stateCode ?? "";
		setFormValues((prev) => {
			if (prev.billing_state_code === billingStateCode) return prev;
			return { ...prev, billing_state_code: billingStateCode };
		});
	}, [billingBranchId, selectedCustomer, mode, setFormValues]);

	// Auto-fill sales_order_id from delivery order when DO is selected
	React.useEffect(() => {
		if (mode === "view") return;
		const doId = formValues.delivery_order ? String(formValues.delivery_order) : "";
		if (!doId) return;
		const doRecord = approvedDeliveryOrders.find((d) => d.id === doId);
		if (!doRecord?.salesOrderId) return;
		const soId = String(doRecord.salesOrderId);
		setFormValues((prev) => {
			if (prev.sales_order_id === soId) return prev;
			return {
				...prev,
				sales_order_id: soId,
				sales_order_date: doRecord.salesOrderDate ?? "",
			};
		});
	}, [formValues.delivery_order, approvedDeliveryOrders, mode, setFormValues]);

	// Auto-fill sales_order_date and payment_terms when sales_order_id changes
	React.useEffect(() => {
		if (mode === "view") return;
		const soId = formValues.sales_order_id ? String(formValues.sales_order_id) : "";
		if (!soId) {
			setFormValues((prev) => {
				if (!prev.sales_order_date && !prev.payment_terms) return prev;
				return { ...prev, sales_order_date: "", payment_terms: "" };
			});
			return;
		}
		const soRecord = approvedSalesOrders.find((s) => s.id === soId);
		if (!soRecord) return;
		setFormValues((prev) => {
			const updates: Record<string, unknown> = {};
			const soDate = soRecord.salesOrderDate ?? "";
			if (prev.sales_order_date !== soDate) updates.sales_order_date = soDate;
			if (soRecord.paymentTerms != null) {
				const ptStr = String(soRecord.paymentTerms);
				if (prev.payment_terms !== ptStr) updates.payment_terms = ptStr;
			}
			if (Object.keys(updates).length === 0) return prev;
			return { ...prev, ...updates };
		});
	}, [formValues.sales_order_id, approvedSalesOrders, mode, setFormValues]);

	// Whether sales order dropdown should be disabled (auto-populated from DO)
	const salesOrderDisabled = React.useMemo(() => {
		const doId = formValues.delivery_order ? String(formValues.delivery_order) : "";
		if (!doId) return false;
		const doRecord = approvedDeliveryOrders.find((d) => d.id === doId);
		return Boolean(doRecord?.salesOrderId);
	}, [formValues.delivery_order, approvedDeliveryOrders]);

	const {
		lineItems, setLineItems, replaceItems, removeLineItems,
		handleLineFieldChange, handleDeliveryOrderLinesConfirm,
		mapLineToEditable, filledLineItems, lineItemsValid, itemGroupsFromLineItems,
	} = useSalesInvoiceLineItems({
		mode,
		partyState,
		shippingState,
		itemGroupCache,
		itemGroupLoading,
		ensureItemGroupData,
		itemGroups,
	});

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

	const juteFormRef = React.useRef<{ submit: () => Promise<void>; isDirty: () => boolean; setValue: (name: string, value: unknown) => void } | null>(null);

	// Auto-sum header claim amount from line item claim amounts for Raw Jute invoices
	React.useEffect(() => {
		const invoiceTypeId = String(formValues.invoice_type ?? "");
		if (!isRawJuteInvoice(invoiceTypeId)) return;
		if (mode === "view") return;

		const sum = filledLineItems.reduce(
			(acc, line) => acc + (Number(line.juteClaimAmountDtl) || 0),
			0,
		);
		const rounded = Number(sum.toFixed(2));

		setFormValues((prev) => {
			const current = Number(prev.jute_claim_amount) || 0;
			if (current === rounded) return prev;
			return { ...prev, jute_claim_amount: rounded };
		});

		juteFormRef.current?.setValue("jute_claim_amount", rounded);
	}, [filledLineItems, formValues.invoice_type, mode, setFormValues]);

	const freightCharges = Number(formValues.freight_charges) || 0;
	const roundOff = Number(formValues.round_off) || 0;
	const totals = React.useMemo(
		() => calculateInvoiceTotals(filledLineItems, freightCharges, roundOff),
		[filledLineItems, freightCharges, roundOff],
	);

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
			setInvoiceDetails(null);
			setPageError(null);
			setLoading(false);
			return;
		}

		if (!requestedId) {
			setInvoiceDetails(null);
			setPageError("Invoice id is required to load details.");
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
				const details = await getInvoiceById(requestedId, coId || undefined, getMenuId() || undefined);
				if (cancelled) return;

				setInvoiceDetails(details);
				const defaultFormValues = buildDefaultFormValues();
				const nextValues = mapInvoiceDetailsToFormValues(details, defaultFormValues);

				const detailsWithBranchId = details as unknown as { branch_id?: unknown; branchId?: unknown };
				const branchIdFromDetails = detailsWithBranchId?.branch_id ?? detailsWithBranchId?.branchId;
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
				const description = error instanceof Error ? error.message : "Unable to load sales invoice.";
				setInvoiceDetails(null);
				setPageError(description);
				toast({ variant: "destructive", title: "Unable to load sales invoice", description });
			} finally {
				if (!cancelled) setLoading(false);
			}
		};

		void fetchDetails();

		return () => { cancelled = true; };
	}, [
		mode, requestedId, coId, getMenuId,
		setInitialValues, setFormValues, bumpFormKey,
		replaceItems, mapLineToEditable,
		setupEnabled, setupLoading, setupData,
		branchIdFromUrl, branchValue,
	]);

	React.useEffect(() => {
		if (!invoiceDetails?.lines?.length) return;
		const uniqueGroups = new Set(
			invoiceDetails.lines
				.map((line) => (line.itemGroup ? String(line.itemGroup) : ""))
				.filter((groupId) => groupId && /^\d+$/.test(groupId)),
		);
		uniqueGroups.forEach((groupId) => { ensureItemGroupData(groupId); });
	}, [invoiceDetails, ensureItemGroupData]);

	const isLineItemsReady = React.useMemo(() => {
		if (mode === "view" || pageError || setupError) return true;
		return lineItemsValid;
	}, [lineItemsValid, mode, pageError, setupError]);

	const handleDOSelect = React.useCallback(() => {
		setDODialogOpen(true);
	}, []);

	const handleDOLinesConfirm = React.useCallback(
		(selectedItems: import("@/utils/salesInvoiceService").DeliveryOrderLineForInvoice[]) => {
			handleDeliveryOrderLinesConfirm(selectedItems);
			setDODialogOpen(false);
		},
		[handleDeliveryOrderLinesConfirm],
	);

	const {
		customerOptions, customerBranchOptions, transporterOptions, brokerOptions, deliveryOrderOptions, salesOrderOptions,
		invoiceTypeOptions, itemGroupOptions, getItemGroupLabel,
		getItemOptions, getMakeOptions, getUomOptions,
		getItemLabel, getMakeLabel, getUomLabel, getUomConversions, getOptionLabel,
	} = useSalesInvoiceSelectOptions({
		customers,
		transporters,
		brokers,
		approvedDeliveryOrders,
		approvedSalesOrders,
		invoiceTypes,
		itemGroupsFromLineItems,
		itemGroupCache,
		selectedPartyId,
	});

	const headerSchema = useSalesInvoiceHeaderSchema({
		branchOptions: resolvedBranchOptions,
		customerOptions,
		customerBranchOptions,
		transporterOptions,
		brokerOptions,
		deliveryOrderOptions,
		salesOrderOptions,
		invoiceTypeOptions,
		mode,
		headerFieldsDisabled,
		salesOrderDisabled,
	});

	const mukamOptions = React.useMemo(() => buildMukamOptions(setupData?.mukamList ?? []), [setupData?.mukamList]);
	const juteHeaderSchema = useSalesInvoiceJuteHeaderSchema({ mode, headerFieldsDisabled, mukamOptions, invoiceTypeId: String(formValues.invoice_type ?? "") });
	const footerSchema = useSalesInvoiceFooterSchema({ mode });

	const canEdit = mode !== "view";

	const lineItemColumns = useInvoiceLineItemColumns({
		canEdit,
		itemGroupOptions,
		getItemGroupLabel,
		getItemOptions,
		getItemLabel,
		getUomOptions,
		getUomLabel,
		onFieldChange: handleLineFieldChange,
		invoiceTypeId: String(formValues.invoice_type ?? ""),
		getUomConversions,
	});

	const {
		approvalLoading, approvalInfo, approvalPermissions, statusChipProps,
		handleApprove, handleReject, handleOpen, handleCancelDraft,
		handleReopen, handleSendForApproval, handleViewApprovalLog,
	} = useSalesInvoiceApproval({
		mode,
		requestedId,
		formValues,
		invoiceDetails,
		coId,
		getMenuId,
		setInvoiceDetails,
	});

	const branchLabel = React.useMemo(() => {
		const value = formValues.branch ?? invoiceDetails?.branch;
		return getOptionLabel(resolvedBranchOptions, value) ?? (typeof value === "string" ? value : undefined);
	}, [resolvedBranchOptions, formValues.branch, invoiceDetails?.branch, getOptionLabel]);

	const customerLabel = React.useMemo(() => {
		const value = formValues.party ?? invoiceDetails?.party;
		return getOptionLabel(customerOptions, value) ?? (typeof value === "string" ? value : undefined);
	}, [formValues.party, invoiceDetails?.party, customerOptions, getOptionLabel]);

	const customerBranchLabel = React.useMemo(() => {
		const value = formValues.party_branch ?? invoiceDetails?.partyBranch;
		return getOptionLabel(customerBranchOptions, value) ?? (typeof value === "string" ? value : undefined);
	}, [formValues.party_branch, invoiceDetails?.partyBranch, customerBranchOptions, getOptionLabel]);

	const billingToLabel = React.useMemo(() => {
		const value = formValues.billing_to ?? invoiceDetails?.billingTo;
		return getOptionLabel(customerBranchOptions, value) ?? (typeof value === "string" ? value : undefined);
	}, [formValues.billing_to, invoiceDetails?.billingTo, customerBranchOptions, getOptionLabel]);

	const shippingToLabel = React.useMemo(() => {
		const value = formValues.shipping_to ?? invoiceDetails?.shippingTo;
		return getOptionLabel(customerBranchOptions, value) ?? (typeof value === "string" ? value : undefined);
	}, [formValues.shipping_to, invoiceDetails?.shippingTo, customerBranchOptions, getOptionLabel]);

	const deliveryOrderLabel = React.useMemo(() => {
		const value = formValues.delivery_order ?? invoiceDetails?.deliveryOrder;
		return getOptionLabel(deliveryOrderOptions, value) ?? invoiceDetails?.deliveryOrderNo ?? (typeof value === "string" ? value : undefined);
	}, [formValues.delivery_order, invoiceDetails?.deliveryOrder, invoiceDetails?.deliveryOrderNo, deliveryOrderOptions, getOptionLabel]);

	const transporterLabel = React.useMemo(() => {
		const value = formValues.transporter ?? invoiceDetails?.transporter;
		return getOptionLabel(transporterOptions, value) ?? invoiceDetails?.transporterName ?? (typeof value === "string" ? value : undefined);
	}, [formValues.transporter, invoiceDetails?.transporter, invoiceDetails?.transporterName, transporterOptions, getOptionLabel]);

	const statusLabel = React.useMemo(() => statusChipProps?.label ?? invoiceDetails?.status, [statusChipProps?.label, invoiceDetails?.status]);

	const previewHeader = React.useMemo(
		() => ({
			invoiceNo: invoiceDetails?.invoiceNo,
			invoiceDate: (formValues.date as string) || invoiceDetails?.invoiceDate,
			challanNo: (formValues.challan_no as string) || invoiceDetails?.challanNo,
			challanDate: (formValues.challan_date as string) || invoiceDetails?.challanDate,
			branch: branchLabel,
			customer: customerLabel,
			customerBranch: customerBranchLabel,
			deliveryOrder: deliveryOrderLabel,
			billingTo: billingToLabel,
			shippingTo: shippingToLabel,
			transporter: transporterLabel,
			vehicleNo: (formValues.vehicle_no as string) || invoiceDetails?.vehicleNo,
			ewayBillNo: (formValues.eway_bill_no as string) || invoiceDetails?.ewayBillNo,
			ewayBillDate: (formValues.eway_bill_date as string) || invoiceDetails?.ewayBillDate,
			invoiceType: (formValues.invoice_type as string) || invoiceDetails?.invoiceType,
			companyName,
			status: statusLabel,
			updatedBy: invoiceDetails?.updatedBy,
			updatedAt: invoiceDetails?.updatedAt,
		}),
		[
			invoiceDetails, formValues.date, formValues.challan_no, formValues.challan_date,
			formValues.vehicle_no, formValues.eway_bill_no, formValues.eway_bill_date,
			formValues.invoice_type,
			branchLabel, customerLabel, customerBranchLabel, deliveryOrderLabel,
			billingToLabel, shippingToLabel, transporterLabel, companyName, statusLabel,
		],
	);

	const previewItems = React.useMemo(() => {
		return filledLineItems.map((line, index) => {
			const groupLabel = itemGroups.find((grp) => grp.id === line.itemGroup)?.label ?? line.itemGroup ?? "";
			const itemLabel = getItemLabel(line.itemGroup, line.item, line.itemCode);
			const uomLabel = getUomLabel(line.itemGroup, line.item, line.uom);
			const displayItem = (() => {
				const parts = [groupLabel, itemLabel].filter(Boolean);
				if (parts.length > 0) return parts.join(" — ");
				return line.item || "-";
			})();
			const discountType = (() => {
				if (line.discountType === 1) return "%";
				if (line.discountType === 2) return "Amt";
				return "";
			})();
			return {
				srNo: index + 1,
				itemGroup: groupLabel || undefined,
				item: displayItem,
				quantity: line.quantity || "-",
				uom: uomLabel,
				rate: line.rate,
				discountType,
				discountAmount: typeof line.discountAmount === "number" ? line.discountAmount : "",
				netAmount: typeof line.netAmount === "number" ? line.netAmount : "",
				remarks: line.remarks || "-",
			};
		});
	}, [filledLineItems, getItemLabel, getUomLabel, itemGroups]);

	const previewTotals = React.useMemo(
		() => ({
			grossAmount: totals.grossAmount,
			totalIGST: totals.totalIGST,
			totalCGST: totals.totalCGST,
			totalSGST: totals.totalSGST,
			freightCharges: totals.freightCharges,
			roundOff: totals.roundOff,
			netAmount: totals.netAmount,
		}),
		[totals],
	);

	const previewRemarks = React.useMemo(() => {
		return (
			(formValues.internal_note as string) ||
			invoiceDetails?.internalNote ||
			(formValues.footer_note as string) ||
			invoiceDetails?.footerNote ||
			""
		);
	}, [formValues.internal_note, formValues.footer_note, invoiceDetails?.internalNote, invoiceDetails?.footerNote]);

	const previewTermsConditions = React.useMemo(() => {
		return (formValues.terms_conditions as string) || invoiceDetails?.termsConditions || "";
	}, [formValues.terms_conditions, invoiceDetails?.termsConditions]);

	const { metadata } = useTransactionPreview({
		header: previewHeader,
		fields: [
			{ label: "Invoice No", accessor: (header) => header.invoiceNo || "Pending" },
			{ label: "Invoice Date", accessor: (header) => header.invoiceDate || "-" },
			{ label: "Customer", accessor: (header) => header.customer || "-" },
			{ label: "Status", accessor: (header) => header.status || "-", includeWhen: (header) => Boolean(header.status) },
		],
	});

	const { saving, handleFormSubmit } = useSalesInvoiceFormSubmission({
		mode,
		pageError,
		setupError,
		filledLineItems,
		isLineItemsReady,
		requestedId,
		formValues,
	});

	if (!mounted) return <InvoicePageLoading />;

	const primaryActionLabel = mode === "create" ? "Create" : "Save";
	const handleSaveClick = React.useCallback(() => {
		if (!formRef.current?.submit) return;
		void formRef.current.submit();
	}, [formRef]);

	const pageTitle = React.useMemo(() => {
		if (mode === "create") return "Create Sales Invoice";
		if (mode === "edit") {
			return invoiceDetails?.invoiceNo ? `Edit Invoice ${invoiceDetails.invoiceNo}` : "Edit Sales Invoice";
		}
		return invoiceDetails?.invoiceNo ? `Sales Invoice ${invoiceDetails.invoiceNo}` : "Sales Invoice Details";
	}, [mode, invoiceDetails?.invoiceNo]);

	const showDOButton = React.useMemo(() => {
		return mode !== "view" && Boolean(formValues.delivery_order);
	}, [mode, formValues.delivery_order]);

	return (
		<TransactionWrapper
			title={pageTitle}
			subtitle={mode === "create" ? "Create a new sales invoice" : mode === "edit" ? "Edit sales invoice" : "View sales invoice details"}
			metadata={metadata}
			statusChip={statusChipProps}
			backAction={{ onClick: () => router.push("/dashboardportal/sales/salesInvoice") }}
			loading={loading || setupLoading}
			alerts={pageError ? <div role="alert" aria-live="assertive" className="text-red-600">{pageError}</div> : undefined}
			preview={
				<SalesInvoicePreview
					header={previewHeader}
					items={previewItems}
					totals={previewTotals}
					remarks={previewRemarks}
					termsConditions={previewTermsConditions}
				/>
			}
			lineItems={{
				items: lineItems,
				getItemId: (item) => item.id,
				canEdit,
				columns: lineItemColumns,
				placeholder: "Add line items manually or import from a delivery order",
				selectionColumnWidth: "28px",
			}}
			footer={
				<div className="space-y-6 pt-4 border-t">
					<SalesInvoiceFooterForm
						schema={footerSchema}
						formKey={formKey}
						initialValues={initialValues}
						mode={mode}
						onSubmit={handleFormSubmit}
						onValuesChange={handleFooterFormValuesChange}
					/>
					<SalesInvoiceTotalsDisplay totals={totals} showGSTBreakdown={Boolean(partyState || shippingState)} />
					<SalesInvoiceApprovalBar
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
			<SalesInvoiceHeaderForm
				schema={headerSchema}
				formKey={formKey}
				initialValues={initialValues}
				mode={mode}
				formRef={formRef}
				onSubmit={handleFormSubmit}
				onValuesChange={handleMainFormValuesChange}
				showDeliveryOrderButton={showDOButton}
				onDeliveryOrderSelect={handleDOSelect}
				deliveryOrderButtonDisabled={!formValues.delivery_order}
				juteSchema={juteHeaderSchema}
				invoiceTypeId={String(formValues.invoice_type ?? "")}
				juteFormRef={juteFormRef}
			/>

			<DeliveryOrderLinesDialog
				open={doDialogOpen}
				onOpenChange={setDODialogOpen}
				onConfirm={handleDOLinesConfirm}
				deliveryOrderId={formValues.delivery_order ? String(formValues.delivery_order) : undefined}
			/>
		</TransactionWrapper>
	);
}
