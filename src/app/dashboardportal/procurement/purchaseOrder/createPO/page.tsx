"use client";

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import TransactionWrapper, { type TransactionAction } from "@/components/ui/TransactionWrapper";
import MuiForm, { type MuiFormMode, type Schema, type Field } from "@/components/ui/muiform";
import {
  SearchableSelect,
  useDeferredOptionCache,
  useLineItems,
  useTransactionSetup,
  type TransactionLineColumn,
  ApprovalActionsBar,
  type ApprovalInfo,
  type ApprovalActionPermissions,
  type ApprovalStatusId,
} from "@/components/ui/transaction";
import { useBranchOptions } from "@/utils/branchUtils";
import {
  createPO,
  fetchPOSetup1,
  fetchPOSetup2,
  getPOById,
  updatePO,
  approvePO,
  openPO,
  cancelDraftPO,
  reopenPO,
  sendPOForApproval,
  rejectPO,
  getIndentLineItems,
  type POLine,
  type PODetails,
} from "@/utils/poService";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import useSelectedCompanyCoId from "@/hooks/use-selected-company-coid";
import { buildLabelMap, createLabelResolver } from "@/utils/labelUtils";
import { useSidebarContext } from "@/components/dashboard/sidebarContext";
import { IndentLineItemsDialog, type IndentLineItem } from "../components/IndentLineItemsDialog";
import { Button } from "@/components/ui/button";

type Option = { label: string; value: string };

type EditableLineItem = {
  id: string;
  indentDtlId?: string;
  indentNo?: string;
  department?: string;
  itemGroup: string;
  item: string;
  itemCode?: string;
  itemMake: string;
  quantity: string;
  rate: string;
  uom: string;
  discountMode?: number;
  discountValue: string;
  discountAmount?: number;
  amount?: number;
  remarks: string;
  taxPercentage?: number;
};

type SupplierRecord = { id: string; name: string; code?: string; branches?: SupplierBranchRecord[] };
type SupplierBranchRecord = { id: string; address: string; stateName?: string };
type BranchAddressRecord = { 
  id: string; 
  name: string; 
  address1?: string; 
  address2?: string; 
  zipcode?: string;
  stateName?: string; 
  stateId?: number;
  fullAddress?: string; // Concatenated address for display
};
type ProjectRecord = { id: string; name: string; branchId?: string };
type ExpenseRecord = { id: string; name: string };
type ItemGroupRecord = { id: string; label: string };

type ItemOption = Option & { defaultUomId?: string; defaultUomLabel?: string; defaultRate?: number; taxPercentage?: number };

type ItemGroupCacheEntry = {
  items: ItemOption[];
  makes: Option[];
  uomsByItemId: Record<string, Option[]>;
  itemLabelById: Record<string, string>;
  makeLabelById: Record<string, string>;
  uomLabelByItemId: Record<string, Record<string, string>>;
  itemRateById: Record<string, number>;
  itemTaxById: Record<string, number>;
};

type POSetupData = {
  suppliers: SupplierRecord[];
  projects: ProjectRecord[];
  expenses: ExpenseRecord[];
  itemGroups: ItemGroupRecord[];
  coConfig?: { india_gst?: number; indent_required?: number; back_date_allowable?: number };
  branchAddresses: BranchAddressRecord[];
};

const mapSupplierRecords = (records: unknown[]): SupplierRecord[] =>
  records
    .map((row) => {
      const data = row as any;
      const id = data?.party_id ?? data?.id;
      if (!id) return null;
      
      // Map branches if they exist in the supplier object
      const branchesRaw = (data?.branches as unknown[]) ?? [];
      const branches = mapSupplierBranchRecords(branchesRaw);
      
      return {
        id: String(id),
        name: data?.supplier_name ?? data?.supp_name ?? data?.name ?? String(id),
        code: data?.supplier_code ?? data?.supp_code,
        branches: branches.length > 0 ? branches : undefined,
      } satisfies SupplierRecord;
    })
    .filter(Boolean) as SupplierRecord[];

const mapSupplierBranchRecords = (records: unknown[]): SupplierBranchRecord[] =>
  records
    .map((row) => {
      const data = row as any;
      const id = data?.party_mst_branch_id ?? data?.id;
      if (!id) return null;
      const addr1 = data?.branch_address1 ?? "";
      const addr2 = data?.branch_address2 ?? "";
      const address = [addr1, addr2].filter(Boolean).join(", ");
      return {
        id: String(id),
        address: address || String(id),
        stateName: data?.state_name,
      } satisfies SupplierBranchRecord;
    })
    .filter(Boolean) as SupplierBranchRecord[];

const mapBranchAddressRecords = (records: unknown[]): BranchAddressRecord[] =>
  records
    .map((row) => {
      const data = row as any;
      const id = data?.branch_id ?? data?.id;
      if (!id) return null;
      
      // Concatenate address fields for display
      const address1 = data?.branch_address1 ?? "";
      const address2 = data?.branch_address2 ?? "";
      const zipcode = data?.branch_zipcode ?? "";
      const stateName = data?.state_name ?? "";
      
      // Build full address string
      const addressParts = [address1, address2, stateName, zipcode].filter(Boolean);
      const fullAddress = addressParts.length > 0 ? addressParts.join(", ") : (data?.branch_name ?? String(id));
      
      return {
        id: String(id),
        name: data?.branch_name ?? String(id),
        address1: address1 || undefined,
        address2: address2 || undefined,
        zipcode: zipcode || undefined,
        stateName: stateName || undefined,
        stateId: data?.state_id,
        fullAddress: fullAddress,
      } satisfies BranchAddressRecord;
    })
    .filter(Boolean) as BranchAddressRecord[];

const mapProjectRecords = (records: unknown[]): ProjectRecord[] =>
  records
    .map((row) => {
      const data = row as any;
      const id = data?.project_id ?? data?.id;
      if (!id) return null;
      return {
        id: String(id),
        name: data?.prj_name ?? data?.project_name ?? data?.name ?? String(id),
        branchId: data?.branch_id != null ? String(data.branch_id) : undefined,
      } satisfies ProjectRecord;
    })
    .filter(Boolean) as ProjectRecord[];

const mapExpenseRecords = (records: unknown[]): ExpenseRecord[] =>
  records
    .map((row) => {
      const data = row as any;
      const id = data?.expense_type_id ?? data?.id;
      if (!id) return null;
      return {
        id: String(id),
        name: data?.expense_type_name ?? data?.name ?? String(id),
      } satisfies ExpenseRecord;
    })
    .filter(Boolean) as ExpenseRecord[];

const mapItemGroupRecords = (records: unknown[]): ItemGroupRecord[] =>
  records
    .map((row) => {
      const data = row as any;
      const id = data?.item_grp_id ?? data?.id;
      if (!id) return null;
      const code = data?.item_grp_code_display ?? data?.code;
      const name = data?.item_grp_name_display ?? data?.name;
      const labelParts = [code, name].filter(Boolean);
      return {
        id: String(id),
        label: labelParts.length ? labelParts.join(" — ") : String(id),
      } satisfies ItemGroupRecord;
    })
    .filter(Boolean) as ItemGroupRecord[];

const mapPOSetupResponse = (response: unknown): POSetupData => {
  try {
    const result = response as Record<string, unknown>;
    console.log("[mapPOSetupResponse] Raw response:", response);
    console.log("[mapPOSetupResponse] Suppliers from API:", result?.suppliers);
    
    const suppliersRaw = (result?.suppliers as unknown[]) ?? [];
    const mappedSuppliers = mapSupplierRecords(suppliersRaw);
    console.log("[mapPOSetupResponse] Mapped suppliers:", mappedSuppliers);
    
    const mapped = {
      suppliers: mappedSuppliers,
      projects: mapProjectRecords((result?.projects as unknown[]) ?? []),
      expenses: mapExpenseRecords((result?.expense_types as unknown[]) ?? []),
      itemGroups: mapItemGroupRecords((result?.item_groups as unknown[]) ?? []),
      coConfig: result?.co_config as POSetupData["coConfig"],
      branchAddresses: mapBranchAddressRecords((result?.branch_addresses as unknown[]) ?? []),
    } satisfies POSetupData;
    
    console.log("[mapPOSetupResponse] Final mapped data:", mapped);
    return mapped;
  } catch (error) {
    console.error("[mapPOSetupResponse] Error mapping response:", error, "Response:", response);
    throw error;
  }
};

const mapItemGroupDetailResponse = (response: unknown): ItemGroupCacheEntry => {
  const result = response as Record<string, unknown>;
  const itemsRaw = Array.isArray(result.items) ? result.items : [];
  const makesRaw = Array.isArray(result.makes) ? result.makes : [];
  const uomsRaw = Array.isArray(result.uoms) ? result.uoms : [];

  const items: ItemOption[] = itemsRaw
    .map((row) => {
      const data = row as any;
      const id = data?.item_id ?? data?.id;
      if (!id) return null;
      const value = String(id);
      const code = data?.item_code;
      const name = data?.item_name;
      const labelParts = [code, name].filter(Boolean);
      return {
        value,
        label: labelParts.length ? labelParts.join(" — ") : value,
        defaultUomId: data?.uom_id != null ? String(data.uom_id) : undefined,
        defaultUomLabel: data?.uom_name ? String(data.uom_name) : undefined,
        defaultRate: data?.rate != null ? Number(data.rate) : undefined,
        taxPercentage: data?.tax_percentage != null ? Number(data.tax_percentage) : undefined,
      } satisfies ItemOption;
    })
    .filter(Boolean) as ItemOption[];

  const makes: Option[] = makesRaw
    .map((row) => {
      const data = row as any;
      const id = data?.item_make_id ?? data?.id;
      if (!id) return null;
      return {
        value: String(id),
        label: data?.item_make_name ?? data?.name ?? String(id),
      } satisfies Option;
    })
    .filter(Boolean) as Option[];

  const uomsByItemId: Record<string, Option[]> = {};
  const uomLabelByItemId: Record<string, Record<string, string>> = {};
  const itemRateById: Record<string, number> = {};
  const itemTaxById: Record<string, number> = {};

  uomsRaw.forEach((row) => {
    const data = row as any;
    const itemId = data?.item_id ?? data?.id;
    const uomId = data?.map_to_id ?? data?.uom_id ?? data?.mapToId;
    if (!itemId || !uomId) return;
    const itemKey = String(itemId);
    const uomKey = String(uomId);
    const label = data?.uom_name ? String(data.uom_name) : uomKey;
    if (!uomsByItemId[itemKey]) uomsByItemId[itemKey] = [];
    if (!uomLabelByItemId[itemKey]) uomLabelByItemId[itemKey] = {};
    if (!uomsByItemId[itemKey].some((opt) => opt.value === uomKey)) {
      uomsByItemId[itemKey].push({ value: uomKey, label });
    }
    uomLabelByItemId[itemKey][uomKey] = label;
  });

  items.forEach((item) => {
    if (item.defaultUomId) {
      const bucket = uomsByItemId[item.value] ?? [];
      if (!bucket.some((opt) => opt.value === item.defaultUomId)) {
        bucket.unshift({
          value: item.defaultUomId,
          label: item.defaultUomLabel ?? item.defaultUomId,
        });
      }
      uomsByItemId[item.value] = bucket;
      if (!uomLabelByItemId[item.value]) uomLabelByItemId[item.value] = {};
      uomLabelByItemId[item.value][item.defaultUomId] = item.defaultUomLabel ?? item.defaultUomId ?? item.defaultUomId;
    }
    if (item.defaultRate != null) {
      itemRateById[item.value] = item.defaultRate;
    }
    if (item.taxPercentage != null) {
      itemTaxById[item.value] = item.taxPercentage;
    }
  });

  const itemLabelById: Record<string, string> = {};
  items.forEach((item) => {
    itemLabelById[item.value] = item.label;
  });

  const makeLabelById: Record<string, string> = {};
  makes.forEach((make) => {
    makeLabelById[make.value] = make.label;
  });

  return {
    items,
    makes,
    uomsByItemId,
    itemLabelById,
    makeLabelById,
    uomLabelByItemId,
    itemRateById,
    itemTaxById,
  } satisfies ItemGroupCacheEntry;
};

const EMPTY_SUPPLIERS: SupplierRecord[] = [];
const EMPTY_SUPPLIER_BRANCHES: SupplierBranchRecord[] = [];
const EMPTY_BRANCH_ADDRESSES: BranchAddressRecord[] = [];
const EMPTY_PROJECTS: ProjectRecord[] = [];
const EMPTY_EXPENSES: ExpenseRecord[] = [];
const EMPTY_ITEM_GROUPS: ItemGroupRecord[] = [];
const EMPTY_SETUP_PARAMS: { readonly branchId?: string } = {};

const buildDefaultFormValues = () => ({
  branch: "",
  date: new Date().toISOString().slice(0, 10),
  supplier: "",
  supplier_branch: "",
  billing_address: "",
  shipping_address: "",
  tax_payable: "Yes",
  credit_term: "",
  delivery_timeline: "",
  project: "",
  expense_type: "",
  contact_person: "",
  contact_no: "",
  footer_note: "",
  internal_note: "",
  terms_conditions: "",
  advance_percentage: "",
  expected_date: "",
  billing_state: "",
  shipping_state: "",
  tax_type: "",
});

let lineIdSeed = 0;
const generateLineId = () => {
  lineIdSeed += 1;
  return `line-${lineIdSeed}`;
};

const createBlankLine = (): EditableLineItem => ({
  id: generateLineId(),
  itemGroup: "",
  item: "",
  itemMake: "",
  quantity: "",
  rate: "",
  uom: "",
  discountValue: "",
  remarks: "",
});

const lineHasAnyData = (line: EditableLineItem) =>
  Boolean(
    line.itemGroup ||
      line.item ||
      line.itemMake ||
      line.quantity ||
      line.rate ||
      line.uom ||
      line.remarks
  );

const lineIsComplete = (line: EditableLineItem) => {
  const qty = Number(line.quantity);
  const rate = Number(line.rate);
  return Boolean(line.itemGroup && line.item && line.uom && Number.isFinite(qty) && qty > 0 && Number.isFinite(rate) && rate >= 0);
};

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

  const [initialValues, setInitialValues] = React.useState<Record<string, unknown>>(buildDefaultFormValues);
  const [formValues, setFormValues] = React.useState<Record<string, unknown>>(buildDefaultFormValues);
  const { items: lineItems, setItems: setLineItems, replaceItems, removeItems: removeLineItems } = useLineItems<EditableLineItem>({
    createBlankItem: createBlankLine,
    hasData: lineHasAnyData,
    getItemId: (item) => item.id,
    maintainTrailingBlank: mode !== "view",
  });
  const [poDetails, setPODetails] = React.useState<PODetails | null>(null);
  const [loading, setLoading] = React.useState<boolean>(mode !== "create");
  const [saving, setSaving] = React.useState(false);
  const [pageError, setPageError] = React.useState<string | null>(null);
  const [formKey, setFormKey] = React.useState(0);
  const [approvalLoading, setApprovalLoading] = React.useState(false);
  const [indentDialogOpen, setIndentDialogOpen] = React.useState(false);

  // Calculate totals and GST
  const calculateLineAmount = React.useCallback((line: EditableLineItem): number => {
    const qty = Number(line.quantity) || 0;
    const rate = Number(line.rate) || 0;
    const baseAmount = qty * rate;
    const discountAmount = line.discountAmount || 0;
    return Math.max(0, baseAmount - discountAmount);
  }, []);

  const totals = React.useMemo(() => {
    const netAmount = lineItems
      .filter(lineHasAnyData)
      .reduce((sum, line) => sum + calculateLineAmount(line), 0);
    
    // TODO: Calculate GST totals when india_gst is enabled
    const totalIGST = 0;
    const totalSGST = 0;
    const totalCGST = 0;
    const totalAmount = netAmount + totalIGST + totalSGST + totalCGST;
    
    const advancePercentage = Number(formValues.advance_percentage) || 0;
    const advanceAmount = (netAmount * advancePercentage) / 100;
    
    return { netAmount, totalIGST, totalSGST, totalCGST, totalAmount, advanceAmount };
  }, [lineItems, formValues.advance_percentage, calculateLineAmount]);

  // Memoize branch value to prevent unnecessary recalculations
  const branchValue = React.useMemo(() => String(formValues.branch ?? ""), [formValues.branch]);
  
  // Memoize branch ID for setup - only changes when branch value actually changes
  const branchIdForSetup = React.useMemo(() => {
    if (!branchValue || !/^\d+$/.test(branchValue)) return undefined;
    return branchValue;
  }, [branchValue]);
  
  // Memoize setup params - use stable reference to prevent unnecessary API calls
  // Use a ref to store the actual params object to maintain reference stability
  const setupParamsRef = React.useRef<{ branchId?: string }>(EMPTY_SETUP_PARAMS);
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

  // Debug: Log when suppliers change
  React.useEffect(() => {
    console.log("[PO Create] Suppliers data changed:", suppliers.length, "suppliers", suppliers);
    console.log("[PO Create] Full setup data:", setupData);
  }, [suppliers.length, setupData]);

  const { cache: itemGroupCache, loading: itemGroupLoading, ensure: ensureItemGroupData, reset: resetItemGroupCache } =
    useDeferredOptionCache<string, ItemGroupCacheEntry>({
      fetcher: async (itemGroupId: string) => {
        if (!itemGroupId || !/^\d+$/.test(itemGroupId)) {
          throw new Error(`Invalid item group ID: ${itemGroupId}`);
        }
        const response = await fetchPOSetup2(itemGroupId);
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

  const formRef = React.useRef<{ submit: () => Promise<void>; isDirty: () => boolean } | null>(null);
  const createDefaultsSeededRef = React.useRef(false);

  const mapLineToEditable = React.useCallback((line: POLine): EditableLineItem => ({
    id: line.id ? String(line.id) : generateLineId(),
    indentDtlId: line.indentDtlId,
    indentNo: line.indentNo,
    itemGroup: "",
    item: line.item ?? "",
    itemCode: line.itemCode,
    itemMake: line.itemMake ?? "",
    quantity: line.quantity != null ? String(line.quantity) : "",
    rate: line.rate != null ? String(line.rate) : "",
    uom: line.uom ?? "",
    discountMode: line.discountMode,
    discountValue: line.discountValue != null ? String(line.discountValue) : "",
    discountAmount: line.discountAmount,
    amount: line.amount,
    remarks: line.remarks ?? "",
    taxPercentage: line.taxPercentage,
  }), []);

  React.useEffect(() => {
    if (mode !== "create") {
      createDefaultsSeededRef.current = false;
      return;
    }

    if (!createDefaultsSeededRef.current) {
      const base = buildDefaultFormValues();
      setInitialValues(base);
      setFormValues(base);
      setFormKey((prev) => prev + 1);
      setLineItems((prev) => (prev.length ? prev : [createBlankLine()]));
      createDefaultsSeededRef.current = true;
    }
  }, [mode]);

  React.useEffect(() => {
    if (mode === "create") {
      setPODetails(null);
      setPageError(null);
      setLoading(false);
      return;
    }

    if (!requestedId) {
      setPODetails(null);
      replaceItems([]);
      setPageError("Missing PO identifier in the URL.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    
    const menuId = getMenuId();
    getPOById(requestedId, coId, menuId || undefined)
      .then((detail) => {
        if (cancelled) return;
        setPODetails(detail);
        const mappedLines = (detail.lines ?? []).map(mapLineToEditable);
        replaceItems(mappedLines.length ? mappedLines : [createBlankLine()]);
        
        const baseValues = buildDefaultFormValues();
        const headerValues = {
          ...baseValues,
          branch: detail.branch ?? "",
          date: detail.poDate ?? baseValues.date,
          supplier: detail.supplier ?? "",
          supplier_branch: detail.supplierBranch ?? "",
          billing_address: detail.billingAddress ?? "",
          shipping_address: detail.shippingAddress ?? "",
          project: detail.project ?? "",
          credit_term: detail.creditTerm != null ? String(detail.creditTerm) : "",
          delivery_timeline: detail.deliveryTimeline != null ? String(detail.deliveryTimeline) : "",
          contact_person: detail.contactPerson ?? "",
          contact_no: detail.contactNo ?? "",
          footer_note: detail.footerNote ?? "",
          internal_note: detail.internalNote ?? "",
          terms_conditions: detail.termsConditions ?? "",
          advance_percentage: detail.advancePercentage != null ? String(detail.advancePercentage) : "",
        };
        setInitialValues(headerValues);
        setFormValues(headerValues);
        setFormKey((prev) => prev + 1);
        setPageError(null);
      })
      .catch((error) => {
        if (cancelled) return;
        setPageError(error instanceof Error ? error.message : "Failed to load PO details.");
        setPODetails(null);
        replaceItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [mode, requestedId, coId, getMenuId, mapLineToEditable, replaceItems]);

  // Get supplier branches from selected supplier (already included in setup data)
  const supplierBranches = React.useMemo(() => {
    const supplierId = String(formValues.supplier ?? "");
    if (!supplierId) return [];
    const supplier = suppliers.find((s) => s.id === supplierId);
    return supplier?.branches ?? [];
  }, [formValues.supplier, suppliers]);

  // Set default supplier branch when supplier changes (only when supplier ID actually changes)
  const previousSupplierIdRef = React.useRef<string>("");
  const hasSetDefaultBranchRef = React.useRef<boolean>(false); // Track if we've set default branch for current supplier
  
  React.useEffect(() => {
    if (mode === "view") return;
    
    const currentSupplierId = String(formValues.supplier ?? "");
    const supplierChanged = previousSupplierIdRef.current !== currentSupplierId;
    
    // Only proceed if supplier actually changed (not just other form fields)
    if (!supplierChanged) {
      return;
    }
    
    // Update tracked supplier
    previousSupplierIdRef.current = currentSupplierId;
    hasSetDefaultBranchRef.current = false;
    
    if (!currentSupplierId) {
      // Supplier cleared - clear branch if set
      setFormValues((prev) => {
        if (prev.supplier_branch) {
          return { ...prev, supplier_branch: "" };
        }
        return prev;
      });
      return;
    }
    
    // Supplier changed - set default branch if available and not already set
    if (supplierBranches.length > 0 && !hasSetDefaultBranchRef.current) {
      const defaultBranchId = supplierBranches[0].id;
      setFormValues((prev) => {
        const currentSupplierIdCheck = String(prev.supplier ?? "");
        // Only update if the supplier still matches (to prevent resetting when other fields change)
        if (currentSupplierIdCheck !== currentSupplierId) {
          return prev; // Don't change if supplier doesn't match
        }
        
        const currentBranchId = String(prev.supplier_branch ?? "");
        // Only update if branch is empty or the current branch is not in the new supplier's branches
        const currentBranchValid = supplierBranches.some((b) => b.id === currentBranchId);
        if (!currentBranchId || !currentBranchValid) {
          hasSetDefaultBranchRef.current = true;
          return { ...prev, supplier_branch: defaultBranchId };
        }
        hasSetDefaultBranchRef.current = true; // Mark as set even if we didn't change it
        return prev; // No change needed
      });
    } else if (supplierBranches.length === 0) {
      // No branches available - clear branch if set
      setFormValues((prev) => {
        const currentSupplierIdCheck = String(prev.supplier ?? "");
        if (currentSupplierIdCheck !== currentSupplierId) {
          return prev; // Don't change if supplier doesn't match
        }
        if (prev.supplier_branch) {
          return { ...prev, supplier_branch: "" };
        }
        return prev;
      });
      hasSetDefaultBranchRef.current = true; // Mark as handled
    }
  }, [formValues.supplier, mode]); // Removed supplierBranches from deps to prevent re-runs when it changes reference

  // Get billing and shipping states
  const billingState = React.useMemo(() => {
    const billingId = String(formValues.billing_address ?? "");
    const address = branchAddresses.find((a) => a.id === billingId);
    return address?.stateName;
  }, [formValues.billing_address, branchAddresses]);

  const shippingState = React.useMemo(() => {
    const shippingId = String(formValues.shipping_address ?? "");
    const address = branchAddresses.find((a) => a.id === shippingId);
    return address?.stateName;
  }, [formValues.shipping_address, branchAddresses]);

  const taxType = React.useMemo(() => {
    if (!coConfig?.india_gst) return "";
    if (billingState && shippingState && billingState === shippingState) {
      return "IGST & SGST";
    }
    return "IGST";
  }, [coConfig?.india_gst, billingState, shippingState]);

  const expectedDate = React.useMemo(() => {
    const dateStr = String(formValues.date ?? "");
    const timeline = Number(formValues.delivery_timeline) || 0;
    if (!dateStr || !timeline) return "";
    try {
      const date = new Date(dateStr);
      date.setDate(date.getDate() + timeline);
      return date.toISOString().slice(0, 10);
    } catch {
      return "";
    }
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

  // Memoized handler for footer form value changes (prevents infinite loops)
  const handleFooterFormValuesChange = React.useCallback((values: Record<string, unknown>) => {
    setFormValues((prev) => {
      // Check if any values actually changed before updating
      let hasChanges = false;
      for (const key in values) {
        if (prev[key] !== values[key]) {
          hasChanges = true;
          break;
        }
      }
      if (!hasChanges) {
        return prev; // No changes, return same reference to prevent re-render
      }
      // Merge footer form values with existing form values to preserve fields from main form
      return { ...prev, ...values };
    });
  }, []);

  // Memoized handler for main form value changes (prevents infinite loops)
  const handleMainFormValuesChange = React.useCallback((values: Record<string, unknown>) => {
    setFormValues((prev) => {
      // Check if any values actually changed before updating
      let hasChanges = false;
      for (const key in values) {
        if (prev[key] !== values[key]) {
          hasChanges = true;
          break;
        }
      }
      if (!hasChanges) {
        return prev; // No changes, return same reference to prevent re-render
      }
      // Merge main form values with existing form values to preserve fields from footer form
      return { ...prev, ...values };
    });
  }, []);

  // Handle indent selection - just open the dialog, selection happens inside
  const handleIndentSelect = React.useCallback(() => {
    setIndentDialogOpen(true);
  }, []);

  const handleIndentItemsConfirm = React.useCallback((selectedItems: IndentLineItem[]) => {
    const newLines = selectedItems.map((item) => {
      const line: EditableLineItem = {
        id: generateLineId(),
        indentDtlId: String(item.indent_dtl_id),
        indentNo: item.indent_no,
        itemGroup: String(item.item_grp_id),
        item: String(item.item_id),
        itemCode: item.item_code,
        itemMake: item.item_make_id ? String(item.item_make_id) : "",
        quantity: String(item.qty || 0),
        rate: "",
        uom: String(item.uom_id),
        discountValue: "",
        remarks: item.remarks || "",
        taxPercentage: item.tax_percentage,
      };
      return line;
    });
    setLineItems((prev) => [...prev.filter((line) => !lineHasAnyData(line)), ...newLines]);
    setIndentDialogOpen(false);
  }, [setLineItems]);

  // Line item field handlers and columns
  const handleLineFieldChange = React.useCallback(
    (id: string, field: keyof EditableLineItem, rawValue: string | number) => {
      if (mode === "view") return;

      const value = typeof rawValue === "number" ? String(rawValue) : rawValue;

      if (field === "itemGroup") {
        setLineItems((prev) =>
          prev.map((item) =>
            item.id === id
              ? {
                  ...item,
                  itemGroup: value,
                  item: "",
                  itemMake: "",
                  uom: "",
                  rate: "",
                }
              : item
          )
        );
        if (value && !itemGroupCache[value] && !itemGroupLoading[value]) {
          void ensureItemGroupData(value);
        }
        return;
      }

      if (field === "item") {
        setLineItems((prev) =>
          prev.map((item) => {
            if (item.id !== id) return item;
            const groupId = item.itemGroup;
            const cache = itemGroupCache[groupId ?? ""];
            const defaultRate = cache?.itemRateById[value];
            const defaultTax = cache?.itemTaxById[value];
            const defaultUom = cache?.items.find((opt) => opt.value === value)?.defaultUomId;
            const uomOptions = cache?.uomsByItemId[value] ?? [];
            let nextUom = item.uom;
            if (defaultUom && uomOptions.some((opt) => opt.value === defaultUom)) {
              nextUom = defaultUom;
            } else if (uomOptions.length) {
              nextUom = uomOptions[0].value;
            }
            return {
              ...item,
              item: value,
              uom: nextUom,
              rate: defaultRate != null ? String(defaultRate) : item.rate,
              taxPercentage: defaultTax,
            };
          })
        );
        return;
      }

      if (field === "quantity" || field === "rate") {
        const sanitized = value.replace(/[^0-9.]/g, "");
        setLineItems((prev) =>
          prev.map((item) => {
            if (item.id !== id) return item;
            const updated = { ...item, [field]: sanitized };
            const qty = Number(updated.quantity) || 0;
            const rate = Number(updated.rate) || 0;
            const discountMode = updated.discountMode;
            const discountValue = Number(updated.discountValue) || 0;
            let discountAmount = 0;
            if (discountMode === 1) {
              discountAmount = (qty * rate * discountValue) / 100;
            } else if (discountMode === 2) {
              discountAmount = discountValue;
            }
            updated.discountAmount = discountAmount;
            updated.amount = Math.max(0, qty * rate - discountAmount);
            return updated;
          })
        );
        return;
      }

      if (field === "discountValue") {
        const sanitized = value.replace(/[^0-9.]/g, "");
        setLineItems((prev) =>
          prev.map((item) => {
            if (item.id !== id) return item;
            const updated = { ...item, discountValue: sanitized };
            const qty = Number(updated.quantity) || 0;
            const rate = Number(updated.rate) || 0;
            const discountMode = updated.discountMode;
            const discountValue = Number(sanitized) || 0;
            let discountAmount = 0;
            if (discountMode === 1) {
              discountAmount = (qty * rate * discountValue) / 100;
            } else if (discountMode === 2) {
              discountAmount = discountValue;
            }
            updated.discountAmount = discountAmount;
            updated.amount = Math.max(0, qty * rate - discountAmount);
            return updated;
          })
        );
        return;
      }

      setLineItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, [field]: value } as EditableLineItem : item))
      );
    },
    [mode, ensureItemGroupData, itemGroupCache, itemGroupLoading]
  );

  const supplierOptions = React.useMemo<Option[]>(() => {
    if (!suppliers || suppliers.length === 0) {
      console.log("[PO Create] No suppliers available for options");
      return [];
    }
    const options = suppliers.map((s) => {
      const label = s.name || s.code || s.id || "Unknown";
      const value = s.id || "";
      return { label, value };
    }).filter((opt) => opt.value); // Filter out any with empty values
    console.log("[PO Create] Supplier options created:", options.length, "options", options);
    console.log("[PO Create] From suppliers:", suppliers.length, "suppliers", suppliers);
    return options;
  }, [suppliers]);

  const supplierBranchOptions = React.useMemo<Option[]>(
    () => supplierBranches.map((b) => ({ label: b.address || b.id, value: b.id })),
    [supplierBranches]
  );

  const branchAddressOptions = React.useMemo<Option[]>(
    () => branchAddresses.map((a) => ({ 
      label: a.fullAddress || a.address1 || a.name || a.id, 
      value: a.id 
    })),
    [branchAddresses]
  );

  const projectOptions = React.useMemo<Option[]>(
    () => projects.map((p) => ({ label: p.name || p.id, value: p.id })),
    [projects]
  );

  const expenseOptions = React.useMemo<Option[]>(
    () => expenses.map((e) => ({ label: e.name || e.id, value: e.id })),
    [expenses]
  );

  const itemGroupOptions = React.useMemo<Option[]>(
    () => itemGroups.map((grp) => ({ label: grp.label || grp.id, value: grp.id })),
    [itemGroups]
  );

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
    (groupId: string, itemId: string) => {
      if (!groupId || !itemId) return "-";
      return itemGroupCache[groupId]?.itemLabelById[itemId] ?? itemId;
    },
    [itemGroupCache]
  );

  const canEdit = mode !== "view";

  const lineItemColumns: TransactionLineColumn<EditableLineItem>[] = React.useMemo(
    () => [
      {
        id: "itemGroup",
        header: "Item Group",
        width: "1.2fr",
        renderCell: ({ item }) => {
          if (!canEdit) {
            return <span className="block truncate text-xs">{itemGroupOptions.find((o) => o.value === item.itemGroup)?.label || "-"}</span>;
          }
          const value = itemGroupOptions.find((o) => o.value === item.itemGroup) ?? null;
          return (
            <SearchableSelect<Option>
              options={itemGroupOptions}
              value={value}
              onChange={(next) => handleLineFieldChange(item.id, "itemGroup", next?.value ?? "")}
              getOptionLabel={(o) => o.label}
              isOptionEqualToValue={(a, b) => a.value === b.value}
              placeholder="Select group"
            />
          );
        },
      },
      {
        id: "item",
        header: "Item",
        width: "1.5fr",
        renderCell: ({ item }) => {
          if (!canEdit) {
            return <span className="block truncate text-xs">{getItemLabel(item.itemGroup, item.item)}</span>;
          }
          const options = getItemOptions(item.itemGroup);
          const value = options.find((o) => o.value === item.item) ?? null;
          return (
            <SearchableSelect<Option>
              options={options}
              value={value}
              onChange={(next) => handleLineFieldChange(item.id, "item", next?.value ?? "")}
              getOptionLabel={(o) => o.label}
              isOptionEqualToValue={(a, b) => a.value === b.value}
              placeholder="Select item"
            />
          );
        },
      },
      {
        id: "rate",
        header: "Rate",
        width: "0.8fr",
        renderCell: ({ item }) => {
          if (!canEdit) {
            return <span className="block truncate text-xs">{item.rate || "-"}</span>;
          }
          return (
            <Input
              type="text"
              value={item.rate}
              onChange={(e) => handleLineFieldChange(item.id, "rate", e.target.value)}
              placeholder="0.00"
              className="h-8 text-xs"
            />
          );
        },
      },
      {
        id: "quantity",
        header: "Quantity",
        width: "0.8fr",
        renderCell: ({ item }) => {
          if (!canEdit) {
            return <span className="block truncate text-xs">{item.quantity || "-"}</span>;
          }
          return (
            <Input
              type="text"
              value={item.quantity}
              onChange={(e) => handleLineFieldChange(item.id, "quantity", e.target.value)}
              placeholder="0"
              className="h-8 text-xs"
            />
          );
        },
      },
      {
        id: "uom",
        header: "Unit",
        width: "0.6fr",
        renderCell: ({ item }) => {
          if (!canEdit) {
            return <span className="block truncate text-xs">{getUomOptions(item.itemGroup, item.item).find((o) => o.value === item.uom)?.label || "-"}</span>;
          }
          const options = getUomOptions(item.itemGroup, item.item);
          const value = options.find((o) => o.value === item.uom) ?? null;
          return (
            <SearchableSelect<Option>
              options={options}
              value={value}
              onChange={(next) => handleLineFieldChange(item.id, "uom", next?.value ?? "")}
              getOptionLabel={(o) => o.label}
              isOptionEqualToValue={(a, b) => a.value === b.value}
              placeholder="UOM"
            />
          );
        },
      },
      {
        id: "amount",
        header: "Amount",
        width: "0.8fr",
        renderCell: ({ item }) => (
          <span className="block truncate text-xs font-medium">{item.amount?.toFixed(2) || "0.00"}</span>
        ),
      },
    ],
    [canEdit, itemGroupOptions, getItemOptions, getUomOptions, getItemLabel, handleLineFieldChange]
  );

  const filledLineItems = React.useMemo(
    () => lineItems.filter((item) => lineHasAnyData(item)),
    [lineItems]
  );

  const lineItemsValid = React.useMemo(() => {
    if (mode === "view" || pageError || setupError) return true;
    if (!filledLineItems.length) return false;
    return filledLineItems.every(lineIsComplete);
  }, [mode, filledLineItems, pageError, setupError]);

  const handleFormSubmit = React.useCallback(
    async (values: Record<string, unknown>) => {
      if (mode === "view" || pageError || setupError) return;

      if (!lineItemsValid) {
        toast({
          variant: "destructive",
          title: "Line items incomplete",
          description: "Add at least one item with valid quantity and rate.",
        });
        return;
      }

      const itemsPayload = filledLineItems.map((item) => ({
        indent_dtl_id: item.indentDtlId,
        item: item.item || undefined,
        quantity: item.quantity || undefined,
        rate: item.rate || undefined,
        uom: item.uom || undefined,
        make: item.itemMake || undefined,
        discount_mode: item.discountMode,
        discount_value: item.discountValue || undefined,
        remarks: item.remarks || undefined,
      }));

      const createPayload = {
        branch: String(values.branch ?? ""),
        date: String(values.date ?? ""),
        supplier: String(values.supplier ?? ""),
        supplier_branch: String(values.supplier_branch ?? ""),
        billing_address: String(values.billing_address ?? ""),
        shipping_address: String(values.shipping_address ?? ""),
        tax_payable: String(values.tax_payable ?? "Yes"),
        credit_term: values.credit_term ? Number(values.credit_term) : undefined,
        delivery_timeline: Number(values.delivery_timeline ?? 0),
        project: String(values.project ?? ""),
        expense_type: String(values.expense_type ?? ""),
        contact_person: values.contact_person ? String(values.contact_person) : undefined,
        contact_no: values.contact_no ? String(values.contact_no) : undefined,
        footer_note: values.footer_note ? String(values.footer_note) : undefined,
        internal_note: values.internal_note ? String(values.internal_note) : undefined,
        terms_conditions: values.terms_conditions ? String(values.terms_conditions) : undefined,
        advance_percentage: values.advance_percentage ? Number(values.advance_percentage) : undefined,
        items: itemsPayload,
      };

      setSaving(true);
      try {
        if (mode === "edit" && requestedId) {
          const updatePayload: Partial<PODetails> = {
            id: requestedId,
            branch: createPayload.branch,
            poDate: createPayload.date,
            supplier: createPayload.supplier,
            supplierBranch: createPayload.supplier_branch,
            billingAddress: createPayload.billing_address,
            shippingAddress: createPayload.shipping_address,
            project: createPayload.project,
            creditTerm: createPayload.credit_term,
            deliveryTimeline: createPayload.delivery_timeline,
            contactPerson: createPayload.contact_person,
            contactNo: createPayload.contact_no,
            footerNote: createPayload.footer_note,
            internalNote: createPayload.internal_note,
            termsConditions: createPayload.terms_conditions,
            advancePercentage: createPayload.advance_percentage,
            lines: filledLineItems.map((item) => ({
              id: item.id,
              item: item.item || undefined,
              quantity: item.quantity ? Number(item.quantity) : undefined,
              rate: item.rate ? Number(item.rate) : undefined,
              uom: item.uom || undefined,
              itemMake: item.itemMake || undefined,
              discountMode: item.discountMode,
              discountValue: item.discountValue || undefined,
              remarks: item.remarks || undefined,
            })),
          };

          await updatePO(updatePayload);
          toast({ title: "PO updated" });
          router.replace(`/dashboardportal/procurement/purchaseOrder/createPO?mode=view&id=${encodeURIComponent(requestedId)}`);
        } else {
          const result = await createPO(createPayload);
          toast({
            title: result?.message ?? "PO created",
          });
          const poId = result?.po_id ?? result?.poId;
          if (poId) {
            router.replace(`/dashboardportal/procurement/purchaseOrder/createPO?mode=view&id=${encodeURIComponent(String(poId))}`);
          }
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Unable to save PO",
          description: error instanceof Error ? error.message : "Please try again.",
        });
      } finally {
        setSaving(false);
      }
    },
    [filledLineItems, lineItemsValid, mode, pageError, setupError, requestedId, router]
  );

  // Map status
  const mapStatusToId = React.useCallback((status?: string | null): ApprovalStatusId | null => {
    if (!status) return null;
    const normalized = String(status).toLowerCase().trim();
    if (normalized.includes("draft") || normalized === "21") return 21;
    if (normalized === "open" || normalized === "1") return 1;
    if (normalized.includes("pending") || normalized.includes("approval") || normalized === "20") return 20;
    if (normalized === "approved" || normalized === "3") return 3;
    if (normalized === "rejected" || normalized === "4") return 4;
    if (normalized === "closed" || normalized === "5") return 5;
    if (normalized === "cancelled" || normalized === "6") return 6;
    return null;
  }, []);

  const getApprovalPermissions = React.useCallback(
    (statusId: ApprovalStatusId | null, mode: MuiFormMode, apiPermissions?: ApprovalActionPermissions): ApprovalActionPermissions => {
      if (apiPermissions) return apiPermissions;
      if (!statusId || mode === "view") {
        return { canViewApprovalLog: true, canClone: true };
      }
      if (statusId === 21) return { canSave: true, canOpen: true, canCancelDraft: true };
      if (statusId === 6) return { canReopen: true, canClone: true, canViewApprovalLog: true };
      if (statusId === 1) return { canSave: true, canApprove: true };
      if (statusId === 20) return { canViewApprovalLog: true };
      if (statusId === 3) return { canViewApprovalLog: true, canClone: true };
      return {};
    },
    []
  );

  const statusId = React.useMemo(() => {
    if (poDetails?.statusId) return poDetails.statusId;
    if (poDetails?.status) return mapStatusToId(poDetails.status);
    return null;
  }, [poDetails, mapStatusToId]);

  const approvalPermissions = React.useMemo(
    () => getApprovalPermissions(statusId, mode, poDetails?.permissions),
    [statusId, mode, poDetails?.permissions, getApprovalPermissions]
  );

  const approvalInfo: ApprovalInfo | null = React.useMemo(() => {
    if (!statusId) return null;
    return {
      statusId,
      statusLabel: poDetails?.status || "Unknown",
      approvalLevel: poDetails?.approvalLevel ?? undefined,
      maxApprovalLevel: poDetails?.maxApprovalLevel ?? undefined,
    };
  }, [statusId, poDetails]);

  const handleSave = React.useCallback(async () => {
    if (!formRef.current?.submit) return;
    await formRef.current.submit();
  }, []);

  const handleOpen = React.useCallback(async () => {
    if (!requestedId) {
      if (formRef.current?.submit) await formRef.current.submit();
      return;
    }
    const branchId = String(formValues.branch ?? poDetails?.branch ?? "");
    const menuId = getMenuId();
    if (!branchId || !menuId) {
      toast({ variant: "destructive", title: "Branch and Menu ID required" });
      return;
    }
    setApprovalLoading(true);
    try {
      await openPO(requestedId, branchId, menuId);
      toast({ title: "PO opened successfully" });
      const detail = await getPOById(requestedId, coId, menuId || undefined);
      setPODetails(detail);
    } catch (error) {
      toast({ variant: "destructive", title: "Unable to open PO", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setApprovalLoading(false);
    }
  }, [requestedId, formValues.branch, poDetails?.branch, getMenuId, coId]);

  const handleCancelDraft = React.useCallback(async () => {
    if (!requestedId) return;
    const branchId = String(formValues.branch ?? poDetails?.branch ?? "");
    const menuId = getMenuId();
    if (!branchId || !menuId) {
      toast({ variant: "destructive", title: "Branch and Menu ID required" });
      return;
    }
    setApprovalLoading(true);
    try {
      await cancelDraftPO(requestedId, branchId, menuId);
      toast({ title: "Draft cancelled successfully" });
      const detail = await getPOById(requestedId, coId, menuId || undefined);
      setPODetails(detail);
    } catch (error) {
      toast({ variant: "destructive", title: "Unable to cancel draft", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setApprovalLoading(false);
    }
  }, [requestedId, formValues.branch, poDetails?.branch, getMenuId, coId]);

  const handleReopen = React.useCallback(async () => {
    if (!requestedId) return;
    const branchId = String(formValues.branch ?? poDetails?.branch ?? "");
    const menuId = getMenuId();
    if (!branchId || !menuId) {
      toast({ variant: "destructive", title: "Branch and Menu ID required" });
      return;
    }
    setApprovalLoading(true);
    try {
      await reopenPO(requestedId, branchId, menuId);
      toast({ title: "PO reopened successfully" });
      const detail = await getPOById(requestedId, coId, menuId || undefined);
      setPODetails(detail);
    } catch (error) {
      toast({ variant: "destructive", title: "Unable to reopen PO", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setApprovalLoading(false);
    }
  }, [requestedId, formValues.branch, poDetails?.branch, getMenuId, coId]);

  const handleSendForApproval = React.useCallback(async () => {
    if (!requestedId) return;
    const branchId = String(formValues.branch ?? poDetails?.branch ?? "");
    const menuId = getMenuId();
    if (!branchId || !menuId) {
      toast({ variant: "destructive", title: "Branch and Menu ID required" });
      return;
    }
    setApprovalLoading(true);
    try {
      await sendPOForApproval(requestedId, branchId, menuId);
      toast({ title: "PO sent for approval successfully" });
      const detail = await getPOById(requestedId, coId, menuId || undefined);
      setPODetails(detail);
    } catch (error) {
      toast({ variant: "destructive", title: "Unable to send for approval", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setApprovalLoading(false);
    }
  }, [requestedId, formValues.branch, poDetails?.branch, getMenuId, coId]);

  const handleApprove = React.useCallback(async () => {
    if (!requestedId) return;
    const branchId = String(formValues.branch ?? poDetails?.branch ?? "");
    const menuId = getMenuId();
    if (!branchId || !menuId) {
      toast({ variant: "destructive", title: "Branch and Menu ID required" });
      return;
    }
    setApprovalLoading(true);
    try {
      await approvePO(requestedId, branchId, menuId);
      toast({ title: "PO approved successfully" });
      const detail = await getPOById(requestedId, coId, menuId || undefined);
      setPODetails(detail);
    } catch (error) {
      toast({ variant: "destructive", title: "Unable to approve PO", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setApprovalLoading(false);
    }
  }, [requestedId, formValues.branch, poDetails?.branch, getMenuId, coId]);

  const handleReject = React.useCallback(async (reason: string) => {
    if (!requestedId) return;
    const branchId = String(formValues.branch ?? poDetails?.branch ?? "");
    const menuId = getMenuId();
    if (!branchId || !menuId) {
      toast({ variant: "destructive", title: "Branch and Menu ID required" });
      return;
    }
    setApprovalLoading(true);
    try {
      await rejectPO(requestedId, branchId, menuId, reason);
      toast({ title: "PO rejected successfully" });
      const detail = await getPOById(requestedId, coId, menuId || undefined);
      setPODetails(detail);
    } catch (error) {
      toast({ variant: "destructive", title: "Unable to reject PO", description: error instanceof Error ? error.message : "Please try again." });
    } finally {
      setApprovalLoading(false);
    }
  }, [requestedId, formValues.branch, poDetails?.branch, getMenuId, coId]);

  const pageTitle = mode === "create" ? "Create Purchase Order" : mode === "edit" ? "Edit Purchase Order" : "Purchase Order Details";

  const schema: Schema = React.useMemo(
    () => {
      const fields: Field[] = [
        {
          name: "branch",
          label: "Branch",
          type: "select",
          options: branchOptions,
          required: true,
          grid: { xs: 12, md: 4 },
        },
        {
          name: "date",
          label: "Date",
          type: "date",
          required: true,
          disabled: headerFieldsDisabled || (coConfig?.back_date_allowable !== 1 && mode === "edit"),
          grid: { xs: 12, md: 4 },
        },
        {
          name: "supplier",
          label: "Supplier",
          type: "select",
          options: supplierOptions,
          required: true,
          disabled: headerFieldsDisabled,
          grid: { xs: 12, md: 4 },
        },
        {
          name: "supplier_branch",
          label: "Supplier Branch",
          type: "select",
          options: supplierBranchOptions,
          required: true,
          disabled: headerFieldsDisabled,
          grid: { xs: 12, md: 4 },
        },
        {
          name: "billing_address",
          label: "Billing Address",
          type: "select",
          options: branchAddressOptions,
          required: true,
          disabled: headerFieldsDisabled,
          grid: { xs: 12, md: 4 },
        },
        {
          name: "shipping_address",
          label: "Shipping Address",
          type: "select",
          options: branchAddressOptions,
          required: true,
          disabled: headerFieldsDisabled,
          grid: { xs: 12, md: 4 },
        },
        {
          name: "tax_payable",
          label: "Tax Payable",
          type: "select",
          options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }],
          required: true,
          disabled: headerFieldsDisabled,
          grid: { xs: 12, md: 4 },
        },
        {
          name: "credit_term",
          label: "Credit Term (days)",
          type: "text",
          placeholder: "days",
          disabled: headerFieldsDisabled,
          grid: { xs: 12, md: 4 },
        },
        {
          name: "delivery_timeline",
          label: "Delivery Timeline (days)",
          type: "text",
          placeholder: "days",
          required: true,
          disabled: headerFieldsDisabled,
          grid: { xs: 12, md: 4 },
        },
        {
          name: "expected_date",
          label: "Expected Date",
          type: "text",
          disabled: true,
          grid: { xs: 12, md: 4 },
        },
        {
          name: "expense_type",
          label: "Expense Type",
          type: "select",
          options: expenseOptions,
          required: true,
          disabled: headerFieldsDisabled,
          grid: { xs: 12, md: 4 },
        },
        {
          name: "project",
          label: "Project",
          type: "select",
          options: projectOptions,
          required: true,
          disabled: headerFieldsDisabled,
          grid: { xs: 12, md: 4 },
        },
        {
          name: "contact_person",
          label: "Contact Person",
          type: "text",
          disabled: headerFieldsDisabled,
          grid: { xs: 12, md: 4 },
        },
        {
          name: "contact_no",
          label: "Contact No.",
          type: "text",
          disabled: headerFieldsDisabled,
          grid: { xs: 12, md: 4 },
        },
      ];

      return { fields };
    },
    [branchOptions, supplierOptions, supplierBranchOptions, branchAddressOptions, projectOptions, expenseOptions, coConfig, billingState, shippingState, taxType, expectedDate, mode, headerFieldsDisabled]
  );

  // Schema for fields after line items (everything after contact_no, including footer_note)
  const schemaAfterLineItems: Schema = React.useMemo(
    () => {
      const fields: Field[] = [
        {
          name: "footer_note",
          label: "Footer Note",
          type: "textarea",
          grid: { xs: 12 },
        },
        {
          name: "internal_note",
          label: "Internal Note",
          type: "textarea",
          grid: { xs: 12 },
        },
        {
          name: "terms_conditions",
          label: "Terms and Conditions",
          type: "textarea",
          grid: { xs: 12 },
        },
        {
          name: "advance_percentage",
          label: "Advance Percentage",
          type: "text",
          grid: { xs: 12, md: 4 },
        },
      ];

      // Add conditional fields for India GST
      if (coConfig?.india_gst) {
        fields.push(
          {
            name: "billing_state",
            label: "Billing State",
            type: "text",
            disabled: true,
            grid: { xs: 12, md: 4 },
          },
          {
            name: "tax_type",
            label: "Tax Type",
            type: "text",
            disabled: true,
            grid: { xs: 12, md: 4 },
          }
        );
      }

      // Add shipping state (always shown)
      fields.push({
        name: "shipping_state",
        label: "Shipping State Name",
        type: "text",
        disabled: true,
        grid: { xs: 12, md: 4 },
      });

      return { fields };
    },
    [coConfig, billingState, shippingState, taxType]
  );

  const primaryActions: TransactionAction[] = React.useMemo(
    () => [
      {
        label: "Save",
        onClick: handleSave,
        disabled: saving || setupLoading || !lineItemsValid,
        loading: saving,
        hidden: mode === "view" || !approvalPermissions.canSave,
      },
    ],
    [handleSave, saving, setupLoading, lineItemsValid, mode, approvalPermissions.canSave]
  );

  return (
    <TransactionWrapper
      title={pageTitle}
      subtitle={mode === "create" ? "Create a new purchase order" : mode === "edit" ? "Edit purchase order" : "View purchase order details"}
      statusChip={statusId ? { label: poDetails?.status || "Unknown", color: statusId === 3 ? "success" : statusId === 4 || statusId === 6 ? "error" : statusId === 20 ? "warning" : "default" } : undefined}
      backAction={{ onClick: () => router.push("/dashboardportal/procurement/purchaseOrder") }}
      primaryActions={primaryActions}
      loading={loading || setupLoading}
      alerts={pageError ? <div className="text-red-600">{pageError}</div> : undefined}
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
          <MuiForm
            key={`${formKey}-after`}
            schema={schemaAfterLineItems}
            initialValues={initialValues}
            mode={mode}
            hideModeToggle
            hideSubmit
            onSubmit={handleFormSubmit}
            onValuesChange={handleFooterFormValuesChange}
          />
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <div className="text-sm font-medium">Net Amount</div>
              <div className="text-lg">{totals.netAmount.toFixed(2)}</div>
            </div>
            {coConfig?.india_gst && (
              <>
                <div>
                  <div className="text-sm font-medium">Total IGST</div>
                  <div className="text-lg">{totals.totalIGST.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Total SGST</div>
                  <div className="text-lg">{totals.totalSGST.toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Total CGST</div>
                  <div className="text-lg">{totals.totalCGST.toFixed(2)}</div>
                </div>
              </>
            )}
            <div>
              <div className="text-sm font-medium">Total Amount</div>
              <div className="text-lg font-bold">{totals.totalAmount.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-sm font-medium">Advance Amount</div>
              <div className="text-lg">{totals.advanceAmount.toFixed(2)}</div>
            </div>
          </div>

          {approvalInfo && (
            <ApprovalActionsBar
              approvalInfo={approvalInfo}
              permissions={approvalPermissions}
              onApprove={handleApprove}
              onReject={handleReject}
              onOpen={handleOpen}
              onCancelDraft={handleCancelDraft}
              onReopen={handleReopen}
              onSendForApproval={handleSendForApproval}
              loading={approvalLoading}
            />
          )}
        </div>
      }
    >
      <div className="space-y-6">
        <MuiForm
          key={formKey}
          ref={formRef}
          schema={schema}
          initialValues={initialValues}
          mode={mode}
          hideModeToggle
          hideSubmit
          onSubmit={handleFormSubmit}
          onValuesChange={handleMainFormValuesChange}
        />

        {mode !== "view" && (
          <div className="space-y-2">
            <Button 
              variant="outline" 
              onClick={handleIndentSelect} 
              disabled={!isMounted || !selectedBranches || selectedBranches.length === 0}
            >
              Select from Indent
            </Button>
            <p className="text-xs text-slate-500">Select items from an indent to populate the PO line items.</p>
          </div>
        )}
      </div>

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

