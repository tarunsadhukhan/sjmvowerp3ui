/**
 * @file useGateEntryLineItemColumns.tsx
 * @description Hook for generating line item column definitions.
 */

import * as React from "react";
import { SearchableSelect } from "@/components/ui/transaction";
import { TextField } from "@mui/material";
import type { TransactionLineColumn } from "@/components/ui/transaction";
import type { GateEntryLineItem, Option, JuteItemRecord, JuteQualityRecord } from "../types/gateEntryTypes";

type UseGateEntryLineItemColumnsParams = {
	canEdit: boolean;
	juteItems: JuteItemRecord[];
	qualitiesByItem: Record<string, JuteQualityRecord[]>;
	handleLineFieldChange: (id: string, field: keyof GateEntryLineItem, value: string) => void;
	getItemLabel: (itemId: string) => string;
	getQualityLabel: (qualityId: string) => string;
};

export function useGateEntryLineItemColumns({
	canEdit,
	juteItems,
	qualitiesByItem,
	handleLineFieldChange,
	getItemLabel,
	getQualityLabel,
}: UseGateEntryLineItemColumnsParams): TransactionLineColumn<GateEntryLineItem>[] {
	// Build item options
	const itemOptions = React.useMemo<Option[]>(
		() =>
			juteItems.map((i) => ({
				label: i.item_name,
				value: String(i.item_id),
			})),
		[juteItems]
	);

	// Get quality options for a specific item
	const getQualityOptions = React.useCallback(
		(itemId: string): Option[] => {
			const qualities = qualitiesByItem[itemId] ?? [];
			return qualities.map((q) => ({
				label: q.quality_name,
				value: String(q.quality_id),
			}));
		},
		[qualitiesByItem]
	);

	return React.useMemo(
		(): TransactionLineColumn<GateEntryLineItem>[] => [
			// Challan columns
			{
				id: "challanItem",
				header: "Challan Item",
				width: "1.2fr",
				renderCell: ({ item }) => {
					if (!canEdit) {
						return <span className="text-xs">{getItemLabel(item.challanItem)}</span>;
					}
					const value = itemOptions.find((opt) => opt.value === item.challanItem) ?? null;
					return (
						<SearchableSelect
							options={itemOptions}
							value={value}
							onChange={(next) =>
								handleLineFieldChange(item.id, "challanItem", next?.value ?? "")
							}
							getOptionLabel={(opt) => opt.label}
							isOptionEqualToValue={(a, b) => a.value === b.value}
							placeholder="Select item"
						/>
					);
				},
				getTooltip: ({ item }) => getItemLabel(item.challanItem) || undefined,
			},
			{
				id: "challanQuality",
				header: "Challan Quality",
				width: "1.2fr",
				renderCell: ({ item }) => {
					if (!canEdit) {
						return <span className="text-xs">{getQualityLabel(item.challanQuality)}</span>;
					}
					const qualityOpts = getQualityOptions(item.challanItem);
					const value = qualityOpts.find((opt) => opt.value === item.challanQuality) ?? null;
					return (
						<SearchableSelect
							options={qualityOpts}
							value={value}
							onChange={(next) =>
								handleLineFieldChange(item.id, "challanQuality", next?.value ?? "")
							}
							getOptionLabel={(opt) => opt.label}
							isOptionEqualToValue={(a, b) => a.value === b.value}
							placeholder={item.challanItem ? "Select quality" : "Select item first"}
							disabled={!item.challanItem}
						/>
					);
				},
				getTooltip: ({ item }) => getQualityLabel(item.challanQuality) || undefined,
			},
			{
				id: "challanQty",
				header: "Challan Qty",
				width: "0.8fr",
				renderCell: ({ item }) => {
					if (!canEdit) {
						return <span className="text-xs">{item.challanQty || "-"}</span>;
					}
					return (
						<TextField
							type="number"
							size="small"
							value={item.challanQty}
							onChange={(e) =>
								handleLineFieldChange(item.id, "challanQty", e.target.value)
							}
							placeholder="Qty"
							inputProps={{ min: 0, step: 0.01 }}
							sx={{ "& .MuiInputBase-input": { fontSize: "0.75rem", py: 0.5 } }}
							fullWidth
						/>
					);
				},
			},
			{
				id: "challanWeight",
				header: "Challan Wt",
				width: "0.8fr",
				renderCell: ({ item }) => (
					<span className="text-xs text-slate-600">
						{item.challanWeight ? parseFloat(item.challanWeight).toFixed(2) : "-"}
					</span>
				),
			},

			// Actual columns
			{
				id: "actualItem",
				header: "Actual Item",
				width: "1.2fr",
				renderCell: ({ item }) => {
					if (!canEdit) {
						return <span className="text-xs">{getItemLabel(item.actualItem)}</span>;
					}
					const value = itemOptions.find((opt) => opt.value === item.actualItem) ?? null;
					return (
						<SearchableSelect
							options={itemOptions}
							value={value}
							onChange={(next) =>
								handleLineFieldChange(item.id, "actualItem", next?.value ?? "")
							}
							getOptionLabel={(opt) => opt.label}
							isOptionEqualToValue={(a, b) => a.value === b.value}
							placeholder="Select item"
						/>
					);
				},
				getTooltip: ({ item }) => getItemLabel(item.actualItem) || undefined,
			},
			{
				id: "actualQuality",
				header: "Actual Quality",
				width: "1.2fr",
				renderCell: ({ item }) => {
					if (!canEdit) {
						return <span className="text-xs">{getQualityLabel(item.actualQuality)}</span>;
					}
					const qualityOpts = getQualityOptions(item.actualItem);
					const value = qualityOpts.find((opt) => opt.value === item.actualQuality) ?? null;
					return (
						<SearchableSelect
							options={qualityOpts}
							value={value}
							onChange={(next) =>
								handleLineFieldChange(item.id, "actualQuality", next?.value ?? "")
							}
							getOptionLabel={(opt) => opt.label}
							isOptionEqualToValue={(a, b) => a.value === b.value}
							placeholder={item.actualItem ? "Select quality" : "Select item first"}
							disabled={!item.actualItem}
						/>
					);
				},
				getTooltip: ({ item }) => getQualityLabel(item.actualQuality) || undefined,
			},
			{
				id: "actualQty",
				header: "Actual Qty",
				width: "0.8fr",
				renderCell: ({ item }) => {
					if (!canEdit) {
						return <span className="text-xs">{item.actualQty || "-"}</span>;
					}
					return (
						<TextField
							type="number"
							size="small"
							value={item.actualQty}
							onChange={(e) =>
								handleLineFieldChange(item.id, "actualQty", e.target.value)
							}
							placeholder="Qty"
							inputProps={{ min: 0, step: 0.01 }}
							sx={{ "& .MuiInputBase-input": { fontSize: "0.75rem", py: 0.5 } }}
							fullWidth
						/>
					);
				},
			},
			{
				id: "actualWeight",
				header: "Actual Wt",
				width: "0.8fr",
				renderCell: ({ item }) => (
					<span className="text-xs text-slate-600">
						{item.actualWeight ? parseFloat(item.actualWeight).toFixed(2) : "-"}
					</span>
				),
			},
		],
		[
			canEdit,
			itemOptions,
			getQualityOptions,
			handleLineFieldChange,
			getItemLabel,
			getQualityLabel,
		]
	);
}
