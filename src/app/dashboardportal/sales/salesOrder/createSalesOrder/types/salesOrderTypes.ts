/**
 * Sales Order specific shared TypeScript definitions.
 */

export type Option = {
	label: string;
	value: string;
};

// ---------------------------------------------------------------------------
// Normalized UI Records
// ---------------------------------------------------------------------------

export type CustomerBranchRecord = {
	id: string;
	address: string;
	stateName?: string;
};

export type CustomerRecord = {
	id: string;
	name: string;
	code?: string;
	entityType?: string;
	msmeStatus?: string;
	branches?: CustomerBranchRecord[];
};

export type BrokerRecord = {
	id: string;
	name: string;
};

export type TransporterRecord = {
	id: string;
	name: string;
};

export type ApprovedQuotationRecord = {
	id: string;
	quotationNo: string;
	quotationDate?: string;
	partyName?: string;
	netAmount?: number;
};

export type BranchAddressRecord = {
	id: string;
	name: string;
	address1?: string;
	address2?: string;
	zipcode?: string;
	stateName?: string;
	stateId?: number;
	fullAddress?: string;
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
};

export type SalesOrderSetupData = {
	customers: CustomerRecord[];
	brokers: BrokerRecord[];
	transporters: TransporterRecord[];
	approvedQuotations: ApprovedQuotationRecord[];
	itemGroups: ItemGroupRecord[];
	branchAddresses: BranchAddressRecord[];
	coConfig?: {
		india_gst?: number;
		quotation_required?: number | boolean;
	};
};

// ---------------------------------------------------------------------------
// Editable Line Item
// ---------------------------------------------------------------------------

export type EditableLineItem = {
	id: string;
	quotationLineitemId?: number | null;
	hsnCode?: string;
	itemGroup: string;
	item: string;
	itemMake: string;
	quantity: string;
	rate: string;
	uom: string;
	discountType?: number;
	discountValue: string;
	discountAmount?: number;
	amount?: number;
	remarks: string;
	taxPercentage?: number;
	igstAmount?: number;
	cgstAmount?: number;
	sgstAmount?: number;
	taxAmount?: number;
};

// ---------------------------------------------------------------------------
// Raw API Records (for mapping)
// ---------------------------------------------------------------------------

export type CustomerRecordRaw = {
	id?: string | number;
	party_id?: string | number;
	party_name?: string;
	name?: string;
	party_code?: string;
	entity_type?: string;
	msme_status?: string;
	branches?: CustomerBranchRecordRaw[];
};

export type CustomerBranchRecordRaw = {
	id?: string | number;
	party_mst_branch_id?: string | number;
	branch_address1?: string;
	branch_address2?: string;
	state_name?: string;
	state?: string;
};

export type BrokerRecordRaw = {
	id?: string | number;
	party_id?: string | number;
	party_name?: string;
	name?: string;
};

export type TransporterRecordRaw = {
	id?: string | number;
	party_id?: string | number;
	party_name?: string;
	name?: string;
};

export type ApprovedQuotationRecordRaw = {
	sales_quotation_id?: string | number;
	quotation_no?: string;
	quotation_date?: string;
	party_name?: string;
	net_amount?: number;
};

export type BranchAddressRecordRaw = {
	id?: string | number;
	branch_id?: string | number;
	branch_name?: string;
	branch_address1?: string;
	branch_address2?: string;
	branch_zipcode?: string;
	state_name?: string;
	state_id?: number;
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
};

export type SalesOrderSetup1ResponseRaw = {
	customers?: CustomerRecordRaw[];
	brokers?: BrokerRecordRaw[];
	transporters?: TransporterRecordRaw[];
	approved_quotations?: ApprovedQuotationRecordRaw[];
	item_groups?: ItemGroupRecordRaw[];
	co_config?: Record<string, unknown>;
	branches?: Array<Record<string, unknown>>;
};

export type SalesOrderSetup2ResponseRaw = {
	item_grp_code?: string;
	item_grp_name?: string;
	items?: ItemOptionRaw[];
	makes?: ItemMakeOptionRaw[];
	uoms?: ItemUomOptionRaw[];
};
