"use client";

import React from "react";
import { Paper, Typography, IconButton, Tooltip } from "@mui/material";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchableSelect } from "@/components/ui/transaction";

export type AdditionalChargeRow = {
	id: string;
	additionalChargesId: string;
	chargeName: string;
	qty: string;
	rate: string;
	netAmount: string;
	remarks: string;
	gst?: {
		igstAmount?: number;
		igstPercent?: number;
		cgstAmount?: number;
		cgstPercent?: number;
		sgstAmount?: number;
		sgstPercent?: number;
		gstTotal?: number;
	};
};

type ChargeOption = {
	value: string;
	label: string;
	defaultValue?: number;
};

type Props = {
	charges: AdditionalChargeRow[];
	chargeOptions: ChargeOption[];
	onChange: (charges: AdditionalChargeRow[]) => void;
	disabled?: boolean;
};

let nextId = 1;
const genId = () => `charge_${Date.now()}_${nextId++}`;

export const AdditionalChargesSection: React.FC<Props> = ({
	charges,
	chargeOptions,
	onChange,
	disabled = false,
}) => {
	const handleAdd = () => {
		onChange([
			...charges,
			{
				id: genId(),
				additionalChargesId: "",
				chargeName: "",
				qty: "1",
				rate: "",
				netAmount: "",
				remarks: "",
			},
		]);
	};

	const handleRemove = (id: string) => {
		onChange(charges.filter((c) => c.id !== id));
	};

	const handleFieldChange = (id: string, field: keyof AdditionalChargeRow, value: string) => {
		onChange(
			charges.map((c) => {
				if (c.id !== id) return c;
				const updated = { ...c, [field]: value };

				// Auto-select charge name when additionalChargesId changes
				if (field === "additionalChargesId") {
					const opt = chargeOptions.find((o) => o.value === value);
					updated.chargeName = opt?.label ?? "";
				}

				// Auto-calculate net amount
				if (field === "qty" || field === "rate") {
					const qty = parseFloat(field === "qty" ? value : updated.qty) || 0;
					const rate = parseFloat(field === "rate" ? value : updated.rate) || 0;
					updated.netAmount = (qty * rate).toFixed(2);
				}

				return updated;
			}),
		);
	};

	const total = charges.reduce((sum, c) => sum + (parseFloat(c.netAmount) || 0), 0);

	const chargeSelectOptions = React.useMemo(
		() => chargeOptions.map((opt) => ({ value: opt.value, label: opt.label })),
		[chargeOptions],
	);

	return (
		<Paper variant="outlined" sx={{ p: 2 }}>
			<div className="flex items-center justify-between mb-2">
				<Typography variant="subtitle2">Additional Charges</Typography>
				{!disabled && (
					<Button type="button" variant="outline" size="sm" onClick={handleAdd}>
						+ Add Charge
					</Button>
				)}
			</div>

			{charges.length > 0 && (
				<>
					{/* Header row */}
					<div
						className="grid gap-2 text-xs font-medium text-muted-foreground pb-1 border-b"
						style={{ gridTemplateColumns: disabled ? "2fr 0.8fr 1fr 1fr 1.5fr" : "2fr 0.8fr 1fr 1fr 1.5fr 36px" }}
					>
						<span>Charge Type</span>
						<span className="text-right">Qty</span>
						<span className="text-right">Rate</span>
						<span className="text-right">Amount</span>
						<span>Remarks</span>
						{!disabled && <span />}
					</div>

					{/* Rows */}
					{charges.map((row) => (
						<div
							key={row.id}
							className="grid gap-2 items-center py-1 border-b border-border/50"
							style={{ gridTemplateColumns: disabled ? "2fr 0.8fr 1fr 1fr 1.5fr" : "2fr 0.8fr 1fr 1fr 1.5fr 36px" }}
						>
							<div>
								{disabled ? (
									<span className="block truncate text-sm">{row.chargeName || "-"}</span>
								) : (
									<SearchableSelect<{ value: string; label: string }>
										options={chargeSelectOptions}
										value={chargeSelectOptions.find((o) => o.value === row.additionalChargesId) ?? null}
										onChange={(next) =>
											handleFieldChange(row.id, "additionalChargesId", next?.value ?? "")
										}
										getOptionLabel={(o) => o.label}
										isOptionEqualToValue={(a, b) => a.value === b.value}
										placeholder="Select charge"
									/>
								)}
							</div>
							<div>
								{disabled ? (
									<span className="block text-sm text-right">{row.qty || "1"}</span>
								) : (
									<Input
										type="text"
										value={row.qty}
										onChange={(e) => handleFieldChange(row.id, "qty", e.target.value)}
										placeholder="1"
										className="h-8 text-sm text-right"
									/>
								)}
							</div>
							<div>
								{disabled ? (
									<span className="block text-sm text-right">{row.rate || "-"}</span>
								) : (
									<Input
										type="text"
										value={row.rate}
										onChange={(e) => handleFieldChange(row.id, "rate", e.target.value)}
										placeholder="0.00"
										className="h-8 text-sm text-right"
									/>
								)}
							</div>
							<div>
								<span className="block text-sm text-right font-medium">
									{row.netAmount || "0.00"}
								</span>
							</div>
							<div>
								{disabled ? (
									<span className="block truncate text-sm">{row.remarks || "-"}</span>
								) : (
									<Input
										type="text"
										value={row.remarks}
										onChange={(e) => handleFieldChange(row.id, "remarks", e.target.value)}
										placeholder="Remarks"
										className="h-8 text-sm"
									/>
								)}
							</div>
							{!disabled && (
								<div className="flex justify-center">
									<Tooltip title="Remove">
										<IconButton
											size="small"
											color="error"
											onClick={() => handleRemove(row.id)}
											sx={{ p: 0.5 }}
										>
											<span className="text-sm font-bold leading-none">&times;</span>
										</IconButton>
									</Tooltip>
								</div>
							)}
						</div>
					))}

					{/* Footer total */}
					<div
						className="grid gap-2 pt-2"
						style={{ gridTemplateColumns: disabled ? "2fr 0.8fr 1fr 1fr 1.5fr" : "2fr 0.8fr 1fr 1fr 1.5fr 36px" }}
					>
						<div className="col-span-3 text-right">
							<Typography variant="body2" fontWeight={600}>Total Additional Charges</Typography>
						</div>
						<div className="text-right">
							<Typography variant="body2" fontWeight={600}>{total.toFixed(2)}</Typography>
						</div>
						{/* Empty spacer for remaining columns */}
					<div />
					{!disabled && <div />}
					</div>
				</>
			)}

			{charges.length === 0 && (
				<Typography variant="body2" color="text.secondary" sx={{ pt: 1 }}>
					No additional charges added.
				</Typography>
			)}
		</Paper>
	);
};

export default AdditionalChargesSection;
