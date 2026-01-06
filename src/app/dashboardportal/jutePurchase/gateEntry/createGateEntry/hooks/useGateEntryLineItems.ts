/**
 * @file useGateEntryLineItems.ts
 * @description Hook for managing gate entry line items with calculations.
 */

import * as React from "react";
import { useLineItems } from "@/components/ui/transaction";
import type { MuiFormMode, GateEntryLineItem, Option } from "../types/gateEntryTypes";
import { createBlankLine, lineHasAnyData } from "../utils/gateEntryFactories";
import { recalculateLineItemWeights } from "../utils/gateEntryCalculations";

type UseGateEntryLineItemsParams = {
	mode: MuiFormMode;
	headerChallanWeight: number;
	headerNetWeight: number;
	getQualityOptions: (itemId: string) => Option[];
};

export function useGateEntryLineItems({
	mode,
	headerChallanWeight,
	headerNetWeight,
	getQualityOptions,
}: UseGateEntryLineItemsParams) {
	const {
		items: lineItems,
		setItems: setLineItems,
		replaceItems,
		removeItems: removeLineItems,
	} = useLineItems<GateEntryLineItem>({
		createBlankItem: createBlankLine,
		hasData: lineHasAnyData,
		getItemId: (item) => item.id,
		maintainTrailingBlank: mode !== "view",
	});

	// Recalculate weights when header values change
	React.useEffect(() => {
		if (mode === "view") return;
		if (headerChallanWeight <= 0 && headerNetWeight <= 0) return;

		setLineItems((prev) => {
			const hasDataItems = prev.filter(lineHasAnyData);
			if (hasDataItems.length === 0) return prev;

			return recalculateLineItemWeights(prev, headerChallanWeight, headerNetWeight);
		});
	}, [headerChallanWeight, headerNetWeight, mode, setLineItems]);

	/**
	 * Handle field changes with cascading logic.
	 */
	const handleLineFieldChange = React.useCallback(
		(id: string, field: keyof GateEntryLineItem, rawValue: string) => {
			if (mode === "view") return;

			// Handle challanItem change -> reset quality
			if (field === "challanItem") {
				setLineItems((prev) =>
					prev.map((item) =>
						item.id === id
							? { ...item, challanItem: rawValue, challanQuality: "" }
							: item
					)
				);
				return;
			}

			// Handle actualItem change -> reset quality
			if (field === "actualItem") {
				setLineItems((prev) =>
					prev.map((item) =>
						item.id === id
							? { ...item, actualItem: rawValue, actualQuality: "" }
							: item
					)
				);
				return;
			}

			// Handle quantity changes -> trigger weight recalculation
			if (field === "challanQty" || field === "actualQty") {
				setLineItems((prev) => {
					const updated = prev.map((item) =>
						item.id === id ? { ...item, [field]: rawValue } : item
					);
					// Recalculate weights after qty change
					return recalculateLineItemWeights(updated, headerChallanWeight, headerNetWeight);
				});
				return;
			}

			// Generic field update
			setLineItems((prev) =>
				prev.map((item) => (item.id === id ? { ...item, [field]: rawValue } : item))
			);
		},
		[mode, setLineItems, headerChallanWeight, headerNetWeight]
	);

	return {
		lineItems,
		setLineItems,
		replaceItems,
		removeLineItems,
		handleLineFieldChange,
	};
}
