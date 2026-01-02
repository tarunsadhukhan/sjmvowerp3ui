"use client";

import * as React from "react";
import { Box, Stack, Typography, Divider } from "@mui/material";
import type { SRTotals } from "../types/srTypes";

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

type SRTotalsDisplayProps = {
	totals: SRTotals;
	additionalChargesTotal?: number;
};

/**
 * Displays SR totals with GST breakdown.
 */
export const SRTotalsDisplay: React.FC<SRTotalsDisplayProps> = ({ totals, additionalChargesTotal = 0 }) => {
	const grandTotalWithCharges = totals.grandTotal + additionalChargesTotal;
	
	return (
		<Box sx={{ display: "flex", justifyContent: "flex-end" }}>
			<Stack spacing={1} sx={{ minWidth: 280 }}>
				<Stack direction="row" justifyContent="space-between">
					<Typography variant="body2" color="text.secondary">
						Gross Amount:
					</Typography>
					<Typography variant="body2">{formatCurrency(totals.grossAmount)}</Typography>
				</Stack>

				{totals.totalDiscount > 0 && (
					<Stack direction="row" justifyContent="space-between">
						<Typography variant="body2" color="text.secondary">
							Discount:
						</Typography>
						<Typography variant="body2" color="error">
							-{formatCurrency(totals.totalDiscount)}
						</Typography>
					</Stack>
				)}

				<Stack direction="row" justifyContent="space-between">
					<Typography variant="body2" color="text.secondary">
						Net Amount:
					</Typography>
					<Typography variant="body2">{formatCurrency(totals.netAmount)}</Typography>
				</Stack>

				{totals.totalIGST > 0 && (
					<Stack direction="row" justifyContent="space-between">
						<Typography variant="body2" color="text.secondary">
							IGST:
						</Typography>
						<Typography variant="body2">{formatCurrency(totals.totalIGST)}</Typography>
					</Stack>
				)}

				{(totals.totalCGST > 0 || totals.totalSGST > 0) && (
					<>
						<Stack direction="row" justifyContent="space-between">
							<Typography variant="body2" color="text.secondary">
								CGST:
							</Typography>
							<Typography variant="body2">{formatCurrency(totals.totalCGST)}</Typography>
						</Stack>
						<Stack direction="row" justifyContent="space-between">
							<Typography variant="body2" color="text.secondary">
								SGST:
							</Typography>
							<Typography variant="body2">{formatCurrency(totals.totalSGST)}</Typography>
						</Stack>
					</>
				)}

				{additionalChargesTotal > 0 && (
					<Stack direction="row" justifyContent="space-between">
						<Typography variant="body2" color="text.secondary">
							Additional Charges:
						</Typography>
						<Typography variant="body2">{formatCurrency(additionalChargesTotal)}</Typography>
					</Stack>
				)}

				<Divider />

				<Stack direction="row" justifyContent="space-between">
					<Typography variant="body1" fontWeight={600}>
						Grand Total:
					</Typography>
					<Typography variant="body1" fontWeight={600} color="primary">
						{formatCurrency(grandTotalWithCharges)}
					</Typography>
				</Stack>
			</Stack>
		</Box>
	);
};
