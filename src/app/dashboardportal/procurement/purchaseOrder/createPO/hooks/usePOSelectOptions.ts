import React from "react";
import type {
  BranchAddressRecord,
  ExpenseRecord,
  ItemGroupRecord,
  Option,
  ProjectRecord,
  SupplierBranchRecord,
  SupplierRecord,
} from "../types/poTypes";

type UsePOSelectOptionsParams = {
  suppliers: ReadonlyArray<SupplierRecord>;
  supplierBranches: ReadonlyArray<SupplierBranchRecord>;
  branchAddresses: ReadonlyArray<BranchAddressRecord>;
  projects: ReadonlyArray<ProjectRecord>;
  expenses: ReadonlyArray<ExpenseRecord>;
  itemGroupsFromLineItems: ReadonlyArray<ItemGroupRecord>;
};

/**
 * Normalises frequently used select options so memoised arrays live outside page.tsx.
 */
export const usePOSelectOptions = ({
  suppliers,
  supplierBranches,
  branchAddresses,
  projects,
  expenses,
  itemGroupsFromLineItems,
}: UsePOSelectOptionsParams) => {
  const supplierOptions = React.useMemo<Option[]>(() => {
    if (!suppliers?.length) return [];
    return suppliers
      .map((s) => ({
        label: s.name || s.code || s.id || "Unknown",
        value: s.id ?? "",
      }))
      .filter((opt) => opt.value);
  }, [suppliers]);

  const supplierBranchOptions = React.useMemo<Option[]>(
    () => supplierBranches.map((b) => ({ label: b.address || b.id, value: b.id })),
    [supplierBranches],
  );

  const branchAddressOptions = React.useMemo<Option[]>(
    () => branchAddresses.map((a) => ({ label: a.fullAddress || a.address1 || a.name || a.id, value: a.id })),
    [branchAddresses],
  );

  const projectOptions = React.useMemo<Option[]>(() => projects.map((p) => ({ label: p.name || p.id, value: p.id })), [projects]);

  const expenseOptions = React.useMemo<Option[]>(() => expenses.map((e) => ({ label: e.name || e.id, value: e.id })), [expenses]);

  const itemGroupOptions = React.useMemo<Option[]>(() => itemGroupsFromLineItems.map((grp) => ({ label: grp.label || grp.id, value: grp.id })), [itemGroupsFromLineItems]);

  return {
    supplierOptions,
    supplierBranchOptions,
    branchAddressOptions,
    projectOptions,
    expenseOptions,
    itemGroupOptions,
  };
};

export default usePOSelectOptions;
