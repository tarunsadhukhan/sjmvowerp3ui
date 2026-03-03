import React from "react";
import { useLineItems } from "@/components/ui/transaction";
import type { MuiFormMode } from "@/components/ui/muiform";
import type { EditableLineItem, ItemGroupCacheMap, POLineItem } from "../types/inwardTypes";
import { createBlankLine, lineHasAnyData, generateLineId } from "../utils/inwardFactories";

type UseInwardLineItemsParams = {
	mode: MuiFormMode;
	itemGroupCache: ItemGroupCacheMap;
	itemGroupLoading: Partial<Record<string, boolean>>;
	ensureItemGroupData: (groupId: string) => void;
};

/**
 * Hook to manage line items for the Inward transaction page.
 */
export const useInwardLineItems = ({
	mode,
	itemGroupCache,
	itemGroupLoading,
	ensureItemGroupData,
}: UseInwardLineItemsParams) => {
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
	 * Map API line to editable format.
	 */
	const mapLineToEditable = React.useCallback(
		(line: Record<string, unknown>): EditableLineItem => {
			const itemGroupId = String(line.item_grp_id ?? line.itemGroup ?? "");
			if (itemGroupId && !itemGroupCache[itemGroupId] && !itemGroupLoading[itemGroupId]) {
				ensureItemGroupData(itemGroupId);
			}

			return {
				id: String(line.inward_dtl_id ?? line.id ?? generateLineId()),
				poDtlId: line.po_dtl_id ? String(line.po_dtl_id) : undefined,
				poNo: line.po_no ? String(line.po_no) : undefined,
				itemGroup: itemGroupId,
				item: String(line.item_id ?? line.item ?? ""),
				itemCode: line.item_code ? String(line.item_code) : undefined,
				itemMake: String(line.item_make_id ?? line.itemMake ?? ""),
				orderedQty: typeof line.ordered_qty === "number" ? line.ordered_qty : undefined,
				receivedQty: typeof line.received_qty === "number" ? line.received_qty : undefined,
				quantity: String(line.quantity ?? line.qty ?? ""),
				uom: String(line.uom_id ?? line.uom ?? ""),
				remarks: String(line.remarks ?? ""),
				taxPercentage: typeof line.tax_percentage === "number" ? line.tax_percentage : undefined,
				hsnCode: line.hsn_code ? String(line.hsn_code) : undefined,
			};
		},
		[itemGroupCache, itemGroupLoading, ensureItemGroupData]
	);

	/**
	 * Handle field change in a line item.
	 */
	const handleLineFieldChange = React.useCallback(
		(id: string, field: keyof EditableLineItem, rawValue: string) => {
			if (mode === "view") return;

			// Cascade logic for item group change
			if (field === "itemGroup") {
				setLineItems((prev) =>
					prev.map((item) =>
						item.id === id
							? { ...item, itemGroup: rawValue, item: "", itemMake: "", uom: "" }
							: item
					)
				);
				if (rawValue && !itemGroupCache[rawValue] && !itemGroupLoading[rawValue]) {
					ensureItemGroupData(rawValue);
				}
				return;
			}

			// Item change → auto-select default UOM
			if (field === "item") {
				setLineItems((prev) =>
					prev.map((item) => {
						if (item.id !== id) return item;
						const cache = itemGroupCache[item.itemGroup ?? ""];
						const itemOption = cache?.items.find((opt) => opt.value === rawValue);
						const defaultUom = itemOption?.defaultUomId ?? "";
						const taxPct = itemOption?.taxPercentage;
						return {
							...item,
							item: rawValue,
							uom: defaultUom,
							taxPercentage: taxPct,
						};
					})
				);
				return;
			}

			// Generic field update
			setLineItems((prev) =>
				prev.map((item) => (item.id === id ? { ...item, [field]: rawValue } : item))
			);
		},
		[mode, setLineItems, itemGroupCache, itemGroupLoading, ensureItemGroupData]
	);

	/**
	 * Handle confirmation of PO line items selection.
	 */
	const handlePOItemsConfirm = React.useCallback(
		(selectedItems: POLineItem[]) => {
			const newLines: EditableLineItem[] = selectedItems.map((poItem) => {
				const itemGroupId = String(poItem.item_grp_id ?? "");
				if (itemGroupId && !itemGroupCache[itemGroupId] && !itemGroupLoading[itemGroupId]) {
					ensureItemGroupData(itemGroupId);
				}

				return {
					id: generateLineId(),
					poDtlId: String(poItem.po_dtl_id),
					poNo: poItem.po_no,
					itemGroup: itemGroupId,
					item: String(poItem.item_id),
					itemCode: poItem.item_code,
					itemMake: poItem.item_make_id ? String(poItem.item_make_id) : "",
					orderedQty: poItem.ordered_qty,
					receivedQty: poItem.received_qty,
					quantity: String(poItem.pending_qty ?? poItem.ordered_qty - (poItem.received_qty ?? 0)),
					uom: String(poItem.uom_id ?? ""),
					remarks: poItem.remarks ?? "",
					taxPercentage: poItem.tax_percentage,
					hsnCode: poItem.hsn_code ?? undefined,
				};
			});

			// Merge with existing lines (avoid duplicates by poDtlId)
			setLineItems((prev) => {
				const existingPoDtlIds = new Set(
					prev.filter((line) => line.poDtlId).map((line) => line.poDtlId)
				);
				const uniqueNewLines = newLines.filter(
					(line) => !line.poDtlId || !existingPoDtlIds.has(line.poDtlId)
				);
				// Remove blank lines and add new ones
				const filledPrev = prev.filter(lineHasAnyData);
				return [...filledPrev, ...uniqueNewLines];
			});
		},
		[setLineItems, itemGroupCache, itemGroupLoading, ensureItemGroupData]
	);

	// Compute filled line items (non-blank)
	const filledLineItems = React.useMemo(
		() => lineItems.filter(lineHasAnyData),
		[lineItems]
	);

	// Check if line items are valid for submission
	const lineItemsValid = React.useMemo(() => {
		if (filledLineItems.length === 0) return false;
		return filledLineItems.every((line) => {
			const qty = Number(line.quantity);
			return Boolean(line.item && line.uom && Number.isFinite(qty) && qty > 0);
		});
	}, [filledLineItems]);

	return {
		lineItems,
		setLineItems,
		replaceItems,
		removeLineItems,
		mapLineToEditable,
		handleLineFieldChange,
		handlePOItemsConfirm,
		filledLineItems,
		lineItemsValid,
	};
};
