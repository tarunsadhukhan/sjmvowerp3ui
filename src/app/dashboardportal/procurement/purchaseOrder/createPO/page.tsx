"use client";

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import TransactionWrapper, { type TransactionAction } from "@/components/ui/TransactionWrapper";
import type { MuiFormMode } from "@/components/ui/muiform";
import {
  useDeferredOptionCache,
  useTransactionSetup,
  type ApprovalInfo,
  type ApprovalActionPermissions,
  type ApprovalStatusId,
} from "@/components/ui/transaction";
import { useBranchOptions } from "@/utils/branchUtils";
import {
  fetchPOSetup1,
  fetchPOSetup2,
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
import { usePOLineItemColumns } from "./components/POLineItemsTable";
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
  const menuIdFromUrl = searchParams?.get("menu_id") || "";

  const mode: MuiFormMode = modeParam === "edit" ? "edit" : modeParam === "view" ? "view" : "create";

  const branchOptions = useBranchOptions();
  const { coId } = useSelectedCompanyCoId();
  const { availableMenus, menuItems: sidebarMenuItems, selectedBranches } = useSidebarContext();
  const [isMounted, setIsMounted] = React.useState(false);

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
  });
  const [poDetails, setPODetails] = React.useState<PODetails | null>(null);
  const [loading, setLoading] = React.useState<boolean>(mode !== "create");
  const [pageError, setPageError] = React.useState<string | null>(null);
  const [indentDialogOpen, setIndentDialogOpen] = React.useState(false);

  // Memoize branch value to prevent unnecessary recalculations
  const branchValue = React.useMemo(() => String(formValues.branch ?? ""), [formValues.branch]);

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

  // Only enable the hook when BOTH coId AND branchIdForSetup are available
  // This ensures the API is only called once branch is selected, not on page load
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
  const branchAddresses = setupData?.branchAddresses ?? EMPTY_BRANCH_ADDRESSES;

  const fetchItemGroupDetail = React.useCallback(async (itemGroupId: string) => {
    if (!itemGroupId || !/^\d+$/.test(itemGroupId)) {
      throw new Error(`Invalid item group identifier: ${itemGroupId}`);
    }
    const response = await fetchPOSetup2(itemGroupId);
    return mapItemGroupDetailResponse(response);
  }, []);

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
  }, [mode, setLineItems, createBlankLine]);

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
    branchOptions,
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

  const handleSave = React.useCallback(async () => {
    if (!formRef.current?.submit) return;
    await formRef.current.submit();
  }, [formRef]);

  const primaryActions: TransactionAction[] = React.useMemo(
    () => [
      {
        label: "Save",
        onClick: handleSave,
        disabled: saving || setupLoading || !isLineItemsReady,
        loading: saving,
        hidden: mode === "view" || !approvalPermissions.canSave,
      },
    ],
    [handleSave, saving, setupLoading, isLineItemsReady, mode, approvalPermissions.canSave]
  );

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
      statusChip={statusChipProps}
      backAction={{ onClick: () => router.push("/dashboardportal/procurement/purchaseOrder") }}
      primaryActions={primaryActions}
      loading={loading || setupLoading}
      alerts={pageError ? <div role="alert" aria-live="assertive" className="text-red-600">{pageError}</div> : undefined}
      lineItems={{
        items: lineItems,
        getItemId: (item) => item.id,
        canEdit,
        columns: lineItemColumns,
        placeholder: "Add line items by selecting from indent or manually entering items",
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

