import * as React from "react";
import type { SRHeader, SRLineItem } from "../types/srTypes";
import { calculateLineTax, calculateLineAmount } from "../utils/srCalculations";

type UseSRLineItemsParams = {
	header: SRHeader | null;
};

type UseSRLineItemsReturn = {
	lineItems: SRLineItem[];
	setLineItems: React.Dispatch<React.SetStateAction<SRLineItem[]>>;
	handleLineItemChange: (id: string, field: keyof SRLineItem, value: unknown) => void;
	recalculateLineItem: (item: SRLineItem) => SRLineItem;
	validateLineItems: () => { valid: boolean; missingWarehouseCount: number };
};

/**
 * Manages SR line items state and provides change handlers.
 */
export const useSRLineItems = ({ header }: UseSRLineItemsParams): UseSRLineItemsReturn => {
	const [lineItems, setLineItems] = React.useState<SRLineItem[]>([]);

	/**
	 * Recalculates a single line item's amount and taxes.
	 */
	const recalculateLineItem = React.useCallback(
		(item: SRLineItem): SRLineItem => {
			const amount = calculateLineAmount(
				item.approved_qty,
				item.accepted_rate,
				item.discount_amount,
			);
			const tax = calculateLineTax(
				amount,
				item.tax_percentage,
				header?.supplier_state_name,
				header?.shipping_state_name || header?.billing_state_name,
				header?.india_gst || false,
			);

			return {
				...item,
				amount,
				igst_amount: tax.igst,
				cgst_amount: tax.cgst,
				sgst_amount: tax.sgst,
				tax_amount: tax.total,
				total_amount: amount + tax.total,
			};
		},
		[header],
	);

	/**
	 * Handles field change for a line item with auto-recalculation.
	 */
	const handleLineItemChange = React.useCallback(
		(id: string, field: keyof SRLineItem, value: unknown) => {
			setLineItems((prev) =>
				prev.map((item) => {
					if (item.id !== id) return item;

					const updated = { ...item, [field]: value };

					// Recalculate when rate changes
					if (field === "accepted_rate") {
						return recalculateLineItem(updated);
					}

					return updated;
				}),
			);
		},
		[recalculateLineItem],
	);

	/**
	 * Validates all line items have required fields (warehouse_id is mandatory).
	 */
	const validateLineItems = React.useCallback((): { valid: boolean; missingWarehouseCount: number } => {
		const missingWarehouseCount = lineItems.filter((item) => item.warehouse_id === null || item.warehouse_id === undefined).length;
		return {
			valid: missingWarehouseCount === 0,
			missingWarehouseCount,
		};
	}, [lineItems]);

	return {
		lineItems,
		setLineItems,
		handleLineItemChange,
		recalculateLineItem,
		validateLineItems,
	};
};
