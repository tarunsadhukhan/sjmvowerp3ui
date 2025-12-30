import React from "react";
import type { Schema, MuiFormMode } from "@/components/ui/muiform";
import type { Option } from "../types/indentTypes";
import { INDENT_TYPE_OPTIONS, OPEN_INDENT_ALLOWED_EXPENSE_IDS } from "../utils/indentConstants";

type UseIndentFormSchemaParams = {
	mode: MuiFormMode;
	branchOptions: readonly Option[];
	expenseOptions: readonly Option[];
	projectOptions: readonly Option[];
};

/**
 * Generates the form schema for the Indent header form.
 */
export const useIndentFormSchema = ({
	mode,
	branchOptions,
	expenseOptions,
	projectOptions,
}: UseIndentFormSchemaParams): Schema => {
	return React.useMemo(
		() => ({
			fields: [
				{
					name: "branch",
					label: "Branch",
					type: "select",
					required: true,
					options: branchOptions as Option[],
					disabled: mode !== "create",
					grid: { xs: 12, md: 4 },
				},
				{
					name: "indent_type",
					label: "Indent Type",
					type: "select",
					required: true,
					options: INDENT_TYPE_OPTIONS as Option[],
					grid: { xs: 12, md: 4 },
				},
				{
					name: "expense_type",
					label: "Expense Type",
					type: "select",
					required: true,
					options: expenseOptions as Option[],
					customValidate: (value: unknown, values: Record<string, unknown>) => {
						const indentType = String(values.indent_type ?? "").toLowerCase();
						if (indentType !== "open") return null;
						const expense = String(value ?? "");
						if (!expense) return "Required";
						return OPEN_INDENT_ALLOWED_EXPENSE_IDS.has(expense)
							? null
							: "Select expense type 3, 5, or 6 for Open indents";
					},
					grid: { xs: 12, md: 4 },
				},
				{
					name: "date",
					label: "Indent Date",
					type: "date",
					required: true,
					grid: { xs: 12, md: 6 },
				},
				{
					name: "indent_no",
					label: "Indent No",
					type: "text",
					disabled: true,
					helperText: "Generated after the indent is created",
					grid: { xs: 12, md: 6 },
				},
				{
					name: "project",
					label: "Project",
					type: "select",
					options: projectOptions as Option[],
					grid: { xs: 12, md: 6 },
				},
				{
					name: "requester",
					label: "Indent Name",
					type: "text",
					grid: { xs: 12, md: 6 },
				},
				{
					name: "remarks",
					label: "Remarks",
					type: "textarea",
					grid: { xs: 12 },
					minRows: 1,
					maxRows: 4,
				},
			],
		}),
		[branchOptions, mode, expenseOptions, projectOptions]
	);
};
