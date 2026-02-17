import React from "react";
import type {
	CustomerRecord,
	TransporterRecord,
	ApprovedDeliveryOrderRecord,
	ItemGroupCacheEntry,
	ItemGroupRecord,
	Option,
} from "../types/salesInvoiceTypes";

type Params = {
	customers: ReadonlyArray<CustomerRecord>;
	transporters: ReadonlyArray<TransporterRecord>;
	approvedDeliveryOrders: ReadonlyArray<ApprovedDeliveryOrderRecord>;
	itemGroupsFromLineItems: ReadonlyArray<ItemGroupRecord>;
	itemGroupCache?: Partial<Record<string, ItemGroupCacheEntry>>;
	selectedPartyId?: string;
};

export const useSalesInvoiceSelectOptions = ({
	customers, transporters, approvedDeliveryOrders,
	itemGroupsFromLineItems, itemGroupCache = {}, selectedPartyId,
}: Params) => {
	const customerOptions = React.useMemo<Option[]>(() => {
		if (!customers?.length) return [];
		return customers
			.map((c) => ({ label: c.name || c.code || c.id, value: c.id ?? "" }))
			.filter((opt) => opt.value);
	}, [customers]);

	const customerBranchOptions = React.useMemo<Option[]>(() => {
		if (!selectedPartyId || !customers?.length) return [];
		const customer = customers.find((c) => c.id === selectedPartyId);
		if (!customer?.branches?.length) return [];
		return customer.branches.map((b) => ({
			label: b.name || b.address || b.id,
			value: b.id,
		}));
	}, [customers, selectedPartyId]);

	const transporterOptions = React.useMemo<Option[]>(() => {
		if (!transporters?.length) return [];
		return transporters.map((t) => ({ label: t.name || t.code || t.id, value: t.id }));
	}, [transporters]);

	const deliveryOrderOptions = React.useMemo<Option[]>(() => {
		if (!approvedDeliveryOrders?.length) return [];
		return approvedDeliveryOrders.map((doRec) => ({
			label: doRec.deliveryOrderNo + (doRec.partyName ? ` — ${doRec.partyName}` : ""),
			value: doRec.id,
		}));
	}, [approvedDeliveryOrders]);

	const itemGroupOptions = React.useMemo<Option[]>(
		() => itemGroupsFromLineItems.map((grp) => ({ label: grp.label || grp.id, value: grp.id })),
		[itemGroupsFromLineItems],
	);

	const getItemGroupLabel = React.useCallback(
		(groupId: string): string => {
			if (!groupId) return "-";
			const cached = itemGroupCache[groupId];
			if (cached?.groupLabel) return cached.groupLabel;
			const option = itemGroupsFromLineItems.find((grp) => grp.id === groupId);
			if (option?.label && option.label !== option.id) return option.label;
			return groupId;
		},
		[itemGroupCache, itemGroupsFromLineItems],
	);

	const getItemOptions = React.useCallback(
		(itemGroupId: string) => itemGroupCache[itemGroupId]?.items ?? [],
		[itemGroupCache],
	);

	const getMakeOptions = React.useCallback(
		(itemGroupId: string) => itemGroupCache[itemGroupId]?.makes ?? [],
		[itemGroupCache],
	);

	const getUomOptions = React.useCallback(
		(itemGroupId: string, itemId: string) => itemGroupCache[itemGroupId]?.uomsByItemId[itemId] ?? [],
		[itemGroupCache],
	);

	const getItemLabel = React.useCallback(
		(groupId: string, itemId: string, itemCode?: string): string => {
			if (!groupId || !itemId) return itemCode || "-";
			return itemGroupCache[groupId]?.itemLabelById[itemId] ?? itemCode ?? itemId;
		},
		[itemGroupCache],
	);

	const getMakeLabel = React.useCallback(
		(groupId: string, makeId: string): string => {
			if (!groupId || !makeId) return "-";
			return itemGroupCache[groupId]?.makeLabelById[makeId] ?? makeId;
		},
		[itemGroupCache],
	);

	const getUomLabel = React.useCallback(
		(groupId: string, itemId: string, uomId: string): string => {
			if (!groupId || !itemId || !uomId) return "-";
			return itemGroupCache[groupId]?.uomLabelByItemId[itemId]?.[uomId] ?? uomId;
		},
		[itemGroupCache],
	);

	const getOptionLabel = React.useCallback(
		(options: ReadonlyArray<{ label: string; value: string }>, value?: unknown): string | undefined => {
			if (value === null || typeof value === "undefined") return undefined;
			const target = String(value);
			return options.find((opt) => opt.value === target)?.label;
		},
		[],
	);

	return {
		customerOptions, customerBranchOptions, transporterOptions, deliveryOrderOptions,
		itemGroupOptions, getItemGroupLabel,
		getItemOptions, getMakeOptions, getUomOptions,
		getItemLabel, getMakeLabel, getUomLabel, getOptionLabel,
	};
};
