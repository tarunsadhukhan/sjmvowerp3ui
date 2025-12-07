"use client";

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import TransactionWrapper, { type TransactionAction } from "@/components/ui/TransactionWrapper";
import IndentPreview from "../components/IndentPreview";
import {
	useDeferredOptionCache,
	useTransactionSetup,
	useTransactionPreview,
} from "@/components/ui/transaction";
import { useBranchOptions } from "@/utils/branchUtils";
import {
	createIndent,
	fetchIndentSetup1,
	fetchIndentSetup2,
	getIndentById,
	updateIndent,
	type IndentDetails,
} from "@/utils/indentService";
import { toast } from "@/hooks/use-toast";
import useSelectedCompanyCoId from "@/hooks/use-selected-company-coid";
import { useSidebarContext } from "@/components/dashboard/sidebarContext";
import type { MuiFormMode } from "@/components/ui/muiform";

// Types
import type { EditableLineItem, IndentSetupData, ItemGroupCacheEntry } from "./types/indentTypes";

// Utils
import { EMPTY_DEPARTMENTS, EMPTY_EXPENSES, EMPTY_ITEM_GROUPS, EMPTY_PROJECTS, EMPTY_SETUP_PARAMS } from "./utils/indentConstants";
import { buildDefaultFormValues, createBlankLine } from "./utils/indentFactories";
import { mapIndentSetupResponse, mapItemGroupDetailResponse } from "./utils/indentMappers";

// Hooks
import { useIndentFormState } from "./hooks/useIndentFormState";
import { useIndentLineItems } from "./hooks/useIndentLineItems";
import { useIndentApproval } from "./hooks/useIndentApproval";
import { useIndentFormSchema } from "./hooks/useIndentFormSchemas";
import { useIndentSelectOptions } from "./hooks/useIndentSelectOptions";

// Components
import { IndentHeaderForm } from "./components/IndentHeaderForm";
import { IndentApprovalBar } from "./components/IndentApprovalBar";
import { useIndentLineItemColumns } from "./components/IndentLineItemsTable";

export default function IndentTransactionPage() {
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

			// Second, try to find by "indent" in path or name
			const indentMenu = availableMenus.find((item) => {
				const path = (item.menu_path || "").toLowerCase();
				const name = (item.menu_name || "").toLowerCase();
				return path.includes("indent") || path.includes("/procurement/indent") || name.includes("indent");
			});
			if (indentMenu?.menu_id) return String(indentMenu.menu_id);
		}

		// Fallback to sidebarMenuItems
		if (sidebarMenuItems && sidebarMenuItems.length > 0) {
			const indentMenu = sidebarMenuItems.find((item) => {
				const path = (item.menu_path || "").toLowerCase();
				const name = (item.menu_name || "").toLowerCase();
				return path.includes("indent") || path.includes("/procurement/indent") || name.includes("indent");
			});
			if (indentMenu?.menu_id) return String(indentMenu.menu_id);
		}

		// Try localStorage
		if (typeof window !== "undefined" && pathname) {
			try {
				const storedMenuItems = localStorage.getItem("sidebar_menuItems");
				if (storedMenuItems) {
					const menuItems = JSON.parse(storedMenuItems) as Array<{ menu_id?: number; menu_path?: string; menu_name?: string }> | null;
					if (Array.isArray(menuItems)) {
						const indentMenu = menuItems.find((item) => {
							const path = (item.menu_path || "").toLowerCase();
							const name = (item.menu_name || "").toLowerCase();
							return path.includes("indent") || path.includes("/procurement/indent") || name.includes("indent");
						});
						if (indentMenu?.menu_id) return String(indentMenu.menu_id);
					}
				}
			} catch {
				// Ignore errors
			}
		}

		return "";
	}, [menuIdFromUrl, pathname, availableMenus, sidebarMenuItems]);

	// Form state hook
	const { initialValues, setInitialValues, formValues, setFormValues, formKey, bumpFormKey, formRef } = useIndentFormState({ mode });

	// Indent details state
	const [indentDetails, setIndentDetails] = React.useState<IndentDetails | null>(null);
	const [loading, setLoading] = React.useState<boolean>(mode !== "create");
	const [saving, setSaving] = React.useState(false);
	const [pageError, setPageError] = React.useState<string | null>(null);

	// Item group cache
	const { cache: itemGroupCache, loading: itemGroupLoading, ensure: ensureItemGroupData, reset: resetItemGroupCache } =
		useDeferredOptionCache<string, ItemGroupCacheEntry>({
			fetcher: async (itemGroupId: string) => {
				if (!itemGroupId || !/^\d+$/.test(itemGroupId)) {
					throw new Error(`Invalid item group ID: ${itemGroupId}. Expected numeric ID.`);
				}
				const response = await fetchIndentSetup2(itemGroupId);
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
		filledLineItems,
		lineItemsValid,
	} = useIndentLineItems({
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

	// Load indent data for edit/view mode
	React.useEffect(() => {
		if (mode === "create") {
			setIndentDetails(null);
			setPageError(null);
			setLoading(false);
			if (!lineItems.length) {
				setLineItems([createBlankLine()]);
			}
			return;
		}

		if (!requestedId) {
			setIndentDetails(null);
			replaceItems([]);
			setPageError("Missing indent identifier in the URL.");
			setLoading(false);
			return;
		}

		let cancelled = false;
		setLoading(true);

		const menuId = getMenuId();

		getIndentById(requestedId, coId, menuId || undefined)
			.then((detail) => {
				if (cancelled) return;
				setIndentDetails(detail);
				const base = {
					branch: detail.branch ?? "",
					indent_type: detail.indentType ?? "",
					expense_type: detail.expenseType ?? "",
					date: detail.indentDate ?? "",
					indent_no: detail.indentNo ?? "",
					project: detail.project ?? "",
					requester: detail.requester ?? "",
					remarks: detail.remarks ?? "",
				};
				setInitialValues(base);
				setFormValues(base);
				bumpFormKey();
				const mappedLines = (detail.lines ?? []).map(mapLineToEditable);
				replaceItems(mappedLines.length ? mappedLines : [createBlankLine()]);
				setPageError(null);
			})
			.catch((error) => {
				if (cancelled) return;
				setIndentDetails(null);
				replaceItems([createBlankLine()]);
				setPageError(error instanceof Error ? error.message : "Unable to load indent details.");
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [mode, requestedId, mapLineToEditable, coId, getMenuId, setInitialValues, setFormValues, bumpFormKey, replaceItems, setLineItems, lineItems.length]);

	// Setup data
	const branchValue = React.useMemo(() => String(formValues.branch ?? ""), [formValues.branch]);
	const branchIdForSetup = React.useMemo(() => (branchValue && /^\d+$/.test(branchValue) ? branchValue : undefined), [branchValue]);
	const setupParams = React.useMemo(
		() => (branchIdForSetup ? { branchId: branchIdForSetup } : EMPTY_SETUP_PARAMS),
		[branchIdForSetup]
	);

	const { data: setupData, loading: setupLoading, error: setupError } = useTransactionSetup<{ branchId?: string }, Record<string, unknown>, IndentSetupData>({
		coId,
		params: setupParams,
		fetcher: fetchIndentSetup1,
		mapData: mapIndentSetupResponse,
		deps: [branchIdForSetup],
	});

	const departments = setupData?.departments ?? EMPTY_DEPARTMENTS;
	const projects = setupData?.projects ?? EMPTY_PROJECTS;
	const expenses = setupData?.expenses ?? EMPTY_EXPENSES;
	const itemGroups = setupData?.itemGroups ?? EMPTY_ITEM_GROUPS;

	// Select options hook
	const {
		departmentOptions,
		projectOptions,
		expenseOptions,
		itemGroupOptions,
		getExpenseLabel,
		getProjectLabel,
		getItemOptions,
		getMakeOptions,
		getUomOptions,
		labelResolvers,
	} = useIndentSelectOptions({
		departments,
		projects,
		expenses,
		itemGroups,
		branchIdForSetup,
		indentType: String(formValues.indent_type ?? ""),
		itemGroupCache,
	});

	// Expense type validation on indent type change
	React.useEffect(() => {
		if (mode === "view") return;
		const indentType = String(formValues.indent_type ?? "").toLowerCase();
		if (indentType !== "open") return;
		const allowed = new Set(["3", "5", "6"]);
		const current = String(formValues.expense_type ?? "");
		if (current && !allowed.has(current)) {
			setFormValues((prev) => ({ ...prev, expense_type: "" }));
		}
	}, [formValues.indent_type, formValues.expense_type, mode, setFormValues]);

	// Form schema
	const schema = useIndentFormSchema({
		mode,
		branchOptions,
		expenseOptions,
		projectOptions,
	});

	// Approval hook
	const {
		approvalLoading,
		approvalInfo,
		approvalPermissions,
		statusChipProps,
		handleOpen,
		handleCancelDraft,
		handleReopen,
		handleSendForApproval,
		handleApprove,
		handleReject,
		handleViewApprovalLog,
		handleClone,
	} = useIndentApproval({
		mode,
		requestedId,
		formValues,
		indentDetails,
		coId,
		getMenuId,
		setIndentDetails,
		setFormValues,
	});

	// Line item columns
	const canEdit = mode !== "view";
	const lineItemColumns = useIndentLineItemColumns({
		canEdit,
		departmentOptions,
		itemGroupOptions,
		itemGroupLoading,
		labelResolvers,
		getItemOptions,
		getMakeOptions,
		getUomOptions,
		handleLineFieldChange,
	});

	// Form submit handler
	const handleFormSubmit = React.useCallback(
		async (values: Record<string, unknown>) => {
			if (mode === "view" || pageError || setupError) return;

			if (!lineItemsValid) {
				toast({
					variant: "destructive",
					title: "Line items incomplete",
					description: "Add at least one item and make sure quantity is greater than zero.",
				});
				return;
			}

			const indentType = String(values.indent_type ?? "").toLowerCase();
			const expenseType = String(values.expense_type ?? "");
			if (indentType === "open" && expenseType && !["3", "5", "6"].includes(expenseType)) {
				toast({
					variant: "destructive",
					title: "Select allowed expense type",
					description: "Open indents only support expense types 3, 5, or 6.",
				});
				return;
			}

			const itemsPayload = filledLineItems.map((item) => ({
				item_group: item.itemGroup || undefined,
				item: item.item || undefined,
				quantity: item.quantity || undefined,
				uom: item.uom || undefined,
				item_make: item.itemMake || undefined,
				remarks: item.remarks || undefined,
				department: item.department || undefined,
			}));

			const createPayload = {
				branch: String(values.branch ?? ""),
				indent_type: String(values.indent_type ?? ""),
				expense_type: String(values.expense_type ?? ""),
				date: String(values.date ?? ""),
				indent_no: values.indent_no ? String(values.indent_no) : undefined,
				project: values.project ? String(values.project) : undefined,
				requester: values.requester ? String(values.requester) : undefined,
				remarks: values.remarks ? String(values.remarks) : undefined,
				items: itemsPayload,
			};

			setSaving(true);
			try {
				if (mode === "edit" && requestedId) {
					const updatePayload: Partial<IndentDetails> = {
						id: requestedId,
						branch: createPayload.branch,
						indentType: createPayload.indent_type,
						expenseType: createPayload.expense_type,
						indentDate: createPayload.date,
						project: createPayload.project,
						requester: createPayload.requester,
						remarks: createPayload.remarks,
						lines: filledLineItems.map((item) => ({
							id: item.id,
							department: item.department || undefined,
							itemGroup: item.itemGroup || undefined,
							item: item.item || undefined,
							itemMake: item.itemMake || undefined,
							quantity: item.quantity ? Number(item.quantity) : undefined,
							uom: item.uom || undefined,
							remarks: item.remarks || undefined,
						})),
					};

					await updateIndent(updatePayload);
					toast({ title: "Indent updated" });
					router.replace(`/dashboardportal/procurement/indent/createIndent?mode=view&id=${encodeURIComponent(requestedId)}`);
				} else {
					const result = await createIndent(createPayload);
					toast({
						title: result?.message ?? "Indent created",
						description: result?.indent_no ? `Indent No: ${result.indent_no}` : undefined,
					});
					const indentId = result?.indent_id ?? result?.indentId;
					if (indentId) {
						router.replace(`/dashboardportal/procurement/indent/createIndent?mode=view&id=${encodeURIComponent(String(indentId))}`);
					}
				}
			} catch (error) {
				toast({
					variant: "destructive",
					title: "Unable to save indent",
					description: error instanceof Error ? error.message : "Please try again.",
				});
			} finally {
				setSaving(false);
			}
		},
		[filledLineItems, lineItemsValid, mode, pageError, setupError, requestedId, router]
	);

	// Save handler for approval bar
	const handleSave = React.useCallback(async () => {
		if (!formRef.current?.submit) return;
		await formRef.current.submit();
	}, [formRef]);

	// Page metadata
	const pageTitle = mode === "create" ? "Create Indent" : mode === "edit" ? "Edit Indent" : "Indent Details";
	const subtitle =
		mode === "create"
			? "Capture header information and line items to raise a new indent."
			: mode === "edit"
				? "Update the indent before sending it forward."
				: "Review the captured indent information.";

	// Preview data
	const branchLabel = React.useMemo(() => {
		const value = String(formValues.branch ?? "");
		const option = branchOptions.find((opt) => opt.value === value);
		return option?.label || indentDetails?.branch || "";
	}, [formValues.branch, branchOptions, indentDetails?.branch]);

	const indentTypeLabel = React.useMemo(() => {
		const value = String(formValues.indent_type ?? "");
		const options = [
			{ label: "Regular Indent", value: "regular" },
			{ label: "Open Indent", value: "open" },
			{ label: "BOM", value: "bom" },
		];
		return options.find((opt) => opt.value === value)?.label || indentDetails?.indentType || "";
	}, [formValues.indent_type, indentDetails?.indentType]);

	const expenseTypeLabel = React.useMemo(() => {
		const value = String(formValues.expense_type ?? "");
		return getExpenseLabel(value) || indentDetails?.expenseType || "";
	}, [formValues.expense_type, indentDetails?.expenseType, getExpenseLabel]);

	const projectLabel = React.useMemo(() => {
		const value = String(formValues.project ?? "");
		return getProjectLabel(value) || indentDetails?.project || "";
	}, [formValues.project, indentDetails?.project, getProjectLabel]);

	const previewItems = React.useMemo(
		() =>
			filledLineItems.map((item, index) => {
				const extractCodeAndName = (label: string | undefined) => {
					if (!label) return { code: undefined, name: undefined };
					const separator = label.includes(" — ") ? " — " : label.includes(" - ") ? " - " : null;
					if (separator) {
						const parts = label.split(separator);
						return { code: parts[0]?.trim(), name: parts[1]?.trim() };
					}
					return { code: label.trim(), name: undefined };
				};

				const groupLabel = item.itemGroup ? labelResolvers.itemGroup(item.itemGroup) : undefined;
				const groupData = extractCodeAndName(groupLabel);
				const itemLabel = item.itemGroup && item.item ? labelResolvers.item(item.itemGroup, item.item) : undefined;
				const itemData = extractCodeAndName(itemLabel);

				return {
					srNo: index + 1,
					department: labelResolvers.department(item.department),
					itemGroup: labelResolvers.itemGroup(item.itemGroup),
					itemGroupCode: groupData.code,
					itemGroupName: groupData.name,
					item: labelResolvers.item(item.itemGroup, item.item),
					itemCode: itemData.code,
					itemName: itemData.name,
					itemMake: labelResolvers.itemMake(item.itemGroup, item.itemMake),
					quantity: item.quantity || "-",
					uom: labelResolvers.uom(item.itemGroup, item.item, item.uom),
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
		indentNo: (formValues.indent_no as string) || indentDetails?.indentNo,
		indentDate: (formValues.date as string) || indentDetails?.indentDate,
		branch: branchLabel,
		indentType: indentTypeLabel,
		expenseType: expenseTypeLabel,
		project: projectLabel,
		requester: (formValues.requester as string) || indentDetails?.requester,
		status: indentDetails?.status,
		updatedBy: indentDetails?.updatedBy,
		updatedAt: indentDetails?.updatedAt,
		companyName: companyName,
	};

	const { metadata } = useTransactionPreview({
		header: previewHeader,
		fields: [
			{ label: "Indent No", accessor: (header) => header.indentNo || "Pending" },
			{ label: "Indent Date", accessor: (header) => header.indentDate || "-" },
			{ label: "Status", accessor: (header) => header.status, includeWhen: (header) => Boolean(header.status) },
			{ label: "Updated By", accessor: (header) => header.updatedBy, includeWhen: (header) => Boolean(header.updatedBy) },
			{
				label: "Updated At",
				accessor: (header) => (header.updatedAt ? new Date(header.updatedAt).toLocaleString() : "-"),
				includeWhen: (header) => Boolean(header.updatedAt),
			},
		],
	});

	// Status chip
	const statusChip = React.useMemo(() => {
		if (!indentDetails?.status) return undefined;
		return statusChipProps;
	}, [indentDetails?.status, statusChipProps]);

	// Primary actions
	const primaryActions = React.useMemo<TransactionAction[] | undefined>(() => {
		if (mode === "view" || pageError || setupError) return undefined;
		return [
			{
				label: mode === "create" ? "Create Indent" : "Save Changes",
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
				onClick: () => router.replace(`/dashboardportal/procurement/indent/createIndent?mode=edit&id=${encodeURIComponent(requestedId)}`),
			});
		}
		if (mode === "edit") {
			actions.push({
				label: "Cancel",
				variant: "ghost",
				onClick: () => router.replace(`/dashboardportal/procurement/indent/createIndent?mode=view&id=${encodeURIComponent(requestedId)}`),
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

	const getLineItemId = React.useCallback((item: EditableLineItem) => item.id, []);

	return (
		<TransactionWrapper
			title={pageTitle}
			subtitle={subtitle}
			backAction={{ label: "Back", onClick: () => router.back() }}
			metadata={metadata}
			statusChip={statusChip}
			primaryActions={primaryActions}
			secondaryActions={secondaryActions}
			loading={loading || setupLoading}
			alerts={alerts}
			preview={
				<div className="space-y-4">
					{/* Approval Actions Bar */}
					{mode !== "create" && indentDetails ? (
						<IndentApprovalBar
							approvalInfo={approvalInfo}
							permissions={approvalPermissions}
							loading={approvalLoading}
							disabled={saving || loading || setupLoading}
							onSave={handleSave}
							onOpen={handleOpen}
							onCancelDraft={handleCancelDraft}
							onReopen={handleReopen}
							onSendForApproval={handleSendForApproval}
							onApprove={handleApprove}
							onReject={handleReject}
							onViewApprovalLog={handleViewApprovalLog}
							onClone={handleClone}
						/>
					) : null}
					<IndentPreview
						header={previewHeader}
						items={previewItems}
						remarks={(formValues.remarks as string) || indentDetails?.remarks}
					/>
				</div>
			}
			lineItems={{
				title: "Line Items",
				subtitle: "List the materials or services you intend to procure.",
				items: lineItems,
				getItemId: getLineItemId,
				canEdit,
				columns: lineItemColumns,
				onRemoveSelected: handleBulkRemoveLines,
				placeholder: canEdit ? "Add items to build the indent." : "No line items available.",
				selectionColumnWidth: "28px",
			}}
		>
			<IndentHeaderForm
				schema={schema}
				formKey={formKey}
				initialValues={initialValues}
				mode={mode}
				formRef={formRef}
				onSubmit={handleFormSubmit}
				onValuesChange={setFormValues}
			/>
		</TransactionWrapper>
	);
}
