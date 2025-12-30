import React from "react";
import { useLineItems } from "@/components/ui/transaction";
import type { EditableLineItem, ItemGroupCacheEntry } from "../types/issueTypes";
import {
	createBlankLine,
	lineHasAnyData,
} from "../utils/issueFactories";
import type { MuiFormMode } from "@/components/ui/muiform";

type UseIssueLineItemsParams = {
	mode: MuiFormMode;
	itemGroupCache: Partial<Record<string, ItemGroupCacheEntry>>;
	itemGroupLoading: Partial<Record<string, boolean>>;
	ensureItemGroupData: (groupId: string) => Promise<void>;
};

/**
 * Hook for managing issue line items with CRUD operations
 * and cascading field resets when parent fields change.
 */
export const useIssueLineItems = ({
	mode,
	itemGroupCache,
	itemGroupLoading,
	ensureItemGroupData,
}: UseIssueLineItemsParams) => {
	const {
		items: lineItems,
		setItems: setLineItems,
		replaceItems,
		removeItems: removeLineItems,
	} = useLineItems<EditableLineItem>({
		createBlankItem: createBlankLine,
		hasData: lineHasAnyData,
		getItemId: (item) => item.id,
		maintainTrailingBlank: mode !== "view",
	});

	/**
	 * Handles field changes on a single line item.
	 * Cascades resets: itemGroup → item/uom cleared, item → uom auto-select
	 */
	const handleLineFieldChange = React.useCallback(
		(id: string, field: keyof EditableLineItem, rawValue: string | number) => {
			if (mode === "view") return;

			const value = String(rawValue);

			// ItemGroup changed → reset item, uom, rate, inwardDtlId
			if (field === "itemGroup") {
				setLineItems((prev) =>
					prev.map((item) =>
						item.id === id
							? {
									...item,
									itemGroup: value,
									item: "",
									uom: "",
									rate: "",
									inwardDtlId: "",
									availableQty: "",
								}
							: item
					)
				);
				// Pre-fetch item group options if not cached
				if (value && !itemGroupCache[value] && !itemGroupLoading[value]) {
					void ensureItemGroupData(value);
				}
				return;
			}

			// Item changed → reset uom (item-based defaults would be applied via available inventory)
			if (field === "item") {
				setLineItems((prev) =>
					prev.map((item) =>
						item.id === id
							? {
									...item,
									item: value,
									uom: "",
									rate: "",
									inwardDtlId: "",
									availableQty: "",
								}
							: item
					)
				);
				return;
			}

			// inwardDtlId changed → set rate and availableQty from available inventory
			if (field === "inwardDtlId") {
				setLineItems((prev) =>
					prev.map((line) => {
						if (line.id !== id) return line;
						// Rate and availableQty will be set by the component when selecting inward
						return { ...line, inwardDtlId: value };
					})
				);
				return;
			}

			// Generic field update
			setLineItems((prev) =>
				prev.map((item) =>
					item.id === id ? { ...item, [field]: value } : item
				)
			);
		},
		[mode, setLineItems, itemGroupCache, itemGroupLoading, ensureItemGroupData]
	);

	/**
	 * Updates multiple fields on a line item at once (e.g., when selecting an inward line).
	 */
	const updateLineFields = React.useCallback(
		(id: string, updates: Partial<EditableLineItem>) => {
			if (mode === "view") return;
			setLineItems((prev) =>
				prev.map((item) =>
					item.id === id ? { ...item, ...updates } : item
				)
			);
		},
		[mode, setLineItems]
	);

	return {
		lineItems,
		setLineItems,
		replaceItems,
		removeLineItems,
		handleLineFieldChange,
		updateLineFields,
	};
};
