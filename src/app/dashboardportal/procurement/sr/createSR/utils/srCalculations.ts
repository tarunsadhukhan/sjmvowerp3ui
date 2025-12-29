import type { SRLineItem, SRTotals } from "../types/srTypes";

/**
 * Calculates the GST split for a line item based on supplier/shipping states.
 * Same logic as PO: If same state → CGST+SGST split, else IGST.
 */
export const calculateLineTax = (
	amount: number,
	taxPercentage: number,
	supplierState: string | undefined,
	shippingState: string | undefined,
	indiaGst: boolean,
): { igst: number; cgst: number; sgst: number; total: number } => {
	if (!indiaGst || !taxPercentage || taxPercentage === 0) {
		return { igst: 0, cgst: 0, sgst: 0, total: 0 };
	}

	const taxAmount = (amount * taxPercentage) / 100;

	// If same state, split into CGST + SGST; otherwise IGST
	if (supplierState && shippingState && supplierState === shippingState) {
		const halfTax = taxAmount / 2;
		return {
			igst: 0,
			cgst: Number(halfTax.toFixed(2)),
			sgst: Number(halfTax.toFixed(2)),
			total: Number(taxAmount.toFixed(2)),
		};
	}

	return {
		igst: Number(taxAmount.toFixed(2)),
		cgst: 0,
		sgst: 0,
		total: Number(taxAmount.toFixed(2)),
	};
};

/**
 * Calculates net amount after discount.
 */
export const calculateLineAmount = (
	qty: number,
	rate: number,
	discountAmount: number = 0,
): number => {
	const baseAmount = qty * rate;
	return Math.max(0, baseAmount - discountAmount);
};

/**
 * Calculates summary totals across all line items.
 */
export const calculateTotals = (lineItems: SRLineItem[]): SRTotals => {
	let grossAmount = 0;
	let totalDiscount = 0;
	let netAmount = 0;
	let totalIGST = 0;
	let totalCGST = 0;
	let totalSGST = 0;
	let totalTax = 0;
	let grandTotal = 0;

	for (const item of lineItems) {
		const lineGross = (item.approved_qty || 0) * (item.accepted_rate || 0);
		const lineDiscount = item.discount_amount || 0;
		grossAmount += lineGross;
		totalDiscount += lineDiscount;
		netAmount += item.amount || 0;
		totalIGST += item.igst_amount || 0;
		totalCGST += item.cgst_amount || 0;
		totalSGST += item.sgst_amount || 0;
		totalTax += item.tax_amount || 0;
		grandTotal += item.total_amount || 0;
	}

	return {
		grossAmount: Number(grossAmount.toFixed(2)),
		totalDiscount: Number(totalDiscount.toFixed(2)),
		netAmount: Number(netAmount.toFixed(2)),
		totalIGST: Number(totalIGST.toFixed(2)),
		totalCGST: Number(totalCGST.toFixed(2)),
		totalSGST: Number(totalSGST.toFixed(2)),
		totalTax: Number(totalTax.toFixed(2)),
		grandTotal: Number(grandTotal.toFixed(2)),
	};
};
