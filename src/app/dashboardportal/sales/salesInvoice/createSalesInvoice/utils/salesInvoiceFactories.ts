import type { EditableLineItem } from "../types/salesInvoiceTypes";

let lineIdSeed = 0;

export const generateLineId = () => {
	lineIdSeed += 1;
	return `inv-line-${lineIdSeed}`;
};

export const createBlankLine = (): EditableLineItem => ({
	id: generateLineId(),
	itemGroup: "",
	item: "",
	itemMake: "",
	quantity: "",
	rate: "",
	uom: "",
	remarks: "",
});

export const buildDefaultFormValues = () => ({
	branch: "",
	date: new Date().toISOString().slice(0, 10),
	party: "",
	party_branch: "",
	delivery_order: "",
	billing_to: "",
	shipping_to: "",
	transporter: "",
	vehicle_no: "",
	eway_bill_no: "",
	eway_bill_date: "",
	challan_no: "",
	challan_date: "",
	invoice_type: "",
	footer_note: "",
	internal_note: "",
	terms_conditions: "",
	freight_charges: "",
	round_off: "",
	tcs_percentage: "",
	tcs_amount: "",
});
