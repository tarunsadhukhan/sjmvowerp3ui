"use client";

import React from "react";
import type { TransactionLineColumn } from "@/components/ui/transaction";
import { SearchableSelect } from "@/components/ui/transaction";
import TextField from "@mui/material/TextField";
import type { EditableLineItem, Option, InwardLabelResolvers } from "../types/inwardTypes";

type UseInwardLineItemColumnsParams = {
	canEdit: boolean;
	itemGroupOptions: readonly Option[];
	itemGroupLoading: Partial<Record<string, boolean>>;
	labelResolvers: InwardLabelResolvers;
	getItemOptions: (groupId: string) => readonly Option[];
	getMakeOptions: (groupId: string) => readonly Option[];
	getUomOptions: (groupId: string, itemId: string) => readonly Option[];
	handleLineFieldChange: (id: string, field: keyof EditableLineItem, value: string) => void;
};

/**
 * Hook to generate column definitions for inward line items table.
 */
export const useInwardLineItemColumns = ({
	canEdit,
	itemGroupOptions,
	itemGroupLoading,
	labelResolvers,
	getItemOptions,
	getMakeOptions,
	getUomOptions,
	handleLineFieldChange,
}: UseInwardLineItemColumnsParams): TransactionLineColumn<EditableLineItem>[] => {
	return React.useMemo(
		() => [
			// PO No column (read-only, shows source PO)
			{
				id: "poNo",
				header: "PO No.",
				width: "1fr",
				minWidth: "100px",
				renderCell: ({ item }) => (
					<span className="text-sm text-muted-foreground">{item.poNo || "-"}</span>
				),
				getTooltip: ({ item }) => item.poNo || undefined,
			},
			// Item Group column
			{
				id: "itemGroup",
				header: "Item Group",
				width: "1.75fr",
				minWidth: "175px",
				renderCell: ({ item }) => {
					if (!canEdit) {
						return (
							<span className="text-sm">{labelResolvers.itemGroup(item.itemGroup)}</span>
						);
					}
					const isLoading = Boolean(item.itemGroup && itemGroupLoading[item.itemGroup]);
					const value = itemGroupOptions.find((opt) => opt.value === item.itemGroup) ?? null;
					return (
						<SearchableSelect
							options={[...itemGroupOptions]}
							value={value}
							onChange={(next) => handleLineFieldChange(item.id, "itemGroup", next?.value ?? "")}
							getOptionLabel={(opt) => opt.label}
							isOptionEqualToValue={(a, b) => a.value === b.value}
							placeholder={isLoading ? "Loading..." : "Select group"}
							disabled={isLoading}
						/>
					);
				},
				getTooltip: ({ item }) => labelResolvers.itemGroup(item.itemGroup) || undefined,
			},
			// Item column
			{
				id: "item",
				header: "Item",
				width: "2.4fr",
				minWidth: "225px",
				renderCell: ({ item }) => {
					if (!canEdit) {
						const label = labelResolvers.item(item.itemGroup, item.item);
						return <span className="text-sm">{label || item.itemCode || "-"}</span>;
					}
					const options = getItemOptions(item.itemGroup);
					const value = options.find((opt) => opt.value === item.item) ?? null;
					return (
						<SearchableSelect
							options={[...options]}
							value={value}
							onChange={(next) => handleLineFieldChange(item.id, "item", next?.value ?? "")}
							getOptionLabel={(opt) => opt.label}
							isOptionEqualToValue={(a, b) => a.value === b.value}
							placeholder="Select item"
							disabled={!item.itemGroup}
						/>
					);
				},
				getTooltip: ({ item }) =>
					labelResolvers.item(item.itemGroup, item.item) || item.itemCode || undefined,
			},
			// Quantity column
			{
				id: "quantity",
				header: "Qty",
				width: "0.8fr",
				minWidth: "70px",
				renderCell: ({ item }) => {
					if (!canEdit) {
						return <span className="text-sm text-right w-full block">{item.quantity || "-"}</span>;
					}
					return (
						<TextField
							size="small"
							type="number"
							value={item.quantity}
							onChange={(e) => handleLineFieldChange(item.id, "quantity", e.target.value)}
							inputProps={{ min: 0, step: 1, className: "text-right text-sm" }}
							sx={{ "& .MuiInputBase-input": { padding: "4px 8px" } }}
							fullWidth
						/>
					);
				},
				getTooltip: ({ item }) => {
					if (item.orderedQty != null && item.receivedQty != null) {
						const pending = item.orderedQty - item.receivedQty;
						return `Ordered: ${item.orderedQty}, Received: ${item.receivedQty}, Pending: ${pending}`;
					}
					return undefined;
				},
			},
			// UOM column
			{
				id: "uom",
				header: "UOM",
				width: "0.8fr",
				minWidth: "80px",
				renderCell: ({ item }) => {
					if (!canEdit) {
						return (
							<span className="text-sm">
								{labelResolvers.uom(item.itemGroup, item.item, item.uom)}
							</span>
						);
					}
					const options = getUomOptions(item.itemGroup, item.item);
					const value = options.find((opt) => opt.value === item.uom) ?? null;
					return (
						<SearchableSelect
							options={[...options]}
							value={value}
							onChange={(next) => handleLineFieldChange(item.id, "uom", next?.value ?? "")}
							getOptionLabel={(opt) => opt.label}
							isOptionEqualToValue={(a, b) => a.value === b.value}
							placeholder="UOM"
							disabled={!item.item}
						/>
					);
				},
				getTooltip: ({ item }) =>
					labelResolvers.uom(item.itemGroup, item.item, item.uom) || undefined,
			},
			// Remarks column
			{
				id: "remarks",
				header: "Remarks",
				width: "1.2fr",
				minWidth: "120px",
				renderCell: ({ item }) => {
					if (!canEdit) {
						return <span className="text-sm">{item.remarks || "-"}</span>;
					}
					return (
						<TextField
							size="small"
							value={item.remarks}
							onChange={(e) => handleLineFieldChange(item.id, "remarks", e.target.value)}
							placeholder="Remarks"
							sx={{ "& .MuiInputBase-input": { padding: "4px 8px", fontSize: "0.875rem" } }}
							fullWidth
						/>
					);
				},
				getTooltip: ({ item }) => item.remarks || undefined,
			},
		],
		[
			canEdit,
			itemGroupOptions,
			itemGroupLoading,
			labelResolvers,
			getItemOptions,
			getMakeOptions,
			getUomOptions,
			handleLineFieldChange,
		]
	);
};
