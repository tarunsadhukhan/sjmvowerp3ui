"use client";

/**
 * @page JutePOCreatePage
 * @description Create/Edit/View page for Jute Purchase Orders.
 * Orchestrates all hooks and components for the Jute PO transaction workflow.
 */

import * as React from "react";
import { useSearchParams, useRouter } from "next/navigation";
import TransactionWrapper, { type TransactionAction } from "@/components/ui/TransactionWrapper";
import { useLineItems, SearchableSelect } from "@/components/ui/transaction";
import useSelectedCompanyCoId from "@/hooks/use-selected-company-coid";
import { fetchWithCookie } from "@/utils/apiClient2";
import { apiRoutesPortalMasters } from "@/utils/api";

// Types
import type {
  MuiFormMode,
  JutePOFormValues,
  JutePOLineItem,
  JutePOSetupData,
  JutePODetails,
  Option,
} from "./types/jutePOTypes";

// Constants and Utils
import {
  JUTE_PO_STATUS_IDS,
  JUTE_PO_STATUS_LABELS,
  JUTE_PO_STATUS_COLORS,
  EMPTY_MUKAMS,
  EMPTY_VEHICLE_TYPES,
  EMPTY_JUTE_ITEMS,
  EMPTY_OPTIONS,
  CHANNEL_OPTIONS,
  UNIT_OPTIONS,
} from "./utils/jutePOConstants";
import { createBlankLine, lineHasAnyData, lineIsComplete } from "./utils/jutePOFactories";
import { calculateTotals } from "./utils/jutePOCalculations";
import {
  mapJutePOSetupResponse,
  mapJutePODetailsResponse,
  mapLineItemsFromAPI,
  mapFormToCreatePayload,
  mapFormToUpdatePayload,
  buildBranchOptions,
  extractFormValuesFromDetails,
} from "./utils/jutePOMappers";

// Hooks
import { useJutePOFormState } from "./hooks/useJutePOFormState";
import { useJutePOLineItems } from "./hooks/useJutePOLineItems";
import { useJutePOSelectOptions } from "./hooks/useJutePOSelectOptions";
import { useJutePOFormSchemas } from "./hooks/useJutePOFormSchemas";
import { useJutePOApproval } from "./hooks/useJutePOApproval";

// Components
import {
  JutePOHeaderForm,
  useJutePOLineItemColumns,
  JutePOApprovalBar,
  JutePOTotalsDisplay,
  JutePOPreview,
} from "./components";

export default function JutePOCreatePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { coId } = useSelectedCompanyCoId();

  // Derive mode and ID from URL
  const modeParam = searchParams?.get("mode") ?? "create";
  const mode: MuiFormMode = modeParam === "edit" ? "edit" : modeParam === "view" ? "view" : "create";
  const jutePOId = searchParams?.get("id") ?? null;

  // Page-level state
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [pageError, setPageError] = React.useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = React.useState(false);

  // Setup data state
  const [setupData, setSetupData] = React.useState<JutePOSetupData | null>(null);
  const [details, setDetails] = React.useState<JutePODetails | null>(null);

  // Cascading dropdown state - parties only (suppliers come from setupData)
  const [parties, setParties] = React.useState<Option[]>([]);
  const [qualitiesByItem, setQualitiesByItem] = React.useState<Record<string, Option[]>>({});

  // Derived branch options from setup data
  const branchOptions = React.useMemo(
    () => (setupData ? buildBranchOptions(setupData.branches) : []),
    [setupData]
  );

  // Derived supplier options from setup data
  const supplierOptions = React.useMemo(
    () =>
      (setupData?.suppliers ?? []).map((s) => ({
        label: s.supplier_name,
        value: String(s.supplier_id),
      })),
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
  } = useJutePOFormState({ mode });

  // Line items hook
  const {
    lineItems,
    setLineItems,
    replaceItems: replaceLineItems,
    removeLineItems,
    handleLineFieldChange,
  } = useJutePOLineItems({
    mode,
    juteUnit: formValues.juteUnit,
    vehicleCapacity: parseFloat(
      (setupData?.vehicle_types ?? []).find((v) => String(v.vehicle_type_id) === formValues.vehicleType)?.capacity_weight?.toString() ?? "0"
    ),
    vehicleQty: parseInt(formValues.vehicleQty, 10) || 1,
    getQualityOptions: (itemId: string) => qualitiesByItem[itemId] ?? [],
  });

  // Select options hook
  const { labelResolvers, getQualityOptions } = useJutePOSelectOptions({
    branches: setupData?.branches ?? [],
    mukams: setupData?.mukams ?? [],
    vehicleTypes: setupData?.vehicle_types ?? [],
    juteItems: setupData?.jute_items ?? [],
    suppliers: setupData?.suppliers ?? [],
    parties,
    qualitiesByItem,
  });

  // Form schema hook
  const formSchema = useJutePOFormSchemas({
    mode,
    branchOptions,
    mukamOptions: (setupData?.mukams ?? []).map((m) => ({ label: m.mukam_name, value: String(m.mukam_id) })),
    supplierOptions,
    partyOptions: parties,
    vehicleTypeOptions: (setupData?.vehicle_types ?? []).map((v) => ({
      label: `${v.vehicle_type} (${v.capacity_weight} Qtl)`,
      value: String(v.vehicle_type_id),
    })),
    channelOptions: CHANNEL_OPTIONS,
    unitOptions: UNIT_OPTIONS,
    hasSupplierSelected: Boolean(formValues.supplier),
  });

  // Approval hook
  const {
    statusId,
    approvalInfo,
    approvalPermissions,
    approvalLoading,
    handleOpen,
    handleApprove,
    handleReject,
    handleCancelDraft,
    handleReopen,
  } = useJutePOApproval({
    mode,
    jutePOId,
    coId: coId ?? "",
    details,
    setDetails,
  });

  // Calculate totals
  const { totalWeight, totalAmount, validLineCount } = React.useMemo(
    () => calculateTotals(lineItems),
    [lineItems]
  );

  // Check if mandatory header fields are filled (required before line item entry)
  const areMandatoryFieldsFilled = React.useMemo(() => {
    const mandatoryFields: (keyof JutePOFormValues)[] = [
      "branch",
      "poDate",
      "mukam",
      "juteUnit",
      "supplier",
      "vehicleType",
      "vehicleQty",
      "channelType",
      "creditTerm",
      "deliveryTimeline",
    ];
    return mandatoryFields.every((field) => {
      const value = formValues[field];
      return value !== undefined && value !== null && value !== "";
    });
  }, [formValues]);

  // Line items can be edited only if mode is not view AND mandatory fields are filled
  const canEditLineItems = mode !== "view" && areMandatoryFieldsFilled;

  // ========== Data Fetching ==========

  // Fetch setup data on mount
  React.useEffect(() => {
    if (!coId) return;

    const fetchSetup = async () => {
      try {
        const response = await fetchWithCookie(
          `${apiRoutesPortalMasters.JUTE_PO_CREATE_SETUP}?co_id=${coId}`,
          "GET"
        );
        if (response?.data) {
          const mapped = mapJutePOSetupResponse(response.data);
          setSetupData(mapped);
        }
      } catch (error) {
        console.error("Error fetching Jute PO setup:", error);
        setPageError("Failed to load setup data");
      }
    };

    void fetchSetup();
  }, [coId]);

  // Fetch PO details for edit/view modes
  React.useEffect(() => {
    if (!coId || !jutePOId || mode === "create") {
      setLoading(false);
      return;
    }

    const fetchDetails = async () => {
      setLoading(true);
      try {
        // Fetch PO details
        const detailsResponse = await fetchWithCookie(
          `${apiRoutesPortalMasters.JUTE_PO_BY_ID}/${jutePOId}?co_id=${coId}`,
          "GET"
        );
        if (detailsResponse?.data) {
          const mappedDetails = mapJutePODetailsResponse(detailsResponse.data);
          setDetails(mappedDetails);

          // Set form values from details
          const formVals = extractFormValuesFromDetails(mappedDetails);
          setInitialValues(formVals);
          setFormValues(formVals);
          bumpFormKey();

          // Fetch parties for the supplier (suppliers come from setupData now)
          if (formVals.supplier) {
            await handleSupplierChange(formVals.supplier);
          }
        }

        // Fetch line items
        const lineItemsResponse = await fetchWithCookie(
          `${apiRoutesPortalMasters.JUTE_PO_LINE_ITEMS}/${jutePOId}?co_id=${coId}`,
          "GET"
        );
        if (lineItemsResponse?.data) {
          const mappedLines = mapLineItemsFromAPI(lineItemsResponse.data);
          replaceLineItems(mappedLines);

          // Fetch qualities for each unique item
          const uniqueItems = [...new Set(mappedLines.map((l) => l.itemId).filter(Boolean))];
          for (const itemId of uniqueItems) {
            await fetchQualitiesForItem(itemId);
          }
        }
      } catch (error) {
        console.error("Error fetching Jute PO details:", error);
        setPageError("Failed to load PO details");
      } finally {
        setLoading(false);
      }
    };

    void fetchDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coId, jutePOId, mode]);

  // ========== Cascading Handlers ==========

  // Suppliers now come from setupData, so no handleMukamChange needed.
  // Only parties are fetched when supplier changes.

  const handleSupplierChange = React.useCallback(
    async (supplierId: string) => {
      // Clear party when supplier changes
      setParties([]);
      setFormValues((prev) => ({ ...prev, partyName: "" }));

      if (!supplierId || !coId) return;

      try {
        const response = await fetchWithCookie(
          `${apiRoutesPortalMasters.JUTE_PO_PARTIES_BY_SUPPLIER}/${supplierId}?co_id=${coId}`,
          "GET"
        );
        if (response?.data) {
          const mapped = (response.data as Array<{ party_id: string; party_name: string }>).map(
            (p) => ({
              label: p.party_name ?? p.party_id,
              value: String(p.party_id),
            })
          );
          setParties(mapped);
        }
      } catch (error) {
        console.error("Error fetching parties:", error);
      }
    },
    [coId, setFormValues]
  );

  const fetchQualitiesForItem = React.useCallback(
    async (itemId: string) => {
      if (!itemId || !coId || qualitiesByItem[itemId]) return;

      try {
        const response = await fetchWithCookie(
          `${apiRoutesPortalMasters.JUTE_PO_QUALITIES_BY_ITEM}/${itemId}?co_id=${coId}`,
          "GET"
        );
        if (response?.data) {
          // API returns { qualities: [...] } with quality_id and quality_name
          const qualitiesData = response.data.qualities ?? response.data;
          const mapped = (qualitiesData as Array<{ quality_id: number | string; quality_name: string }>).map(
            (q) => ({
              label: q.quality_name ?? String(q.quality_id),
              value: String(q.quality_id),
            })
          );
          setQualitiesByItem((prev) => ({ ...prev, [itemId]: mapped }));
        }
      } catch (error) {
        console.error("Error fetching qualities:", error);
      }
    },
    [coId, qualitiesByItem]
  );

  // Handle item selection in line items - fetches qualities for the selected item
  const handleItemSelect = React.useCallback(
    (itemId: string) => {
      if (itemId) {
        void fetchQualitiesForItem(itemId);
      }
    },
    [fetchQualitiesForItem]
  );

  // Wrapped handleLineFieldChange that also triggers quality fetch on item change
  const handleLineFieldChangeWithQualityFetch = React.useCallback(
    (id: string, field: keyof JutePOLineItem, value: string) => {
      handleLineFieldChange(id, field, value);
      
      // When item changes, fetch qualities for the new item
      if (field === "itemId" && value) {
        handleItemSelect(value);
      }
    },
    [handleLineFieldChange, handleItemSelect]
  );

  // Column definitions for line items
  const lineItemColumns = useJutePOLineItemColumns({
    canEdit: canEditLineItems,
    itemOptions: (setupData?.jute_items ?? EMPTY_JUTE_ITEMS).map((i: { item_id: number; item_desc: string }) => ({
      label: i.item_desc,
      value: String(i.item_id),
    })),
    getQualityOptions,
    labelResolvers,
    handleLineFieldChange: handleLineFieldChangeWithQualityFetch,
  });

  // ========== Form Handlers ==========

  const handleFormSubmit = React.useCallback(
    async (values: Record<string, unknown>) => {
      if (!coId) return;

      setSaving(true);
      setPageError(null);

      try {
        const validLines = lineItems.filter(lineIsComplete);
        if (validLines.length === 0) {
          setPageError("Please add at least one complete line item");
          setSaving(false);
          return;
        }

        if (mode === "create") {
          const payload = mapFormToCreatePayload(values as unknown as JutePOFormValues, validLines);
          const response = await fetchWithCookie(
            `${apiRoutesPortalMasters.JUTE_PO_CREATE}?co_id=${coId}`,
            "POST",
            payload
          );

          if (response?.data && !response?.error && response.data?.jute_po_id) {
            // Redirect to edit mode with new ID
            router.push(
              `/dashboardportal/jutePurchase/po/createPO?mode=edit&id=${response.data.jute_po_id}`
            );
          } else {
            setPageError(response?.error ?? "Failed to create Jute PO");
          }
        } else if (mode === "edit" && jutePOId) {
          const payload = mapFormToUpdatePayload(values as unknown as JutePOFormValues, validLines);
          const response = await fetchWithCookie(
            `${apiRoutesPortalMasters.JUTE_PO_UPDATE}/${jutePOId}?co_id=${coId}`,
            "PUT",
            payload
          );

          if (response?.data && !response?.error) {
            // Refresh details
            bumpFormKey();
          } else {
            setPageError(response?.error ?? "Failed to update Jute PO");
          }
        }
      } catch (error) {
        console.error("Error saving Jute PO:", error);
        setPageError("An error occurred while saving");
      } finally {
        setSaving(false);
      }
    },
    [coId, mode, jutePOId, lineItems, router, bumpFormKey]
  );

  const handleSave = React.useCallback(async () => {
    if (formRef.current) {
      await formRef.current.submit();
    }
  }, [formRef]);

  // ========== Actions ==========

  const primaryActions = React.useMemo((): TransactionAction[] => {
    const actions: TransactionAction[] = [];

    if (mode !== "view" && approvalPermissions.canSave) {
      actions.push({
        label: "Save",
        onClick: handleSave,
        variant: "default",
        disabled: saving,
      });
    }

    actions.push({
      label: "Preview",
      onClick: () => setPreviewOpen(true),
      variant: "outline",
    });

    if (mode !== "create") {
      actions.push({
        label: "Back to List",
        onClick: () => router.push("/dashboardportal/jutePurchase/po"),
        variant: "ghost",
      });
    }

    return actions;
  }, [mode, approvalPermissions, saving, handleSave, router]);

  // ========== Render ==========

  return (
    <>
      <TransactionWrapper
        title={mode === "create" ? "Create Jute PO" : mode === "edit" ? "Edit Jute PO" : "View Jute PO"}
        subtitle={details?.po_num ? `PO #${details.po_num}` : undefined}
        loading={loading || saving}
        alerts={
          <>
            {pageError && <div className="text-red-600 p-2">{pageError}</div>}
            {mode !== "view" && !areMandatoryFieldsFilled && (
              <div className="text-amber-600 bg-amber-50 border border-amber-200 rounded p-2 text-sm">
                Please fill all mandatory header fields before adding line items.
              </div>
            )}
          </>
        }
        primaryActions={primaryActions}
        statusChip={
          mode !== "create" && approvalInfo
            ? { label: approvalInfo.statusLabel, color: approvalInfo.statusColor }
            : undefined
        }
        lineItems={{
          items: lineItems as unknown[],
          getItemId: (item: unknown) => (item as JutePOLineItem).id,
          canEdit: canEditLineItems,
          columns: lineItemColumns as unknown as { id: string; header: React.ReactNode; width?: string; renderCell: (context: { item: unknown; index: number; canEdit: boolean }) => React.ReactNode }[],
          onRemoveSelected: canEditLineItems ? removeLineItems : undefined,
        }}
        footer={
          <>
            {mode !== "create" && (
              <JutePOApprovalBar
                approvalInfo={approvalInfo}
                permissions={approvalPermissions}
                loading={approvalLoading}
                onOpen={handleOpen}
                onApprove={handleApprove}
                onReject={handleReject}
                onCancelDraft={handleCancelDraft}
                onReopen={handleReopen}
              />
            )}
            <JutePOTotalsDisplay
              totalWeight={totalWeight}
              totalAmount={totalAmount}
              lineCount={validLineCount}
            />
          </>
        }
      >
        <JutePOHeaderForm
          schema={formSchema}
          formKey={formKey}
          initialValues={initialValues}
          mode={mode}
          formRef={formRef}
          onSubmit={handleFormSubmit}
          onValuesChange={(values) => setFormValues(values as unknown as JutePOFormValues)}
          onSupplierChange={handleSupplierChange}
        />
      </TransactionWrapper>

      <JutePOPreview
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        poNumber={details?.po_num}
        statusId={statusId}
        formValues={formValues}
        lineItems={lineItems}
        labelResolvers={labelResolvers}
        totalWeight={totalWeight}
        totalAmount={totalAmount}
      />
    </>
  );
}
