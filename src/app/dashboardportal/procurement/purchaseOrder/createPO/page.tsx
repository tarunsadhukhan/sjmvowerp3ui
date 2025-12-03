"use client";

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import TransactionWrapper from "@/components/ui/TransactionWrapper";
import { Button } from "@/components/ui/button";
import type { MuiFormMode } from "@/components/ui/muiform";
import {
  useDeferredOptionCache,
  useTransactionSetup,
  useTransactionPreview,
  type ApprovalInfo,
  type ApprovalActionPermissions,
  type ApprovalStatusId,
} from "@/components/ui/transaction";
import { useBranchOptions } from "@/utils/branchUtils";
import {
  fetchPOSetup1,
  fetchPOSetup2,
  getPOById,
  type POLine,
  type PODetails,
} from "@/utils/poService";
import useSelectedCompanyCoId from "@/hooks/use-selected-company-coid";
import { toast } from "@/hooks/use-toast";
import { useSidebarContext } from "@/components/dashboard/sidebarContext";
import { IndentLineItemsDialog, type IndentLineItem } from "../components/IndentLineItemsDialog";
import { POHeaderForm } from "./components/POHeaderForm";
import { POFooterForm } from "./components/POFooterForm";
import { POTotalsDisplay } from "./components/POTotalsDisplay";
import { POApprovalBar } from "./components/POApprovalBar";
import POPreview from "./components/POPreview";
import { usePOLineItemColumns, shouldAllowManualLineEntry } from "./components/POLineItemsTable";
import { usePOFormState } from "./hooks/usePOFormState";
import { usePOAddresses } from "./hooks/usePOAddresses";
import { usePOTaxCalculations } from "./hooks/usePOTaxCalculations";
import { usePOSelectOptions } from "./hooks/usePOSelectOptions";
import { usePOHeaderSchema, usePOFooterSchema } from "./hooks/usePOFormSchemas";
import { usePOFormSubmission } from "./hooks/usePOFormSubmission";
import { usePOApproval } from "./hooks/usePOApproval";
import { usePOLineItems } from "./hooks/usePOLineItems";
import {
  type BranchAddressRecord,
  type EditableLineItem,
  type ExpenseRecord,
  type ItemGroupCacheEntry,
  type ItemGroupRecord,
  type Option,
  type POSetupData,
  type ProjectRecord,
  type SupplierBranchRecord,
  type SupplierRecord,
} from "./types/poTypes";

import { mapItemGroupDetailResponse, mapPOSetupResponse } from "./utils/poMappers";
import {
  calculateExpectedDate,
  calculateLineAmount as calculateLineAmountUtil,
  calculateTotals,
} from "./utils/poCalculations";
import { buildDefaultFormValues, createBlankLine } from "./utils/poFactories";
import {
  EMPTY_BRANCH_ADDRESSES,
  EMPTY_EXPENSES,
  EMPTY_ITEM_GROUPS,
  EMPTY_PROJECTS,
  EMPTY_SETUP_PARAMS,
  EMPTY_SUPPLIERS,
  EMPTY_SUPPLIER_BRANCHES,
  PO_STATUS_IDS,
  PO_STATUS_LABELS,
  isAmountDiscountMode,
  isPercentageDiscountMode,
} from "./utils/poConstants";

export default function POTransactionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const modeParam = (searchParams?.get("mode") || "create").toLowerCase();
  const requestedId = searchParams?.get("id") || "";
  const branchIdFromUrl = searchParams?.get("branch_id") || "";
  const menuIdFromUrl = searchParams?.get("menu_id") || "";

  const mode: MuiFormMode = modeParam === "edit" ? "edit" : modeParam === "view" ? "view" : "create";

  const branchOptions = useBranchOptions();
  const { coId } = useSelectedCompanyCoId();
  const { availableMenus, menuItems: sidebarMenuItems, selectedBranches } = useSidebarContext();
  const [isMounted, setIsMounted] = React.useState(false);
  const branchPrefillAppliedRef = React.useRef(false);
  const [lockedBranchId, setLockedBranchId] = React.useState<string | null>(() => (mode !== "create" && branchIdFromUrl ? String(branchIdFromUrl) : null));

  // Prevent hydration mismatch by only enabling after mount
  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const getMenuId = React.useCallback((): string => {
    if (menuIdFromUrl) return menuIdFromUrl;

    if (availableMenus && availableMenus.length > 0) {
      const currentPath = pathname?.toLowerCase() || "";
      const matchingMenu = availableMenus.find(
        (item) => {
          if (!item.menu_path) return false;
          const menuPath = item.menu_path.toLowerCase();
          return currentPath === menuPath || currentPath.startsWith(menuPath + "/");
        }
      );
      if (matchingMenu?.menu_id) return String(matchingMenu.menu_id);

      const poMenu = availableMenus.find(
        (item) => {
          const path = (item.menu_path || "").toLowerCase();
          const name = (item.menu_name || "").toLowerCase();
          return path.includes("po") || path.includes("/procurement/po") || name.includes("po") || name.includes("purchase order");
        }
      );
      if (poMenu?.menu_id) return String(poMenu.menu_id);
    }

    return "";
  }, [menuIdFromUrl, pathname, availableMenus]);

  const {
    initialValues,
    setInitialValues,
    formValues,
    setFormValues,
    formKey,
    bumpFormKey,
    formRef,
    handleMainFormValuesChange,
    handleFooterFormValuesChange,
  } = usePOFormState({
    mode,
    buildDefaultFormValues,
    branchIdFromUrl,
  });
  const [poDetails, setPODetails] = React.useState<PODetails | null>(null);
  const [loading, setLoading] = React.useState<boolean>(mode !== "create");
  const [pageError, setPageError] = React.useState<string | null>(null);
  const [indentDialogOpen, setIndentDialogOpen] = React.useState(false);

  // DEBUG: Log branch state on each render
  React.useEffect(() => {
    console.log('[PO Page Debug]', {
      mode,
      branchIdFromUrl,
      lockedBranchId,
      'formValues.branch': formValues.branch,
      'initialValues.branch': initialValues.branch,
      formKey,
      branchOptionsCount: branchOptions.length,
    });
  });

  // Memoize branch value to prevent unnecessary recalculations.
  // In edit/view mode, we prefer the branch id passed from the index page
  // (branch_id query param) when the form has not yet been populated.
  const branchValue = React.useMemo(
    () => {
      if (lockedBranchId) return lockedBranchId;
      const fromForm = formValues.branch != null ? String(formValues.branch) : "";
      if (fromForm) return fromForm;
      return branchIdFromUrl ? String(branchIdFromUrl) : "";
    },
    [formValues.branch, branchIdFromUrl, lockedBranchId],
  );

  const resolvedBranchOptions = React.useMemo(() => {
    if (!branchValue) return branchOptions;
    const exists = branchOptions.some((opt) => String(opt.value) === String(branchValue));
    if (exists) return branchOptions;
    const fallbackLabel =
      (poDetails?.branch && typeof poDetails.branch === "string" ? poDetails.branch : undefined) ||
      branchValue;
    return [...branchOptions, { label: fallbackLabel, value: branchValue }];
  }, [branchOptions, branchValue, poDetails?.branch]);

  // Memoize branch ID for setup - only changes when branch value actually changes
  const branchIdForSetup = React.useMemo(() => {
    if (!branchValue || !/^\d+$/.test(branchValue)) return undefined;
    return branchValue;
  }, [branchValue]);

  // Memoize setup params - use stable reference to prevent unnecessary API calls
  // Use a ref to store the actual params object to maintain reference stability
  const setupParamsRef = React.useRef<typeof EMPTY_SETUP_PARAMS>(EMPTY_SETUP_PARAMS);
  const setupParams = React.useMemo(() => {
    // If branchId hasn't changed, return the same object reference
    const currentBranchId = branchIdForSetup;
    const prevBranchId = setupParamsRef.current.branchId;

    if (currentBranchId === prevBranchId) {
      return setupParamsRef.current; // Return same object reference
    }

    // BranchId changed - create new params object
    if (!currentBranchId) {
      setupParamsRef.current = EMPTY_SETUP_PARAMS;
      return EMPTY_SETUP_PARAMS;
    }

    setupParamsRef.current = { branchId: currentBranchId };
    return setupParamsRef.current;
  }, [branchIdForSetup]);

  // Memoize the mapper function to prevent unnecessary re-renders
  const memoizedMapPOSetupResponse = React.useCallback(mapPOSetupResponse, []);
  const memoizedFetchPOSetup1 = React.useCallback(fetchPOSetup1, []);

  const setupEnabled = React.useMemo(() => {
    return Boolean(coId && branchIdForSetup);
  }, [coId, branchIdForSetup]);

  // Setup hook - params will change only when branchIdForSetup actually changes
  // No deps needed since params already captures branch changes
  // Only fetches when enabled (both coId and branchIdForSetup are present)
  const { data: setupData, loading: setupLoading, error: setupError } = useTransactionSetup<{ branchId?: string }, Record<string, unknown>, POSetupData>({
    coId: coId || undefined,
    params: setupParams,
    fetcher: memoizedFetchPOSetup1,
    mapData: memoizedMapPOSetupResponse,
    enabled: setupEnabled,
  });

  // Determine if header fields should be disabled (when branch is not selected in create mode)
  const headerFieldsDisabled = React.useMemo(() => {
    if (mode === "view") return true; // Always disabled in view mode
    if (mode === "edit") return false; // Never disabled in edit mode (data is loaded)
    // In create mode, disable if branch is not selected
    return !branchIdForSetup;
  }, [mode, branchIdForSetup]);

  // Extract data from setupData - use direct access since setupData is memoized in the hook
  const suppliers = setupData?.suppliers ?? EMPTY_SUPPLIERS;
  const projects = setupData?.projects ?? EMPTY_PROJECTS;
  const expenses = setupData?.expenses ?? EMPTY_EXPENSES;
  const itemGroups = setupData?.itemGroups ?? EMPTY_ITEM_GROUPS;
  const coConfig = setupData?.coConfig;
  const manualEntryAllowed = React.useMemo(
    () => shouldAllowManualLineEntry(mode, coConfig?.indent_required),
    [mode, coConfig?.indent_required],
  );
  const branchAddresses = setupData?.branchAddresses ?? EMPTY_BRANCH_ADDRESSES;

  const fetchItemGroupDetail = React.useCallback(async (itemGroupId: string) => {
        if (!itemGroupId || !/^\d+$/.test(itemGroupId)) {
      throw new Error(`Invalid item group identifier: ${itemGroupId}`);
        }
        const response = await fetchPOSetup2(itemGroupId);
        return mapItemGroupDetailResponse(response);
  }, []);

  // Sync lockedBranchId when branch becomes available from URL (SSR -> hydration)
  React.useEffect(() => {
    if (mode === "create") return;
    if (branchPrefillAppliedRef.current) return;
    if (!branchIdFromUrl) return;

    branchPrefillAppliedRef.current = true;
    setLockedBranchId(String(branchIdFromUrl));
  }, [branchIdFromUrl, mode]);

  const handleItemGroupError = React.useCallback((error: unknown) => {
    const description = error instanceof Error ? error.message : "Please try again.";
        toast({
          variant: "destructive",
      title: "Unable to load item options",
      description,
    });
  }, []);

  const { cache: itemGroupCache, loading: itemGroupLoading, ensure: ensureItemGroupData } =
    useDeferredOptionCache<string, ItemGroupCacheEntry>({
      fetcher: fetchItemGroupDetail,
      onError: handleItemGroupError,
    });

  const { supplierBranches, billingState, shippingState, supplierBranchState } = usePOAddresses({
    mode,
    suppliers,
    branchAddresses,
    formValues,
    setFormValues,
  });

  const {
    lineItems,
    setLineItems,
    replaceItems,
    removeLineItems,
    handleLineFieldChange,
    handleIndentItemsConfirm: handleIndentItemsFromHook,
    mapLineToEditable,
    filledLineItems,
    lineItemsValid,
    itemGroupsFromLineItems,
  } = usePOLineItems({
    mode,
    coConfig,
    supplierBranchState,
    shippingState,
    itemGroupCache,
    itemGroupLoading,
    ensureItemGroupData,
    itemGroups,
    allowManualEntry: manualEntryAllowed,
  });

  const initialLineSeededRef = React.useRef(false);
  React.useEffect(() => {
    if (!manualEntryAllowed || mode !== "create") {
      initialLineSeededRef.current = false;
      return;
    }
    if (initialLineSeededRef.current) return;
    setLineItems((prev) => {
      if (prev.length) return prev;
      initialLineSeededRef.current = true;
      return [createBlankLine()];
    });
  }, [manualEntryAllowed, mode, setLineItems, createBlankLine]);

  const { taxType } = usePOTaxCalculations({
    mode,
    coConfig,
    supplierBranchState,
    shippingState,
    setLineItems,
  });

  const totals = React.useMemo(() => {
    const advancePercentage = Number(formValues.advance_percentage) || 0;
    return calculateTotals(filledLineItems, advancePercentage);
  }, [filledLineItems, formValues.advance_percentage]);


  const mapDetailsToFormValues = React.useCallback(
    (details: PODetails): Record<string, unknown> => {
      const base = buildDefaultFormValues();
      const toStringValue = (value: unknown) => {
        if (value === null || value === undefined) return "";
        return typeof value === "string" ? value : String(value);
      };
      const normalizeDate = (raw?: string) => {
        if (!raw) return "";
        return raw.split("T")[0] || raw;
      };

      return {
        ...base,
        branch: toStringValue(details.branch ?? base.branch),
        date: normalizeDate(details.poDate) || toStringValue(base.date),
        supplier: toStringValue(details.supplier ?? base.supplier),
        supplier_branch: toStringValue(details.supplierBranch ?? base.supplier_branch),
        billing_address: toStringValue(details.billingAddress ?? base.billing_address),
        shipping_address: toStringValue(details.shippingAddress ?? base.shipping_address),
        credit_term:
          details.creditTerm !== undefined && details.creditTerm !== null
            ? String(details.creditTerm)
            : toStringValue(base.credit_term),
        delivery_timeline:
          details.deliveryTimeline !== undefined && details.deliveryTimeline !== null
            ? String(details.deliveryTimeline)
            : toStringValue(base.delivery_timeline),
        project: toStringValue(details.project ?? base.project),
        expense_type: toStringValue(details.expenseType ?? base.expense_type),
        contact_person: toStringValue(details.contactPerson ?? base.contact_person),
        contact_no: toStringValue(details.contactNo ?? base.contact_no),
        footer_note: toStringValue(details.footerNote ?? base.footer_note),
        internal_note: toStringValue(details.internalNote ?? base.internal_note),
        terms_conditions: toStringValue(details.termsConditions ?? base.terms_conditions),
        advance_percentage:
          details.advancePercentage !== undefined && details.advancePercentage !== null
            ? String(details.advancePercentage)
            : toStringValue(base.advance_percentage),
        billing_state: toStringValue(details.billingState ?? base.billing_state),
        shipping_state: toStringValue(details.shippingState ?? base.shipping_state),
        tax_type: toStringValue(details.taxType ?? base.tax_type),
      };
    },
    [buildDefaultFormValues],
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
      setPODetails(null);
      setPageError(null);
      setLoading(false);
      return;
    }

    if (!requestedId) {
      setPODetails(null);
      setPageError("Purchase order id is required to load details.");
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
        const details = await getPOById(requestedId, coId || undefined, getMenuId() || undefined);
        if (cancelled) return;

        setPODetails(details);
        const nextValues = mapDetailsToFormValues(details);

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
        const description = error instanceof Error ? error.message : "Unable to load purchase order.";
        setPODetails(null);
        setPageError(description);
        toast({
          variant: "destructive",
          title: "Unable to load purchase order",
          description,
        });
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void fetchDetails();

    return () => {
      cancelled = true;
    };
  }, [
    mode,
    requestedId,
    coId,
    getMenuId,
    mapDetailsToFormValues,
    setInitialValues,
    setFormValues,
    bumpFormKey,
    replaceItems,
    mapLineToEditable,
    setupEnabled,
    setupLoading,
    setupData,
    branchIdFromUrl,
    branchValue,
  ]);

  React.useEffect(() => {
    if (!poDetails?.lines?.length) return;
    const uniqueGroups = new Set(
      poDetails.lines
        .map((line) => (line.itemGroup ? String(line.itemGroup) : ""))
        .filter((groupId) => groupId && /^\d+$/.test(groupId)),
    );
    uniqueGroups.forEach((groupId) => {
      ensureItemGroupData(groupId);
    });
  }, [poDetails, ensureItemGroupData]);

  const isLineItemsReady = React.useMemo(() => {
    if (mode === "view" || pageError || setupError) return true;
    return lineItemsValid;
  }, [lineItemsValid, mode, pageError, setupError]);

  const expectedDate = React.useMemo(() => {
    const dateStr = String(formValues.date ?? "");
    const timeline = Number(formValues.delivery_timeline) || 0;
    return calculateExpectedDate(dateStr, timeline);
  }, [formValues.date, formValues.delivery_timeline]);


  // Update computed fields in formValues when dependencies change
  React.useEffect(() => {
    setFormValues((prev) => {
      // Only update if values actually changed to prevent unnecessary re-renders
      if (
        prev.expected_date === expectedDate &&
        prev.billing_state === (billingState || "") &&
        prev.shipping_state === (shippingState || "") &&
        prev.tax_type === taxType
      ) {
        return prev;
      }
      return {
        ...prev,
        expected_date: expectedDate,
        billing_state: billingState || "",
        shipping_state: shippingState || "",
        tax_type: taxType,
      };
    });
  }, [expectedDate, billingState, shippingState, taxType]);

  // Handle indent selection - just open the dialog, selection happens inside
  const handleIndentSelect = React.useCallback(() => {
    setIndentDialogOpen(true);
  }, []);

  const handleIndentItemsConfirm = React.useCallback(
    (selectedItems: IndentLineItem[]) => {
      handleIndentItemsFromHook(selectedItems);
    setIndentDialogOpen(false);
    },
    [handleIndentItemsFromHook, setIndentDialogOpen],
  );

  // Line item field handlers and columns
  const {
    supplierOptions,
    supplierBranchOptions,
    branchAddressOptions,
    projectOptions,
    expenseOptions,
    itemGroupOptions,
  } = usePOSelectOptions({
    suppliers,
    supplierBranches,
    branchAddresses,
    projects,
    expenses,
    itemGroupsFromLineItems,
  });

  const headerSchema = usePOHeaderSchema({
    branchOptions: resolvedBranchOptions,
    supplierOptions,
    supplierBranchOptions,
    branchAddressOptions,
    projectOptions,
    expenseOptions,
    coConfig,
    billingState,
              shippingState,
    taxType,
    expectedDate,
    mode,
    headerFieldsDisabled,
  });

  const footerSchema = usePOFooterSchema({
    coConfig,
    billingState,
              shippingState,
    taxType,
  });

  const getItemOptions = React.useCallback(
    (itemGroupId: string) => itemGroupCache[itemGroupId]?.items ?? [],
    [itemGroupCache]
  );

  const getMakeOptions = React.useCallback(
    (itemGroupId: string) => itemGroupCache[itemGroupId]?.makes ?? [],
    [itemGroupCache]
  );

  const getUomOptions = React.useCallback(
    (itemGroupId: string, itemId: string) =>
      itemGroupCache[itemGroupId]?.uomsByItemId[itemId] ?? [],
    [itemGroupCache]
  );

  const getItemLabel = React.useCallback(
    (groupId: string, itemId: string, itemCode?: string) => {
      if (!groupId || !itemId) return itemCode || "-";
      // Try to get from cache first
      const cachedLabel = itemGroupCache[groupId]?.itemLabelById[itemId];
      if (cachedLabel) return cachedLabel;
      // Fallback to itemCode if available, otherwise itemId
      return itemCode || itemId;
    },
    [itemGroupCache]
  );

  const canEdit = mode !== "view";

  const lineItemColumns = usePOLineItemColumns({
    canEdit,
    itemGroupOptions,
    getItemOptions,
    getItemLabel,
    getUomOptions,
    onFieldChange: handleLineFieldChange,
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
  } = usePOApproval({
    mode,
    requestedId,
    formValues,
    poDetails,
    coId,
    getMenuId,
    setPODetails,
  });

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

  const getOptionLabel = React.useCallback(
    (options: Array<{ label: string; value: string }>, value?: unknown) => {
      if (value === null || typeof value === "undefined") return undefined;
      const target = String(value);
      return options.find((opt) => opt.value === target)?.label;
    },
    [],
  );

  const branchLabel = React.useMemo(() => {
    const value = formValues.branch ?? poDetails?.branch;
    return getOptionLabel(resolvedBranchOptions, value) ?? (typeof value === "string" ? value : undefined);
  }, [resolvedBranchOptions, formValues.branch, poDetails?.branch, getOptionLabel]);

  const supplierLabel = React.useMemo(() => {
    const value = formValues.supplier ?? poDetails?.supplier;
    return getOptionLabel(supplierOptions, value) ?? (typeof value === "string" ? value : undefined);
  }, [formValues.supplier, poDetails?.supplier, supplierOptions, getOptionLabel]);

  const supplierBranchLabel = React.useMemo(() => {
    const value = formValues.supplier_branch ?? poDetails?.supplierBranch;
    return getOptionLabel(supplierBranchOptions, value) ?? (typeof value === "string" ? value : undefined);
  }, [formValues.supplier_branch, poDetails?.supplierBranch, supplierBranchOptions, getOptionLabel]);

  const billingAddressLabel = React.useMemo(() => {
    const value = formValues.billing_address ?? poDetails?.billingAddress;
    return getOptionLabel(branchAddressOptions, value) ?? (typeof value === "string" ? value : undefined);
  }, [formValues.billing_address, poDetails?.billingAddress, branchAddressOptions, getOptionLabel]);

  const shippingAddressLabel = React.useMemo(() => {
    const value = formValues.shipping_address ?? poDetails?.shippingAddress;
    return getOptionLabel(branchAddressOptions, value) ?? (typeof value === "string" ? value : undefined);
  }, [formValues.shipping_address, poDetails?.shippingAddress, branchAddressOptions, getOptionLabel]);

  const projectLabel = React.useMemo(() => {
    const value = formValues.project ?? poDetails?.project;
    return getOptionLabel(projectOptions, value) ?? (typeof value === "string" ? value : undefined);
  }, [formValues.project, poDetails?.project, projectOptions, getOptionLabel]);

  const expenseLabel = React.useMemo(() => {
    const value = formValues.expense_type ?? poDetails?.expenseType;
    return getOptionLabel(expenseOptions, value) ?? (typeof value === "string" ? value : undefined);
  }, [formValues.expense_type, poDetails?.expenseType, expenseOptions, getOptionLabel]);

  const statusLabel = React.useMemo(() => statusChipProps?.label ?? poDetails?.status, [statusChipProps?.label, poDetails?.status]);

  const previewHeader = React.useMemo(
    () => ({
      poNo: poDetails?.poNo,
      poDate: (formValues.date as string) || poDetails?.poDate,
      expectedDate,
      branch: branchLabel,
      supplier: supplierLabel,
      supplierBranch: supplierBranchLabel,
      billingAddress: billingAddressLabel,
      shippingAddress: shippingAddressLabel,
      project: projectLabel,
      expenseType: expenseLabel,
      companyName,
      contactPerson: (formValues.contact_person as string) || poDetails?.contactPerson,
      contactNo: (formValues.contact_no as string) || poDetails?.contactNo,
      status: statusLabel,
      updatedBy: poDetails?.updatedBy,
      updatedAt: poDetails?.updatedAt,
      taxType: (formValues.tax_type as string) || poDetails?.taxType,
    }),
    [
      poDetails?.poNo,
      poDetails?.poDate,
      poDetails?.contactPerson,
      poDetails?.contactNo,
      poDetails?.updatedBy,
      poDetails?.updatedAt,
      poDetails?.taxType,
      formValues.date,
      formValues.contact_person,
      formValues.contact_no,
      formValues.tax_type,
      branchLabel,
      supplierLabel,
      supplierBranchLabel,
      billingAddressLabel,
      shippingAddressLabel,
      projectLabel,
      expenseLabel,
      companyName,
      expectedDate,
      statusLabel,
    ],
  );

  const previewItems = React.useMemo(() => {
    return filledLineItems.map((line, index) => {
      const groupLabel = itemGroups.find((grp) => grp.id === line.itemGroup)?.label ?? line.itemGroup ?? "";
      const itemLabel = getItemLabel(line.itemGroup, line.item, line.itemCode);
      const uomOptions = getUomOptions(line.itemGroup, line.item);
      const uomLabel = uomOptions.find((opt) => opt.value === line.uom)?.label ?? line.uom ?? "-";
      const displayItem = (() => {
        const parts = [groupLabel, itemLabel].filter(Boolean);
        if (parts.length > 0) return parts.join(" — ");
        return line.item || "-";
      })();
      return {
        srNo: index + 1,
        itemGroup: groupLabel || undefined,
        item: displayItem,
        quantity: line.quantity || "-",
        uom: uomLabel,
        rate: line.rate,
        amount: typeof line.amount === "number" ? line.amount : line.amount ?? "",
        remarks: line.remarks || "-",
      };
    });
  }, [filledLineItems, getItemLabel, getUomOptions, itemGroups]);

  const previewTotals = React.useMemo(
    () => ({
      netAmount: totals.netAmount,
      totalIGST: totals.totalIGST,
      totalCGST: totals.totalCGST,
      totalSGST: totals.totalSGST,
      totalAmount: totals.totalAmount,
      advanceAmount: totals.advanceAmount,
      advancePercentage:
        formValues.advance_percentage != null && formValues.advance_percentage !== ""
          ? Number(formValues.advance_percentage)
          : poDetails?.advancePercentage,
    }),
    [totals, formValues.advance_percentage, poDetails?.advancePercentage],
  );

  const previewRemarks = React.useMemo(() => {
    return (
      (formValues.internal_note as string) ||
      poDetails?.internalNote ||
      (formValues.footer_note as string) ||
      poDetails?.footerNote ||
      ""
    );
  }, [formValues.internal_note, formValues.footer_note, poDetails?.internalNote, poDetails?.footerNote]);

  const { metadata } = useTransactionPreview({
    header: previewHeader,
    fields: [
      { label: "PO No", accessor: (header) => header.poNo || "Pending" },
      { label: "PO Date", accessor: (header) => header.poDate || "-" },
      { label: "Supplier", accessor: (header) => header.supplier || "-" },
      { label: "Status", accessor: (header) => header.status || "-", includeWhen: (header) => Boolean(header.status) },
    ],
  });

  const {
    saving,
    handleFormSubmit,
  } = usePOFormSubmission({
    mode,
    pageError,
    setupError,
    branchAddresses,
    filledLineItems,
    isLineItemsReady,
    requestedId,
  });

  const primaryActionLabel = mode === "create" ? "Create" : "Save";
  const handleSaveClick = React.useCallback(() => {
    if (!formRef.current?.submit) return;
    void formRef.current.submit();
  }, [formRef]);

  const pageTitle = React.useMemo(() => {
    if (mode === "create") return "Create Purchase Order";
    if (mode === "edit") {
      return poDetails?.poNo ? `Edit PO ${poDetails.poNo}` : "Edit Purchase Order";
    }
    return poDetails?.poNo ? `Purchase Order ${poDetails.poNo}` : "Purchase Order Details";
  }, [mode, poDetails?.poNo]);

  return (
    <TransactionWrapper
      title={pageTitle}
      subtitle={mode === "create" ? "Create a new purchase order" : mode === "edit" ? "Edit purchase order" : "View purchase order details"}
      metadata={metadata}
      statusChip={statusChipProps}
      backAction={{ onClick: () => router.push("/dashboardportal/procurement/purchaseOrder") }}
      loading={loading || setupLoading}
      alerts={pageError ? <div role="alert" aria-live="assertive" className="text-red-600">{pageError}</div> : undefined}
      preview={
        <POPreview
          header={previewHeader}
          items={previewItems}
          totals={previewTotals}
          remarks={previewRemarks}
        />
      }
      lineItems={{
        items: lineItems,
        getItemId: (item) => item.id,
        canEdit,
        columns: lineItemColumns,
        placeholder: manualEntryAllowed
          ? "Add line items by selecting from indent or manually entering items"
          : "Select items from an indent to populate the PO line items",
        selectionColumnWidth: "28px",
      }}
      footer={
        <div className="space-y-6 pt-4 border-t">
          <POFooterForm
            schema={footerSchema}
            formKey={formKey}
            initialValues={initialValues}
            mode={mode}
            onSubmit={handleFormSubmit}
            onValuesChange={handleFooterFormValuesChange}
          />
          <POTotalsDisplay totals={totals} showGSTBreakdown={Boolean(coConfig?.india_gst)} />
          <POApprovalBar
              approvalInfo={approvalInfo}
              permissions={approvalPermissions}
            loading={approvalLoading}
              onApprove={handleApprove}
              onReject={handleReject}
              onOpen={handleOpen}
              onCancelDraft={handleCancelDraft}
              onReopen={handleReopen}
              onSendForApproval={handleSendForApproval}
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
      <POHeaderForm
        schema={headerSchema}
        formKey={formKey}
          initialValues={initialValues}
          mode={mode}
        formRef={formRef}
          onSubmit={handleFormSubmit}
          onValuesChange={handleMainFormValuesChange}
        showIndentButton={mode !== "view"}
        onIndentSelect={handleIndentSelect}
        indentButtonDisabled={!isMounted || !selectedBranches || selectedBranches.length === 0}
      />

      <IndentLineItemsDialog
        open={indentDialogOpen}
        onOpenChange={setIndentDialogOpen}
        onConfirm={handleIndentItemsConfirm}
        branchId={branchValue || undefined}
        coId={coId || undefined}
      />
    </TransactionWrapper>
  );
}

