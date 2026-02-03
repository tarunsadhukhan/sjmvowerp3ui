"use client";

import * as React from "react";
import { Autocomplete, TextField, Typography } from "@mui/material";
import type { TransactionLineColumn } from "@/components/ui/transaction";
import type { SRLineItem, WarehouseOption } from "../types/srTypes";

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
			sx={{ width: "100%" }}
		/>
	);
};

type UseSRLineItemColumnsParams = {
	canEdit: boolean;
	onLineItemChange: (id: string, field: keyof SRLineItem, value: unknown) => void;
	warehouseOptions: WarehouseOption[];
};

/**
 * Returns column definitions for SR line items.
 */
export const useSRLineItemColumns = ({
	canEdit,
	onLineItemChange,
	warehouseOptions,
}: UseSRLineItemColumnsParams): TransactionLineColumn<SRLineItem>[] => {
	// Build warehouse label map for display
	const warehouseLabelMap = React.useMemo(() => {
		const map: Record<string, string> = {};
		for (const opt of warehouseOptions) {
			map[opt.value] = opt.label;
		}
		return map;
	}, [warehouseOptions]);

	return React.useMemo(
		() => [
			{
				id: "item_grp_name",
				header: "Item Group",
				width: "1fr",
				renderCell: ({ item }) => (
					<Typography variant="body2" noWrap title={item.item_grp_name || undefined}>
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
					<Typography variant="body2" noWrap title={item.item_name || undefined}>
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
					<Typography variant="body2" noWrap title={item.accepted_item_make_name || undefined}>
						{item.accepted_item_make_name || "-"}
					</Typography>
				),
				getTooltip: ({ item }) => item.accepted_item_make_name || undefined,
			},
			{
				id: "uom_name",
				header: "UOM",
				width: "60px",
				renderCell: ({ item }) => (
					<Typography variant="body2" noWrap>{item.uom_name || "-"}</Typography>
				),
			},
			{
				id: "approved_qty",
				header: "Qty",
				width: "60px",
				renderCell: ({ item }) => (
					<Typography variant="body2" noWrap sx={{ textAlign: "right", width: "100%" }}>
						{item.approved_qty}
					</Typography>
				),
			},
			{
				id: "po_rate",
				header: "PO Rate",
				width: "90px",
				renderCell: ({ item }) => (
					<Typography variant="body2" color="text.secondary" noWrap sx={{ textAlign: "right", width: "100%" }}>
						{formatCurrency(item.po_rate)}
					</Typography>
				),
			},
			{
				id: "accepted_rate",
				header: "Accept Rate",
				width: "100px",
				renderCell: ({ item }) => (
					<EditableNumberCell
						initialValue={item.accepted_rate}
						disabled={!canEdit}
						onCommit={(val) => onLineItemChange(item.id, "accepted_rate", val)}
					/>
				),
			},
			{
				id: "warehouse_id",
				header: "Warehouse *",
				width: "140px",
				renderCell: ({ item }) => {
					if (!canEdit) {
						const warehouseLabel = item.warehouse_id ? warehouseLabelMap[String(item.warehouse_id)] || item.warehouse_name : "-";
						return (
							<Typography variant="body2" noWrap>
								{warehouseLabel}
							</Typography>
						);
					}

					const selectedOption = warehouseOptions.find(
						(opt) => String(opt.value) === String(item.warehouse_id)
					) ?? null;

					return (
						<Autocomplete
							size="small"
							options={warehouseOptions}
							value={selectedOption}
							onChange={(_, newValue) => {
								onLineItemChange(item.id, "warehouse_id", newValue ? Number(newValue.value) : null);
							}}
							getOptionLabel={(opt) => opt.label}
							isOptionEqualToValue={(opt, val) => opt.value === val.value}
							renderOption={(props, option) => {
								const { key, ...rest } = props;
								return (
									<li key={`wh-${option.value}-${item.id}`} {...rest}>
										{option.label}
									</li>
								);
							}}
							renderInput={(params) => (
								<TextField
									{...params}
									placeholder="Select warehouse"
									variant="outlined"
									size="small"
									error={item.warehouse_id === null || item.warehouse_id === undefined}
								/>
							)}
							sx={{ width: "100%" }}
						/>
					);
				},
				getTooltip: ({ item }) => {
					if (item.warehouse_id) {
						return warehouseLabelMap[String(item.warehouse_id)] || item.warehouse_name || undefined;
					}
					return "Warehouse is required";
				},
			},
			{
				id: "amount",
				header: "Amount",
				width: "90px",
				renderCell: ({ item }) => (
					<Typography variant="body2" noWrap sx={{ textAlign: "right", width: "100%" }}>
						{formatCurrency(item.amount)}
					</Typography>
				),
			},
			{
				id: "tax_percentage",
				header: "Tax %",
				width: "60px",
				renderCell: ({ item }) => (
					<Typography variant="body2" noWrap sx={{ textAlign: "right", width: "100%" }}>
						{item.tax_percentage}%
					</Typography>
				),
			},
			{
				id: "tax_amount",
				header: "Tax Amt",
				width: "80px",
				renderCell: ({ item }) => (
					<Typography variant="body2" noWrap sx={{ textAlign: "right", width: "100%" }}>
						{formatCurrency(item.tax_amount)}
					</Typography>
				),
			},
			{
				id: "total_amount",
				header: "Total",
				width: "90px",
				renderCell: ({ item }) => (
					<Typography variant="body2" fontWeight={600} color="primary" noWrap sx={{ textAlign: "right", width: "100%" }}>
						{formatCurrency(item.total_amount)}
					</Typography>
				),
			},
		],
		[canEdit, onLineItemChange, warehouseOptions, warehouseLabelMap],
	);
};
