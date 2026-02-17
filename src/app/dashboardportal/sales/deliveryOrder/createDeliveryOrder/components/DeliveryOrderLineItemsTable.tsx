import React from "react";
import { SearchableSelect } from "@/components/ui/transaction";
import { Input } from "@/components/ui/input";
import type { TransactionLineColumn } from "@/components/ui/transaction";
import type { EditableLineItem, Option } from "../types/deliveryOrderTypes";
import { DISCOUNT_TYPE } from "../utils/deliveryOrderConstants";

const DISCOUNT_TYPE_OPTIONS: Option[] = [
	{ label: "None", value: "" },
	{ label: "%", value: String(DISCOUNT_TYPE.PERCENTAGE) },
	{ label: "Amount", value: String(DISCOUNT_TYPE.AMOUNT) },
];

type UseDOLineItemColumnsParams = {
	canEdit: boolean;
	itemGroupOptions: Option[];
	getItemGroupLabel: (groupId: string) => string;
	getItemOptions: (groupId: string) => Option[];
	getItemLabel: (groupId: string, itemId: string, itemCode?: string) => string;
	getUomOptions: (groupId: string, itemId: string) => Option[];
	getUomLabel: (groupId: string, itemId: string, uomId: string) => string;
	onFieldChange: (id: string, field: keyof EditableLineItem, value: string | number) => void;
};

export const useDOLineItemColumns = ({
	canEdit,
	itemGroupOptions,
	getItemGroupLabel,
	getItemOptions,
	getItemLabel,
	getUomOptions,
	getUomLabel,
	onFieldChange,
}: UseDOLineItemColumnsParams): TransactionLineColumn<EditableLineItem>[] =>
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
							onChange={(next) => onFieldChange(item.id, "itemGroup", next?.value ?? "")}
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
				width: "2fr",
				minWidth: "200px",
				renderCell: ({ item }) => {
					const label = getItemLabel(item.itemGroup, item.item, item.itemCode);
					if (!canEdit) {
						return <span className="block truncate text-sm">{label}</span>;
					}
					const options = getItemOptions(item.itemGroup);
					const value = options.find((o) => o.value === item.item) ?? null;
					return (
						<SearchableSelect<Option>
							options={options}
							value={value}
							onChange={(next) => onFieldChange(item.id, "item", next?.value ?? "")}
							getOptionLabel={(o) => o.label}
							isOptionEqualToValue={(a, b) => a.value === b.value}
							placeholder="Select item"
						/>
					);
				},
				getTooltip: ({ item }) => getItemLabel(item.itemGroup, item.item, item.itemCode) || undefined,
			},
			{
				id: "rate",
				header: "Rate",
				width: "0.8fr",
				minWidth: "80px",
				renderCell: ({ item }) =>
					canEdit ? (
						<Input
							type="text"
							value={item.rate}
							onChange={(e) => onFieldChange(item.id, "rate", e.target.value)}
							placeholder="0.00"
							className="h-8 text-sm"
						/>
					) : (
						<span className="block truncate text-sm">{item.rate || "-"}</span>
					),
				getTooltip: ({ item }) => (item.rate ? `Rate: ${item.rate}` : undefined),
			},
			{
				id: "quantity",
				header: "Quantity",
				width: "0.8fr",
				minWidth: "80px",
				renderCell: ({ item }) =>
					canEdit ? (
						<Input
							type="text"
							value={item.quantity}
							onChange={(e) => onFieldChange(item.id, "quantity", e.target.value)}
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
				header: "Unit",
				width: "0.6fr",
				minWidth: "80px",
				renderCell: ({ item }) => {
					const options = getUomOptions(item.itemGroup, item.item);
					const label = getUomLabel(item.itemGroup, item.item, item.uom);
					if (!canEdit) {
						return <span className="block truncate text-sm">{label || "-"}</span>;
					}
					const value = options.find((o) => o.value === item.uom) ?? null;
					return (
						<SearchableSelect<Option>
							options={options}
							value={value}
							onChange={(next) => onFieldChange(item.id, "uom", next?.value ?? "")}
							getOptionLabel={(o) => o.label}
							isOptionEqualToValue={(a, b) => a.value === b.value}
							placeholder="UOM"
						/>
					);
				},
				getTooltip: ({ item }) => getUomLabel(item.itemGroup, item.item, item.uom) || undefined,
			},
			{
				id: "discountType",
				header: "Disc. Type",
				width: "0.7fr",
				minWidth: "90px",
				renderCell: ({ item }) => {
					const currentVal = item.discountType != null ? String(item.discountType) : "";
					const label = DISCOUNT_TYPE_OPTIONS.find((o) => o.value === currentVal)?.label || "-";
					if (!canEdit) {
						return <span className="block truncate text-sm">{label}</span>;
					}
					const value = DISCOUNT_TYPE_OPTIONS.find((o) => o.value === currentVal) ?? DISCOUNT_TYPE_OPTIONS[0];
					return (
						<SearchableSelect<Option>
							options={DISCOUNT_TYPE_OPTIONS}
							value={value}
							onChange={(next) => onFieldChange(item.id, "discountType", next?.value ?? "")}
							getOptionLabel={(o) => o.label}
							isOptionEqualToValue={(a, b) => a.value === b.value}
							placeholder="Type"
						/>
					);
				},
				getTooltip: ({ item }) => {
					const currentVal = item.discountType != null ? String(item.discountType) : "";
					const label = DISCOUNT_TYPE_OPTIONS.find((o) => o.value === currentVal)?.label;
					return label && label !== "None" ? `Discount Type: ${label}` : undefined;
				},
			},
			{
				id: "discountedRate",
				header: "Disc. Rate",
				width: "0.7fr",
				minWidth: "80px",
				renderCell: ({ item }) => {
					const hasDiscountType = item.discountType != null && item.discountType !== 0;
					if (!canEdit) {
						return <span className="block truncate text-sm">{item.discountedRate?.toFixed(2) || "-"}</span>;
					}
					return (
						<Input
							type="text"
							value={item.discountedRate ?? ""}
							onChange={(e) => onFieldChange(item.id, "discountedRate", e.target.value)}
							placeholder="0"
							className="h-8 text-sm"
							disabled={!hasDiscountType}
						/>
					);
				},
				getTooltip: ({ item }) => (item.discountedRate ? `Discounted Rate: ${item.discountedRate.toFixed(2)}` : undefined),
			},
			{
				id: "discountAmount",
				header: "Disc. Amt",
				width: "0.7fr",
				minWidth: "80px",
				renderCell: ({ item }) => (
					<span className="block truncate text-sm">{item.discountAmount?.toFixed(2) || "0.00"}</span>
				),
				getTooltip: ({ item }) => (item.discountAmount ? `Discount Amount: ${item.discountAmount.toFixed(2)}` : undefined),
			},
			{
				id: "netAmount",
				header: "Amount",
				width: "0.8fr",
				minWidth: "90px",
				renderCell: ({ item }) => <span className="block truncate text-sm font-medium">{item.netAmount?.toFixed(2) || "0.00"}</span>,
				getTooltip: ({ item }) => (item.netAmount ? `Amount: ${item.netAmount.toFixed(2)}` : undefined),
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
							onChange={(e) => onFieldChange(item.id, "remarks", e.target.value)}
							placeholder=""
							className="h-8 text-sm"
						/>
					) : (
						<span className="block truncate text-sm">{item.remarks || "-"}</span>
					),
				getTooltip: ({ item }) => (item.remarks ? item.remarks : undefined),
			},
		],
		[canEdit, itemGroupOptions, getItemGroupLabel, getItemOptions, getItemLabel, getUomOptions, getUomLabel, onFieldChange],
	);

export default useDOLineItemColumns;
