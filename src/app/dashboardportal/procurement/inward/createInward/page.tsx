"use client";

import React, { Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import TransactionWrapper, { type TransactionAction } from "@/components/ui/TransactionWrapper";
import {
	useDeferredOptionCache,
	useTransactionSetup,
	useTransactionPreview,
} from "@/components/ui/transaction";
import { useBranchOptions } from "@/utils/branchUtils";
import {
	fetchInwardSetup1,
	fetchInwardSetup2,
	getInwardById,
	createInward,
	updateInward,
	type InwardDetails,
} from "@/utils/inwardService";
import { toast } from "@/hooks/use-toast";
import useSelectedCompanyCoId from "@/hooks/use-selected-company-coid";
import { useSidebarContext } from "@/components/dashboard/sidebarContext";
import type { MuiFormMode } from "@/components/ui/muiform";

// Types
import type { InwardSetupData, ItemGroupCacheEntry, POLineItem } from "./types/inwardTypes";

// Utils
import { EMPTY_SUPPLIERS, EMPTY_ITEM_GROUPS, EMPTY_SETUP_PARAMS } from "./utils/inwardConstants";
import { buildDefaultFormValues, createBlankLine } from "./utils/inwardFactories";
import { mapInwardSetupResponse, mapItemGroupDetailResponse, mapInwardDetailsToFormValues } from "./utils/inwardMappers";

// Hooks
import { useInwardFormState } from "./hooks/useInwardFormState";
import { useInwardLineItems } from "./hooks/useInwardLineItems";
import { useInwardApproval } from "./hooks/useInwardApproval";
import { useInwardFormSchema } from "./hooks/useInwardFormSchemas";
import { useInwardSelectOptions } from "./hooks/useInwardSelectOptions";

// Components
import { InwardHeaderForm } from "./components/InwardHeaderForm";
import { InwardApprovalBar } from "./components/InwardApprovalBar";
import InwardPreview from "./components/InwardPreview";
import { useInwardLineItemColumns } from "./components/InwardLineItemsTable";
import { POLineItemsDialog } from "./components/POLineItemsDialog";

// Loading fallback for Suspense
function InwardPageLoading() {
	return (
		<div className="flex items-center justify-center min-h-100">
			<div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
		</div>
	);
}

export default function InwardTransactionPage() {
	return (
		<Suspense fallback={<InwardPageLoading />}>
			<InwardTransactionPageContent />
		</Suspense>
	);
}

function InwardTransactionPageContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const pathname = usePathname();

	const modeParam = (searchParams?.get("mode") || "create").toLowerCase();
	const requestedId = searchParams?.get("id") || "";
	const menuIdFromUrl = searchParams?.get("menu_id") || "";

	const mode: MuiFormMode = modeParam === "edit" ? "edit" : modeParam === "view" ? "view" : "create";

	const branchOptions = useBranchOptions();
	const { coId } = useSelectedCompanyCoId();
	const { availableMenus, menuItems: sidebarMenuItems } = useSidebarContext();

	// Get menu_id from URL, or lookup from menuItems based on current path
	const getMenuId = React.useCallback((): string => {
		if (menuIdFromUrl) return menuIdFromUrl;

		if (availableMenus && availableMenus.length > 0) {
			const currentPath = pathname?.toLowerCase() || "";

			// First, try exact path match
			const matchingMenu = availableMenus.find((item) => {
				if (!item.menu_path) return false;
				const menuPath = item.menu_path.toLowerCase();
				return currentPath === menuPath || currentPath.startsWith(menuPath + "/");
			});
			if (matchingMenu?.menu_id) return String(matchingMenu.menu_id);

			// Second, try to find by "inward" in path or name
			const inwardMenu = availableMenus.find((item) => {
				const path = (item.menu_path || "").toLowerCase();
				const name = (item.menu_name || "").toLowerCase();
				return path.includes("inward") || path.includes("/procurement/inward") || name.includes("inward");
			});
			if (inwardMenu?.menu_id) return String(inwardMenu.menu_id);
		}

		// Fallback to sidebarMenuItems
		if (sidebarMenuItems && sidebarMenuItems.length > 0) {
			const inwardMenu = sidebarMenuItems.find((item) => {
				const path = (item.menu_path || "").toLowerCase();
				const name = (item.menu_name || "").toLowerCase();
				return path.includes("inward") || path.includes("/procurement/inward") || name.includes("inward");
			});
			if (inwardMenu?.menu_id) return String(inwardMenu.menu_id);
		}

		// Try localStorage
		if (typeof window !== "undefined" && pathname) {
			try {
				const storedMenuItems = localStorage.getItem("sidebar_menuItems");
				if (storedMenuItems) {
					const menuItems = JSON.parse(storedMenuItems) as Array<{ menu_id?: number; menu_path?: string; menu_name?: string }> | null;
					if (Array.isArray(menuItems)) {
						const inwardMenu = menuItems.find((item) => {
							const path = (item.menu_path || "").toLowerCase();
							const name = (item.menu_name || "").toLowerCase();
							return path.includes("inward") || path.includes("/procurement/inward") || name.includes("inward");
						});
						if (inwardMenu?.menu_id) return String(inwardMenu.menu_id);
					}
				}
			} catch {
				// Ignore errors
			}
		}

		return "";
	}, [menuIdFromUrl, pathname, availableMenus, sidebarMenuItems]);

	// Form state hook
	const { initialValues, setInitialValues, formValues, setFormValues, formKey, bumpFormKey, formRef } = useInwardFormState({ mode });

	// Inward details state
	const [inwardDetails, setInwardDetails] = React.useState<InwardDetails | null>(null);
	const [loading, setLoading] = React.useState<boolean>(mode !== "create");
	const [saving, setSaving] = React.useState(false);
	const [pageError, setPageError] = React.useState<string | null>(null);
	const [poDialogOpen, setPODialogOpen] = React.useState(false);

	// Item group cache
	const { cache: itemGroupCache, loading: itemGroupLoading, ensure: ensureItemGroupData, reset: resetItemGroupCache } =
		useDeferredOptionCache<string, ItemGroupCacheEntry>({
			fetcher: async (itemGroupId: string) => {
				if (!itemGroupId || !/^\d+$/.test(itemGroupId)) {
					throw new Error(`Invalid item group ID: ${itemGroupId}. Expected numeric ID.`);
				}
				const response = await fetchInwardSetup2(itemGroupId);
				return mapItemGroupDetailResponse(response);
			},
			onError: (error) => {
				const message = error instanceof Error ? error.message : "Unable to load item options.";
				toast({
					variant: "destructive",
					title: "Item data not available",
					description: message,
				});
			},
		});

	// Line items hook
	const {
		lineItems,
		setLineItems,
		replaceItems,
		removeLineItems,
		mapLineToEditable,
		handleLineFieldChange,
		handlePOItemsConfirm,
		filledLineItems,
		lineItemsValid,
	} = useInwardLineItems({
		mode,
		itemGroupCache,
		itemGroupLoading,
		ensureItemGroupData,
	});

	// Branch options prefill for create mode
	React.useEffect(() => {
		if (mode !== "create") return;
		if (!branchOptions.length) return;

		setFormValues((prev) => {
			const currentBranch = (prev.branch as string) || "";
			if (currentBranch) return prev;
			const next = { ...prev, branch: branchOptions[0].value };
			setInitialValues(next);
			bumpFormKey();
			return next;
		});
	}, [mode, branchOptions, setFormValues, setInitialValues, bumpFormKey]);

	// Reset item group cache on company change
	React.useEffect(() => {
		resetItemGroupCache();
	}, [coId, resetItemGroupCache]);

	// Load inward data for edit/view mode
	React.useEffect(() => {
		if (mode === "create") {
			setInwardDetails(null);
			setPageError(null);
			setLoading(false);
			return;
		}

		if (!requestedId) {
			setInwardDetails(null);
			replaceItems([]);
			setPageError("Missing inward identifier in the URL.");
			setLoading(false);
			return;
		}

		let cancelled = false;
		setLoading(true);

		const menuId = getMenuId();

		getInwardById(requestedId, coId ?? undefined, menuId || undefined)
			.then((detail) => {
				if (cancelled) return;
				setInwardDetails(detail);
				const defaults = buildDefaultFormValues();
				const nextValues = mapInwardDetailsToFormValues(detail as unknown as Record<string, unknown>, defaults);
				setInitialValues(nextValues);
				setFormValues(nextValues);
				bumpFormKey();
				const mappedLines = (detail.lines ?? []).map((line) => mapLineToEditable(line as unknown as Record<string, unknown>));
				replaceItems(mappedLines.length ? mappedLines : []);
				setPageError(null);
			})
			.catch((error) => {
				if (cancelled) return;
				setInwardDetails(null);
				replaceItems([]);
				setPageError(error instanceof Error ? error.message : "Unable to load inward details.");
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [mode, requestedId, mapLineToEditable, coId, getMenuId, setInitialValues, setFormValues, bumpFormKey, replaceItems]);

	// Setup data
	const branchValue = React.useMemo(() => String(formValues.branch ?? ""), [formValues.branch]);
	const branchIdForSetup = React.useMemo(() => (branchValue && /^\d+$/.test(branchValue) ? branchValue : undefined), [branchValue]);
	const setupParams = React.useMemo(
		() => (branchIdForSetup ? { branchId: branchIdForSetup } : EMPTY_SETUP_PARAMS),
		[branchIdForSetup]
	);

	const { data: setupData, loading: setupLoading, error: setupError } = useTransactionSetup<{ branchId?: string }, Record<string, unknown>, InwardSetupData>({
		coId: coId ?? undefined,
		params: setupParams,
		fetcher: fetchInwardSetup1,
		mapData: mapInwardSetupResponse,
		deps: [branchIdForSetup],
	});

	const suppliers = setupData?.suppliers ?? EMPTY_SUPPLIERS;
	const itemGroups = setupData?.itemGroups ?? EMPTY_ITEM_GROUPS;

	// Select options hook
	const {
		supplierOptions,
		itemGroupOptions,
		getSupplierLabel,
		getItemOptions,
		getMakeOptions,
		getUomOptions,
		labelResolvers,
		getOptionLabel,
	} = useInwardSelectOptions({
		suppliers,
		itemGroups,
		itemGroupCache,
	});

	// Form schema
	const headerFieldsDisabled = React.useMemo(() => {
		if (mode === "view") return true;
		if (mode === "edit") return false;
		return !branchIdForSetup;
	}, [mode, branchIdForSetup]);

	const schema = useInwardFormSchema({
		mode,
		branchOptions,
		supplierOptions,
		headerFieldsDisabled,
	});

	// Approval hook
	const {
		approvalLoading,
		approvalInfo,
		approvalPermissions,
		statusChipProps,
		handleOpen,
		handleCancelDraft,
		handleApprove,
		handleReject,
	} = useInwardApproval({
		mode,
		requestedId,
		formValues,
		inwardDetails,
		coId,
		getMenuId,
		setInwardDetails,
	});

	// Line item columns
	const canEdit = mode !== "view";
	const lineItemColumns = useInwardLineItemColumns({
		canEdit,
		itemGroupOptions,
		itemGroupLoading,
		labelResolvers,
		getItemOptions,
		getMakeOptions,
		getUomOptions,
		handleLineFieldChange,
	});

	// Validation: Either challan or invoice must be filled
	const validateChallanInvoice = React.useCallback((values: Record<string, unknown>): boolean => {
		const challanNo = String(values.challan_no ?? "").trim();
		const invoiceNo = String(values.invoice_no ?? "").trim();
		return Boolean(challanNo || invoiceNo);
	}, []);

	// Form submit handler
	const handleFormSubmit = React.useCallback(
		async (values: Record<string, unknown>) => {
			if (mode === "view" || pageError || setupError) return;

			// Validate challan/invoice requirement
			if (!validateChallanInvoice(values)) {
				toast({
					variant: "destructive",
					title: "Missing document reference",
					description: "Please provide either Challan No. or Invoice No.",
				});
				return;
			}

			if (!lineItemsValid) {
				toast({
					variant: "destructive",
					title: "Line items incomplete",
					description: "Add at least one item and make sure quantity is greater than zero.",
				});
				return;
			}

			const itemsPayload = filledLineItems.map((item) => ({
				po_dtl_id: item.poDtlId || undefined,
				item: item.item || undefined,
				quantity: item.quantity || undefined,
				rate: item.rate || undefined,
				uom: item.uom || undefined,
				remarks: item.remarks || undefined,
			}));

			const createPayload = {
				branch: String(values.branch ?? ""),
				supplier: String(values.supplier ?? ""),
				inward_date: String(values.inward_date ?? ""),
				challan_no: values.challan_no ? String(values.challan_no) : undefined,
				challan_date: values.challan_date ? String(values.challan_date) : undefined,
				invoice_no: values.invoice_no ? String(values.invoice_no) : undefined,
				invoice_date: values.invoice_date ? String(values.invoice_date) : undefined,
				vehicle_no: values.vehicle_no ? String(values.vehicle_no) : undefined,
				transporter_name: values.transporter_name ? String(values.transporter_name) : undefined,
				remarks: values.remarks ? String(values.remarks) : undefined,
				items: itemsPayload,
			};

			setSaving(true);
			try {
				if (mode === "edit" && requestedId) {
					const updatePayload: Partial<InwardDetails> = {
						id: requestedId,
						branchId: createPayload.branch,
						supplierId: createPayload.supplier,
						inwardDate: createPayload.inward_date,
						challanNo: createPayload.challan_no,
						challanDate: createPayload.challan_date,
						invoiceNo: createPayload.invoice_no,
						invoiceDate: createPayload.invoice_date,
						vehicleNo: createPayload.vehicle_no,
						transporterName: createPayload.transporter_name,
						remarks: createPayload.remarks,
						lines: filledLineItems.map((item) => ({
							id: item.id,
							poDtlId: item.poDtlId,
							item: item.item || undefined,
							quantity: item.quantity ? Number(item.quantity) : undefined,
							rate: item.rate ? Number(item.rate) : undefined,
							uom: item.uom || undefined,
							remarks: item.remarks || undefined,
						})),
					};

					await updateInward(updatePayload);
					toast({ title: "Inward updated" });
					router.replace(`/dashboardportal/procurement/inward/createInward?mode=view&id=${encodeURIComponent(requestedId)}`);
				} else {
					const result = await createInward(createPayload);
					toast({
						title: result?.message ?? "Inward created",
						description: result?.inward_no ? `Inward No: ${result.inward_no}` : "Inward No will be generated on open.",
					});
					const inwardId = result?.inward_id ?? result?.inwardId;
					if (inwardId) {
						router.replace(`/dashboardportal/procurement/inward/createInward?mode=view&id=${encodeURIComponent(String(inwardId))}`);
					}
				}
			} catch (error) {
				toast({
					variant: "destructive",
					title: "Unable to save inward",
					description: error instanceof Error ? error.message : "Please try again.",
				});
			} finally {
				setSaving(false);
			}
		},
		[filledLineItems, lineItemsValid, mode, pageError, setupError, requestedId, router, validateChallanInvoice]
	);

	// Save handler for approval bar
	const handleSave = React.useCallback(async () => {
		if (!formRef.current?.submit) return;
		await formRef.current.submit();
	}, [formRef]);

	// Handle PO selection
	const handlePOSelect = React.useCallback(() => {
		if (!formValues.supplier) {
			toast({
				variant: "destructive",
				title: "Select supplier first",
				description: "Please select a supplier before selecting items from PO.",
			});
			return;
		}
		setPODialogOpen(true);
	}, [formValues.supplier]);

	// Handle PO items confirm
	const handlePOItemsConfirmWrapper = React.useCallback(
		(selectedItems: POLineItem[]) => {
			handlePOItemsConfirm(selectedItems);
			setPODialogOpen(false);
		},
		[handlePOItemsConfirm]
	);

	// Page metadata
	const pageTitle = mode === "create" ? "Create Inward" : mode === "edit" ? "Edit Inward" : "Inward Details";
	const subtitle =
		mode === "create"
			? "Record goods received against a purchase order."
			: mode === "edit"
				? "Update the inward before finalizing."
				: "Review the inward details.";

	// Preview data
	const branchLabel = React.useMemo(() => {
		const value = String(formValues.branch ?? "");
		const option = branchOptions.find((opt) => opt.value === value);
		return option?.label || inwardDetails?.branch || "";
	}, [formValues.branch, branchOptions, inwardDetails?.branch]);

	const supplierLabel = React.useMemo(() => {
		const value = String(formValues.supplier ?? "");
		return getSupplierLabel(value) || inwardDetails?.supplier || "";
	}, [formValues.supplier, inwardDetails?.supplier, getSupplierLabel]);

	const previewItems = React.useMemo(
		() =>
			filledLineItems.map((item, index) => {
				const qty = Number(item.quantity) || 0;
				const rate = Number(item.rate) || 0;
				const amount = qty * rate;

				return {
					srNo: index + 1,
					poNo: item.poNo,
					itemGroup: labelResolvers.itemGroup(item.itemGroup),
					item: labelResolvers.item(item.itemGroup, item.item) || item.itemCode || "-",
					quantity: item.quantity || "-",
					uom: labelResolvers.uom(item.itemGroup, item.item, item.uom),
					rate: item.rate || "-",
					amount: amount > 0 ? amount : "-",
					remarks: item.remarks || "-",
				};
			}),
		[filledLineItems, labelResolvers]
	);

	// Company name from localStorage
	const companyName = React.useMemo(() => {
		if (typeof window === "undefined") return undefined;
		try {
			const storedCompany = localStorage.getItem("sidebar_selectedCompany");
			if (storedCompany) {
				const parsed = JSON.parse(storedCompany) as { co_name?: string; name?: string; company_name?: string } | null;
				return parsed?.co_name || parsed?.name || parsed?.company_name || undefined;
			}
		} catch {
			// Ignore errors
		}
		return undefined;
	}, []);

	const previewHeader = {
		inwardNo: (formValues.inward_no as string) || inwardDetails?.inwardNo,
		inwardDate: (formValues.inward_date as string) || inwardDetails?.inwardDate,
		branch: branchLabel,
		supplier: supplierLabel,
		challanNo: (formValues.challan_no as string) || inwardDetails?.challanNo,
		challanDate: (formValues.challan_date as string) || inwardDetails?.challanDate,
		invoiceNo: (formValues.invoice_no as string) || inwardDetails?.invoiceNo,
		invoiceDate: (formValues.invoice_date as string) || inwardDetails?.invoiceDate,
		vehicleNo: (formValues.vehicle_no as string) || inwardDetails?.vehicleNo,
		transporterName: (formValues.transporter_name as string) || inwardDetails?.transporterName,
		status: inwardDetails?.status,
		updatedBy: inwardDetails?.updatedBy,
		updatedAt: inwardDetails?.updatedAt,
		companyName: companyName,
	};

	const { metadata } = useTransactionPreview({
		header: previewHeader,
		fields: [
			{ label: "Inward No", accessor: (header) => header.inwardNo || "Pending" },
			{ label: "Inward Date", accessor: (header) => header.inwardDate || "-" },
			{ label: "Status", accessor: (header) => header.status, includeWhen: (header) => Boolean(header.status) },
		],
	});

	// Status chip
	const statusChip = React.useMemo(() => {
		if (!inwardDetails?.status) return undefined;
		return statusChipProps;
	}, [inwardDetails?.status, statusChipProps]);

	// Primary actions
	const primaryActions = React.useMemo<TransactionAction[] | undefined>(() => {
		if (mode === "view" || pageError || setupError) return undefined;
		return [
			{
				label: mode === "create" ? "Create Inward" : "Save Changes",
				onClick: () => formRef.current?.submit(),
				disabled: saving || !lineItemsValid || setupLoading,
				loading: saving,
			},
		];
	}, [mode, pageError, setupError, saving, lineItemsValid, setupLoading, formRef]);

	// Secondary actions
	const secondaryActions = React.useMemo<TransactionAction[] | undefined>(() => {
		if (!requestedId || pageError) return undefined;
		const actions: TransactionAction[] = [];
		if (mode === "view") {
			actions.push({
				label: "Edit",
				variant: "secondary",
				onClick: () => router.replace(`/dashboardportal/procurement/inward/createInward?mode=edit&id=${encodeURIComponent(requestedId)}`),
			});
		}
		if (mode === "edit") {
			actions.push({
				label: "Cancel",
				variant: "ghost",
				onClick: () => router.replace(`/dashboardportal/procurement/inward/createInward?mode=view&id=${encodeURIComponent(requestedId)}`),
			});
		}
		return actions.length ? actions : undefined;
	}, [mode, requestedId, router, pageError]);

	// Alerts
	const alerts = pageError || setupError ? (
		<div className="space-y-2">
			{pageError ? (
				<div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{pageError}</div>
			) : null}
			{setupError ? (
				<div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{setupError}</div>
			) : null}
		</div>
	) : null;

	// Line item handlers
	const handleBulkRemoveLines = React.useCallback(
		(ids: string[]) => {
			if (mode === "view" || !ids.length) return;
			removeLineItems(ids);
		},
		[mode, removeLineItems]
	);

	const getLineItemId = React.useCallback((item: typeof lineItems[0]) => item.id, []);

	return (
		<TransactionWrapper
			title={pageTitle}
			subtitle={subtitle}
			backAction={{ label: "Back", onClick: () => router.push("/dashboardportal/procurement/inward") }}
			metadata={metadata}
			statusChip={statusChip}
			primaryActions={primaryActions}
			secondaryActions={secondaryActions}
			loading={loading || setupLoading}
			alerts={alerts}
			preview={
				<div className="space-y-4">
					{/* Approval Actions Bar */}
					{mode !== "create" && inwardDetails ? (
						<InwardApprovalBar
							approvalInfo={approvalInfo}
							permissions={approvalPermissions}
							loading={approvalLoading}
							disabled={saving || loading || setupLoading}
							onSave={handleSave}
							onOpen={handleOpen}
							onCancelDraft={handleCancelDraft}
							onApprove={handleApprove}
							onReject={handleReject}
						/>
					) : null}
					<InwardPreview
						header={previewHeader}
						items={previewItems}
						remarks={(formValues.remarks as string) || inwardDetails?.remarks}
					/>
				</div>
			}
			lineItems={{
				title: "Line Items",
				subtitle: "Items received against the purchase order.",
				items: lineItems,
				getItemId: getLineItemId,
				canEdit,
				columns: lineItemColumns,
				onRemoveSelected: handleBulkRemoveLines,
				placeholder: canEdit ? "Select items from a PO to add to this inward." : "No line items available.",
				selectionColumnWidth: "28px",
			}}
		>
			<InwardHeaderForm
				schema={schema}
				formKey={formKey}
				initialValues={initialValues}
				mode={mode}
				formRef={formRef}
				onSubmit={handleFormSubmit}
				onValuesChange={setFormValues}
				showPOButton={mode !== "view"}
				onPOSelect={handlePOSelect}
				poButtonDisabled={!formValues.supplier || setupLoading}
			/>

			<POLineItemsDialog
				open={poDialogOpen}
				onOpenChange={setPODialogOpen}
				onConfirm={handlePOItemsConfirmWrapper}
				supplierId={formValues.supplier as string}
				branchId={branchValue || undefined}
				coId={coId ?? undefined}
			/>
		</TransactionWrapper>
	);
}
