import type { UomConversionEntry } from "@/utils/uomConversion";
export type { UomConversionEntry } from "@/utils/uomConversion";

export type Option = {
	label: string;
	value: string;
};

export type CustomerBranchRecord = {
	id: string;
	name?: string;
	address?: string;
	fullAddress?: string;
	stateName?: string;
	stateId?: number;
	gstNo?: string;
};

export type CustomerRecord = {
	id: string;
	name: string;
	code?: string;
	branches?: CustomerBranchRecord[];
};

export type TransporterRecord = {
	id: string;
	name: string;
	code?: string;
};

export type BrokerRecord = {
	id: string;
	name: string;
	code?: string;
};

export type ApprovedDeliveryOrderRecord = {
	id: string;
	deliveryOrderNo: string;
	deliveryOrderDate?: string;
	partyName?: string;
	netAmount?: number;
};

export type InvoiceTypeRecord = {
	id: string;
	name: string;
};

export type ItemGroupRecord = {
	id: string;
	label: string;
};

export type ItemOption = Option & {
	defaultUomId?: string;
	defaultUomLabel?: string;
	defaultRate?: number;
	taxPercentage?: number;
};

export type ItemGroupCacheEntry = {
	groupLabel?: string;
	items: ItemOption[];
	makes: Option[];
	uomsByItemId: Record<string, Option[]>;
	itemLabelById: Record<string, string>;
	makeLabelById: Record<string, string>;
	uomLabelByItemId: Record<string, Record<string, string>>;
	itemRateById: Record<string, number>;
	itemTaxById: Record<string, number>;
	uomConversionsByItemId: Record<string, UomConversionEntry[]>;
};

export type EditableLineItem = {
	id: string;
	deliveryOrderDtlId?: number;
	hsnCode?: string;
	itemGroup: string;
	item: string;
	itemCode?: string;
	itemMake: string;
	quantity: string;
	rate: string;
	uom: string;
	discountType?: number;
	discountedRate?: number;
	discountAmount?: number;
	netAmount?: number;
	totalAmount?: number;
	remarks: string;
	taxPercentage?: number;
	igstAmount?: number;
	igstPercent?: number;
	cgstAmount?: number;
	cgstPercent?: number;
	sgstAmount?: number;
	sgstPercent?: number;
	gstTotal?: number;
};

export type InvoiceSetupData = {
	customers: CustomerRecord[];
	transporters: TransporterRecord[];
	brokers: BrokerRecord[];
	approvedDeliveryOrders: ApprovedDeliveryOrderRecord[];
	itemGroups: ItemGroupRecord[];
	invoiceTypes: InvoiceTypeRecord[];
};

export type CustomerBranchRecordRaw = {
	id?: string | number;
	party_mst_branch_id?: string | number;
	party_branch_name?: string;
	branch_address1?: string;
	fatory_address?: string;
	state_name?: string;
	state_id?: number;
	gst_no?: string;
};

export type CustomerRecordRaw = {
	id?: string | number;
	party_id?: string | number;
	supp_name?: string;
	party_name?: string;
	name?: string;
	supp_code?: string;
	party_code?: string;
	branches?: CustomerBranchRecordRaw[];
};

export type TransporterRecordRaw = {
	id?: string | number;
	transporter_id?: string | number;
	party_id?: string | number;
	transporter_name?: string;
	transporter_code?: string;
	name?: string;
};

export type BrokerRecordRaw = {
	id?: string | number;
	broker_id?: string | number;
	party_id?: string | number;
	broker_name?: string;
	broker_code?: string;
	name?: string;
};

export type ApprovedDeliveryOrderRecordRaw = {
	id?: string | number;
	sales_delivery_order_id?: string | number;
	delivery_order_no?: string;
	do_no?: string;
	delivery_order_date?: string;
	party_name?: string;
	net_amount?: number;
};

export type InvoiceTypeRecordRaw = {
	invoice_type_id?: string | number;
	invoice_type_name?: string;
};

export type ItemGroupRecordRaw = {
	id?: string | number;
	item_grp_id?: string | number;
	item_grp_code_display?: string;
	code?: string;
	item_grp_name_display?: string;
	name?: string;
};

export type ItemOptionRaw = {
	id?: string | number;
	item_id?: string | number;
	item_code?: string;
	item_name?: string;
	uom_id?: string | number | null;
	uom_name?: string | null;
	rate?: number | string | null;
	tax_percentage?: number | string | null;
};

export type ItemMakeOptionRaw = {
	id?: string | number;
	item_make_id?: string | number;
	item_make_name?: string;
	name?: string;
};

export type ItemUomOptionRaw = {
	id?: string | number;
	item_id?: string | number;
	map_to_id?: string | number;
	mapToId?: string | number;
	uom_id?: string | number;
	uom_name?: string;
	map_from_id?: string | number;
	map_from_name?: string;
	relation_value?: number | null;
	rounding?: number | null;
};

export type InvoiceSetup1ResponseRaw = {
	customers?: CustomerRecordRaw[];
	transporters?: TransporterRecordRaw[];
	brokers?: BrokerRecordRaw[];
	approved_delivery_orders?: ApprovedDeliveryOrderRecordRaw[];
	item_groups?: ItemGroupRecordRaw[];
	invoice_types?: InvoiceTypeRecordRaw[];
	branches?: unknown[];
};

export type InvoiceSetup2ResponseRaw = {
	item_grp_code?: string;
	item_grp_name?: string;
	items?: ItemOptionRaw[];
	makes?: ItemMakeOptionRaw[];
	uoms?: ItemUomOptionRaw[];
};
