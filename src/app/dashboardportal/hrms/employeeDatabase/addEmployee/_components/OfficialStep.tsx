"use client";

import React, { useMemo, useRef, useCallback, useState, useEffect } from "react";
import MuiForm, { type Schema, type Field, type MuiFormHandle } from "@/components/ui/muiform";
import type { OfficialDetails, Option } from "../../types/employeeTypes";
import type { useEmployeeSetup } from "../../hooks/useEmployeeSetup";
import { useSelectedCompanyCoId } from "@/hooks/use-selected-company-coid";
import { useSidebarContext } from "@/components/dashboard/sidebarContext";
import { fetchDesignationsByBranch } from "@/utils/hrmsService";

interface OfficialStepProps {
  data: OfficialDetails | null;
  onChange: (vals: Partial<OfficialDetails>) => void;
  disabled: boolean;
  setup: ReturnType<typeof useEmployeeSetup>;
  sidebarBranchId: string;
}

const EMPTY_OPTIONS: readonly Option[] = Object.freeze([]);

export default function OfficialStep({ data, onChange, disabled, setup, sidebarBranchId }: OfficialStepProps) {
  const formRef = useRef<MuiFormHandle>(null);
  const { coId } = useSelectedCompanyCoId();
  const { selectedBranches } = useSidebarContext();

  // Filter branch options to only show sidebar-selected branches
  const filteredBranchOptions = useMemo(() => {
    if (selectedBranches.length === 0) return setup.branchOptions;
    const branchSet = new Set(selectedBranches.map(String));
    return setup.branchOptions.filter((opt) => branchSet.has(String(opt.value)));
  }, [setup.branchOptions, selectedBranches]);

  // ─── Branch-dependent designation options ─────────────────────────
  const [designationOptions, setDesignationOptions] = useState<readonly Option[]>(EMPTY_OPTIONS);

  const selectedBranchId = data?.branch_id != null ? String(data.branch_id) : "";

  useEffect(() => {
    if (!coId || !selectedBranchId) {
      setDesignationOptions(EMPTY_OPTIONS);
      return;
    }
    let cancelled = false;
    const load = async () => {
      const { data: resp, error } = await fetchDesignationsByBranch(coId, selectedBranchId);
      if (cancelled) return;
      if (error || !resp?.data) {
        setDesignationOptions(EMPTY_OPTIONS);
        return;
      }
      setDesignationOptions(resp.data);
    };
    load();
    return () => { cancelled = true; };
  }, [coId, selectedBranchId]);

  const schema = useMemo<Schema>(() => ({
    fields: [
      { name: "emp_code", label: "Employee Code", type: "text", required: true, grid: { xs: 12, sm: 4 } },
      { name: "legacy_code", label: "Legacy Code", type: "text", grid: { xs: 12, sm: 4 } },
      { name: "sub_dept_id", label: "Sub Department", type: "select", options: [...setup.subDeptOptions], grid: { xs: 12, sm: 4 } },
      { name: "branch_id", label: "Branch", type: "select", options: [...filteredBranchOptions], grid: { xs: 12, sm: 4 } },
      { name: "designation_id", label: "Designation", type: "select", options: [...designationOptions], grid: { xs: 12, sm: 4 } },
      { name: "catagory_id", label: "Category", type: "select", options: [...setup.categoryOptions], grid: { xs: 12, sm: 4 } },
      { name: "date_of_join", label: "Date of Joining", type: "date", grid: { xs: 12, sm: 4 } },
      { name: "probation_period", label: "Probation Period (months)", type: "number", grid: { xs: 12, sm: 4 } },
      { name: "minimum_working_commitment", label: "Min Working Commitment (months)", type: "number", grid: { xs: 12, sm: 4 } },
      { name: "reporting_eb_id", label: "Reporting To", type: "select", options: [...setup.reportingEmployeeOptions], grid: { xs: 12, sm: 4 } },
      { name: "contractor_id", label: "Contractor", type: "select", options: [...setup.contractorOptions], grid: { xs: 12, sm: 4 } },
      { name: "office_mobile_no", label: "Office Mobile", type: "text", grid: { xs: 12, sm: 4 } },
      { name: "office_email_id", label: "Office Email", type: "text", grid: { xs: 12, sm: 4 } },
    ] satisfies Field[],
  }), [setup.subDeptOptions, designationOptions, filteredBranchOptions, setup.reportingEmployeeOptions, setup.categoryOptions, setup.contractorOptions]);

  const values = useMemo(() => ({
    emp_code: data?.emp_code ?? "",
    legacy_code: data?.legacy_code ?? "",
    sub_dept_id: data?.sub_dept_id != null ? String(data.sub_dept_id) : "",
    catagory_id: data?.catagory_id != null ? String(data.catagory_id) : "",
    designation_id: data?.designation_id != null ? String(data.designation_id) : "",
    branch_id: data?.branch_id != null ? String(data.branch_id) : sidebarBranchId,
    date_of_join: data?.date_of_join ?? "",
    probation_period: data?.probation_period ?? "",
    minimum_working_commitment: data?.minimum_working_commitment ?? "",
    reporting_eb_id: data?.reporting_eb_id != null ? String(data.reporting_eb_id) : "",
    contractor_id: data?.contractor_id ?? "",
    office_mobile_no: data?.office_mobile_no ?? "",
    office_email_id: data?.office_email_id ?? "",
  }), [data]);

  const prevBranchRef = useRef(selectedBranchId);

  const handleChange = useCallback(
    (vals: Record<string, unknown>) => {
      const newBranch = vals.branch_id != null ? String(vals.branch_id) : "";
      if (newBranch !== prevBranchRef.current) {
        prevBranchRef.current = newBranch;
        onChange({ ...vals, designation_id: "" } as unknown as Partial<OfficialDetails>);
        return;
      }
      onChange(vals as Partial<OfficialDetails>);
    },
    [onChange],
  );

  return (
    <MuiForm
      ref={formRef}
      schema={schema}
      initialValues={values}
      mode={disabled ? "view" : "edit"}
      onValuesChange={handleChange}
      hideModeToggle
      hideSubmit
    />
  );
}
