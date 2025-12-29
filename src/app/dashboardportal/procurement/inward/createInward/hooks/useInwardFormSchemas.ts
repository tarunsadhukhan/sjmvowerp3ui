import React from "react";
import type { MuiFormMode, Schema } from "@/components/ui/muiform";
import type { Option } from "../types/inwardTypes";

type UseInwardFormSchemaParams = {
	mode: MuiFormMode;
	branchOptions: Option[];
	supplierOptions: Option[];
	headerFieldsDisabled?: boolean;
	/** In create mode, show full form only after branch and supplier are selected */
	showFullForm?: boolean;
};

/**
 * Hook to generate the form schema for the Inward header.
 * In create mode, initially only shows branch and supplier selection.
 * Once both are selected, the full form is displayed.
 */
export function useInwardFormSchema({
	mode,
	branchOptions,
	supplierOptions,
	headerFieldsDisabled = false,
	showFullForm = true,
}: UseInwardFormSchemaParams): Schema {
	return React.useMemo(() => {
		const isView = mode === "view";
		const isCreate = mode === "create";
		
		// In create mode, first show only branch and supplier selection
		// Once both are selected (showFullForm = true), show all fields
		const showExtendedFields = !isCreate || showFullForm;

		const fields: Schema["fields"] = [
			// Row 1: Branch and Supplier (always shown)
			{
				name: "branch",
				label: "Branch",
				type: "select" as const,
				required: true,
				options: branchOptions,
				disabled: mode !== "create" || headerFieldsDisabled,
				grid: { xs: 12, md: showExtendedFields ? 3 : 6 },
			},
			{
				name: "supplier",
				label: "Supplier",
				type: "select" as const,
				required: true,
				options: supplierOptions,
				disabled: isView || headerFieldsDisabled,
				grid: { xs: 12, md: showExtendedFields ? 3 : 6 },
			},
		];

		// Additional fields only shown after branch/supplier selected in create mode,
		// or always in edit/view mode
		if (showExtendedFields) {
			fields.push(
				{
					name: "inward_date",
					label: "Inward Date",
					type: "date" as const,
					required: true,
					disabled: isView,
					grid: { xs: 12, md: 3 },
				},
				{
					name: "inward_no",
					label: "Inward No.",
					type: "text" as const,
					disabled: true, // Auto-generated after open
					grid: { xs: 12, md: 3 },
					helperText: "Auto-generated on open",
				},

				// Row 2: Challan and Invoice details
				{
					name: "challan_no",
					label: "Challan No.",
					type: "text" as const,
					required: false,
					disabled: isView,
					grid: { xs: 12, md: 3 },
				},
				{
					name: "challan_date",
					label: "Challan Date",
					type: "date" as const,
					required: false,
					disabled: isView,
					grid: { xs: 12, md: 3 },
				},
				{
					name: "invoice_no",
					label: "Invoice No.",
					type: "text" as const,
					required: false,
					disabled: isView,
					grid: { xs: 12, md: 3 },
				},
				{
					name: "invoice_date",
					label: "Invoice Date",
					type: "date" as const,
					required: false,
					disabled: isView,
					grid: { xs: 12, md: 3 },
				},

				// Row 3: Transporter details
				{
					name: "vehicle_no",
					label: "Vehicle No.",
					type: "text" as const,
					required: false,
					disabled: isView,
					grid: { xs: 12, md: 3 },
				},
				{
					name: "transporter_name",
					label: "Transporter Name",
					type: "text" as const,
					required: false,
					disabled: isView,
					grid: { xs: 12, md: 3 },
				},
				{
					name: "remarks",
					label: "Remarks",
					type: "multiline" as const,
					required: false,
					disabled: isView,
					grid: { xs: 12, md: 6 },
					rows: 2,
				},
			);
		}

		return { fields };
	}, [mode, branchOptions, supplierOptions, headerFieldsDisabled, showFullForm]);
}
