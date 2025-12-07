import React from "react";
import { SearchableSelect, type TransactionLineColumn } from "@/components/ui/transaction";
import { Input } from "@/components/ui/input";
import type { EditableLineItem, IndentLabelResolvers, ItemOption, Option } from "../types/indentTypes";

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
};

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
				renderCell: ({ item }) => {
					if (!canEdit) {
						return (
							<span className="block truncate text-xs text-slate-700">
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
				width: "1.6fr",
				renderCell: ({ item }) => {
					if (!canEdit) {
						return (
							<span className="block truncate text-xs text-slate-700">
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
				width: "1.6fr",
				renderCell: ({ item }) => {
					if (!canEdit) {
						return (
							<span className="block truncate text-xs text-slate-700">
								{labelResolvers.item(item.itemGroup, item.item)}
							</span>
						);
					}

					const options = getItemOptions(item.itemGroup);
					const value = options.find((option) => option.value === item.item) ?? null;
					const waitingForGroup = Boolean(item.itemGroup) && !options.length && itemGroupLoading[item.itemGroup];

					return (
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
					);
				},
				getTooltip: ({ item }) => {
					const label = labelResolvers.item(item.itemGroup, item.item);
					return label && label !== "-" ? label : undefined;
				},
			},
			{
				id: "itemMake",
				header: "Item Make",
				width: "1.1fr",
				renderCell: ({ item }) => {
					if (!canEdit) {
						return (
							<span className="block truncate text-xs text-slate-700">
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
				className: "flex flex-col gap-1",
				renderCell: ({ item }) => {
					if (!canEdit) {
						return (
							<span className="block truncate text-xs text-slate-700">
								{item.quantity || "-"}
							</span>
						);
					}

					return (
						<Input
							type="number"
							inputMode="decimal"
							value={item.quantity}
							onChange={(event) => handleLineFieldChange(item.id, "quantity", event.target.value)}
							placeholder="0"
							className="h-7 px-1.5 py-0.5 text-xs border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:outline-none"
						/>
					);
				},
				getTooltip: ({ item }) => {
					const qty = item.quantity.trim();
					return qty ? qty : undefined;
				},
			},
			{
				id: "uom",
				header: "UOM",
				width: "0.75fr",
				renderCell: ({ item }) => {
					if (!canEdit) {
						return (
							<span className="block truncate text-xs text-slate-700">
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
				renderCell: ({ item }) => {
					if (!canEdit) {
						return (
							<span className="block truncate text-xs text-slate-700" title={item.remarks}>
								{item.remarks || "-"}
							</span>
						);
					}

					return (
						<textarea
							className="h-auto min-h-[24px] w-full resize-none border-0 bg-transparent px-1 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
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
		]
	);
};
