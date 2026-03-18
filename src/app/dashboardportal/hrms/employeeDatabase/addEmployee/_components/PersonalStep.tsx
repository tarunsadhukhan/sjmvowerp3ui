"use client";

import React, { useMemo, useRef, useCallback } from "react";
import { Box } from "@mui/material";
import MuiForm, { type Schema, type Field, type MuiFormHandle } from "@/components/ui/muiform";
import type { PersonalDetails, Option } from "../../types/employeeTypes";
import type { useEmployeeSetup } from "../../hooks/useEmployeeSetup";
import EmployeePhotoUpload from "./EmployeePhotoUpload";

interface PersonalStepProps {
  data: PersonalDetails | null;
  onChange: (data: Partial<PersonalDetails>) => void;
  disabled: boolean;
  setup: ReturnType<typeof useEmployeeSetup>;
  photoUrl: string | null;
  onPhotoUpload: (file: File) => Promise<void>;
  onPhotoDelete?: () => void;
  employeeName?: string;
}

const GENDER_OPTIONS: Option[] = [
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
  { label: "Other", value: "Other" },
];

const MARITAL_OPTIONS: Option[] = [
  { label: "Single", value: "0" },
  { label: "Married", value: "1" },
  { label: "Divorced", value: "2" },
  { label: "Widowed", value: "3" },
];

export default function PersonalStep({
  data,
  onChange,
  disabled,
  setup,
  photoUrl,
  onPhotoUpload,
  onPhotoDelete,
  employeeName,
}: PersonalStepProps) {
  const formRef = useRef<MuiFormHandle>(null);

  const schema = useMemo<Schema>(
    () => ({
      fields: [
        { name: "first_name", label: "First Name", type: "text", required: true, grid: { xs: 12, sm: 4 } },
        { name: "middle_name", label: "Middle Name", type: "text", grid: { xs: 12, sm: 4 } },
        { name: "last_name", label: "Last Name", type: "text", required: true, grid: { xs: 12, sm: 4 } },
        { name: "gender", label: "Gender", type: "select", options: GENDER_OPTIONS, required: true, grid: { xs: 12, sm: 4 } },
        { name: "date_of_birth", label: "Date of Birth", type: "date", grid: { xs: 12, sm: 4 } },
        { name: "blood_group", label: "Blood Group", type: "select", options: setup.bloodGroupOptions as Option[], grid: { xs: 12, sm: 4 } },
        { name: "email_id", label: "Email Id", type: "text", grid: { xs: 12, sm: 4 } },
        { name: "marital_status", label: "Marital Status", type: "select", options: MARITAL_OPTIONS, grid: { xs: 12, sm: 4 } },
        { name: "relegion_name", label: "Nationality", type: "text", grid: { xs: 12, sm: 4 } },
        { name: "father_spouse_name", label: "Father / Spouse Name", type: "text", grid: { xs: 12, sm: 6 } },
        { name: "passport_no", label: "Passport Number", type: "text", grid: { xs: 12, sm: 6 } },
        { name: "driving_licence_no", label: "Driving Licence No", type: "text", grid: { xs: 12, sm: 4 } },
        { name: "pan_no", label: "PAN No", type: "text", grid: { xs: 12, sm: 4 } },
        { name: "aadhar_no", label: "Aadhaar No", type: "text", grid: { xs: 12, sm: 4 } },
      ] satisfies Field[],
    }),
    [setup.bloodGroupOptions],
  );

  const values = useMemo(
    () => ({
      first_name: data?.first_name ?? "",
      middle_name: data?.middle_name ?? "",
      last_name: data?.last_name ?? "",
      gender: data?.gender ?? "",
      date_of_birth: data?.date_of_birth ?? "",
      blood_group: data?.blood_group ?? "",
      email_id: data?.email_id ?? "",
      marital_status: data?.marital_status != null ? String(data.marital_status) : "",
      relegion_name: data?.relegion_name ?? "",
      father_spouse_name: data?.father_spouse_name ?? "",
      passport_no: data?.passport_no ?? "",
      driving_licence_no: data?.driving_licence_no ?? "",
      pan_no: data?.pan_no ?? "",
      aadhar_no: data?.aadhar_no ?? "",
    }),
    [data],
  );

  const handleChange = useCallback(
    (vals: Record<string, unknown>) => {
      onChange(vals as Partial<PersonalDetails>);
    },
    [onChange],
  );

  return (
    <Box className="flex flex-col md:flex-row gap-6">
      {/* Photo upload on the left */}
      <Box
        className="flex flex-col items-center justify-center shrink-0"
        sx={{
          border: "1px dashed",
          borderColor: "divider",
          borderRadius: 2,
          p: 3,
          minHeight: 220,
          width: { xs: "100%", md: 220 },
        }}
      >
        <EmployeePhotoUpload
          photoUrl={photoUrl}
          onUpload={onPhotoUpload}
          onDelete={onPhotoDelete}
          disabled={disabled}
          employeeName={employeeName}
        />
      </Box>
      {/* Form fields on the right */}
      <Box className="flex-1 min-w-0">
        <MuiForm
          ref={formRef}
          schema={schema}
          initialValues={values}
          mode={disabled ? "view" : "edit"}
          onValuesChange={handleChange}
          hideModeToggle
          hideSubmit
        />
      </Box>
    </Box>
  );
}
