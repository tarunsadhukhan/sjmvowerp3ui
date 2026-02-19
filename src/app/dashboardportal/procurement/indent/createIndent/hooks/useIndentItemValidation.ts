import React from "react";
import type { ItemValidationResult, LineItemValidationState } from "../types/indentTypes";
import { getValidationLogic } from "../utils/indentConstants";
import { validateItemForIndent } from "@/utils/indentService";

type ValidationMap = Record<string, LineItemValidationState>;

type UseIndentItemValidationParams = {
	branchId: string;
	indentType: string;
	expenseTypeName: string | undefined;
	expenseTypeId: string;
};

/**
 * Manages per-line validation state for indent line items.
 *
 * - On item selection, calls the backend validation endpoint.
 * - Provides max-quantity caps, warnings, and blocking errors.
 * - Clears validation when upstream header fields change.
 */
export function useIndentItemValidation({
	branchId,
	indentType,
	expenseTypeName,
	expenseTypeId,
}: UseIndentItemValidationParams) {
	const [validationMap, setValidationMap] = React.useState<ValidationMap>({});

	const currentLogic = React.useMemo(
		() => getValidationLogic(indentType, expenseTypeName),
		[indentType, expenseTypeName]
	);

	// Clear all validation when header fields change
	const clearAll = React.useCallback(() => {
		setValidationMap({});
	}, []);

	React.useEffect(() => {
		clearAll();
	}, [branchId, indentType, expenseTypeId, clearAll]);

	// Clear validation for a specific line
	const clearLine = React.useCallback((lineId: string) => {
		setValidationMap((prev) => {
			if (!prev[lineId]) return prev;
			const next = { ...prev };
			delete next[lineId];
			return next;
		});
	}, []);

	/**
	 * Trigger validation for a specific line after item selection.
	 * For Logic 3 (no validation) this is a no-op.
	 */
	const validateLine = React.useCallback(
		async (lineId: string, itemId: string) => {
			if (currentLogic === 3 || !branchId || !itemId || !expenseTypeId) {
				clearLine(lineId);
				return;
			}

			// Set loading
			setValidationMap((prev) => ({
				...prev,
				[lineId]: { loading: true, result: null, error: null },
			}));

			try {
				const apiResult = await validateItemForIndent({
					branchId,
					itemId,
					indentType,
					expenseTypeId,
				});

				const mapped: ItemValidationResult = {
					validationLogic: apiResult.validation_logic,
					branchStock: apiResult.branch_stock,
					minqty: apiResult.minqty,
					maxqty: apiResult.maxqty,
					minOrderQty: apiResult.min_order_qty,
					leadTime: apiResult.lead_time,
					outstandingIndentQty: apiResult.outstanding_indent_qty,
					hasOpenIndent: apiResult.has_open_indent,
					maxIndentQty: apiResult.max_indent_qty,
					fyDuplicateIndentNo: apiResult.fy_duplicate_indent_no,
					regularBomOutstanding: apiResult.regular_bom_outstanding,
					warnings: apiResult.warnings ?? [],
				};

				setValidationMap((prev) => ({
					...prev,
					[lineId]: { loading: false, result: mapped, error: null },
				}));
			} catch (err) {
				const msg = err instanceof Error ? err.message : "Validation failed";
				setValidationMap((prev) => ({
					...prev,
					[lineId]: { loading: false, result: null, error: msg },
				}));
			}
		},
		[currentLogic, branchId, indentType, expenseTypeId, clearLine]
	);

	/**
	 * Check if a given quantity exceeds the max allowed for a line.
	 * Returns an error message string, or null if OK / not applicable.
	 */
	const getQuantityError = React.useCallback(
		(lineId: string, quantity: string): string | null => {
			const state = validationMap[lineId];
			if (!state?.result) return null;
			const { validationLogic, maxIndentQty, fyDuplicateIndentNo } = state.result;

			if (validationLogic === 2 && fyDuplicateIndentNo != null) {
				return `An open indent already exists for this item in the current FY (Indent #${fyDuplicateIndentNo}).`;
			}

			if (validationLogic === 1 && maxIndentQty != null) {
				const qty = parseFloat(quantity);
				if (!Number.isNaN(qty) && qty > maxIndentQty) {
					return `Quantity exceeds the maximum allowed (${maxIndentQty.toFixed(2)}).`;
				}
			}

			return null;
		},
		[validationMap]
	);

	/**
	 * Get warnings (non-blocking) for a line.
	 */
	const getLineWarnings = React.useCallback(
		(lineId: string): string[] => {
			return validationMap[lineId]?.result?.warnings ?? [];
		},
		[validationMap]
	);

	/**
	 * Check if all filled lines pass validation.
	 * Lines without validation state are assumed OK (Logic 3 or not yet fetched).
	 */
	const allLinesValid = React.useCallback(
		(filledLineIds: string[], lineQuantities: Record<string, string>): boolean => {
			for (const id of filledLineIds) {
				const state = validationMap[id];
				if (state?.loading) return false;
				if (state?.result) {
					const err = getQuantityError(id, lineQuantities[id] ?? "0");
					if (err) return false;
				}
			}
			return true;
		},
		[validationMap, getQuantityError]
	);

	return {
		validationMap,
		currentLogic,
		validateLine,
		clearLine,
		clearAll,
		getQuantityError,
		getLineWarnings,
		allLinesValid,
	};
}
