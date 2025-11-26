import React from "react";
import type { Schema, Field } from "@/components/ui/muiform";
import type { Option } from "../types/poTypes";

export type UsePOHeaderSchemaParams = {
  branchOptions: Option[];
  supplierOptions: Option[];
  supplierBranchOptions: Option[];
  branchAddressOptions: Option[];
  projectOptions: Option[];
  expenseOptions: Option[];
  coConfig?: { india_gst?: number };
  billingState?: string;
  shippingState?: string;
  taxType: string;
  expectedDate: string;
  mode: "create" | "edit" | "view";
  headerFieldsDisabled: boolean;
};

export type UsePOFooterSchemaParams = {
  coConfig?: { india_gst?: number };
  billingState?: string;
  shippingState?: string;
  taxType: string;
};

/**
 * Builds the header form schema for the PO create/edit page.
 */
export const usePOHeaderSchema = ({
  branchOptions,
  supplierOptions,
  supplierBranchOptions,
  branchAddressOptions,
  projectOptions,
  expenseOptions,
  coConfig,
  billingState,
  shippingState,
  taxType,
  expectedDate,
  mode,
  headerFieldsDisabled,
}: UsePOHeaderSchemaParams): Schema =>
  React.useMemo(() => {
    const fields: Field[] = [
      {
        name: "branch",
        label: "Branch",
        type: "select",
        options: branchOptions,
        required: true,
        disabled: mode === "view",
        grid: { xs: 12, md: 4 },
      },
      { name: "date", label: "PO Date", type: "date", required: true, disabled: mode === "view", grid: { xs: 12, md: 4 } },
      { name: "supplier", label: "Supplier", type: "select", options: supplierOptions, required: true, disabled: headerFieldsDisabled, grid: { xs: 12, md: 4 } },
      { name: "supplier_branch", label: "Supplier Branch", type: "select", options: supplierBranchOptions, required: true, disabled: headerFieldsDisabled, grid: { xs: 12, md: 4 } },
      { name: "billing_address", label: "Billing Address", type: "select", options: branchAddressOptions, required: true, disabled: headerFieldsDisabled, grid: { xs: 12, md: 4 } },
      { name: "shipping_address", label: "Shipping Address", type: "select", options: branchAddressOptions, required: true, disabled: headerFieldsDisabled, grid: { xs: 12, md: 4 } },
      { name: "tax_payable", label: "Tax Payable", type: "select", options: [{ label: "Yes", value: "Yes" }, { label: "No", value: "No" }], required: true, disabled: headerFieldsDisabled, grid: { xs: 12, md: 4 } },
      { name: "credit_term", label: "Credit Term (days)", type: "text", placeholder: "days", disabled: headerFieldsDisabled, grid: { xs: 12, md: 4 } },
      { name: "delivery_timeline", label: "Delivery Timeline (days)", type: "text", placeholder: "days", required: true, disabled: headerFieldsDisabled, grid: { xs: 12, md: 4 } },
      { name: "expected_date", label: "Expected Date", type: "text", disabled: true, helperText: expectedDate ? undefined : "Set a delivery timeline to calculate expected date", grid: { xs: 12, md: 4 } },
      { name: "expense_type", label: "Expense Type", type: "select", options: expenseOptions, required: true, disabled: headerFieldsDisabled, grid: { xs: 12, md: 4 } },
      { name: "project", label: "Project", type: "select", options: projectOptions, required: true, disabled: headerFieldsDisabled, grid: { xs: 12, md: 4 } },
      { name: "contact_person", label: "Contact Person", type: "text", disabled: headerFieldsDisabled, grid: { xs: 12, md: 4 } },
      { name: "contact_no", label: "Contact No.", type: "text", disabled: headerFieldsDisabled, grid: { xs: 12, md: 4 } },
    ];

    return { fields } satisfies Schema;
  }, [
    branchOptions,
    supplierOptions,
    supplierBranchOptions,
    branchAddressOptions,
    projectOptions,
    expenseOptions,
    coConfig,
    billingState,
    shippingState,
    taxType,
    expectedDate,
    mode,
    headerFieldsDisabled,
  ]);

/** Builds the schema for footer-only fields rendered below the line items. */
export const usePOFooterSchema = ({ coConfig, billingState, shippingState, taxType }: UsePOFooterSchemaParams): Schema =>
  React.useMemo(() => {
    const fields: Field[] = [
      { name: "footer_note", label: "Footer Note", type: "textarea", grid: { xs: 12 } },
      { name: "internal_note", label: "Internal Note", type: "textarea", grid: { xs: 12 } },
      { name: "terms_conditions", label: "Terms and Conditions", type: "textarea", grid: { xs: 12 } },
      { name: "advance_percentage", label: "Advance Percentage", type: "text", grid: { xs: 12, md: 4 } },
    ];

    return { fields } satisfies Schema;
  }, [coConfig, billingState, shippingState, taxType]);
