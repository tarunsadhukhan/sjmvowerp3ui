import React from "react";
import { SearchableSelect } from "@/components/ui/transaction";
import { Input } from "@/components/ui/input";
import type { TransactionLineColumn } from "@/components/ui/transaction";
import type { EditableLineItem, Option, UomConversionEntry } from "../types/salesOrderTypes";
import { computeConvertedRate } from "@/utils/uomConversion";

type UseSalesOrderLineItemColumnsParams = {
	canEdit: boolean;
	invoiceTypeId?: string;
	itemGroupOptions: Option[];
	itemGroupLoading: Partial<Record<string, boolean>>;
	getItemOptions: (groupId: string) => Option[];
	getMakeOptions: (groupId: string) => Option[];
	getUomOptions: (groupId: string, itemId: string) => Option[];
	getUomConversions?: (groupId: string, itemId: string) => UomConversionEntry[] | undefined;
	getItemGroupLabel: (groupId: string) => string;
	handleLineFieldChange: (id: string, field: keyof EditableLineItem, value: string | number) => void;
};

export const useSalesOrderLineItemColumns = ({
	canEdit,
	invoiceTypeId,
	itemGroupOptions,
	itemGroupLoading,
	getItemOptions,
	getMakeOptions,
	getUomOptions,
	getUomConversions,
	getItemGroupLabel,
	handleLineFieldChange,
}: UseSalesOrderLineItemColumnsParams): TransactionLineColumn<EditableLineItem>[] =>
	React.useMemo(
		() => [
			{
				id: "itemGroup",
				header: "Item Group",
				width: "1.5fr",
				minWidth: "163px",
				renderCell: ({ item }) => {
					const label = getItemGroupLabel(item.itemGroup);
					if (!canEdit) {
						return <span className="block truncate text-sm">{label || "-"}</span>;
					}
					const value = itemGroupOptions.find((o) => o.value === item.itemGroup) ?? null;
					return (
						<SearchableSelect<Option>
							options={itemGroupOptions}
							value={value}
							onChange={(next) => handleLineFieldChange(item.id, "itemGroup", next?.value ?? "")}
							getOptionLabel={(o) => o.label}
							isOptionEqualToValue={(a, b) => a.value === b.value}
							placeholder="Select group"
						/>
					);
				},
				getTooltip: ({ item }) => getItemGroupLabel(item.itemGroup) || undefined,
			},
			{
				id: "item",
				header: "Item",
				width: "2.25fr",
				minWidth: "225px",
				renderCell: ({ item }) => {
					const options = getItemOptions(item.itemGroup);
					const label = options.find((o) => o.value === item.item)?.label ?? item.item ?? "-";
					if (!canEdit) {
						return <span className="block truncate text-sm">{label}</span>;
					}
					const value = options.find((o) => o.value === item.item) ?? null;
					return (
						<SearchableSelect<Option>
							options={options}
							value={value}
							onChange={(next) => handleLineFieldChange(item.id, "item", next?.value ?? "")}
							getOptionLabel={(o) => o.label}
							isOptionEqualToValue={(a, b) => a.value === b.value}
							placeholder="Select item"
						/>
					);
				},
			},
			{
				id: "itemMake",
				header: "Make",
				width: "1fr",
				minWidth: "130px",
				renderCell: ({ item }) => {
					const options = getMakeOptions(item.itemGroup);
					const label = options.find((o) => o.value === item.itemMake)?.label ?? item.itemMake ?? "-";
					if (!canEdit) {
						return <span className="block truncate text-sm">{label}</span>;
					}
					const value = options.find((o) => o.value === item.itemMake) ?? null;
					return (
						<SearchableSelect<Option>
							options={options}
							value={value}
							onChange={(next) => handleLineFieldChange(item.id, "itemMake", next?.value ?? "")}
							getOptionLabel={(o) => o.label}
							isOptionEqualToValue={(a, b) => a.value === b.value}
							placeholder="Make"
						/>
					);
				},
			},
			{
				id: "quantity",
				header: "Qty",
				width: "0.8fr",
				minWidth: "80px",
				renderCell: ({ item }) =>
					canEdit ? (
						<Input
							type="text"
							value={item.quantity}
							onChange={(e) => handleLineFieldChange(item.id, "quantity", e.target.value)}
							placeholder="0"
							className="h-8 text-sm"
						/>
					) : (
						<span className="block truncate text-sm">{item.quantity || "-"}</span>
					),
				getTooltip: ({ item }) => (item.quantity ? `Quantity: ${item.quantity}` : undefined),
			},
			{
				id: "uom",
				header: "UOM",
				width: "0.6fr",
				minWidth: "80px",
				renderCell: ({ item }) => {
					const options = getUomOptions(item.itemGroup, item.item);
					const label = options.find((o) => o.value === item.uom)?.label ?? item.uom ?? "-";
					if (!canEdit) {
						return <span className="block truncate text-sm">{label || "-"}</span>;
					}
					const value = options.find((o) => o.value === item.uom) ?? null;
					return (
						<SearchableSelect<Option>
							options={options}
							value={value}
							onChange={(next) => handleLineFieldChange(item.id, "uom", next?.value ?? "")}
							getOptionLabel={(o) => o.label}
							isOptionEqualToValue={(a, b) => a.value === b.value}
							placeholder="UOM"
						/>
					);
				},
			},
			{
				id: "rate",
				header: "Rate",
				width: "0.8fr",
				minWidth: "80px",
				renderCell: ({ item }) => {
					const showConversion = invoiceTypeId === "2";
					const conversion = showConversion && getUomConversions
						? computeConvertedRate(item.rate, item.uom, getUomConversions(item.itemGroup, item.item))
						: null;

					if (canEdit) {
						return (
							<div className="flex flex-col gap-0.5">
								<Input
									type="text"
									value={item.rate}
									onChange={(e) => handleLineFieldChange(item.id, "rate", e.target.value)}
									placeholder="0.00"
									className="h-8 text-sm"
								/>
								{conversion ? (
									<span className="text-[11px] text-muted-foreground leading-tight truncate">
										{"\u2248"} {conversion.convertedRate} / {conversion.otherUomName}
									</span>
								) : null}
							</div>
						);
					}

					return (
						<div className="flex flex-col gap-0.5">
							<span className="block truncate text-sm">{item.rate || "-"}</span>
							{conversion ? (
								<span className="text-[11px] text-muted-foreground leading-tight truncate">
									{"\u2248"} {conversion.convertedRate} / {conversion.otherUomName}
								</span>
							) : null}
						</div>
					);
				},
				getTooltip: ({ item }) => {
					const showConversion = invoiceTypeId === "2";
					const conversion = showConversion && getUomConversions
						? computeConvertedRate(item.rate, item.uom, getUomConversions(item.itemGroup, item.item))
						: null;
					const parts: string[] = [];
					if (item.rate) parts.push(`Rate: ${item.rate}`);
					if (conversion) parts.push(`\u2248 ${conversion.convertedRate} / ${conversion.otherUomName}`);
					return parts.length ? parts.join("\n") : undefined;
				},
			},
			{
				id: "amount",
				header: "Amount",
				width: "0.8fr",
				minWidth: "90px",
				renderCell: ({ item }) => (
					<span className="block truncate text-sm font-medium">{item.amount != null ? item.amount.toFixed(2) : "-"}</span>
				),
				getTooltip: ({ item }) => (item.amount ? `Amount: ${item.amount.toFixed(2)}` : undefined),
			},
			{
				id: "taxAmount",
				header: "GST",
				width: "0.7fr",
				minWidth: "80px",
				renderCell: ({ item }) => (
					<span className="block truncate text-sm">{item.taxAmount != null ? item.taxAmount.toFixed(2) : "-"}</span>
				),
				getTooltip: ({ item }) => (item.taxAmount ? `GST: ${item.taxAmount.toFixed(2)}` : undefined),
			},
			{
				id: "remarks",
				header: "Remarks",
				width: "1fr",
				minWidth: "100px",
				renderCell: ({ item }) =>
					canEdit ? (
						<Input
							type="text"
							value={item.remarks}
							onChange={(e) => handleLineFieldChange(item.id, "remarks", e.target.value)}
							placeholder="Remarks"
							className="h-8 text-sm"
						/>
					) : (
						<span className="block truncate text-sm">{item.remarks || "-"}</span>
					),
			},
		],
		[canEdit, invoiceTypeId, itemGroupOptions, itemGroupLoading, getItemOptions, getMakeOptions, getUomOptions, getUomConversions, getItemGroupLabel, handleLineFieldChange],
	);
