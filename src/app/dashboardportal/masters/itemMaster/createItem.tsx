"use client";
// create a dialog for creating a new item for now just display "new item" and display the close button and submit button which
// will close the dialog and which submit will console log "new item created"

import React from "react";
import { Dialog, DialogContent, DialogTitle, Box } from "@mui/material";
import { fetchWithCookie } from "@/utils/apiClient2";
import { apiRoutesPortalMasters } from "@/utils/api";
import MinMaxMappingTable from "@/app/dashboardportal/masters/itemMaster/MinMaxMappingTable";
import UOMMappingTable from "@/app/dashboardportal/masters/itemMaster/UOMMappingTable";
import MuiForm, { Schema } from "@/components/ui/muiform";

interface CreateItemProps {
  open: boolean;
  onClose: () => void;
}



const CreateItem: React.FC<CreateItemProps> = ({ open, onClose }) => {
  // Setup data state
  const [setupData, setSetupData] = React.useState<any>(null);

  React.useEffect(() => {
    if (open) {
      console.log("Create Item dialog opened - calling setup API");
      const selectedCompany = localStorage.getItem("sidebar_selectedCompany");
      const co_id = selectedCompany ? JSON.parse(selectedCompany).co_id : "";
      console.log("Using company ID:", co_id);
      
      const queryParams = new URLSearchParams({ co_id });
      const apiUrl = `${apiRoutesPortalMasters.ITEM_CREATE_SETUP}?${queryParams}`;
      console.log("Calling API:", apiUrl);
      
      fetchWithCookie(apiUrl, "GET")
        .then((res) => {
          console.log("ITEM_CREATE_SETUP API response:", res);
          setSetupData(res);
        })
        .catch((err) => {
          console.error("ITEM_CREATE_SETUP API error:", err);
          setSetupData(null);
        });
    } else {
      // Reset setup data when dialog closes to ensure fresh data on reopen
      setSetupData(null);
    }
  }, [open]);

  // Build schema-driven form using setup data
  const itemGroupOptions = React.useMemo(
    () => {
      console.log("Processing itemGroupOptions - setupData:", setupData);
      console.log("setupData?.item_groups:", setupData?.item_groups);
      console.log("Is item_groups array?", Array.isArray(setupData?.item_groups));
      
      if (!setupData || !Array.isArray(setupData.item_groups)) {
        console.log("No valid item_groups data, returning empty array");
        return [];
      }
      
      const options = setupData.item_groups.map((g: any) => {
        console.log("Processing item group:", g);
        const option = {
          label: `${g.item_grp_name_display} (${g.item_grp_code_display})`,
          value: String(g.item_grp_id), // Ensure value is string for consistency
        };
        console.log("Created option:", option);
        return option;
      });
      
      console.log("Final Item Group options:", options);
      return options;
    },
    [setupData]
  );

  const uomOptions = React.useMemo(
    () => {
      console.log("Processing uomOptions - setupData:", setupData);
      console.log("setupData?.uom_groups:", setupData?.uom_groups);
      console.log("Is uom_groups array?", Array.isArray(setupData?.uom_groups));
      
      if (!setupData || !Array.isArray(setupData.uom_groups)) {
        console.log("No valid uom_groups data, returning empty array");
        return [];
      }
      
      const options = setupData.uom_groups.map((u: any) => {
        console.log("Processing UOM:", u);
        const option = {
          label: u.uom_name,
          value: String(u.uom_id), // Ensure value is string for consistency
        };
        console.log("Created UOM option:", option);
        return option;
      });
      
      console.log("Final UOM options:", options);
      return options;
    },
    [setupData]
  );

  const schema: Schema = React.useMemo(
    () => {
      // Add some hard-coded test options to see if select works
      const testItemGroupOptions = [
        { label: "Test Group 1 (TG1)", value: "test1" },
        { label: "Test Group 2 (TG2)", value: "test2" },
      ];
      
      const testUomOptions = [
        { label: "Pieces", value: "pcs" },
        { label: "Kilograms", value: "kg" },
      ];
      
      console.log("Schema creation - using test options first");
      console.log("itemGroupOptions from API:", itemGroupOptions);
      console.log("uomOptions from API:", uomOptions);
      
      return {
        title: "Create Item",
        fields: [
          { 
            name: "itemGroupId", 
            label: "Item Group", 
            type: "select", 
            required: true, 
            options: itemGroupOptions.length > 0 ? itemGroupOptions : testItemGroupOptions, 
            grid: { xs: 12 } 
          },
          { name: "itemCode", label: "Item Code", type: "text", required: true, grid: { xs: 12, sm: 6 } },
          { name: "itemName", label: "Item Name", type: "text", required: true, grid: { xs: 12, sm: 6 } },
          { name: "taxPercent", label: "Tax %", type: "number", grid: { xs: 12, sm: 4 } },
          { 
            name: "uomId", 
            label: "UOM", 
            type: "select", 
            required: true, 
            options: uomOptions.length > 0 ? uomOptions : testUomOptions, 
            grid: { xs: 12, sm: 4 } 
          },
          { name: "uomRounding", label: "UOM Rounding", type: "number", grid: { xs: 12, sm: 4 } },
          { name: "rateRounding", label: "Rate Rounding", type: "number", grid: { xs: 12, sm: 4 } },
          {
            name: "goodOrService",
            label: "Good or Service",
            type: "select",
            options: [
              { label: "Good", value: "Good" },
              { label: "Service", value: "Service" },
            ],
            grid: { xs: 12, sm: 4 },
          },
          { name: "saleable", label: "Saleable", type: "checkbox", grid: { xs: 6, sm: 3 } },
          { name: "consumable", label: "Consumable", type: "checkbox", grid: { xs: 6, sm: 3 } },
          { name: "purchaseable", label: "Purchaseable", type: "checkbox", grid: { xs: 6, sm: 3 } },
          { name: "manufacturable", label: "Manufacturable", type: "checkbox", grid: { xs: 6, sm: 3 } },
          { name: "assembly", label: "Assembly", type: "checkbox", grid: { xs: 6, sm: 3 } },
        ],
      } as Schema;
    },
    [itemGroupOptions, uomOptions]
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

  console.log("Schema being passed to MuiForm:", schema);
  console.log("Initial values being passed to MuiForm:", initialValues);

  const handleFormSubmit = async (vals: Record<string, any>) => {
    console.log("Create Item submit payload:", vals);
    console.log("Setup data available:", !!setupData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Create New Item</DialogTitle>
      <DialogContent>
        {!setupData ? (
          <Box sx={{ py: 4, textAlign: "center" }}>
            Loading setup data...
            <br />
            <small>Calling ITEM_CREATE_SETUP API</small>
          </Box>
        ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <MuiForm
            schema={schema}
            initialValues={initialValues}
            mode="create"
            hideModeToggle
            onSubmit={handleFormSubmit}
            onCancel={onClose}
          />
          {/* UOM Mapping Table */}
          {Array.isArray(setupData?.uom_groups) && (
            <Box sx={{ mt: 3 }}>
              <UOMMappingTable mapping={setupData.uom_groups} />
            </Box>
          )}
          {/* Editable MinMaxMappingTable for branch mapping */}
          {Array.isArray(setupData?.minmax_mapping) && (
            <Box sx={{ mt: 3 }}>
              <MinMaxMappingTable mapping={setupData.minmax_mapping} />
            </Box>
          )}
        </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

// ...existing code...

export default CreateItem;
