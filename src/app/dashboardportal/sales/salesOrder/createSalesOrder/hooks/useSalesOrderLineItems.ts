import React from "react";
import { useLineItems } from "@/components/ui/transaction";
import type { MuiFormMode } from "@/components/ui/muiform";
import { toast } from "@/hooks/use-toast";
import type { SalesOrderLine } from "@/utils/salesOrderService";
import type { EditableLineItem, ItemGroupCacheEntry, ItemGroupRecord } from "../types/salesOrderTypes";
import { createBlankLine } from "../utils/salesOrderFactories";

export const lineHasAnyData = (line: EditableLineItem) =>
	Boolean(line.itemGroup || line.item || line.itemMake || line.quantity || line.rate || line.uom || line.remarks);

export const lineIsComplete = (line: EditableLineItem) => {
	const qty = Number(line.quantity);
	const rate = Number(line.rate);
	return Boolean(line.itemGroup && line.item && line.uom && Number.isFinite(qty) && qty > 0 && Number.isFinite(rate) && rate >= 0);
};

let lineIdCounter = 0;
const generateLineId = () => {
	lineIdCounter += 1;
	return `so-line-${Date.now()}-${lineIdCounter}`;
};

type UseSalesOrderLineItemsParams = {
	mode: MuiFormMode;
	coConfig?: { india_gst?: number };
	billingToState?: string;
	shippingToState?: string;
	itemGroupCache: Partial<Record<string, ItemGroupCacheEntry>>;
	itemGroupLoading: Partial<Record<string, boolean>>;
	ensureItemGroupData: (groupId: string) => void;
	itemGroups: ReadonlyArray<ItemGroupRecord>;
};

export const useSalesOrderLineItems = ({
	mode,
	coConfig,
	billingToState,
	shippingToState,
	itemGroupCache,
	itemGroupLoading,
	ensureItemGroupData,
	itemGroups,
}: UseSalesOrderLineItemsParams) => {
	const {
		items: lineItems,
		setItems: setLineItems,
		replaceItems,
		removeItems: removeLineItems,
	} = useLineItems<EditableLineItem>({
		createBlankItem: createBlankLine,
		hasData: lineHasAnyData,
		getItemId: (item) => item.id,
		maintainTrailingBlank: true,
	});

	const calculateLineTax = (amount: number, taxPct: number) => {
		if (!taxPct || !amount) return { igst: 0, cgst: 0, sgst: 0, total: 0 };
		const taxAmount = (amount * taxPct) / 100;
		const isSameState = billingToState && shippingToState && billingToState === shippingToState;
		if (coConfig?.india_gst && isSameState) {
			const half = taxAmount / 2;
			return { igst: 0, cgst: Math.round(half * 100) / 100, sgst: Math.round(half * 100) / 100, total: Math.round(taxAmount * 100) / 100 };
		}
		return { igst: Math.round(taxAmount * 100) / 100, cgst: 0, sgst: 0, total: Math.round(taxAmount * 100) / 100 };
	};

	const calculateLineAmount = (qty: number, rate: number, discountMode?: number, discountValue?: number) => {
		const gross = qty * rate;
		let discountAmount = 0;
		if (discountMode === 1 && discountValue) {
			discountAmount = (gross * discountValue) / 100;
		} else if (discountMode === 2 && discountValue) {
			discountAmount = discountValue * qty;
		}
		return { amount: Math.max(0, gross - discountAmount), discountAmount };
	};

	const mapLineToEditable = React.useCallback((line: SalesOrderLine): EditableLineItem => ({
		id: line.id ? String(line.id) : generateLineId(),
		quotationLineitemId: line.quotationLineitemId,
		hsnCode: line.hsnCode,
		itemGroup: line.itemGroup ? String(line.itemGroup) : "",
		item: line.item ?? "",
		itemMake: line.itemMake ?? "",
		quantity: line.quantity != null ? String(line.quantity) : "",
		rate: line.rate != null ? String(line.rate) : "",
		uom: line.uom ?? "",
		discountType: line.discountType ?? undefined,
		discountValue: line.discountedRate != null ? String(line.discountedRate) : "",
		discountAmount: line.discountAmount ?? undefined,
		amount: line.totalAmount ?? undefined,
		remarks: line.remarks ?? "",
		taxPercentage: line.gst?.igstPercent ? Number(line.gst.igstPercent) : (line.gst?.cgstPercent ? Number(line.gst.cgstPercent) * 2 : undefined),
		igstAmount: line.gst?.igstAmount ?? undefined,
		cgstAmount: line.gst?.cgstAmount ?? undefined,
		sgstAmount: line.gst?.sgstAmount ?? undefined,
		taxAmount: line.gst?.gstTotal ?? undefined,
	}), []);

	const handleLineFieldChange = React.useCallback(
		(id: string, field: keyof EditableLineItem, rawValue: string | number) => {
			if (mode === "view") return;
			const value = typeof rawValue === "number" ? String(rawValue) : rawValue;

			if (field === "itemGroup") {
				setLineItems((prev) =>
					prev.map((item) =>
						item.id === id ? { ...item, itemGroup: value, item: "", itemMake: "", uom: "", rate: "" } : item,
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
						toast({ variant: "destructive", title: "Duplicate item", description: "This item is already added." });
						return prev;
					}
					return prev.map((item) => {
						if (item.id !== id) return item;
						const cache = itemGroupCache[item.itemGroup ?? ""];
						const defaultRate = cache?.itemRateById[value];
						const defaultTax = cache?.itemTaxById[value];
						const defaultUom = cache?.items.find((opt) => opt.value === value)?.defaultUomId;
						const uomOptions = cache?.uomsByItemId[value] ?? [];
						let nextUom = item.uom;
						if (defaultUom && uomOptions.some((opt) => opt.value === defaultUom)) nextUom = defaultUom;
						else if (uomOptions.length) nextUom = uomOptions[0].value;
						const tax = calculateLineTax(0, defaultTax || 0);
						return {
							...item, item: value, uom: nextUom,
							rate: defaultRate != null ? String(defaultRate) : item.rate,
							taxPercentage: defaultTax,
							igstAmount: tax.igst, cgstAmount: tax.cgst, sgstAmount: tax.sgst, taxAmount: tax.total,
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
						const { amount, discountAmount } = calculateLineAmount(qty, rate, updated.discountType, Number(updated.discountValue) || 0);
						updated.discountAmount = discountAmount;
						updated.amount = amount;
						const tax = calculateLineTax(amount, updated.taxPercentage || 0);
						updated.igstAmount = tax.igst;
						updated.cgstAmount = tax.cgst;
						updated.sgstAmount = tax.sgst;
						updated.taxAmount = tax.total;
						return updated;
					}),
				);
				return;
			}

			if (field === "discountType") {
				const modeValue = value ? Number(value) : undefined;
				setLineItems((prev) =>
					prev.map((item) => {
						if (item.id !== id) return item;
						const updated = { ...item, discountType: modeValue, discountValue: "" };
						const qty = Number(updated.quantity) || 0;
						const rate = Number(updated.rate) || 0;
						const { amount, discountAmount } = calculateLineAmount(qty, rate, modeValue, 0);
						updated.discountAmount = discountAmount;
						updated.amount = amount;
						const tax = calculateLineTax(amount, updated.taxPercentage || 0);
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
						const rate = Number(item.rate) || 0;
						let discountValue = Number(sanitized) || 0;
						if (item.discountType === 1 && discountValue >= 100) discountValue = 99.99;
						else if (item.discountType === 2 && discountValue >= rate && rate > 0) discountValue = rate - 0.01;
						const updated = { ...item, discountValue: String(discountValue === 0 ? sanitized : discountValue) };
						const qty = Number(updated.quantity) || 0;
						const { amount, discountAmount } = calculateLineAmount(qty, rate, item.discountType, discountValue);
						updated.discountAmount = discountAmount;
						updated.amount = amount;
						const tax = calculateLineTax(amount, updated.taxPercentage || 0);
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
				prev.map((item) => (item.id === id ? { ...item, [field]: value } as EditableLineItem : item)),
			);
		},
		[mode, setLineItems, itemGroupCache, itemGroupLoading, ensureItemGroupData, billingToState, shippingToState, coConfig],
	);

	const handleQuotationItemsConfirm = React.useCallback(
		(items: Array<Record<string, unknown>>) => {
			setLineItems((prev) => {
				const filledLines = prev.filter(lineHasAnyData);
				const newLines: EditableLineItem[] = items.map((item) => {
					const groupId = String(item.item_grp_id ?? "");
					if (groupId && !itemGroupCache[groupId]) ensureItemGroupData(groupId);
					return {
						id: generateLineId(),
						quotationLineitemId: item.sales_quotation_dtl_id ? Number(item.sales_quotation_dtl_id) : undefined,
						hsnCode: item.hsn_code ? String(item.hsn_code) : undefined,
						itemGroup: groupId,
						item: String(item.item_id ?? ""),
						itemMake: item.item_make_id ? String(item.item_make_id) : "",
						quantity: String(item.quantity ?? ""),
						rate: String(item.rate ?? ""),
						uom: String(item.uom_id ?? ""),
						discountType: item.discount_type ? Number(item.discount_type) : undefined,
						discountValue: item.discounted_rate != null ? String(item.discounted_rate) : "",
						discountAmount: item.discount_amount ? Number(item.discount_amount) : undefined,
						amount: item.total_amount ? Number(item.total_amount) : undefined,
						remarks: item.remarks ? String(item.remarks) : "",
						taxPercentage: item.tax_percentage ? Number(item.tax_percentage) : undefined,
					};
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
		itemGroups.forEach((grp) => groups.set(grp.id, grp));
		lineItems.forEach((line) => {
			if (line.itemGroup && !groups.has(line.itemGroup)) {
				const cachedLabel = itemGroupCache[line.itemGroup]?.groupLabel;
				groups.set(line.itemGroup, { id: line.itemGroup, label: cachedLabel || line.itemGroup });
			}
		});
		return Array.from(groups.values());
	}, [itemGroupCache, itemGroups, lineItems]);

	return {
		lineItems, setLineItems, replaceItems, removeLineItems,
		handleLineFieldChange, handleQuotationItemsConfirm,
		mapLineToEditable, lineHasAnyData, lineIsComplete,
		filledLineItems, lineItemsValid, itemGroupsFromLineItems,
	};
};
