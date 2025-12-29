"use client";

import * as React from "react";
import { Box, TextField, Typography } from "@mui/material";
import type { TransactionLineColumn } from "@/components/ui/transaction";
import type { SRLineItem } from "../types/srTypes";

/**
 * Format currency for display.
 */
const formatCurrency = (value?: number): string => {
	if (value === undefined || value === null) return "₹0.00";
	return new Intl.NumberFormat("en-IN", {
		style: "currency",
		currency: "INR",
		minimumFractionDigits: 2,
	}).format(value);
};

/**
 * Editable number cell component for rate editing.
 */
type EditableNumberCellProps = {
	initialValue: number;
	disabled: boolean;
	onCommit: (value: number) => void;
};

const EditableNumberCell: React.FC<EditableNumberCellProps> = ({
	initialValue,
	disabled,
	onCommit,
}) => {
	const [localValue, setLocalValue] = React.useState<string>(String(initialValue));

	React.useEffect(() => {
		setLocalValue(String(initialValue));
	}, [initialValue]);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const val = e.target.value;
		setLocalValue(val);
		const numVal = Number(val) || 0;
		if (numVal >= 0) {
			onCommit(numVal);
		}
	};

	return (
		<TextField
			type="number"
			size="small"
			variant="outlined"
			value={localValue}
			disabled={disabled}
			onChange={handleChange}
			inputProps={{ min: 0, step: 0.01 }}
			sx={{ width: 100 }}
		/>
	);
};

type UseSRLineItemColumnsParams = {
	canEdit: boolean;
	onLineItemChange: (id: string, field: keyof SRLineItem, value: unknown) => void;
};

/**
 * Returns column definitions for SR line items.
 */
export const useSRLineItemColumns = ({
	canEdit,
	onLineItemChange,
}: UseSRLineItemColumnsParams): TransactionLineColumn<SRLineItem>[] => {
	return React.useMemo(
		() => [
			{
				id: "item_grp_name",
				header: "Item Group",
				width: "1fr",
				renderCell: ({ item }) => (
					<Typography variant="body2" className="truncate">
						{item.item_grp_name || "-"}
					</Typography>
				),
				getTooltip: ({ item }) => item.item_grp_name || undefined,
			},
			{
				id: "item_name",
				header: "Item",
				width: "1.5fr",
				renderCell: ({ item }) => (
					<Typography variant="body2" className="truncate">
						{item.item_name || "-"}
					</Typography>
				),
				getTooltip: ({ item }) => item.item_name || undefined,
			},
			{
				id: "accepted_item_make_name",
				header: "Make",
				width: "0.8fr",
				renderCell: ({ item }) => (
					<Typography variant="body2" className="truncate">
						{item.accepted_item_make_name || "-"}
					</Typography>
				),
			},
			{
				id: "uom_name",
				header: "UOM",
				width: "0.5fr",
				renderCell: ({ item }) => (
					<Typography variant="body2">{item.uom_name || "-"}</Typography>
				),
			},
			{
				id: "approved_qty",
				header: "Qty",
				width: "0.5fr",
				renderCell: ({ item }) => (
					<Typography variant="body2" className="text-right">
						{item.approved_qty}
					</Typography>
				),
			},
			{
				id: "po_rate",
				header: "PO Rate",
				width: "0.8fr",
				renderCell: ({ item }) => (
					<Typography variant="body2" color="text.secondary" className="text-right">
						{formatCurrency(item.po_rate)}
					</Typography>
				),
			},
			{
				id: "accepted_rate",
				header: "Accept Rate",
				width: "1fr",
				renderCell: ({ item }) => (
					<EditableNumberCell
						initialValue={item.accepted_rate}
						disabled={!canEdit}
						onCommit={(val) => onLineItemChange(item.id, "accepted_rate", val)}
					/>
				),
			},
			{
				id: "amount",
				header: "Amount",
				width: "0.9fr",
				renderCell: ({ item }) => (
					<Typography variant="body2" className="text-right">
						{formatCurrency(item.amount)}
					</Typography>
				),
			},
			{
				id: "tax_percentage",
				header: "Tax %",
				width: "0.5fr",
				renderCell: ({ item }) => (
					<Typography variant="body2" className="text-right">
						{item.tax_percentage}%
					</Typography>
				),
			},
			{
				id: "tax_amount",
				header: "Tax Amt",
				width: "0.8fr",
				renderCell: ({ item }) => (
					<Typography variant="body2" className="text-right">
						{formatCurrency(item.tax_amount)}
					</Typography>
				),
			},
			{
				id: "total_amount",
				header: "Total",
				width: "0.9fr",
				renderCell: ({ item }) => (
					<Typography variant="body2" fontWeight={600} color="primary" className="text-right">
						{formatCurrency(item.total_amount)}
					</Typography>
				),
			},
		],
		[canEdit, onLineItemChange],
	);
};
