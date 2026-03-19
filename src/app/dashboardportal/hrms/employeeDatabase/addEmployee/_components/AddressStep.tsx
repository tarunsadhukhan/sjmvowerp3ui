"use client";

import React, { useMemo, useRef, useCallback } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import MuiForm, { type Schema, type Field, type MuiFormHandle } from "@/components/ui/muiform";
import type { AddressDetails } from "../../types/employeeTypes";
import type { useEmployeeSetup } from "../../hooks/useEmployeeSetup";

interface AddressStepProps {
  addresses: AddressDetails[];
  onAdd: (addr: AddressDetails) => void;
  onUpdate: (index: number, data: Partial<AddressDetails>) => void;
  onRemove: (index: number) => void;
  disabled: boolean;
  setup: ReturnType<typeof useEmployeeSetup>;
}

const ADDRESS_TYPE_OPTIONS = [
  { label: "Permanent", value: "1" },
  { label: "Current", value: "2" },
  { label: "Temporary", value: "3" },
];

const addressSchema: Schema = {
  fields: [
    { name: "address_type", label: "Address Type", type: "select", options: ADDRESS_TYPE_OPTIONS, required: true, grid: { xs: 12, sm: 4 } },
    { name: "address_line_1", label: "Address Line 1", type: "text", required: true, grid: { xs: 12, sm: 8 } },
    { name: "address_line_2", label: "Address Line 2", type: "text", grid: { xs: 12, sm: 6 } },
    { name: "city_name", label: "City", type: "text", grid: { xs: 12, sm: 6 } },
    { name: "pin_code", label: "PIN Code", type: "number", required: true, grid: { xs: 12, sm: 4 } },
    { name: "is_correspondent_address", label: "Correspondence Address", type: "checkbox", grid: { xs: 12, sm: 4 } },
  ] satisfies Field[],
};

function blankAddress(): AddressDetails {
  return {
    tbl_hrms_ed_contact_details_id: 0,
    eb_id: 0,
    address_type: 1,
    country_id: null,
    state_id: null,
    city_name: null,
    address_line_1: "",
    address_line_2: null,
    pin_code: 0,
    is_correspondent_address: 0,
  };
}

export default function AddressStep({ addresses, onAdd, onUpdate, onRemove, disabled }: AddressStepProps) {
  const handleAdd = useCallback(() => onAdd(blankAddress()), [onAdd]);

  return (
    <Box className="flex flex-col gap-6">
      {addresses.map((addr, idx) => (
        <Box key={idx} className="relative rounded-md border p-4">
          <Box className="mb-2 flex items-center justify-between">
            <Typography variant="subtitle2">Address {idx + 1}</Typography>
            {!disabled && addresses.length > 1 && (
              <IconButton size="small" aria-label="Remove address" onClick={() => onRemove(idx)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </IconButton>
            )}
          </Box>
          <MuiForm
            schema={addressSchema}
            initialValues={{
              address_type: String(addr.address_type),
              address_line_1: addr.address_line_1,
              address_line_2: addr.address_line_2 ?? "",
              city_name: addr.city_name ?? "",
              pin_code: addr.pin_code || "",
              is_correspondent_address: addr.is_correspondent_address,
            }}
            mode={disabled ? "view" : "edit"}
            onValuesChange={(vals) => onUpdate(idx, vals as Partial<AddressDetails>)}
            hideModeToggle
            hideSubmit
          />
        </Box>
      ))}

      {!disabled && (
        <Button variant="outline" className="self-start" onClick={handleAdd}>
          <Plus className="mr-1 h-4 w-4" /> Add Address
        </Button>
      )}

      {addresses.length === 0 && !disabled && (
        <Typography variant="body2" color="textSecondary" className="mt-2">
          No addresses yet. Click &quot;Add Address&quot; to start.
        </Typography>
      )}
    </Box>
  );
}
