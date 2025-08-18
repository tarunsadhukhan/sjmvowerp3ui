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

const CreateItem: React.FC<CreateItemProps> = ({ open, onClose }) => {
  const [setupData, setSetupData] = React.useState<SetupData | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
  if (!open) return;

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
    // seed UOM mappings as empty (or use provided default mapping rows if any)
    const uoms = Array.isArray(setupData.uom_groups)
      ? setupData.uom_groups.map((u) => ({ mapToUom: u.uom_id, isFixed: false, relationValue: null, rounding: null }))
      : [];
    setUomMappings(uoms);

    // seed minmax from setup
    const mm = Array.isArray(setupData.minmax_mapping) ? setupData.minmax_mapping : [];
    setMinMaxMappings(mm);
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

  const schema: Schema = React.useMemo(
    () => {
      console.log("=== Creating Schema ===");
      console.log("itemGroupOptions:", itemGroupOptions);
      console.log("itemGroupOptions length:", itemGroupOptions.length);
      console.log("uomOptions:", uomOptions);
      console.log("uomOptions length:", uomOptions.length);
      console.log("loading:", loading);
      
      const schema = {
        title: "Create Item",
        fields: [
          {
            name: "itemGroupId",
            label: "Item Group",
            type: "select" as const,
            required: true,
            options: itemGroupOptions,
            grid: { xs: 12 },
            disabled: loading || itemGroupOptions.length === 0,
          },
          { name: "itemCode", label: "Item Code", type: "text" as const, required: true, grid: { xs: 12, sm: 6 } },
          { name: "itemName", label: "Item Name", type: "text" as const, required: true, grid: { xs: 12, sm: 6 } },
          { name: "taxPercent", label: "Tax %", type: "number" as const, grid: { xs: 12, sm: 4 } },
          {
            name: "uomId",
            label: "UOM",
            type: "select" as const,
            required: true,
            options: uomOptions,
            grid: { xs: 12, sm: 4 },
            disabled: loading || uomOptions.length === 0,
          },
          { name: "uomRounding", label: "UOM Rounding", type: "number" as const, grid: { xs: 12, sm: 4 } },
          { name: "rateRounding", label: "Rate Rounding", type: "number" as const, grid: { xs: 12, sm: 4 } },
          {
            name: "goodOrService",
            label: "Good or Service",
            type: "select" as const,
            options: [
              { label: "Good", value: "Good" },
              { label: "Service", value: "Service" },
            ],
            grid: { xs: 12, sm: 4 },
          },
          { name: "saleable", label: "Saleable", type: "checkbox" as const, grid: { xs: 6, sm: 3 } },
          { name: "consumable", label: "Consumable", type: "checkbox" as const, grid: { xs: 6, sm: 3 } },
          { name: "purchaseable", label: "Purchaseable", type: "checkbox" as const, grid: { xs: 6, sm: 3 } },
          { name: "manufacturable", label: "Manufacturable", type: "checkbox" as const, grid: { xs: 6, sm: 3 } },
          { name: "assembly", label: "Assembly", type: "checkbox" as const, grid: { xs: 6, sm: 3 } },
        ],
      };
      
      console.log("Created schema:", schema);
      console.log("Item Group field options:", schema.fields[0].options);
      console.log("UOM field options:", schema.fields[4].options);
      console.log("=== End Schema Creation ===");
      
      return schema;
    },
    [itemGroupOptions, uomOptions, loading]
  );

  const initialValues = React.useMemo(
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

  const handleFormSubmit = (vals: Record<string, any>) => {
    // include mapping rows in the payload
    const payload = {
      ...vals,
      uom_mappings: uomMappings,
      minmax_mappings: minMaxMappings,
    } as any;
    console.log("new item created", payload);
    onClose();
  };

  // expose form ref so we can trigger submit from outside (below the tables)
  const formRef = React.useRef<{ submit?: () => Promise<void> } | null>(null);

  // local states to hold mapping rows before submit
  const [uomMappings, setUomMappings] = React.useState<any[]>([]);
  const [minMaxMappings, setMinMaxMappings] = React.useState<any[]>([]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      keepMounted // keeps form/menus mounted; smoother UX
    >
      <DialogTitle>Create New Item</DialogTitle>
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
              mode="create"
              hideModeToggle
              // onSubmit={handleFormSubmit}
              // onCancel={onClose}
            />
            {Array.isArray(setupData?.uom_groups) && (
              <Box sx={{ mt: 3 }}>
                <UOMMappingTable
                  mapping={setupData.uom_groups.map(u => ({ mapToUom: u.uom_id, isFixed: false, relationValue: null, rounding: null }))}
                  uomOptions={uomOptions}
                  onChange={(rows) => setUomMappings(rows)}
                />
              </Box>
            )}
            {Array.isArray(setupData?.minmax_mapping) && (
              <Box sx={{ mt: 3 }}>
                <MinMaxMappingTable mapping={setupData.minmax_mapping} onChange={(rows) => setMinMaxMappings(rows)} />
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
                Create
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateItem;
