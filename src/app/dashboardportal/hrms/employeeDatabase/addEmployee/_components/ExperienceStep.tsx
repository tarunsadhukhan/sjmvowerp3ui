"use client";

import React, { useMemo, useCallback } from "react";
import { Box, Typography, IconButton } from "@mui/material";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import MuiForm, { type Schema, type Field } from "@/components/ui/muiform";
import type { ExperienceDetails } from "../../types/employeeTypes";

interface ExperienceStepProps {
  items: ExperienceDetails[];
  onAdd: (exp: ExperienceDetails) => void;
  onUpdate: (index: number, data: Partial<ExperienceDetails>) => void;
  onRemove: (index: number) => void;
  disabled: boolean;
}

const experienceSchema: Schema = {
  fields: [
    { name: "company_name", label: "Company Name", type: "text", required: true, grid: { xs: 12, sm: 6 } },
    { name: "designation", label: "Designation", type: "text", grid: { xs: 12, sm: 6 } },
    { name: "from_date", label: "From Date", type: "date", grid: { xs: 12, sm: 3 } },
    { name: "to_date", label: "To Date", type: "date", grid: { xs: 12, sm: 3 } },
    { name: "project", label: "Project", type: "text", grid: { xs: 12, sm: 6 } },
    { name: "contact", label: "Contact", type: "text", grid: { xs: 12, sm: 6 } },
  ] satisfies Field[],
};

function blankExperience(): ExperienceDetails {
  return {
    auto_id: 0,
    eb_id: 0,
    company_name: "",
    from_date: null,
    to_date: null,
    designation: null,
    project: null,
    contact: null,
  };
}

export default function ExperienceStep({ items, onAdd, onUpdate, onRemove, disabled }: ExperienceStepProps) {
  const handleAdd = useCallback(() => onAdd(blankExperience()), [onAdd]);

  return (
    <Box className="flex flex-col gap-6">
      {items.map((exp, idx) => (
        <Box key={idx} className="relative rounded-md border p-4">
          <Box className="mb-2 flex items-center justify-between">
            <Typography variant="subtitle2">Experience {idx + 1}</Typography>
            {!disabled && (
              <IconButton size="small" aria-label="Remove experience" onClick={() => onRemove(idx)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </IconButton>
            )}
          </Box>
          <MuiForm
            schema={experienceSchema}
            initialValues={{
              company_name: exp.company_name,
              designation: exp.designation ?? "",
              from_date: exp.from_date ?? "",
              to_date: exp.to_date ?? "",
              project: exp.project ?? "",
              contact: exp.contact ?? "",
            }}
            mode={disabled ? "view" : "edit"}
            onValuesChange={(vals) => onUpdate(idx, vals as Partial<ExperienceDetails>)}
            hideModeToggle
            hideSubmit
          />
        </Box>
      ))}

      {!disabled && (
        <Button variant="outline" className="self-start" onClick={handleAdd}>
          <Plus className="mr-1 h-4 w-4" /> Add Experience
        </Button>
      )}

      {items.length === 0 && !disabled && (
        <Typography variant="body2" color="textSecondary" className="mt-2">
          No experience entries yet. Click &quot;Add Experience&quot; to start.
        </Typography>
      )}
    </Box>
  );
}
