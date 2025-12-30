"use client";

import React, { Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import TransactionWrapper, {
	type TransactionAction,
} from "@/components/ui/TransactionWrapper";
import {
	useDeferredOptionCache,
	useTransactionSetup,
	useTransactionPreview,
} from "@/components/ui/transaction";
import { useBranchOptions } from "@/utils/branchUtils";
import {
	createIssue,
	fetchIssueSetup1,
	fetchIssueSetup2,
	fetchAvailableInventory,
	fetchCostFactors,
	fetchMachines,
	getIssueById,
	updateIssue,
	updateIssueStatus,
	type IssueDetails,
	type AvailableInventoryResponse,
	type CostFactorResponse,
	type MachineResponse,
} from "@/utils/issueService";
import { toast } from "@/hooks/use-toast";
import useSelectedCompanyCoId from "@/hooks/use-selected-company-coid";
import { useSidebarContext } from "@/components/dashboard/sidebarContext";
import type { MuiFormMode } from "@/components/ui/muiform";

// Types
import type {
	EditableLineItem,
	IssueSetupData,
	ItemGroupCacheEntry,
	AvailableInventoryItem,
	CostFactorRecord,
	MachineRecord,
} from "./types/issueTypes";

// Utils
import {
	ISSUE_STATUS_IDS,
	ISSUE_STATUS_LABELS,
	EMPTY_DEPARTMENTS,
	EMPTY_EXPENSES,
	EMPTY_ITEM_GROUPS,
	EMPTY_PROJECTS,
	EMPTY_COST_FACTORS,
	EMPTY_MACHINES,
	EMPTY_SETUP_PARAMS,
} from "./utils/issueConstants";
import {
	buildDefaultFormValues,
	createBlankLine,
	lineIsComplete,
} from "./utils/issueFactories";
import {
	mapIssueSetupResponse,
	mapItemGroupDetailResponse,
	mapAvailableInventoryItems,
	mapCostFactorRecords,
	mapMachineRecords,
} from "./utils/issueMappers";

// Hooks
import { useIssueFormState } from "./hooks/useIssueFormState";
import { useIssueLineItems } from "./hooks/useIssueLineItems";
import { useIssueFormSchema } from "./hooks/useIssueFormSchemas";
import { useIssueSelectOptions } from "./hooks/useIssueSelectOptions";

// Components
import { IssueHeaderForm } from "./components/IssueHeaderForm";
import { useIssueLineItemColumns } from "./components/IssueLineItemsTable";
import { IssuePreview } from "./components/IssuePreview";

// Loading fallback for Suspense
function IssuePageLoading() {
	return (
		<div className="flex items-center justify-center min-h-100">
			<div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
		</div>
	);
}

export default function IssueTransactionPage() {
	return (
		<Suspense fallback={<IssuePageLoading />}>
			<IssueTransactionPageContent />
		</Suspense>
	);
}

function IssueTransactionPageContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const pathname = usePathname();

	const modeParam = (searchParams?.get("mode") || "create").toLowerCase();
	const requestedId = searchParams?.get("id") || "";
	const menuIdFromUrl = searchParams?.get("menu_id") || "";

	const mode: MuiFormMode =
		modeParam === "edit" ? "edit" : modeParam === "view" ? "view" : "create";

	const branchOptions = useBranchOptions();
	const { coId } = useSelectedCompanyCoId();
	const { availableMenus, menuItems: sidebarMenuItems } = useSidebarContext();

	// Get menu_id from URL or lookup from menuItems based on current path
	const getMenuId = React.useCallback((): string => {
		if (menuIdFromUrl) return menuIdFromUrl;

		if (availableMenus && availableMenus.length > 0) {
			const currentPath = pathname?.toLowerCase() || "";

			// First, try exact path match
			const matchingMenu = availableMenus.find((item) => {
				if (!item.menu_path) return false;
				const menuPath = item.menu_path.toLowerCase();
				return (
					currentPath === menuPath || currentPath.startsWith(menuPath + "/")
				);
			});
			if (matchingMenu?.menu_id) return String(matchingMenu.menu_id);

			// Second, try to find by "issue" in path or name
			const issueMenu = availableMenus.find((item) => {
				const path = (item.menu_path || "").toLowerCase();
				const name = (item.menu_name || "").toLowerCase();
				return (
					path.includes("issue") ||
					path.includes("/inventory/issue") ||
					name.includes("issue")
				);
			});
			if (issueMenu?.menu_id) return String(issueMenu.menu_id);
		}

		// Fallback to sidebarMenuItems
		if (sidebarMenuItems && sidebarMenuItems.length > 0) {
			const issueMenu = sidebarMenuItems.find((item) => {
				const path = (item.menu_path || "").toLowerCase();
				const name = (item.menu_name || "").toLowerCase();
				return (
					path.includes("issue") ||
					path.includes("/inventory/issue") ||
					name.includes("issue")
				);
			});
			if (issueMenu?.menu_id) return String(issueMenu.menu_id);
		}

		return "";
	}, [menuIdFromUrl, pathname, availableMenus, sidebarMenuItems]);

	// Form state hook
	const {
		initialValues,
		setInitialValues,
		formValues,
		setFormValues,
		formKey,
		bumpFormKey,
		formRef,
	} = useIssueFormState({ mode });

	// Issue details state
	const [issueDetails, setIssueDetails] = React.useState<IssueDetails | null>(
		null
	);
	const [loading, setLoading] = React.useState<boolean>(mode !== "create");
	const [saving, setSaving] = React.useState(false);
	const [pageError, setPageError] = React.useState<string | null>(null);

	// Available inventory state
	const [availableInventory, setAvailableInventory] = React.useState<
		AvailableInventoryItem[]
	>([]);
	const [availableInventoryLoading, setAvailableInventoryLoading] =
		React.useState(false);

	// Cost factors and machines state
	const [costFactors, setCostFactors] =
		React.useState<readonly CostFactorRecord[]>(EMPTY_COST_FACTORS);
	const [machines, setMachines] =
		React.useState<readonly MachineRecord[]>(EMPTY_MACHINES);

	// Item group cache
	const {
		cache: itemGroupCache,
		loading: itemGroupLoading,
		ensure: ensureItemGroupData,
		reset: resetItemGroupCache,
	} = useDeferredOptionCache<string, ItemGroupCacheEntry>({
		fetcher: async (itemGroupId: string) => {
			if (!itemGroupId || !/^\d+$/.test(itemGroupId)) {
				throw new Error(
					`Invalid item group ID: ${itemGroupId}. Expected numeric ID.`
				);
			}
			const response = await fetchIssueSetup2(itemGroupId, coId);
			return mapItemGroupDetailResponse(response);
		},
		onError: (error) => {
			const message =
				error instanceof Error
					? error.message
					: "Unable to load item options.";
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
		handleLineFieldChange,
		updateLineFields,
	} = useIssueLineItems({
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

	// Initialize blank line for create mode
	const initialLineSeededRef = React.useRef(false);
	React.useEffect(() => {
		if (mode !== "create") {
			initialLineSeededRef.current = false;
			return;
		}
		if (initialLineSeededRef.current) return;
		initialLineSeededRef.current = true;
		setLineItems((prev) => (prev.length ? prev : [createBlankLine()]));
	}, [mode, setLineItems]);

	// Map API line response to editable line item
	const mapLineToEditable = React.useCallback(
		(apiLine: Record<string, unknown>): EditableLineItem => ({
			id: String(apiLine.issue_li_id ?? apiLine.id ?? ""),
			itemGroup: String(apiLine.item_group_id ?? ""),
			item: String(apiLine.item_id ?? ""),
			quantity: String(apiLine.qty ?? ""),
			uom: String(apiLine.uom_id ?? ""),
			rate: String(apiLine.rate ?? ""),
			expenseType: String(apiLine.expense_id ?? ""),
			costFactor: String(apiLine.cost_factor_id ?? ""),
			machine: String(apiLine.machine_id ?? ""),
			inwardDtlId: String(apiLine.inward_dtl_id ?? ""),
			srNo: String(apiLine.sr_no ?? ""),
			availableQty: "",
			remarks: String(apiLine.remarks ?? ""),
		}),
		[]
	);

	// Load issue data for edit/view mode
	React.useEffect(() => {
		if (mode === "create") {
			setIssueDetails(null);
			setPageError(null);
			setLoading(false);
			return;
		}

		if (!requestedId) {
			setIssueDetails(null);
			replaceItems([]);
			setPageError("Missing issue identifier in the URL.");
			setLoading(false);
			return;
		}

		let cancelled = false;
		setLoading(true);

		const menuId = getMenuId();

		getIssueById(requestedId, coId, menuId || undefined)
			.then((detail) => {
				if (cancelled) return;
				setIssueDetails(detail);
				const base = {
					branch: String(detail.branchId ?? ""),
					department: String(detail.deptId ?? ""),
					date: detail.date ?? "",
					issue_no: detail.issuePassNo ?? "",
					project: String(detail.projectId ?? ""),
					issued_to: detail.issuedTo ?? "",
					req_by: detail.reqBy ?? "",
					internal_note: detail.internalNote ?? "",
				};
				setInitialValues(base);
				setFormValues(base);
				bumpFormKey();
				const mappedLines = (detail.lineItems ?? []).map((line) =>
					mapLineToEditable(line as unknown as Record<string, unknown>)
				);
				replaceItems(mappedLines.length ? mappedLines : [createBlankLine()]);
				setPageError(null);

				// Pre-fetch item group cache for existing lines
				const uniqueGroups = [
					...new Set(
						mappedLines.map((line) => line.itemGroup).filter(Boolean)
					),
				];
				uniqueGroups.forEach((groupId) => {
					if (groupId && !itemGroupCache[groupId] && !itemGroupLoading[groupId]) {
						void ensureItemGroupData(groupId);
					}
				});
			})
			.catch((error) => {
				if (cancelled) return;
				setIssueDetails(null);
				replaceItems([createBlankLine()]);
				setPageError(
					error instanceof Error
						? error.message
						: "Unable to load issue details."
				);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [
		mode,
		requestedId,
		mapLineToEditable,
		coId,
		getMenuId,
		setInitialValues,
		setFormValues,
		bumpFormKey,
		replaceItems,
		itemGroupCache,
		itemGroupLoading,
		ensureItemGroupData,
	]);

	// Setup data
	const branchValue = React.useMemo(
		() => String(formValues.branch ?? ""),
		[formValues.branch]
	);
	const branchIdForSetup = React.useMemo(
		() => (branchValue && /^\d+$/.test(branchValue) ? branchValue : undefined),
		[branchValue]
	);
	const setupParams = React.useMemo(
		() => (branchIdForSetup ? { branchId: branchIdForSetup } : EMPTY_SETUP_PARAMS),
		[branchIdForSetup]
	);

	const {
		data: setupData,
		loading: setupLoading,
		error: setupError,
	} = useTransactionSetup<
		{ branchId?: string },
		Record<string, unknown>,
		IssueSetupData
	>({
		coId,
		params: setupParams,
		fetcher: fetchIssueSetup1,
		mapData: mapIssueSetupResponse,
		deps: [branchIdForSetup],
	});

	const departments = setupData?.departments ?? EMPTY_DEPARTMENTS;
	const projects = setupData?.projects ?? EMPTY_PROJECTS;
	const expenses = setupData?.expenses ?? EMPTY_EXPENSES;
	const itemGroups = setupData?.itemGroups ?? EMPTY_ITEM_GROUPS;

	// Load cost factors when branch changes
	React.useEffect(() => {
		if (!coId || !branchIdForSetup) {
			setCostFactors(EMPTY_COST_FACTORS);
			return;
		}

		let cancelled = false;
		fetchCostFactors(coId, branchIdForSetup)
			.then((response: CostFactorResponse[]) => {
				if (cancelled) return;
				setCostFactors(mapCostFactorRecords(response));
			})
			.catch(() => {
				if (!cancelled) setCostFactors(EMPTY_COST_FACTORS);
			});

		return () => {
			cancelled = true;
		};
	}, [coId, branchIdForSetup]);

	// Load machines when department changes
	const departmentValue = React.useMemo(
		() => String(formValues.department ?? ""),
		[formValues.department]
	);
	React.useEffect(() => {
		if (!coId || !departmentValue) {
			setMachines(EMPTY_MACHINES);
			return;
		}

		let cancelled = false;
		fetchMachines(coId, departmentValue)
			.then((response: MachineResponse[]) => {
				if (cancelled) return;
				setMachines(mapMachineRecords(response));
			})
			.catch(() => {
				if (!cancelled) setMachines(EMPTY_MACHINES);
			});

		return () => {
			cancelled = true;
		};
	}, [coId, departmentValue]);

	// Load available inventory when branch changes
	React.useEffect(() => {
		if (!coId || !branchIdForSetup) {
			setAvailableInventory([]);
			return;
		}

		let cancelled = false;
		setAvailableInventoryLoading(true);
		fetchAvailableInventory(coId, { branchId: branchIdForSetup })
			.then((response: AvailableInventoryResponse[]) => {
				if (cancelled) return;
				setAvailableInventory(mapAvailableInventoryItems(response));
			})
			.catch(() => {
				if (!cancelled) setAvailableInventory([]);
			})
			.finally(() => {
				if (!cancelled) setAvailableInventoryLoading(false);
			});

		return () => {
			cancelled = true;
		};
	}, [coId, branchIdForSetup]);

	// Select options hook
	const {
		departmentOptions,
		projectOptions,
		expenseOptions,
		itemGroupOptions,
		costFactorOptions,
		machineOptions,
		labelResolvers,
		getItemOptions,
		getUomOptions,
	} = useIssueSelectOptions({
		departments,
		projects,
		expenses,
		itemGroups,
		costFactors,
		machines,
		branchIdForSetup,
		departmentIdForMachines: departmentValue,
		itemGroupCache,
	});

	// Form schema
	const schema = useIssueFormSchema({
		mode,
		branchOptions,
		departmentOptions,
		projectOptions,
	});

	// Derived values
	const canEdit = mode !== "view";
	const filledLineItems = React.useMemo(
		() => lineItems.filter((item) => lineIsComplete(item)),
		[lineItems]
	);
	const lineItemsValid = filledLineItems.length > 0;

	// Status helpers
	const currentStatusId = React.useMemo(() => {
		return issueDetails?.statusId ?? ISSUE_STATUS_IDS.DRAFT;
	}, [issueDetails?.statusId]);

	const statusChipProps = React.useMemo(() => {
		const label =
			ISSUE_STATUS_LABELS[currentStatusId as keyof typeof ISSUE_STATUS_LABELS] ??
			issueDetails?.status ??
			"Draft";
		let variant: "default" | "success" | "warning" | "destructive" = "default";
		if (currentStatusId === ISSUE_STATUS_IDS.APPROVED) variant = "success";
		else if (currentStatusId === ISSUE_STATUS_IDS.REJECTED) variant = "destructive";
		else if (currentStatusId === ISSUE_STATUS_IDS.PENDING_APPROVAL)
			variant = "warning";
		return { label, variant };
	}, [currentStatusId, issueDetails?.status]);

	// Line item columns
	const lineItemColumns = useIssueLineItemColumns({
		canEdit,
		mode,
		itemGroupOptions,
		itemGroupLoading,
		expenseOptions,
		costFactorOptions,
		machineOptions,
		labelResolvers,
		getItemOptions,
		getUomOptions,
		handleLineFieldChange,
		updateLineFields,
		availableInventory,
		availableInventoryLoading,
	});

	// Form submit handler
	const handleFormSubmit = React.useCallback(
		async (values: Record<string, unknown>) => {
			if (mode === "view" || pageError || setupError) return;

			if (!lineItemsValid) {
				toast({
					variant: "destructive",
					title: "Line items incomplete",
					description:
						"Add at least one item and make sure quantity is greater than zero.",
				});
				return;
			}

			const lineItemsPayload = filledLineItems.map((item) => ({
				item_id: item.item ? Number(item.item) : undefined,
				item_group_id: item.itemGroup ? Number(item.itemGroup) : undefined,
				qty: Number(item.quantity) || 0,
				uom_id: item.uom ? Number(item.uom) : undefined,
				expense_id: item.expenseType ? Number(item.expenseType) : undefined,
				cost_factor_id: item.costFactor ? Number(item.costFactor) : undefined,
				machine_id: item.machine ? Number(item.machine) : undefined,
				inward_dtl_id: item.inwardDtlId ? Number(item.inwardDtlId) : undefined,
				remarks: item.remarks || undefined,
			}));

			const createPayload = {
				branch_id: Number(values.branch) || 0,
				dept_id: Number(values.department) || 0,
				issue_date: String(values.date ?? ""),
				project_id: values.project ? Number(values.project) : undefined,
				issued_to: values.issued_to ? String(values.issued_to) : undefined,
				req_by: values.req_by ? String(values.req_by) : undefined,
				internal_note: values.internal_note
					? String(values.internal_note)
					: undefined,
				line_items: lineItemsPayload,
			};

			setSaving(true);
			try {
				if (mode === "edit" && requestedId) {
					await updateIssue(coId, {
						issue_id: requestedId,
						...createPayload,
					});
					toast({ title: "Issue updated" });
					router.replace(
						`/dashboardportal/inventory/issue/createIssue?mode=view&id=${encodeURIComponent(requestedId)}`
					);
				} else {
					const result = await createIssue(coId, createPayload);
					toast({
						title: result?.message ?? "Issue created",
						description: result?.issue_pass_no
							? `Issue Pass No: ${result.issue_pass_no}`
							: undefined,
					});
					const issueId = result?.issue_id;
					if (issueId) {
						router.replace(
							`/dashboardportal/inventory/issue/createIssue?mode=view&id=${encodeURIComponent(String(issueId))}`
						);
					}
				}
			} catch (error) {
				toast({
					variant: "destructive",
					title: "Unable to save issue",
					description:
						error instanceof Error ? error.message : "Please try again.",
				});
			} finally {
				setSaving(false);
			}
		},
		[
			filledLineItems,
			lineItemsValid,
			mode,
			pageError,
			setupError,
			requestedId,
			router,
			coId,
		]
	);

	// Approval actions
	const handleOpen = React.useCallback(async () => {
		if (!requestedId || !coId) return;
		setSaving(true);
		try {
			await updateIssueStatus(
				coId,
				requestedId,
				{ status_id: ISSUE_STATUS_IDS.OPEN },
				getMenuId()
			);
			toast({ title: "Issue opened" });
			// Refresh the page
			router.refresh();
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Failed to open issue",
				description:
					error instanceof Error ? error.message : "Please try again.",
			});
		} finally {
			setSaving(false);
		}
	}, [requestedId, coId, getMenuId, router]);

	const handleApprove = React.useCallback(async () => {
		if (!requestedId || !coId) return;
		setSaving(true);
		try {
			await updateIssueStatus(
				coId,
				requestedId,
				{ status_id: ISSUE_STATUS_IDS.APPROVED },
				getMenuId()
			);
			toast({ title: "Issue approved" });
			router.refresh();
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Failed to approve issue",
				description:
					error instanceof Error ? error.message : "Please try again.",
			});
		} finally {
			setSaving(false);
		}
	}, [requestedId, coId, getMenuId, router]);

	// Page metadata
	const pageTitle =
		mode === "create"
			? "Create Issue"
			: mode === "edit"
				? "Edit Issue"
				: "Issue Details";
	const subtitle =
		mode === "create"
			? "Record material issue from stores."
			: mode === "edit"
				? "Update the issue before approval."
				: "Review the captured issue information.";

	// Preview data
	const branchLabel = React.useMemo(() => {
		const value = String(formValues.branch ?? "");
		const option = branchOptions.find((opt) => opt.value === value);
		return option?.label || issueDetails?.branchName || "";
	}, [formValues.branch, branchOptions, issueDetails?.branchName]);

	const previewHeader = {
		issuePassNo:
			(formValues.issue_no as string) || issueDetails?.issuePassNo || "Pending",
		issueDate: (formValues.date as string) || issueDetails?.date,
		branch: branchLabel,
		department: labelResolvers.department(
			String(formValues.department ?? "")
		),
		project: labelResolvers.project(String(formValues.project ?? "")),
		issuedTo: (formValues.issued_to as string) || issueDetails?.issuedTo,
		status: issueDetails?.status,
	};

	const { metadata } = useTransactionPreview({
		header: previewHeader,
		fields: [
			{ label: "Issue Pass No", accessor: (header) => header.issuePassNo },
			{ label: "Issue Date", accessor: (header) => header.issueDate || "-" },
			{
				label: "Status",
				accessor: (header) => header.status,
				includeWhen: (header) => Boolean(header.status),
			},
		],
	});

	// Status chip
	const statusChip = React.useMemo(() => {
		if (!issueDetails?.status) return undefined;
		return statusChipProps;
	}, [issueDetails?.status, statusChipProps]);

	// Primary actions
	const primaryActions = React.useMemo<TransactionAction[] | undefined>(() => {
		if (mode === "view" || pageError || setupError) return undefined;
		return [
			{
				label: mode === "create" ? "Create Issue" : "Save Changes",
				onClick: () => formRef.current?.submit(),
				disabled: saving || !lineItemsValid || setupLoading,
				loading: saving,
			},
		];
	}, [
		mode,
		pageError,
		setupError,
		saving,
		lineItemsValid,
		setupLoading,
		formRef,
	]);

	// Secondary actions
	const secondaryActions = React.useMemo<TransactionAction[] | undefined>(() => {
		if (!requestedId || pageError) return undefined;
		const actions: TransactionAction[] = [];

		if (mode === "view") {
			// Edit button for draft/open status
			if (
				currentStatusId === ISSUE_STATUS_IDS.DRAFT ||
				currentStatusId === ISSUE_STATUS_IDS.OPEN
			) {
				actions.push({
					label: "Edit",
					variant: "secondary",
					onClick: () =>
						router.replace(
							`/dashboardportal/inventory/issue/createIssue?mode=edit&id=${encodeURIComponent(requestedId)}`
						),
				});
			}

			// Open button for draft status
			if (currentStatusId === ISSUE_STATUS_IDS.DRAFT) {
				actions.push({
					label: "Open",
					variant: "default",
					onClick: handleOpen,
					disabled: saving,
				});
			}

			// Approve button for open/pending status
			if (
				currentStatusId === ISSUE_STATUS_IDS.OPEN ||
				currentStatusId === ISSUE_STATUS_IDS.PENDING_APPROVAL
			) {
				actions.push({
					label: "Approve",
					variant: "default",
					onClick: handleApprove,
					disabled: saving,
				});
			}
		}

		if (mode === "edit") {
			actions.push({
				label: "Cancel",
				variant: "ghost",
				onClick: () =>
					router.replace(
						`/dashboardportal/inventory/issue/createIssue?mode=view&id=${encodeURIComponent(requestedId)}`
					),
			});
		}

		return actions.length ? actions : undefined;
	}, [
		mode,
		requestedId,
		router,
		pageError,
		currentStatusId,
		saving,
		handleOpen,
		handleApprove,
	]);

	// Alerts
	const alerts =
		pageError || setupError ? (
			<div className="space-y-2">
				{pageError ? (
					<div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
						{pageError}
					</div>
				) : null}
				{setupError ? (
					<div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
						{setupError}
					</div>
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

	const getLineItemId = React.useCallback(
		(item: EditableLineItem) => item.id,
		[]
	);

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
				<IssuePreview details={issueDetails} labelResolvers={labelResolvers} />
			}
			lineItems={{
				title: "Line Items",
				subtitle: "List the materials to issue from stores.",
				items: lineItems,
				getItemId: getLineItemId,
				canEdit,
				columns: lineItemColumns,
				onRemoveSelected: handleBulkRemoveLines,
				placeholder: canEdit
					? "Add items to record the issue."
					: "No line items available.",
				selectionColumnWidth: "28px",
			}}
		>
			<IssueHeaderForm
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
