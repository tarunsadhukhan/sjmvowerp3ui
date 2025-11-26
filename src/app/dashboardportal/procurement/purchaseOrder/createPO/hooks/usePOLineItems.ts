import React from "react";
import { useLineItems } from "@/components/ui/transaction";
import type { MuiFormMode } from "@/components/ui/muiform";
import { toast } from "@/hooks/use-toast";
import type { POLine } from "@/utils/poService";
import type { IndentLineItem } from "../../components/IndentLineItemsDialog";
import type { EditableLineItem, ItemGroupCacheEntry, ItemGroupRecord } from "../types/poTypes";
import { createBlankLine, generateLineId } from "../utils/poFactories";
import { calculateLineAmount as calculateLineAmountUtil, calculateLineTax } from "../utils/poCalculations";

export const lineHasAnyData = (line: EditableLineItem) =>
	Boolean(line.itemGroup || line.item || line.itemMake || line.quantity || line.rate || line.uom || line.remarks);

export const lineIsComplete = (line: EditableLineItem) => {
	const qty = Number(line.quantity);
	const rate = Number(line.rate);
	return Boolean(line.itemGroup && line.item && line.uom && Number.isFinite(qty) && qty > 0 && Number.isFinite(rate) && rate >= 0);
};

type UsePOLineItemsParams = {
	mode: MuiFormMode;
	coConfig?: { india_gst?: number };
	supplierBranchState?: string;
	shippingState?: string;
	itemGroupCache: Partial<Record<string, ItemGroupCacheEntry>>;
	itemGroupLoading: Partial<Record<string, boolean>>;
	ensureItemGroupData: (groupId: string) => void;
	itemGroups: ReadonlyArray<ItemGroupRecord>;
};

/**
 * Centralizes all line-item specific business logic (field changes, indent ingestion, validation).
 */
export const usePOLineItems = ({
	mode,
	coConfig,
	supplierBranchState,
	shippingState,
	itemGroupCache,
	itemGroupLoading,
	ensureItemGroupData,
	itemGroups,
}: UsePOLineItemsParams) => {
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

	const indentItemGroupInfoRef = React.useRef<Map<string, { code?: string; name?: string }>>(new Map());

	const mapLineToEditable = React.useCallback((line: POLine): EditableLineItem => ({
		id: line.id ? String(line.id) : generateLineId(),
		indentDtlId: line.indentDtlId,
		indentNo: line.indentNo,
		itemGroup: "",
		item: line.item ?? "",
		itemCode: line.itemCode,
		itemMake: line.itemMake ?? "",
		quantity: line.quantity != null ? String(line.quantity) : "",
		rate: line.rate != null ? String(line.rate) : "",
		uom: line.uom ?? "",
		discountMode: line.discountMode,
		discountValue: line.discountValue != null ? String(line.discountValue) : "",
		discountAmount: line.discountAmount,
		amount: line.amount,
		remarks: line.remarks ?? "",
		taxPercentage: line.taxPercentage,
	}), []);

	const handleLineFieldChange = React.useCallback(
		(id: string, field: keyof EditableLineItem, rawValue: string | number) => {
			if (mode === "view") return;

			const value = typeof rawValue === "number" ? String(rawValue) : rawValue;

			if (field === "itemGroup") {
				setLineItems((prev) =>
					prev.map((item) =>
						item.id === id
							? { ...item, itemGroup: value, item: "", itemMake: "", uom: "", rate: "" }
							: item,
					),
				);
				if (value && !itemGroupCache[value] && !itemGroupLoading[value]) {
					void ensureItemGroupData(value);
				}
				return;
			}

			if (field === "item") {
				setLineItems((prev) => {
					const isDuplicate = prev.some((line) => line.id !== id && line.item === value && lineHasAnyData(line));

					if (isDuplicate && value) {
						toast({
							variant: "destructive",
							title: "Duplicate item",
							description: "This item is already added to the PO. Please select a different item.",
						});
						return prev;
					}

					return prev.map((item) => {
						if (item.id !== id) return item;
						const groupId = item.itemGroup;
						const cache = itemGroupCache[groupId ?? ""];
						const defaultRate = cache?.itemRateById[value];
						const defaultTax = cache?.itemTaxById[value];
						const defaultUom = cache?.items.find((opt) => opt.value === value)?.defaultUomId;
						const uomOptions = cache?.uomsByItemId[value] ?? [];
						let nextUom = item.uom;
						if (defaultUom && uomOptions.some((opt) => opt.value === defaultUom)) {
							nextUom = defaultUom;
						} else if (uomOptions.length) {
							nextUom = uomOptions[0].value;
						}
						const tax = calculateLineTax(0, defaultTax || 0, supplierBranchState, shippingState, !!coConfig?.india_gst);

						return {
							...item,
							item: value,
							uom: nextUom,
							rate: defaultRate != null ? String(defaultRate) : item.rate,
							taxPercentage: defaultTax,
							igstAmount: tax.igst,
							cgstAmount: tax.cgst,
							sgstAmount: tax.sgst,
							taxAmount: tax.total,
						};
					});
				});
				return;
			}

			if (field === "quantity" || field === "rate") {
				const sanitized = value.replace(/[^0-9.]/g, "");
				setLineItems((prev) =>
					prev.map((item) => {
						if (item.id !== id) return item;
						const updated = { ...item, [field]: sanitized };
						const qty = Number(updated.quantity) || 0;
						const rate = Number(updated.rate) || 0;
						const discountMode = updated.discountMode;
						const discountValue = Number(updated.discountValue) || 0;
						const { amount, discountAmount } = calculateLineAmountUtil(qty, rate, discountMode, discountValue);
						updated.discountAmount = discountAmount;
						updated.amount = amount;

						const tax = calculateLineTax(
							amount,
							updated.taxPercentage || 0,
							supplierBranchState,
							shippingState,
							!!coConfig?.india_gst,
						);
						updated.igstAmount = tax.igst;
						updated.cgstAmount = tax.cgst;
						updated.sgstAmount = tax.sgst;
						updated.taxAmount = tax.total;

						return updated;
					}),
				);
				return;
			}

			if (field === "discountValue") {
				const sanitized = value.replace(/[^0-9.]/g, "");
				setLineItems((prev) =>
					prev.map((item) => {
						if (item.id !== id) return item;
						const updated = { ...item, discountValue: sanitized };
						const qty = Number(updated.quantity) || 0;
						const rate = Number(updated.rate) || 0;
						const discountMode = updated.discountMode;
						const discountValue = Number(sanitized) || 0;
						const { amount, discountAmount } = calculateLineAmountUtil(qty, rate, discountMode, discountValue);
						updated.discountAmount = discountAmount;
						updated.amount = amount;

						const tax = calculateLineTax(
							amount,
							updated.taxPercentage || 0,
							supplierBranchState,
							shippingState,
							!!coConfig?.india_gst,
						);
						updated.igstAmount = tax.igst;
						updated.cgstAmount = tax.cgst;
						updated.sgstAmount = tax.sgst;
						updated.taxAmount = tax.total;

						return updated;
					}),
				);
				return;
			}

			setLineItems((prev) =>
				prev.map((item) => {
					if (item.id === id) {
						const updated = { ...item, [field]: value } as EditableLineItem;
						if (field === "taxPercentage") {
							const qty = Number(updated.quantity) || 0;
							const rate = Number(updated.rate) || 0;
							const discountMode = updated.discountMode;
							const discountValue = Number(updated.discountValue) || 0;
							const { amount } = calculateLineAmountUtil(qty, rate, discountMode, discountValue);

							const tax = calculateLineTax(
								amount,
								Number(value) || 0,
								supplierBranchState,
								shippingState,
								!!coConfig?.india_gst,
							);
							updated.igstAmount = tax.igst;
							updated.cgstAmount = tax.cgst;
							updated.sgstAmount = tax.sgst;
							updated.taxAmount = tax.total;
						}
						return updated;
					}
					return item;
				}),
			);
		},
		[coConfig, ensureItemGroupData, itemGroupCache, itemGroupLoading, mode, setLineItems, shippingState, supplierBranchState],
	);

	const handleIndentItemsConfirm = React.useCallback(
		(selectedItems: IndentLineItem[]) => {
			setLineItems((prev) => {
				const filledLines = prev.filter((line) => lineHasAnyData(line));

				const existingIndentDtlIds = new Set(
					filledLines.map((line) => line.indentDtlId).filter((id): id is string => Boolean(id)),
				);
				const existingItemIds = new Set(filledLines.map((line) => line.item).filter((id): id is string => Boolean(id)));

				const newItems = selectedItems.filter((item) => {
					const indentDtlId = String(item.indent_dtl_id);
					const itemId = String(item.item_id);
					return !existingIndentDtlIds.has(indentDtlId) && !existingItemIds.has(itemId);
				});

				const skippedCount = selectedItems.length - newItems.length;
				if (skippedCount > 0) {
					toast({
						variant: "default",
						title: "Some items skipped",
						description: `${skippedCount} item(s) were not added because they already exist in the PO.`,
					});
				}

				if (newItems.length === 0) {
					return prev;
				}

				const uniqueItemGroupIds = Array.from(new Set(newItems.map((item) => String(item.item_grp_id))));
				uniqueItemGroupIds.forEach((groupId) => {
					if (groupId && !itemGroupCache[groupId]) {
						ensureItemGroupData(groupId);
					}
				});

				const newLines = newItems.map((item) => ({
					id: generateLineId(),
					indentDtlId: String(item.indent_dtl_id),
					indentNo: item.indent_no,
					itemGroup: String(item.item_grp_id),
					item: String(item.item_id),
					itemCode: item.item_code,
					itemMake: item.item_make_id ? String(item.item_make_id) : "",
					quantity: String(item.qty || 0),
					rate: "",
					uom: String(item.uom_id),
					discountValue: "",
					remarks: item.remarks || "",
					taxPercentage: item.tax_percentage,
				}));

				newItems.forEach((item) => {
					const groupId = String(item.item_grp_id);
					if (!indentItemGroupInfoRef.current.has(groupId)) {
						indentItemGroupInfoRef.current.set(groupId, {
							code: item.item_grp_code,
							name: item.item_grp_name,
						});
					}
				});

				return [...filledLines, ...newLines];
			});
		},
		[ensureItemGroupData, itemGroupCache, setLineItems],
	);

	const filledLineItems = React.useMemo(() => lineItems.filter(lineHasAnyData), [lineItems]);

	const lineItemsValid = React.useMemo(() => {
		if (mode === "view") return true;
		if (!filledLineItems.length) return false;
		return filledLineItems.every(lineIsComplete);
	}, [filledLineItems, mode]);

	const itemGroupsFromLineItems: ItemGroupRecord[] = React.useMemo(() => {
		const groups = new Map<string, { id: string; label: string }>();
		itemGroups.forEach((grp) => {
			groups.set(grp.id, grp);
		});
		lineItems.forEach((line) => {
			if (line.itemGroup && !groups.has(line.itemGroup)) {
				const indentInfo = indentItemGroupInfoRef.current.get(line.itemGroup);
				const labelParts = indentInfo ? [indentInfo.code, indentInfo.name].filter(Boolean) : [];
				const label = labelParts.length ? labelParts.join(" — ") : line.itemGroup;
				groups.set(line.itemGroup, {
					id: line.itemGroup,
					label,
				});
			}
		});
		return Array.from(groups.values());
	}, [itemGroups, lineItems]);

	return {
		lineItems,
		setLineItems,
		replaceItems,
		removeLineItems,
		handleLineFieldChange,
		handleIndentItemsConfirm,
		mapLineToEditable,
		lineHasAnyData,
		lineIsComplete,
		filledLineItems,
		lineItemsValid,
		itemGroupsFromLineItems,
	};
};

