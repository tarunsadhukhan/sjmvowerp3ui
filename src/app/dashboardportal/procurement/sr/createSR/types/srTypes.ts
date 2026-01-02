/**
 * Stores Receipt (SR) specific TypeScript definitions.
 * Keeping these in a dedicated module makes it easier to reuse them
 * across hooks, utils, and components without circular dependencies.
 */

/**
 * Basic label/value tuple used across SR forms.
 */
export type Option = {
	label: string;
	value: string;
};

/**
 * Warehouse option with branch association.
 */
export type WarehouseOption = {
	label: string;
	value: string;
	branchId?: number;
};

/**
 * Normalized representation of an SR line item used in the UI.
 */
export type SRLineItem = {
	id: string;
	inward_dtl_id: number;
	item_id: number;
	item_code: string;
	item_name: string;
	item_grp_id: number;
	item_grp_name: string;
	item_make_name: string;
	accepted_item_make_name: string;
	uom_id: number;
	uom_name: string;
	approved_qty: number;
	rejected_qty: number;
	po_rate: number;
	accepted_rate: number;
	amount: number;
	discount_mode: number | null;
	discount_value: number | null;
	discount_amount: number;
	tax_percentage: number;
	igst_amount: number;
	cgst_amount: number;
	sgst_amount: number;
	tax_amount: number;
	total_amount: number;
	remarks: string;
	warehouse_id: number | null;
	warehouse_name: string;
};

/**
 * SR header data from API.
 */
export type SRHeader = {
	inward_id: number;
	inward_no: string;
	inward_date: string;
	branch_id: number;
	branch_name: string;
	supplier_id: number;
	supplier_name: string;
	supplier_state_id: number | null;
	supplier_state_name: string;
	bill_branch_id: number | null;
	billing_branch_name: string;
	billing_state_id: number | null;
	billing_state_name: string;
	ship_branch_id: number | null;
	shipping_branch_name: string;
	shipping_state_id: number | null;
	shipping_state_name: string;
	india_gst: boolean;
	sr_no: string;
	sr_date: string;
	sr_status: number;
	sr_status_name: string;
	inspection_date: string;
	challan_no: string;
	challan_date: string;
	invoice_date: string;
	invoice_amount: number;
	invoice_recvd_date: string;
	vehicle_number: string;
	driver_name: string;
	driver_contact_no: string;
	consignment_no: string;
	consignment_date: string;
	ewaybillno: string;
	ewaybill_date: string;
	despatch_remarks: string;
	receipts_remarks: string;
	sr_remarks: string;
	gross_amount: number;
	net_amount: number;
};

/**
 * SR totals calculated from line items.
 */
export type SRTotals = {
	grossAmount: number;
	totalDiscount: number;
	netAmount: number;
	totalIGST: number;
	totalCGST: number;
	totalSGST: number;
	totalTax: number;
	grandTotal: number;
};

/**
 * Raw line item structure from API before mapping.
 */
export type SRLineItemRaw = {
	inward_dtl_id?: number;
	item_id?: number;
	item_code?: string;
	item_name?: string;
	item_grp_id?: number;
	item_grp_name?: string;
	item_make_name?: string;
	accepted_item_make_name?: string;
	uom_id?: number;
	uom_name?: string;
	approved_qty?: number;
	rejected_qty?: number;
	po_rate?: number;
	rate?: number;
	accepted_rate?: number;
	amount?: number;
	discount_mode?: number | null;
	discount_value?: number | null;
	discount_amount?: number | null;
	tax_percentage?: number;
	remarks?: string;
	warehouse_id?: number | null;
	warehouse_name?: string;
};

/**
 * Raw header structure from API before mapping.
 */
export type SRHeaderRaw = {
	inward_id?: number;
	inward_no?: string;
	inward_date?: string;
	branch_id?: number;
	branch_name?: string;
	supplier_id?: number;
	supplier_name?: string;
	supplier_state_id?: number | null;
	supplier_state_name?: string;
	bill_branch_id?: number | null;
	billing_branch_name?: string;
	billing_state_id?: number | null;
	billing_state_name?: string;
	ship_branch_id?: number | null;
	shipping_branch_name?: string;
	shipping_state_id?: number | null;
	shipping_state_name?: string;
	india_gst?: boolean | number;
	sr_no?: string;
	sr_date?: string;
	sr_status?: number;
	sr_status_name?: string;
	inspection_date?: string;
	challan_no?: string;
	challan_date?: string;
	invoice_date?: string;
	invoice_amount?: number;
	invoice_recvd_date?: string;
	vehicle_number?: string;
	driver_name?: string;
	driver_contact_no?: string;
	consignment_no?: string;
	consignment_date?: string;
	ewaybillno?: string;
	ewaybill_date?: string;
	despatch_remarks?: string;
	receipts_remarks?: string;
	sr_remarks?: string;
	gross_amount?: number;
	net_amount?: number;
};
