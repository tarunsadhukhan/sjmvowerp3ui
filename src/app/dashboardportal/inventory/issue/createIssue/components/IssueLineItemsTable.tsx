"use client";

import React from "react";
import type { TransactionLineColumn } from "@/components/ui/transaction";
import type { MuiFormMode } from "@/components/ui/muiform";
import type {
	EditableLineItem,
	Option,
	AvailableInventoryItem,
	IssueLabelResolvers,
} from "../types/issueTypes";
import { SearchableSelect } from "@/components/ui/transaction/SearchableSelect";
import { TextField, Tooltip, CircularProgress } from "@mui/material";

type UseIssueLineItemColumnsParams = {
	canEdit: boolean;
	mode: MuiFormMode;
	itemGroupOptions: readonly Option[];
	itemGroupLoading: Partial<Record<string, boolean>>;
	expenseOptions: readonly Option[];
	costFactorOptions: readonly Option[];
	machineOptions: readonly Option[];
	labelResolvers: IssueLabelResolvers;
	getItemOptions: (groupId: string) => Option[];
	getUomOptions: (groupId: string, itemId: string) => Option[];
	handleLineFieldChange: (
		id: string,
		field: keyof EditableLineItem,
		value: string | number
	) => void;
	updateLineFields: (id: string, updates: Partial<EditableLineItem>) => void;
	availableInventory: AvailableInventoryItem[];
	availableInventoryLoading: boolean;
};

/**
 * Hook that returns the column definitions for the Issue line items table.
 */
export const useIssueLineItemColumns = ({
	canEdit,
	mode,
	itemGroupOptions,
	itemGroupLoading,
	expenseOptions,
	costFactorOptions,
	machineOptions,
	labelResolvers,
	getItemOptions,
	getUomOptions,
	handleLineFieldChange,
	updateLineFields,
	availableInventory,
	availableInventoryLoading,
}: UseIssueLineItemColumnsParams): TransactionLineColumn<EditableLineItem>[] => {
	return React.useMemo(
		() => [
			// Item Group
			{
				id: "itemGroup",
				header: "Item Group",
				width: "1.4fr",
				renderCell: ({ item }) => {
					if (!canEdit) {
						return (
							<span className="text-xs">
								{labelResolvers.itemGroup(item.itemGroup)}
							</span>
						);
					}
					const value =
						itemGroupOptions.find((opt) => opt.value === item.itemGroup) ??
						null;
					const isLoading = itemGroupLoading[item.itemGroup] ?? false;
					return (
						<div className="relative">
							<SearchableSelect
								options={itemGroupOptions as Option[]}
								value={value}
								onChange={(next) =>
									handleLineFieldChange(
										item.id,
										"itemGroup",
										next?.value ?? ""
									)
								}
								getOptionLabel={(opt) => opt.label}
								isOptionEqualToValue={(a, b) => a.value === b.value}
								placeholder="Search group"
								textFieldProps={{ size: "small" }}
							/>
							{isLoading && (
								<CircularProgress
									size={16}
									className="absolute right-8 top-1/2 -translate-y-1/2"
								/>
							)}
						</div>
					);
				},
				getTooltip: ({ item }) =>
					labelResolvers.itemGroup(item.itemGroup) || undefined,
			},

			// Item
			{
				id: "item",
				header: "Item",
				width: "1.6fr",
				renderCell: ({ item }) => {
					if (!canEdit) {
						return (
							<span className="text-xs">
								{labelResolvers.item(item.itemGroup, item.item)}
							</span>
						);
					}
					const options = getItemOptions(item.itemGroup);
					const value = options.find((opt) => opt.value === item.item) ?? null;
					return (
						<SearchableSelect
							options={options}
							value={value}
							onChange={(next) =>
								handleLineFieldChange(item.id, "item", next?.value ?? "")
							}
							getOptionLabel={(opt) => opt.label}
							isOptionEqualToValue={(a, b) => a.value === b.value}
							placeholder="Search item"
							textFieldProps={{ size: "small" }}
							disabled={!item.itemGroup}
						/>
					);
				},
				getTooltip: ({ item }) =>
					labelResolvers.item(item.itemGroup, item.item) || undefined,
			},

			// SR Line (Inward Detail ID) - for SR-wise consumption tracking
			{
				id: "inwardDtlId",
				header: "SR Line",
				width: "1.2fr",
				renderCell: ({ item }) => {
					if (!canEdit) {
						return (
							<span className="text-xs">
								{item.inwardDtlId
									? `${item.srNo || "SR"} - ${item.availableQty || 0}`
									: "-"}
							</span>
						);
					}
					// Filter available inventory by selected item
					const filteredInventory = availableInventory.filter(
						(inv) =>
							String(inv.itemId) === String(item.item) &&
							parseFloat(String(inv.availableQty)) > 0
					);
					const inventoryOptions: Option[] = filteredInventory.map((inv) => ({
						label: `${inv.srNo} (Avl: ${inv.availableQty})`,
						value: String(inv.inwardDtlId),
					}));

					const selectedValue =
						inventoryOptions.find((opt) => opt.value === item.inwardDtlId) ??
						null;

					if (availableInventoryLoading) {
						return <CircularProgress size={16} />;
					}

					return (
						<SearchableSelect
							options={inventoryOptions}
							value={selectedValue}
							onChange={(next) => {
								if (!next) {
									updateLineFields(item.id, {
										inwardDtlId: "",
										rate: "",
										availableQty: "",
										srNo: "",
									});
									return;
								}
								const selectedInv = filteredInventory.find(
									(inv) => String(inv.inwardDtlId) === next.value
								);
								if (selectedInv) {
									updateLineFields(item.id, {
										inwardDtlId: next.value,
										rate: String(selectedInv.rate ?? ""),
										availableQty: String(selectedInv.availableQty ?? ""),
										srNo: selectedInv.srNo ?? "",
										uom: String(selectedInv.uomId ?? item.uom),
									});
								}
							}}
							getOptionLabel={(opt) => opt.label}
							isOptionEqualToValue={(a, b) => a.value === b.value}
							placeholder="Select SR"
							textFieldProps={{ size: "small" }}
							disabled={!item.item}
						/>
					);
				},
				getTooltip: ({ item }) =>
					item.inwardDtlId
						? `SR: ${item.srNo || item.inwardDtlId}, Rate: ${item.rate || "N/A"}, Available: ${item.availableQty || "N/A"}`
						: undefined,
			},

			// Quantity
			{
				id: "quantity",
				header: "Qty",
				width: "0.7fr",
				renderCell: ({ item }) => {
					if (!canEdit) {
						return <span className="text-xs text-right">{item.quantity}</span>;
					}
					const maxQty = parseFloat(item.availableQty || "0");
					return (
						<Tooltip
							title={maxQty > 0 ? `Max available: ${maxQty}` : ""}
							placement="top"
						>
							<TextField
								type="number"
								size="small"
								value={item.quantity}
								onChange={(e) =>
									handleLineFieldChange(item.id, "quantity", e.target.value)
								}
								inputProps={{
									min: 0,
									max: maxQty > 0 ? maxQty : undefined,
									step: "0.01",
									style: { textAlign: "right" },
								}}
								fullWidth
								error={
									maxQty > 0 && parseFloat(item.quantity || "0") > maxQty
								}
								helperText={
									maxQty > 0 && parseFloat(item.quantity || "0") > maxQty
										? "Exceeds available"
										: undefined
								}
							/>
						</Tooltip>
					);
				},
			},

			// UOM
			{
				id: "uom",
				header: "UOM",
				width: "0.8fr",
				renderCell: ({ item }) => {
					if (!canEdit) {
						return (
							<span className="text-xs">
								{labelResolvers.uom(item.itemGroup, item.item, item.uom)}
							</span>
						);
					}
					const options = getUomOptions(item.itemGroup, item.item);
					const value = options.find((opt) => opt.value === item.uom) ?? null;
					return (
						<SearchableSelect
							options={options}
							value={value}
							onChange={(next) =>
								handleLineFieldChange(item.id, "uom", next?.value ?? "")
							}
							getOptionLabel={(opt) => opt.label}
							isOptionEqualToValue={(a, b) => a.value === b.value}
							placeholder="UOM"
							textFieldProps={{ size: "small" }}
							disabled={!item.item}
						/>
					);
				},
			},

			// Rate (from SR, read-only)
			{
				id: "rate",
				header: "Rate",
				width: "0.7fr",
				renderCell: ({ item }) => (
					<span className="text-xs text-right block">
						{item.rate ? parseFloat(item.rate).toFixed(2) : "-"}
					</span>
				),
			},

			// Expense Type
			{
				id: "expenseType",
				header: "Expense Type",
				width: "1.2fr",
				renderCell: ({ item }) => {
					if (!canEdit) {
						return (
							<span className="text-xs">
								{labelResolvers.expense(item.expenseType)}
							</span>
						);
					}
					const value =
						expenseOptions.find((opt) => opt.value === item.expenseType) ??
						null;
					return (
						<SearchableSelect
							options={expenseOptions as Option[]}
							value={value}
							onChange={(next) =>
								handleLineFieldChange(
									item.id,
									"expenseType",
									next?.value ?? ""
								)
							}
							getOptionLabel={(opt) => opt.label}
							isOptionEqualToValue={(a, b) => a.value === b.value}
							placeholder="Expense"
							textFieldProps={{ size: "small" }}
						/>
					);
				},
			},

			// Cost Factor
			{
				id: "costFactor",
				header: "Cost Factor",
				width: "1.1fr",
				renderCell: ({ item }) => {
					if (!canEdit) {
						return (
							<span className="text-xs">
								{labelResolvers.costFactor(item.costFactor)}
							</span>
						);
					}
					const value =
						costFactorOptions.find((opt) => opt.value === item.costFactor) ??
						null;
					return (
						<SearchableSelect
							options={costFactorOptions as Option[]}
							value={value}
							onChange={(next) =>
								handleLineFieldChange(
									item.id,
									"costFactor",
									next?.value ?? ""
								)
							}
							getOptionLabel={(opt) => opt.label}
							isOptionEqualToValue={(a, b) => a.value === b.value}
							placeholder="Cost Factor"
							textFieldProps={{ size: "small" }}
						/>
					);
				},
			},

			// Machine
			{
				id: "machine",
				header: "Machine",
				width: "1fr",
				renderCell: ({ item }) => {
					if (!canEdit) {
						return (
							<span className="text-xs">
								{labelResolvers.machine(item.machine)}
							</span>
						);
					}
					const value =
						machineOptions.find((opt) => opt.value === item.machine) ?? null;
					return (
						<SearchableSelect
							options={machineOptions as Option[]}
							value={value}
							onChange={(next) =>
								handleLineFieldChange(item.id, "machine", next?.value ?? "")
							}
							getOptionLabel={(opt) => opt.label}
							isOptionEqualToValue={(a, b) => a.value === b.value}
							placeholder="Machine"
							textFieldProps={{ size: "small" }}
						/>
					);
				},
			},

			// Remarks
			{
				id: "remarks",
				header: "Remarks",
				width: "1fr",
				renderCell: ({ item }) => {
					if (!canEdit) {
						return <span className="text-xs">{item.remarks}</span>;
					}
					return (
						<TextField
							size="small"
							value={item.remarks}
							onChange={(e) =>
								handleLineFieldChange(item.id, "remarks", e.target.value)
							}
							placeholder="Remarks"
							fullWidth
						/>
					);
				},
			},
		],
		[
			canEdit,
			itemGroupOptions,
			itemGroupLoading,
			expenseOptions,
			costFactorOptions,
			machineOptions,
			labelResolvers,
			getItemOptions,
			getUomOptions,
			handleLineFieldChange,
			updateLineFields,
			availableInventory,
			availableInventoryLoading,
		]
	);
};
