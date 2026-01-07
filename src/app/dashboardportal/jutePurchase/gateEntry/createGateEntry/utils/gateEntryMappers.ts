/**
 * @file gateEntryMappers.ts
 * @description Mapper functions for API responses to UI types.
 */

import type {
	GateEntrySetupData,
	GateEntryDetails,
	GateEntryFormValues,
	GateEntryLineItem,
	GateEntryLineItemAPI,
	Option,
	BranchRecord,
	SupplierRecord,
	MukamRecord,
	JuteItemRecord,
	OpenPORecord,
	VehicleTypeRecord,
} from "../types/gateEntryTypes";
import { generateLineId } from "./gateEntryFactories";

// =============================================================================
// SETUP DATA MAPPERS
// =============================================================================

export const mapBranches = (raw: unknown[]): BranchRecord[] =>
	raw.map((r) => {
		const data = r as Record<string, unknown>;
		return {
			branch_id: Number(data.branch_id ?? 0),
			branch_name: String(data.branch_name ?? ""),
		};
	});

export const mapSuppliers = (raw: unknown[]): SupplierRecord[] =>
	raw.map((r) => {
		const data = r as Record<string, unknown>;
		return {
			supplier_id: Number(data.supplier_id ?? 0),
			supplier_name: String(data.supplier_name ?? ""),
		};
	});

export const mapMukams = (raw: unknown[]): MukamRecord[] =>
	raw.map((r) => {
		const data = r as Record<string, unknown>;
		return {
			mukam_id: Number(data.mukam_id ?? 0),
			mukam_name: String(data.mukam_name ?? ""),
		};
	});

export const mapJuteItems = (raw: unknown[]): JuteItemRecord[] =>
	raw.map((r) => {
		const data = r as Record<string, unknown>;
		return {
			item_id: Number(data.item_id ?? 0),
			item_code: String(data.item_code ?? ""),
			item_name: String(data.item_name ?? ""),
			item_grp_id: data.item_grp_id ? Number(data.item_grp_id) : undefined,
			item_grp_name: data.item_grp_name ? String(data.item_grp_name) : undefined,
			default_uom_id: data.default_uom_id ? Number(data.default_uom_id) : undefined,
			default_uom: data.default_uom ? String(data.default_uom) : undefined,
		};
	});

export const mapOpenPOs = (raw: unknown[]): OpenPORecord[] =>
	raw.map((r) => {
		const data = r as Record<string, unknown>;
		return {
			jute_po_id: Number(data.jute_po_id ?? 0),
			po_num: String(data.po_num ?? ""),
			po_date: String(data.po_date ?? ""),
			supplier_id: data.supplier_id ? Number(data.supplier_id) : undefined,
			supplier_name: data.supplier_name ? String(data.supplier_name) : undefined,
			mukam_name: data.mukam_name ? String(data.mukam_name) : undefined,
			total_weight: data.total_weight ? Number(data.total_weight) : undefined,
			jute_uom: data.jute_uom ? String(data.jute_uom) : undefined,
		};
	});

export const mapVehicleTypes = (raw: unknown[]): VehicleTypeRecord[] =>
	raw.map((r) => {
		const data = r as Record<string, unknown>;
		return {
			vehicle_type_id: Number(data.vehicle_type_id ?? 0),
			vehicle_type: String(data.vehicle_type ?? ""),
			capacity_weight: data.capacity_weight ? Number(data.capacity_weight) : undefined,
		};
	});

export const mapGateEntrySetupResponse = (response: unknown): GateEntrySetupData => {
	const data = response as Record<string, unknown>;
	return {
		branches: mapBranches((data.branches as unknown[]) ?? []),
		mukams: mapMukams((data.mukams as unknown[]) ?? []),
		suppliers: mapSuppliers((data.suppliers as unknown[]) ?? []),
		jute_items: mapJuteItems((data.jute_items as unknown[]) ?? []),
		open_pos: mapOpenPOs((data.open_pos as unknown[]) ?? []),
		uom_options: ((data.uom_options as unknown[]) ?? []).map((o) => {
			const opt = o as Record<string, unknown>;
			return { label: String(opt.label ?? ""), value: String(opt.value ?? "") };
		}),
		vehicle_types: mapVehicleTypes((data.vehicle_types as unknown[]) ?? []),
	};
};

// =============================================================================
// BRANCH OPTIONS BUILDER
// =============================================================================

export const buildBranchOptions = (branches: BranchRecord[]): Option[] =>
	branches.map((b) => ({
		label: b.branch_name,
		value: String(b.branch_id),
	}));

export const buildSupplierOptions = (suppliers: SupplierRecord[]): Option[] =>
	suppliers.map((s) => ({
		label: s.supplier_name,
		value: String(s.supplier_id),
	}));

export const buildMukamOptions = (mukams: MukamRecord[]): Option[] =>
	mukams.map((m) => ({
		label: m.mukam_name,
		value: m.mukam_name, // Use mukam_name as value since DB stores text
	}));

export const buildItemOptions = (items: JuteItemRecord[]): Option[] =>
	items.map((i) => ({
		label: i.item_name,
		value: String(i.item_id),
	}));

export const buildPOOptions = (pos: OpenPORecord[]): Option[] =>
	pos.map((p) => ({
		label: `${p.po_num} (${p.supplier_name ?? "Unknown"})`,
		value: String(p.jute_po_id),
	}));

export const buildVehicleTypeOptions = (vehicleTypes: VehicleTypeRecord[]): Option[] =>
	vehicleTypes.map((v) => ({
		label: v.vehicle_type,
		value: String(v.vehicle_type_id),
	}));

// =============================================================================
// DETAILS TO FORM VALUES MAPPER
// =============================================================================

export const extractFormValuesFromDetails = (details: GateEntryDetails): GateEntryFormValues => {
	// Extract time from in_time string (format: "2025-01-06 14:30:00")
	let entryTime = "";
	if (details.in_time) {
		const timePart = details.in_time.split(" ")[1];
		if (timePart) {
			entryTime = timePart.slice(0, 5); // "14:30"
		}
	}

	// Extract time from out_time string
	let outTime = "";
	if (details.out_time) {
		const timePart = details.out_time.split(" ")[1];
		if (timePart) {
			outTime = timePart.slice(0, 5);
		}
	}

	// Extract date from out_date
	let outDate = "";
	if (details.out_date) {
		outDate = details.out_date.split(" ")[0] ?? details.out_date.slice(0, 10);
	}

	return {
		branch: String(details.branch_id ?? ""),
		entryDate: details.jute_gate_entry_date?.split(" ")[0] ?? details.jute_gate_entry_date?.slice(0, 10) ?? "",
		entryTime,
		challanNo: details.challan_no ?? "",
		challanDate: details.challan_date?.split(" ")[0] ?? details.challan_date?.slice(0, 10) ?? "",
		vehicleNo: details.vehicle_no ?? "",
		vehicleType: details.vehicle_type_id ? String(details.vehicle_type_id) : "",
		driverName: details.driver_name ?? "",
		transporter: details.transporter ?? "",
		poId: details.po_id ? String(details.po_id) : "",
		juteUom: details.jute_uom ?? "LOOSE",
		mukam: details.mukam ?? "",
		supplier: String(details.jute_supplier_id ?? ""),
		party: details.party_id ? String(details.party_id) : "",
		grossWeight: String(details.gross_weight ?? ""),
		tareWeight: String(details.tare_weight ?? ""),
		challanWeight: String(details.challan_weight ?? ""),
		netWeight: String(details.net_weight ?? ""),
		variableShortage: String(details.variable_shortage ?? ""),
		actualWeight: String(details.actual_weight ?? ""),
		marketingSlip: details.marketing_slip === 1,
		remarks: details.remarks ?? "",
		outDate,
		outTime,
	};
};

// =============================================================================
// LINE ITEMS MAPPER
// =============================================================================

export const mapLineItemsFromAPI = (lineItems: GateEntryLineItemAPI[]): GateEntryLineItem[] =>
	lineItems.map((li) => ({
		id: generateLineId(),
		challanItem: li.challan_item_id ? String(li.challan_item_id) : "",
		challanQuality: li.challan_jute_quality_id ? String(li.challan_jute_quality_id) : "",
		challanQty: li.challan_quantity ? String(li.challan_quantity) : "",
		challanWeight: li.challan_weight ? String(li.challan_weight) : "",
		actualItem: li.actual_item_id ? String(li.actual_item_id) : "",
		actualQuality: li.actual_jute_quality_id ? String(li.actual_jute_quality_id) : "",
		actualQty: li.actual_quantity ? String(li.actual_quantity) : "",
		actualWeight: li.actual_weight ? String(li.actual_weight) : "",
		remarks: li.remarks ?? "",
	}));

// =============================================================================
// FORM TO API PAYLOAD MAPPERS
// =============================================================================

export const mapFormToCreatePayload = (
	formValues: GateEntryFormValues,
	lineItems: GateEntryLineItem[],
	coId: number
) => {
	// Filter out empty line items
	const validLineItems = lineItems.filter(
		(li) => li.challanItem || li.actualItem || li.challanQty || li.actualQty
	);

	return {
		co_id: coId,
		branch_id: parseInt(formValues.branch, 10),
		jute_gate_entry_date: formValues.entryDate,
		in_time: formValues.entryTime || null,
		challan_no: formValues.challanNo,
		challan_date: formValues.challanDate,
		challan_weight: parseFloat(formValues.challanWeight) || 0,
		vehicle_no: formValues.vehicleNo,
		driver_name: formValues.driverName,
		transporter: formValues.transporter,
		po_id: formValues.poId ? parseInt(formValues.poId, 10) : null,
		jute_uom: formValues.juteUom,
		mukam_id: formValues.mukam,
		jute_supplier_id: parseInt(formValues.supplier, 10),
		party_id: formValues.party ? parseInt(formValues.party, 10) : null,
		gross_weight: parseFloat(formValues.grossWeight) || 0,
		tare_weight: parseFloat(formValues.tareWeight) || 0,
		net_weight: parseFloat(formValues.netWeight) || 0,
		variable_shortage: formValues.variableShortage ? parseFloat(formValues.variableShortage) : 0,
		vehicle_type_id: formValues.vehicleType ? parseInt(formValues.vehicleType, 10) : null,
		marketing_slip: formValues.marketingSlip ? 1 : 0,
		remarks: formValues.remarks || null,
		line_items: validLineItems.map((li) => ({
			challan_item_id: li.challanItem ? parseInt(li.challanItem, 10) : null,
			challan_jute_quality_id: li.challanQuality ? parseInt(li.challanQuality, 10) : null,
			challan_quantity: li.challanQty ? parseFloat(li.challanQty) : null,
			challan_weight: li.challanWeight ? parseFloat(li.challanWeight) : null,
			actual_item_id: li.actualItem ? parseInt(li.actualItem, 10) : null,
			actual_jute_quality_id: li.actualQuality ? parseInt(li.actualQuality, 10) : null,
			actual_quantity: li.actualQty ? parseFloat(li.actualQty) : null,
			actual_weight: li.actualWeight ? parseFloat(li.actualWeight) : null,
			jute_uom: formValues.juteUom,
			remarks: li.remarks || null,
		})),
	};
};

export const mapFormToUpdatePayload = (
	formValues: GateEntryFormValues,
	lineItems: GateEntryLineItem[],
	action?: string
) => {
	const validLineItems = lineItems.filter(
		(li) => li.challanItem || li.actualItem || li.challanQty || li.actualQty
	);

	return {
		branch_id: formValues.branch ? parseInt(formValues.branch, 10) : null,
		jute_gate_entry_date: formValues.entryDate || null,
		in_time: formValues.entryTime || null,
		out_date: formValues.outDate || null,
		out_time: formValues.outTime || null,
		challan_no: formValues.challanNo || null,
		challan_date: formValues.challanDate || null,
		challan_weight: formValues.challanWeight ? parseFloat(formValues.challanWeight) : null,
		vehicle_no: formValues.vehicleNo || null,
		driver_name: formValues.driverName || null,
		transporter: formValues.transporter || null,
		po_id: formValues.poId ? parseInt(formValues.poId, 10) : null,
		jute_uom: formValues.juteUom || null,
		mukam_id: formValues.mukam || null,
		jute_supplier_id: formValues.supplier ? parseInt(formValues.supplier, 10) : null,
		party_id: formValues.party ? parseInt(formValues.party, 10) : null,
		gross_weight: formValues.grossWeight ? parseFloat(formValues.grossWeight) : null,
		tare_weight: formValues.tareWeight ? parseFloat(formValues.tareWeight) : null,
		net_weight: formValues.netWeight ? parseFloat(formValues.netWeight) : null,
		variable_shortage: formValues.variableShortage ? parseFloat(formValues.variableShortage) : null,
		vehicle_type_id: formValues.vehicleType ? parseInt(formValues.vehicleType, 10) : null,
		marketing_slip: formValues.marketingSlip ? 1 : 0,
		remarks: formValues.remarks || null,
		action: action || null,
		line_items: validLineItems.map((li) => ({
			challan_item_id: li.challanItem ? parseInt(li.challanItem, 10) : null,
			challan_jute_quality_id: li.challanQuality ? parseInt(li.challanQuality, 10) : null,
			challan_quantity: li.challanQty ? parseFloat(li.challanQty) : null,
			challan_weight: li.challanWeight ? parseFloat(li.challanWeight) : null,
			actual_item_id: li.actualItem ? parseInt(li.actualItem, 10) : null,
			actual_jute_quality_id: li.actualQuality ? parseInt(li.actualQuality, 10) : null,
			actual_quantity: li.actualQty ? parseFloat(li.actualQty) : null,
			actual_weight: li.actualWeight ? parseFloat(li.actualWeight) : null,
			jute_uom: formValues.juteUom,
			remarks: li.remarks || null,
		})),
	};
};
