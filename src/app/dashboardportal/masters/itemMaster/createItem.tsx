"use client";
import React from "react";
import { Dialog, DialogContent, DialogTitle, Box, Button } from "@mui/material";
import { fetchWithCookie } from "@/utils/apiClient2";
import { apiRoutesPortalMasters } from "@/utils/api";
import MinMaxMappingTable from "@/app/dashboardportal/masters/itemMaster/MinMaxMappingTable";
import UOMMappingTable from "@/app/dashboardportal/masters/itemMaster/UOMMappingTable";
import MuiForm, { Schema } from "@/components/ui/muiform";

interface CreateItemProps {
  open: boolean;
  onClose: () => void;
  mode?: "create" | "edit" | "view";
  itemId?: number;
  prefetchedSetup?: any;
  prefetchedItem?: any;
}

type SetupData = {
  item_groups?: Array<{
    item_grp_id: number;
    item_grp_name_display: string;
    item_grp_code_display: string;
  }>;
  uom_groups?: Array<{ uom_id: number; uom_name: string }>;
  minmax_mapping?: any[];
};

const cacheByCompany = new Map<string, SetupData>(); // simple in-memory cache

const CreateItem: React.FC<CreateItemProps> = ({ open, onClose, mode = 'create', itemId, prefetchedSetup, prefetchedItem }) => {
  const [setupData, setSetupData] = React.useState<SetupData | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
  if (!open) return;
    // If parent passed prefetched setup (from ITEM_EDIT_SETUP), use it and skip fetching
    if (mode !== 'create' && (prefetchedSetup || prefetchedItem)) {
      try {
        const data = prefetchedSetup ?? prefetchedItem ?? null;
        const normalized: SetupData = {
          item_groups: (data as any)?.itemgroups ?? (data as any)?.item_groups ?? [],
          uom_groups: (data as any)?.uomgroups ?? (data as any)?.uom_groups ?? [],
          minmax_mapping: (data as any)?.minmax_mapping ?? (data as any)?.minmax_mapping ?? [],
        };
        setSetupData(normalized);
        setLoading(false);
      } catch (e) {
        // fall through to normal fetch below
      }
      // continue to run the normal fetch to refresh data if needed

    }
    let cancelled = false;
    const ac = new AbortController();

    const run = async () => {
      setErrorMsg(null);
      setLoading(true);

      // read company safely
      let co_id = "";
      try {
        const selectedCompany = localStorage.getItem("sidebar_selectedCompany");
        co_id = selectedCompany ? JSON.parse(selectedCompany)?.co_id ?? "" : "";
      } catch {
        /* ignore parse error, leave co_id empty */
      }

      // serve from cache if available
      if (co_id && cacheByCompany.has(co_id)) {
        if (!cancelled) setSetupData(cacheByCompany.get(co_id)!);
        setLoading(false);
      }

      // always attempt a refresh (fresh each open), but ignore if cancelled
      try {
        const queryParams = new URLSearchParams({ co_id });
        const apiUrl = `${apiRoutesPortalMasters.ITEM_CREATE_SETUP}?${queryParams}`;

        // fetchWithCookie returns { data, error }; extract and validate before using
        const { data, error } = await fetchWithCookie(apiUrl, "GET", { signal: ac.signal }) as {
          data: SetupData | null;
          error: string | null;
        };

        // Console log the raw API response for debugging
        console.log("=== ITEM_CREATE_SETUP API Response ===");
        console.log("API URL:", apiUrl);
        console.log("Raw response data:", data);
        console.log("Raw response error:", error);
        console.log("Data type:", typeof data);
        console.log("Is data null?", data === null);
        console.log("Is data undefined?", data === undefined);
        
  if (data) {
          console.log("=== Setup Data Structure ===");
          console.log("Available keys in data:", Object.keys(data));
          console.log("item_groups:", data.item_groups);
          console.log("item_groups type:", typeof data.item_groups);
          console.log("item_groups is array?", Array.isArray(data.item_groups));
          console.log("item_groups length:", data.item_groups?.length);
          
          console.log("uom_groups:", data.uom_groups);
          console.log("uom_groups type:", typeof data.uom_groups);
          console.log("uom_groups is array?", Array.isArray(data.uom_groups));
          console.log("uom_groups length:", data.uom_groups?.length);
          
          console.log("minmax_mapping:", data.minmax_mapping);
          console.log("minmax_mapping type:", typeof data.minmax_mapping);
          console.log("minmax_mapping is array?", Array.isArray(data.minmax_mapping));
          console.log("minmax_mapping length:", data.minmax_mapping?.length);
          
          // Log first few items for structure inspection
          if (Array.isArray(data.item_groups) && data.item_groups.length > 0) {
            console.log("First item group sample:", data.item_groups[0]);
          }
          if (Array.isArray(data.uom_groups) && data.uom_groups.length > 0) {
            console.log("First UOM group sample:", data.uom_groups[0]);
          }
        }
        console.log("=== End API Response Debug ===");

  if (cancelled) return;
  if (error) throw new Error(error);

        // Normalize backend response shape: some endpoints return `itemgroups`/`uomgroups`,
        // other endpoints return `item_groups`/`uom_groups`. Normalize to internal shape
        // used by this component: `item_groups` and `uom_groups`.
        const normalized: SetupData = {
          item_groups: (data as any)?.itemgroups ?? (data as any)?.item_groups ?? [],
          uom_groups: (data as any)?.uomgroups ?? (data as any)?.uom_groups ?? [],
          minmax_mapping: (data as any)?.minmax_mapping ?? (data as any)?.minmax_mapping ?? [],
        };

  setSetupData(normalized);
        if (co_id && normalized) cacheByCompany.set(co_id, normalized);
      } catch (err: any) {
        if (cancelled) return;
        // If we had cache we already showed it; only surface error if no data
        if (!setupData) setErrorMsg(err?.message ?? "Failed to load setup data");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
      ac.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // seed mapping states when setupData is available
  React.useEffect(() => {
    if (!setupData) return;
    // Only seed mappings for edit/view modes; in create flow we hide mappings
    if (mode !== 'create') {
  // Do NOT pre-seed uomMappings here - edit payload provides actual mappings.
  const mm = Array.isArray(setupData.minmax_mapping) ? setupData.minmax_mapping : [];
  setMinMaxMappings(mm);
    } else {
      setUomMappings([]);
      setMinMaxMappings([]);
    }
  }, [setupData]);

  const itemGroupOptions = React.useMemo(
    () => {
      console.log("=== Processing Item Group Options ===");
      console.log("setupData:", setupData);
      console.log("setupData?.item_groups:", setupData?.item_groups);
      console.log("Is item_groups array?", Array.isArray(setupData?.item_groups));
      
      if (!Array.isArray(setupData?.item_groups)) {
        console.log("No valid item_groups data, returning empty array");
        return [];
      }
      
      const options = setupData.item_groups.map((g) => {
        console.log("Processing item group:", g);
        const option = {
          label: `${g.item_grp_name_display} (${g.item_grp_code_display})`,
          value: String(g.item_grp_id),
        };
        console.log("Created option:", option);
        return option;
      });
      
      console.log("Final Item Group options:", options);
      console.log("=== End Item Group Options Processing ===");
      return options;
    },
    [setupData]
  );

  const uomOptions = React.useMemo(
    () => {
      console.log("=== Processing UOM Options ===");
      console.log("setupData:", setupData);
      console.log("setupData?.uom_groups:", setupData?.uom_groups);
      console.log("Is uom_groups array?", Array.isArray(setupData?.uom_groups));
      
      if (!Array.isArray(setupData?.uom_groups)) {
        console.log("No valid uom_groups data, returning empty array");
        return [];
      }
      
      const options = setupData.uom_groups.map((u) => {
        console.log("Processing UOM:", u);
        const option = { label: u.uom_name, value: String(u.uom_id) };
        console.log("Created UOM option:", option);
        return option;
      });
      
      console.log("Final UOM options:", options);
      console.log("=== End UOM Options Processing ===");
      return options;
    },
    [setupData]
  );
  const schema: Schema = React.useMemo(() => {
    return {
      title: mode === 'create' ? 'Create Item' : mode === 'edit' ? 'Edit Item' : 'View Item',
      fields: [
        {
          name: 'itemGroupId',
          label: 'Item Group',
          type: 'select',
          required: true,
          options: itemGroupOptions,
          grid: { xs: 12 },
          // disable when not creating (edit/view) or when loading/no options
          disabled: mode !== 'create' || loading || itemGroupOptions.length === 0,
        },
        {
          name: 'itemCode',
          label: 'Item Code',
          type: 'text',
          required: true,
          grid: { xs: 12, sm: 6 },
          disabled: mode !== 'create',
        },
        {
          name: 'itemName',
          label: 'Item Name',
          type: 'text',
          required: true,
          grid: { xs: 12, sm: 6 },
          disabled: mode !== 'create',
        },
        { name: 'taxPercent', label: 'Tax %', type: 'number', grid: { xs: 12, sm: 4 } },
        {
          name: 'uomId',
          label: 'UOM',
          type: 'select',
          required: true,
          options: uomOptions,
          grid: { xs: 12, sm: 4 },
          // disable when not creating (can't change UOM in edit/view)
          disabled: mode !== 'create' || loading || uomOptions.length === 0,
        },
        { name: 'uomRounding', label: 'UOM Rounding', type: 'number', grid: { xs: 12, sm: 4 } },
        { name: 'rateRounding', label: 'Rate Rounding', type: 'number', grid: { xs: 12, sm: 4 } },
        {
          name: 'goodOrService',
          label: 'Good or Service',
          type: 'select',
          options: [
            { label: 'Good', value: 'Good' },
            { label: 'Service', value: 'Service' },
          ],
          grid: { xs: 12, sm: 4 },
        },
        { name: 'saleable', label: 'Saleable', type: 'checkbox', grid: { xs: 6, sm: 3 } },
        { name: 'consumable', label: 'Consumable', type: 'checkbox', grid: { xs: 6, sm: 3 } },
        { name: 'purchaseable', label: 'Purchaseable', type: 'checkbox', grid: { xs: 6, sm: 3 } },
        { name: 'manufacturable', label: 'Manufacturable', type: 'checkbox', grid: { xs: 6, sm: 3 } },
        { name: 'assembly', label: 'Assembly', type: 'checkbox', grid: { xs: 6, sm: 3 } },
      ],
    };
  }, [itemGroupOptions, uomOptions, loading, mode]);

  const defaultInitialValues = React.useMemo(
    () => ({
      itemGroupId: "",
      itemCode: "",
      itemName: "",
      taxPercent: "",
      uomId: "",
      uomRounding: "",
      rateRounding: "",
      goodOrService: "",
      saleable: false,
      consumable: false,
      purchaseable: false,
      manufacturable: false,
      assembly: false,
    }),
    []
  );

  const [initialValues, setInitialValues] = React.useState(defaultInitialValues);

  const handleFormSubmit = async (vals: Record<string, any>) => {
    // include mapping rows in the payload
    const payload = {
      ...vals,
      uom_mappings: mode === 'create' ? [] : uomMappings,
      minmax_mappings: mode === 'create' ? [] : minMaxMappings,
    } as any;

    // attach company id for create flows (read from sidebar selection)
    if (mode === 'create') {
      try {
        const stored = localStorage.getItem('sidebar_selectedCompany');
        const parsed = stored ? JSON.parse(stored) : null;
        if (parsed?.co_id) payload.co_id = Number(parsed.co_id);
      } catch (e) {
        // ignore parse errors and proceed without co_id
        console.warn('Failed to read sidebar_selectedCompany for co_id', e);
      }
    }

    // attach item_id for edit flows
    if (mode === 'edit') {
      try {
        if (itemId) {
          payload.item_id = Number(itemId);
        } else if (vals?.item_id) {
          payload.item_id = Number(vals.item_id);
        } else if (vals?.itemId) {
          payload.item_id = Number(vals.itemId);
        }
      } catch (e) {
        // ignore conversion errors
      }
    }

    try {
      // POST to ITEM_CREATE when creating; for edit you may use ITEM_EDIT
      const apiUrl = mode === 'create' ? apiRoutesPortalMasters.ITEM_CREATE : apiRoutesPortalMasters.ITEM_EDIT;
      const { data, error, status } = await fetchWithCookie(apiUrl, mode === 'create' ? 'POST' : 'PUT', payload) as any;

      if (status === 409) {
        // Duplicate item name/code
        setErrorMsg('Item with the same code or name already exists');
        return;
      }
      if (error) {
        setErrorMsg(error);
        return;
      }

      console.log('Item saved', data);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message ?? 'Failed to save item');
    }
  };
  // When in edit/view mode and an itemId prop is provided, fetch item details and populate the form
  React.useEffect(() => {
    if (!open) return;
    if (mode === 'create') return;
    if (!itemId) return;

    const ac = new AbortController();
    const run = async () => {
      setErrorMsg(null);
      setLoading(true);
      try {
        // read company safely (same as ITEM_CREATE_SETUP call)
        let co_id = "";
        try {
          const selectedCompany = localStorage.getItem("sidebar_selectedCompany");
          co_id = selectedCompany ? JSON.parse(selectedCompany)?.co_id ?? "" : "";
        } catch {
          /* ignore parse error */
        }

  const params = new URLSearchParams({ item_id: String(itemId) });
  if (co_id) params.set('co_id', String(co_id));
  // use ITEM_EDIT_VIEW which returns the edit setup (uomgroups, item_details, mappings)
  const editViewUrl = (apiRoutesPortalMasters as any).ITEM_EDIT_VIEW ?? (apiRoutesPortalMasters as any).ITEM_EDIT_SETUP;
  const apiUrl = `${editViewUrl}?${params}`;
  const { data, error } = await fetchWithCookie(apiUrl, 'GET', { signal: ac.signal }) as any;
        if (error) {
          setErrorMsg(error);
          return;
        }
        if (!data) {
          setErrorMsg('Item data not found');
          return;
        }

        // Some APIs return both item details and the setup arrays (uom_groups, item_groups, minmax_mapping).
        // Normalize and set setupData similar to ITEM_CREATE_SETUP so mapping tables have options.
        // Normalize setup arrays using the edit-item payload shape
        const normalizedSetup: SetupData = {
          item_groups: Array.isArray((data as any)?.item_groups)
            ? (data as any).item_groups
            : (data.item_group_path ? [
                {
                  item_grp_id: data.item_group_path.item_grp_id,
                  item_grp_name_display: data.item_group_path.item_group_display,
                  item_grp_code_display: data.item_group_path.item_group_code_display,
                }
              ] : []),
          uom_groups: (data as any)?.uomgroups ?? (data as any)?.uom_groups ?? [],
          minmax_mapping: (data as any)?.minmax_mapping ?? (data as any)?.minmax_mapping ?? [],
        };

        setSetupData(normalizedSetup);
        // cache per company like setup logic
        try {
          if (co_id) cacheByCompany.set(String(co_id), normalizedSetup);
        } catch {}

        // item details may be top-level or nested under `item`/`data` keys
        // item_details key holds the actual item info in edit response
        const details = (data.item_details ?? data.item ?? data) as any;

        const mapped = {
          itemGroupId: String(details.item_grp_id ?? details.item_group_id ?? details.itemGroupId ?? ""),
          itemCode: details.item_code ?? details.itemCode ?? "",
          itemName: details.item_name ?? details.itemName ?? "",
          taxPercent: String(details.tax_percentage ?? details.taxPercent ?? ""),
          uomId: String(details.uom_id ?? details.uomId ?? ""),
          uomRounding: String(details.uom_rounding ?? details.uomRounding ?? details.uom_rounding ?? ""),
          rateRounding: String(details.rate_rounding ?? details.rateRounding ?? details.rate_rounding ?? ""),
          goodOrService: details.tangible === 1 ? 'Good' : (details.goodOrService ?? ''),
          saleable: Boolean(Number(details.saleable ?? details.is_saleable ?? 0)),
          consumable: Boolean(Number(details.consumable ?? details.is_consumable ?? 0)),
          purchaseable: Boolean(Number(details.purchaseable ?? details.is_purchaseable ?? 0)),
          manufacturable: Boolean(Number(details.manufacturable ?? details.is_manufacturable ?? 0)),
          assembly: Boolean(Number(details.assembly ?? details.is_assembly ?? 0)),
        };

        setInitialValues(mapped);

        // Transform UOM mappings into table shape expected by UOMMappingTable
        const rawUomMaps = (data.uom_mappings ?? data.uom_mappings ?? data.uom_mappings ?? data.uom_mappings) ?? data.uom_mappings ?? [];
        const sourceUomMaps = Array.isArray(data.uom_mappings) ? data.uom_mappings : (Array.isArray((data as any).uom_mappings) ? (data as any).uom_mappings : (data.uom_mappings ?? []));
        const uomSource = data.uom_mappings ?? data.uom_mappings ?? [];
        const mappedUoms = (Array.isArray(data.uom_mappings) ? data.uom_mappings : (Array.isArray((data as any).uom_mappings) ? (data as any).uom_mappings : (data.uom_mappings ?? [])))
          .map((m: any) => ({
            mapFromUom: String(m.map_from_id ?? m.map_from ?? m.mapFromId ?? m.map_from_id),
            mapFromName: m.map_from_name ?? m.map_from_name ?? m.mapFromName ?? m.map_from_name,
            mapToUom: String(m.map_to_id ?? m.map_to ?? m.mapToId ?? m.map_to_id),
            mapToName: m.map_to_name ?? m.map_to_name ?? m.mapToName ?? m.map_to_name,
            isFixed: Boolean(Number(m.is_fixed ?? m.isFixed ?? 0)),
            relationValue: m.relation_value ?? m.relationValue ?? null,
            rounding: m.rounding ?? null,
          }));

        setUomMappings(Array.isArray(mappedUoms) ? mappedUoms : []);

        const mmRaw = data.minmax_mapping ?? data.minmax_mapping ?? data.minmax_mapping ?? [];
        const mappedMM = Array.isArray(mmRaw)
          ? mmRaw.map((r: any) => ({
              branchId: r.branch_id ?? r.branchId,
              branchName: r.branch_name ?? r.branchName,
              minqty: r.minqty ?? r.min_qty ?? null,
              maxqty: r.maxqty ?? r.max_qty ?? null,
              min_order_qty: r.min_order_qty ?? r.minOrderQty ?? null,
              lead_time: r.lead_time ?? r.leadTime ?? null,
            }))
          : [];

        setMinMaxMappings(mappedMM);
      } catch (err: any) {
        if (!ac.signal.aborted) setErrorMsg(err?.message ?? 'Failed to load item details');
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    };

    run();
    return () => ac.abort();
  }, [open, mode, itemId]);

  // expose form ref so we can trigger submit from outside (below the tables)
  const formRef = React.useRef<{ submit?: () => Promise<void> } | null>(null);

  // local states to hold mapping rows before submit
  const [uomMappings, setUomMappings] = React.useState<any[]>([]);
  const [minMaxMappings, setMinMaxMappings] = React.useState<any[]>([]);

  // compute mapping rows to pass into UOMMappingTable
  const computedUomMapping: any[] = React.useMemo(() => {
    if (Array.isArray(uomMappings) && uomMappings.length > 0) {
      return uomMappings.map((r: any) => ({
        id: String(Math.random()),
        mapFromUom: r.mapFromUom ?? r.map_from_id ?? r.map_from ?? initialValues.uomId ?? null,
        mapFromName: r.mapFromName ?? r.map_from_name ?? null,
        mapToUom: r.mapToUom ?? r.map_to_id ?? r.map_to ?? null,
        mapToName: r.mapToName ?? r.map_to_name ?? null,
        isFixed: Boolean(r.is_fixed ?? r.isFixed ?? 0),
        relationValue: r.relation_value ?? r.relationValue ?? null,
        rounding: r.rounding ?? null,
      }));
    }
    // default single row with mapFrom = current item UOM
    return [{
      id: String(Math.random()),
      mapFromUom: initialValues.uomId ?? null,
      mapFromName: uomOptions.find(o => String(o.value) === String(initialValues.uomId))?.label ?? null,
      mapToUom: null,
      mapToName: null,
      isFixed: false,
      relationValue: null,
      rounding: null,
    }];
  }, [uomMappings, initialValues.uomId, uomOptions]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      keepMounted // keeps form/menus mounted; smoother UX
    >
  <DialogTitle>{mode === 'create' ? 'Create New Item' : mode === 'edit' ? 'Edit Item' : 'View Item'}</DialogTitle>
      <DialogContent>
        {errorMsg && (
          <Box sx={{ color: "error.main", mb: 1 }}>
            {errorMsg}{" "}
            <Button size="small" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </Box>
        )}

        {!setupData && loading ? (
          <Box sx={{ py: 4, textAlign: "center" }}>
            Loading setup data…
            <br />
            <small>Fetching item groups &amp; UOMs</small>
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <MuiForm
              ref={formRef as any}
              schema={schema}
              initialValues={initialValues}
              mode={mode}
              hideModeToggle
              onSubmit={handleFormSubmit}
            />
            {/* Show mapping tables for edit/view modes only (hidden on create) */}
            {mode !== 'create' && Array.isArray(setupData?.uom_groups) && (
              <Box sx={{ mt: 3 }}>
                <UOMMappingTable
                  mapping={computedUomMapping}
                  uomOptions={uomOptions}
                  itemDefaultUom={initialValues.uomId}
                  onChange={(rows) => setUomMappings(rows as any[])}
                />
              </Box>
            )}
            {mode !== 'create' && (
              <Box sx={{ mt: 3 }}>
                <MinMaxMappingTable mapping={minMaxMappings} onChange={(rows) => setMinMaxMappings(rows)} />
              </Box>
            )}
            {/* External Cancel / Submit below the tables */}
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
              <Button variant="text" onClick={onClose}>Cancel</Button>
              <Button
                variant="contained"
                onClick={async () => {
                  if (formRef.current?.submit) await formRef.current.submit();
                }}
              >
                {mode === 'create' ? 'Create' : mode === 'edit' ? 'Save' : 'Close'}
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateItem;
