/**
 * @file materialInspectionTypes.ts
 * @description Type definitions for Jute Material Inspection (jute gate entry QC) module.
 */

export type MuiFormMode = "create" | "edit" | "view";

// Header from /juteMaterialInspection/get_inspection_by_id
export type JuteMaterialInspectionHeader = {
	jute_gate_entry_id: number;
	branch_gate_entry_no: number | null;
	branch_id: number;
	branch_name: string;
	jute_gate_entry_date: string;
	unit_conversion: string | null;
	mukam_id: number | null;
	mukam: string | null;
	vehicle_no: string | null;
	challan_no: string | null;
	challan_date: string | null;
	challan_weight: number | null;
	gross_weight: number | null;
	tare_weight: number | null;
	net_weight: number | null;
	variable_shortage: number | null;
	jute_supplier_id: number | null;
	supplier_name: string | null;
	party_id: number | null;
	po_id: number | null;
	qc_check: string;
	status_id: number | null;
	status: string | null;
	remarks: string | null;
	updated_by: number | null;
	updated_date_time: string | null;
};

// Line item from get_material_inspection_line_items_query
export type JuteMaterialInspectionLineItemAPI = {
	jute_gate_entry_li_id: number;
	jute_gate_entry_id: number;
	po_line_item_num: number | null;

	// Challan details
	challan_item_id: number | null;
	challan_item_name: string | null;
	challan_jute_quality_id: number | null;
	challan_quality_name: string | null;
	challan_quantity: number | null;
	challan_weight: number | null;

	// Actual (received) details
	actual_item_id: number | null;
	actual_item_name: string | null;
	actual_jute_quality_id: number | null;
	actual_quality_name: string | null;
	actual_quantity: number | null;
	actual_weight: number | null;

	allowable_moisture: number | null;
	jute_uom: string | null;
	remarks: string | null;
	active: number | null;
};

// UI line item type used in the inspection page
export type InspectionLineItem = {
	id: string;
	gateEntryLineItemId: number;
	actualItemId: number | null;
	actualItemName: string;
	actualQualityId: number | null;
	actualQualityName: string;
	actualQty: number | null;
	actualWeight: number | null;
	allowableMoisture: number | null;
	juteUom: string | null;
	remarks: string | null;
	// Moisture info (client-side state until QC complete)
	averageMoisture: number | null;
	hasMoisture: boolean;
};

export type MoistureReadingState = {
	lineItemId: string;
	readings: number[];
	average: number | null;
};

