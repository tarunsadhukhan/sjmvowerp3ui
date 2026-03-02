import React from "react";
import { SearchableSelect, type TransactionLineColumn } from "@/components/ui/transaction";
import { Input } from "@/components/ui/input";
import Tooltip from "@mui/material/Tooltip";
import type { EditableLineItem, IndentLabelResolvers, ItemOption, ItemValidationResult, LineItemValidationState, Option } from "../types/indentTypes";

type UseIndentLineItemColumnsParams = {
	canEdit: boolean;
	departmentOptions: readonly Option[];
	itemGroupOptions: readonly Option[];
	itemGroupLoading: Partial<Record<string, boolean>>;
	labelResolvers: IndentLabelResolvers;
	getItemOptions: (groupId: string) => ItemOption[];
	getMakeOptions: (groupId: string) => Option[];
	getUomOptions: (groupId: string, itemId: string) => Option[];
	handleLineFieldChange: (id: string, field: keyof EditableLineItem, value: string) => void;
	/** Per-line validation map from useIndentItemValidation */
	validationMap?: Record<string, LineItemValidationState>;
	/** Returns an error string if the quantity is invalid for a given line */
	getQuantityError?: (lineId: string, quantity: string) => string | null;
	/** Returns non-blocking warning strings for a given line */
	getLineWarnings?: (lineId: string) => string[];
	/** All line items — used to prevent duplicate item selection */
	lineItems?: readonly EditableLineItem[];
};

/** Build a hint string from validation result (Min / Max / Reorder). */
function buildQtyHint(r: ItemValidationResult | null | undefined): string | null {
	if (!r || r.maxIndentQty == null) return null;
	const parts: string[] = [];
	if (r.minIndentQty != null && r.minIndentQty > 0) parts.push(`Min: ${r.minIndentQty}`);
	parts.push(`Max: ${r.maxIndentQty}`);
	if (r.minOrderQty != null && r.minOrderQty > 0) parts.push(`Reorder: ${r.minOrderQty}`);
	return parts.join(" · ");
}

/** Input with a focus-activated tooltip showing qty hints. */
function QtyInputWithTooltip({
	value,
	onChange,
	readOnly,
	hasError,
	hint,
}: {
	value: string;
	onChange: (v: string) => void;
	readOnly: boolean;
	hasError: boolean;
	hint: string | null;
}) {
	const [focused, setFocused] = React.useState(false);
	return (
		<Tooltip
			title={hint ?? ""}
			open={focused && !!hint}
			arrow
			placement="top"
			disableHoverListener
			disableTouchListener
		>
			<Input
				type="number"
				inputMode="decimal"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				onFocus={() => setFocused(true)}
				onBlur={() => setFocused(false)}
				placeholder="0"
				readOnly={readOnly}
				className={`h-7 px-1.5 py-0.5 text-sm border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:outline-none${hasError ? " text-red-600" : ""}${readOnly ? " bg-slate-50 cursor-not-allowed" : ""}`}
			/>
		</Tooltip>
	);
}

/**
 * Generates the column definitions for the Indent line items table.
 */
export const useIndentLineItemColumns = ({
	canEdit,
	departmentOptions,
	itemGroupOptions,
	itemGroupLoading,
	labelResolvers,
	getItemOptions,
	getMakeOptions,
	getUomOptions,
	handleLineFieldChange,
	validationMap,
	getQuantityError,
	getLineWarnings,
	lineItems,
}: UseIndentLineItemColumnsParams): TransactionLineColumn<EditableLineItem>[] => {
	const adjustTextareaHeight = React.useCallback((event: React.FormEvent<HTMLTextAreaElement>) => {
		const element = event.currentTarget;
		element.style.height = "auto";
		element.style.height = `${Math.min(Math.max(element.scrollHeight, 24), 120)}px`;
	}, []);

	return React.useMemo<TransactionLineColumn<EditableLineItem>[]>(
		() => [
			{
				id: "department",
				header: "Department",
				width: "1.2fr",
				minWidth: "130px",
				renderCell: ({ item }) => {
					if (!canEdit) {
						return (
							<span className="block truncate text-sm text-slate-700">
								{labelResolvers.department(item.department)}
							</span>
						);
					}

					const value = (departmentOptions as Option[]).find((option) => option.value === item.department) ?? null;
					return (
						<SearchableSelect<Option>
							options={departmentOptions as Option[]}
							value={value}
							onChange={(next) => handleLineFieldChange(item.id, "department", next?.value ?? "")}
							getOptionLabel={(option) => option.label}
							isOptionEqualToValue={(option, valueOption) => option.value === valueOption.value}
							placeholder="Search department"
							noOptionsText="No options"
						/>
					);
				},
				getTooltip: ({ item }) => {
					const label = labelResolvers.department(item.department);
					return label && label !== "-" ? label : undefined;
				},
			},
			{
				id: "itemGroup",
				header: "Item Group",
				width: "2fr",
				minWidth: "188px",
				renderCell: ({ item }) => {
					if (!canEdit) {
						return (
							<span className="block truncate text-sm text-slate-700">
								{labelResolvers.itemGroup(item.itemGroup)}
							</span>
						);
					}

					const value = (itemGroupOptions as Option[]).find((option) => option.value === item.itemGroup) ?? null;
					return (
						<SearchableSelect<Option>
							options={itemGroupOptions as Option[]}
							value={value}
							onChange={(next) => handleLineFieldChange(item.id, "itemGroup", next?.value ?? "")}
							getOptionLabel={(option) => option.label}
							isOptionEqualToValue={(option, valueOption) => option.value === valueOption.value}
							placeholder="Search item group"
							noOptionsText="No options"
						/>
					);
				},
				getTooltip: ({ item }) => {
					const label = labelResolvers.itemGroup(item.itemGroup);
					return label && label !== "-" ? label : undefined;
				},
			},
			{
				id: "item",
				header: "Item",
				width: "2.4fr",
				minWidth: "225px",
				className: "flex flex-col gap-0.5",
				renderCell: ({ item }) => {
					const lineValidation = validationMap?.[item.id];
					const itemErrors = lineValidation?.result?.errors ?? [];
					const itemWarnings = getLineWarnings?.(item.id) ?? [];
					const isValidating = lineValidation?.loading ?? false;

					if (!canEdit) {
						return (
							<span className="block truncate text-sm text-slate-700">
								{labelResolvers.item(item.itemGroup, item.item)}
							</span>
						);
					}

					const allOptions = getItemOptions(item.itemGroup);
					// Filter out items already selected in other lines
					const selectedItemIds = new Set(
						(lineItems ?? [])
							.filter((li) => li.id !== item.id && li.item)
							.map((li) => li.item)
					);
					const options = allOptions.filter(
						(opt) => opt.value === item.item || !selectedItemIds.has(opt.value)
					);
					const value = options.find((option) => option.value === item.item) ?? null;
					const waitingForGroup = Boolean(item.itemGroup) && !allOptions.length && itemGroupLoading[item.itemGroup];

					return (
						<div className="flex flex-col gap-0.5 w-full">
							<SearchableSelect<ItemOption>
								options={options}
								value={value}
								onChange={(next) => handleLineFieldChange(item.id, "item", next?.value ?? "")}
								getOptionLabel={(option) => option.label}
								isOptionEqualToValue={(option, valueOption) => option.value === valueOption.value}
								placeholder={waitingForGroup ? "Loading items..." : "Search item"}
								disabled={!item.itemGroup || waitingForGroup}
								loading={waitingForGroup}
								noOptionsText={waitingForGroup ? "Loading..." : "No options"}
							/>
							{isValidating && (
								<span className="text-[11px] leading-tight text-blue-500">Validating...</span>
							)}
							{!isValidating && itemErrors.length > 0 && (
								<span className="text-[11px] leading-tight text-red-600 font-medium">
									{itemErrors[0]}
								</span>
							)}
							{!isValidating && itemErrors.length === 0 && itemWarnings.length > 0 && (
								<span className="text-[11px] leading-tight text-amber-600">
									{itemWarnings[0]}
								</span>
							)}
						</div>
					);
				},
				getTooltip: ({ item }) => {
					const label = labelResolvers.item(item.itemGroup, item.item);
					const errors = validationMap?.[item.id]?.result?.errors ?? [];
					if (errors.length > 0) return `⚠ ${errors[0]}`;
					return label && label !== "-" ? label : undefined;
				},
			},
			{
				id: "itemMake",
				header: "Item Make",
				width: "1.1fr",
				minWidth: "110px",
				renderCell: ({ item }) => {
					if (!canEdit) {
						return (
							<span className="block truncate text-sm text-slate-700">
								{labelResolvers.itemMake(item.itemGroup, item.itemMake)}
							</span>
						);
					}

					const options = getMakeOptions(item.itemGroup);
					const value = options.find((option) => option.value === item.itemMake) ?? null;
					const waitingForGroup = Boolean(item.itemGroup) && itemGroupLoading[item.itemGroup];

					return (
						<SearchableSelect<Option>
							options={options}
							value={value}
							onChange={(next) => handleLineFieldChange(item.id, "itemMake", next?.value ?? "")}
							getOptionLabel={(option) => option.label}
							isOptionEqualToValue={(option, valueOption) => option.value === valueOption.value}
							placeholder={options.length ? "Search make" : "No make options"}
							disabled={!item.itemGroup || waitingForGroup}
							noOptionsText={options.length ? "No matches" : "No options"}
						/>
					);
				},
				getTooltip: ({ item }) => {
					const label = labelResolvers.itemMake(item.itemGroup, item.itemMake);
					return label && label !== "-" ? label : undefined;
				},
			},
			{
				id: "quantity",
				header: "Qty",
				width: "0.7fr",
				minWidth: "70px",
				className: "flex flex-col gap-0.5",
				renderCell: ({ item }) => {
					const qtyError = getQuantityError?.(item.id, item.quantity) ?? null;
					const lineResult = validationMap?.[item.id]?.result;
					const isForcedQty = lineResult?.forcedQty != null;
					const hint = buildQtyHint(lineResult);

					if (!canEdit) {
						return (
							<span className="block truncate text-sm text-slate-700">
								{item.quantity || "-"}
							</span>
						);
					}

					return (
						<div className="flex flex-col gap-0.5 w-full">
							<QtyInputWithTooltip
								value={item.quantity}
								onChange={(v) => handleLineFieldChange(item.id, "quantity", v)}
								readOnly={isForcedQty}
								hasError={!!qtyError}
								hint={hint}
							/>
							{qtyError && (
								<span className="text-[11px] leading-tight text-red-600 font-medium">
									{qtyError}
								</span>
							)}
						</div>
					);
				},
				getTooltip: ({ item }) => {
					const qty = item.quantity.trim();
					const err = getQuantityError?.(item.id, item.quantity);
					if (err) return `⚠ ${err}`;
					return qty ? qty : undefined;
				},
			},
			{
				id: "uom",
				header: "UOM",
				width: "0.75fr",
				minWidth: "80px",
				renderCell: ({ item }) => {
					if (!canEdit) {
						return (
							<span className="block truncate text-sm text-slate-700">
								{labelResolvers.uom(item.itemGroup, item.item, item.uom)}
							</span>
						);
					}

					const options = getUomOptions(item.itemGroup, item.item);
					const value = options.find((option) => option.value === item.uom) ?? null;
					const waitingForGroup = Boolean(item.itemGroup) && itemGroupLoading[item.itemGroup];

					return (
						<SearchableSelect<Option>
							options={options}
							value={value}
							onChange={(next) => handleLineFieldChange(item.id, "uom", next?.value ?? "")}
							getOptionLabel={(option) => option.label}
							isOptionEqualToValue={(option, valueOption) => option.value === valueOption.value}
							placeholder={waitingForGroup ? "Loading UOMs..." : "Search UOM"}
							disabled={!item.item || waitingForGroup}
							loading={waitingForGroup}
							noOptionsText={waitingForGroup ? "Loading..." : "No options"}
						/>
					);
				},
				getTooltip: ({ item }) => {
					const label = labelResolvers.uom(item.itemGroup, item.item, item.uom);
					return label && label !== "-" ? label : undefined;
				},
			},
			{
				id: "remarks",
				header: "Remarks",
				width: "1.6fr",
				minWidth: "120px",
				renderCell: ({ item }) => {
					if (!canEdit) {
						return (
							<span className="block truncate text-sm text-slate-700" title={item.remarks}>
								{item.remarks || "-"}
							</span>
						);
					}

					return (
						<textarea
							className="h-auto min-h-6 w-full resize-none border-0 bg-transparent px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
							rows={1}
							value={item.remarks}
							placeholder="Notes"
							onChange={(event) => {
								adjustTextareaHeight(event);
								handleLineFieldChange(item.id, "remarks", event.target.value);
							}}
							onInput={adjustTextareaHeight}
						/>
					);
				},
				getTooltip: ({ item }) => {
					const remarks = item.remarks?.trim();
					return remarks ? remarks : undefined;
				},
			},
		],
		[
			adjustTextareaHeight,
			canEdit,
			departmentOptions,
			getItemOptions,
			getMakeOptions,
			getUomOptions,
			handleLineFieldChange,
			itemGroupOptions,
			labelResolvers,
			itemGroupLoading,
			lineItems,
			validationMap,
			getQuantityError,
			getLineWarnings,
		]
	);
};
