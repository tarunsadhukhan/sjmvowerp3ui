"use client";

import * as React from "react";
import {
	Box,
	Button,
	Collapse,
	IconButton,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Typography,
	Autocomplete,
	Checkbox,
	FormControlLabel,
} from "@mui/material";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import type { AdditionalChargeOption, SRAdditionalCharge } from "../types/srTypes";

type SRAdditionalChargesProps = {
	charges: SRAdditionalCharge[];
	options: AdditionalChargeOption[];
	canEdit: boolean;
	onAddCharge: () => void;
	onRemoveCharge: (id: string) => void;
	onChargeChange: (id: string, field: keyof SRAdditionalCharge, value: unknown) => void;
};

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
 * Generate unique ID for new charges.
 */
let chargeIdSeed = 0;
export const generateChargeId = (): string => {
	chargeIdSeed += 1;
	return `addl-charge-${chargeIdSeed}`;
};

/**
 * Create a blank additional charge.
 */
export const createBlankCharge = (): SRAdditionalCharge => ({
	id: generateChargeId(),
	inward_additional_id: null,
	additional_charges_id: 0,
	additional_charges_name: "",
	qty: 1,
	rate: 0,
	net_amount: 0,
	remarks: "",
	apply_tax: false,
	tax_pct: 0,
	igst_amount: 0,
	sgst_amount: 0,
	cgst_amount: 0,
	tax_amount: 0,
});

/**
 * Additional Charges section component for SR.
 * Shows a collapsible section with a button to add charges.
 */
export const SRAdditionalCharges: React.FC<SRAdditionalChargesProps> = ({
	charges,
	options,
	canEdit,
	onAddCharge,
	onRemoveCharge,
	onChargeChange,
}) => {
	const [expanded, setExpanded] = React.useState(charges.length > 0);

	// Calculate total
	const total = React.useMemo(() => {
		return charges.reduce((sum, charge) => sum + (charge.net_amount || 0) + (charge.tax_amount || 0), 0);
	}, [charges]);

	// Build options map for quick lookup
	const optionsMap = React.useMemo(() => {
		const map: Record<number, AdditionalChargeOption> = {};
		for (const opt of options) {
			map[opt.additional_charges_id] = opt;
		}
		return map;
	}, [options]);

	return (
		<Paper variant="outlined" sx={{ mt: 3 }}>
			{/* Header with toggle */}
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					p: 2,
					borderBottom: expanded ? "1px solid" : "none",
					borderColor: "divider",
					cursor: "pointer",
				}}
				onClick={() => setExpanded(!expanded)}
			>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					{expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
					<Typography variant="subtitle1" fontWeight={600}>
						Additional Charges
					</Typography>
					{charges.length > 0 && (
						<Typography variant="body2" color="text.secondary">
							({charges.length} item{charges.length !== 1 ? "s" : ""})
						</Typography>
					)}
				</Box>
				{charges.length > 0 && (
					<Typography variant="subtitle2" fontWeight={600} color="primary">
						{formatCurrency(total)}
					</Typography>
				)}
			</Box>

			<Collapse in={expanded}>
				<Box sx={{ p: 2 }}>
					{/* Add button */}
					{canEdit && charges.length === 0 && (
						<Button
							variant="outlined"
							size="small"
							startIcon={<Plus size={16} />}
							onClick={(e) => {
								e.stopPropagation();
								onAddCharge();
							}}
						>
							Add Additional Charges
						</Button>
					)}

					{/* Charges table */}
					{charges.length > 0 && (
						<>
							<TableContainer>
								<Table size="small">
									<TableHead>
										<TableRow>
											<TableCell sx={{ fontWeight: 600, width: "25%" }}>Charge Type</TableCell>
											<TableCell sx={{ fontWeight: 600, width: "10%" }} align="right">Qty</TableCell>
											<TableCell sx={{ fontWeight: 600, width: "15%" }} align="right">Rate</TableCell>
											<TableCell sx={{ fontWeight: 600, width: "15%" }} align="right">Amount</TableCell>
											<TableCell sx={{ fontWeight: 600, width: "10%" }} align="center">Tax?</TableCell>
											<TableCell sx={{ fontWeight: 600, width: "15%" }}>Remarks</TableCell>
											{canEdit && <TableCell sx={{ width: "5%" }} />}
										</TableRow>
									</TableHead>
									<TableBody>
										{charges.map((charge) => {
											const selectedOption = optionsMap[charge.additional_charges_id] || null;
											return (
												<TableRow key={charge.id}>
													{/* Charge Type */}
													<TableCell>
														{canEdit ? (
															<Autocomplete
																size="small"
																options={options}
																value={selectedOption}
																onChange={(_, newValue) => {
																	if (newValue) {
																		onChargeChange(charge.id, "additional_charges_id", newValue.additional_charges_id);
																		onChargeChange(charge.id, "additional_charges_name", newValue.additional_charges_name);
																		// Set default tax if available
																		if (newValue.default_value) {
																			onChargeChange(charge.id, "tax_pct", newValue.default_value);
																		}
																	}
																}}
																getOptionLabel={(opt) => opt.additional_charges_name}
																isOptionEqualToValue={(opt, val) => opt.additional_charges_id === val.additional_charges_id}
																renderInput={(params) => (
																	<TextField {...params} placeholder="Select charge" size="small" />
																)}
																sx={{ minWidth: 150 }}
															/>
														) : (
															<Typography variant="body2">{charge.additional_charges_name || "-"}</Typography>
														)}
													</TableCell>

													{/* Qty */}
													<TableCell align="right">
														{canEdit ? (
															<TextField
																type="number"
																size="small"
																value={charge.qty}
																onChange={(e) => {
																	const qty = Number(e.target.value) || 1;
																	onChargeChange(charge.id, "qty", qty);
																	onChargeChange(charge.id, "net_amount", qty * charge.rate);
																}}
																inputProps={{ min: 1, style: { textAlign: "right" } }}
																sx={{ width: 70 }}
															/>
														) : (
															<Typography variant="body2">{charge.qty}</Typography>
														)}
													</TableCell>

													{/* Rate */}
													<TableCell align="right">
														{canEdit ? (
															<TextField
																type="number"
																size="small"
																value={charge.rate}
																onChange={(e) => {
																	const rate = Number(e.target.value) || 0;
																	onChargeChange(charge.id, "rate", rate);
																	onChargeChange(charge.id, "net_amount", charge.qty * rate);
																}}
																inputProps={{ min: 0, step: 0.01, style: { textAlign: "right" } }}
																sx={{ width: 100 }}
															/>
														) : (
															<Typography variant="body2">{formatCurrency(charge.rate)}</Typography>
														)}
													</TableCell>

													{/* Amount */}
													<TableCell align="right">
														<Typography variant="body2" fontWeight={500}>
															{formatCurrency(charge.net_amount)}
														</Typography>
													</TableCell>

													{/* Tax Checkbox */}
													<TableCell align="center">
														{canEdit ? (
															<Checkbox
																size="small"
																checked={charge.apply_tax}
																onChange={(e) => onChargeChange(charge.id, "apply_tax", e.target.checked)}
															/>
														) : (
															<Typography variant="body2">{charge.apply_tax ? "Yes" : "No"}</Typography>
														)}
													</TableCell>

													{/* Remarks */}
													<TableCell>
														{canEdit ? (
															<TextField
																size="small"
																value={charge.remarks}
																onChange={(e) => onChargeChange(charge.id, "remarks", e.target.value)}
																placeholder="Remarks"
																sx={{ width: "100%" }}
															/>
														) : (
															<Typography variant="body2">{charge.remarks || "-"}</Typography>
														)}
													</TableCell>

													{/* Delete */}
													{canEdit && (
														<TableCell>
															<IconButton
																size="small"
																color="error"
																onClick={() => onRemoveCharge(charge.id)}
															>
																<Trash2 size={16} />
															</IconButton>
														</TableCell>
													)}
												</TableRow>
											);
										})}
									</TableBody>
								</Table>
							</TableContainer>

							{/* Add more button */}
							{canEdit && (
								<Box sx={{ mt: 2 }}>
									<Button
										variant="text"
										size="small"
										startIcon={<Plus size={16} />}
										onClick={onAddCharge}
									>
										Add Another Charge
									</Button>
								</Box>
							)}

							{/* Total */}
							<Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2, pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
								<Typography variant="subtitle1" fontWeight={600}>
									Total Additional Charges: {formatCurrency(total)}
								</Typography>
							</Box>
						</>
					)}
				</Box>
			</Collapse>
		</Paper>
	);
};
