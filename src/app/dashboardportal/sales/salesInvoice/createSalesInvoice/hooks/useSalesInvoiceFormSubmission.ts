import React from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { createInvoice, updateInvoice, type SaveInvoiceRequest } from "@/utils/salesInvoiceService";
import type { EditableLineItem } from "../types/salesInvoiceTypes";

type Params = {
	mode: "create" | "edit" | "view";
	pageError: string | null;
	setupError: string | null;
	filledLineItems: ReadonlyArray<EditableLineItem>;
	isLineItemsReady: boolean;
	requestedId: string;
	formValues: Record<string, unknown>;
};

export const useSalesInvoiceFormSubmission = ({
	mode, pageError, setupError, filledLineItems, isLineItemsReady, requestedId, formValues,
}: Params) => {
	const [saving, setSaving] = React.useState(false);
	const router = useRouter();

	const handleFormSubmit = React.useCallback(
		async (values: Record<string, unknown>) => {
			if (mode === "view" || pageError || setupError) return;

			if (!isLineItemsReady) {
				toast({ variant: "destructive", title: "Line items incomplete", description: "Add at least one item with valid quantity." });
				return;
			}

			const itemsPayload = filledLineItems.map((item) => ({
				item: item.item || "",
				item_make: item.itemMake || undefined,
				delivery_order_dtl_id: item.deliveryOrderDtlId,
				hsn_code: item.hsnCode || undefined,
				quantity: item.quantity || "0",
				uom: item.uom || "",
				rate: item.rate || undefined,
				discount_type: item.discountType,
				discounted_rate: item.discountedRate,
				discount_amount: item.discountAmount,
				net_amount: item.netAmount,
				total_amount: item.totalAmount,
				remarks: item.remarks || undefined,
				gst: {
					igst_amount: item.igstAmount || 0,
					igst_percent: item.igstPercent || 0,
					cgst_amount: item.cgstAmount || 0,
					cgst_percent: item.cgstPercent || 0,
					sgst_amount: item.sgstAmount || 0,
					sgst_percent: item.sgstPercent || 0,
					gst_total: item.gstTotal || 0,
				},
			}));

			const freightCharges = Number(values.freight_charges ?? formValues.freight_charges) || 0;
			const roundOff = Number(values.round_off ?? formValues.round_off) || 0;
			const grossAmount = filledLineItems.reduce((sum, l) => sum + (l.netAmount || 0), 0);
			const totalGST = filledLineItems.reduce((sum, l) => sum + (l.gstTotal || 0), 0);
			const taxPayable = totalGST;
			const netAmount = grossAmount + totalGST + freightCharges + roundOff;

			const payload: SaveInvoiceRequest = {
				branch: String(values.branch ?? formValues.branch ?? ""),
				date: String(values.date ?? formValues.date ?? ""),
				party: String(values.party ?? formValues.party ?? ""),
				party_branch: String(values.party_branch ?? formValues.party_branch ?? "") || undefined,
				delivery_order: String(values.delivery_order ?? formValues.delivery_order ?? "") || undefined,
				sales_delivery_order_id: String(values.delivery_order ?? formValues.delivery_order ?? "") || undefined,
				broker_id: String(values.broker ?? formValues.broker ?? "") || undefined,
				billing_to: String(values.billing_to ?? formValues.billing_to ?? "") || undefined,
				billing_to_id: String(values.billing_to ?? formValues.billing_to ?? "") || undefined,
				shipping_to: String(values.shipping_to ?? formValues.shipping_to ?? "") || undefined,
				shipping_to_id: String(values.shipping_to ?? formValues.shipping_to ?? "") || undefined,
				transporter: String(values.transporter ?? formValues.transporter ?? "") || undefined,
				transporter_name: String(values.transporter_name ?? formValues.transporter_name ?? "") || undefined,
				transporter_address: String(values.transporter_address ?? formValues.transporter_address ?? "") || undefined,
				transporter_state_code: String(values.transporter_state_code ?? formValues.transporter_state_code ?? "") || undefined,
				transporter_state_name: String(values.transporter_state_name ?? formValues.transporter_state_name ?? "") || undefined,
				vehicle_no: String(values.vehicle_no ?? formValues.vehicle_no ?? "") || undefined,
				eway_bill_no: String(values.eway_bill_no ?? formValues.eway_bill_no ?? "") || undefined,
				eway_bill_date: String(values.eway_bill_date ?? formValues.eway_bill_date ?? "") || undefined,
				challan_no: String(values.challan_no ?? formValues.challan_no ?? "") || undefined,
				challan_date: String(values.challan_date ?? formValues.challan_date ?? "") || undefined,
				invoice_type: String(values.invoice_type ?? formValues.invoice_type ?? "") || undefined,
				footer_note: String(values.footer_note ?? formValues.footer_note ?? "") || undefined,
				internal_note: String(values.internal_note ?? formValues.internal_note ?? "") || undefined,
				terms_conditions: String(values.terms_conditions ?? formValues.terms_conditions ?? "") || undefined,
				gross_amount: grossAmount,
				tax_amount: totalGST,
				tax_payable: taxPayable,
				net_amount: netAmount,
				freight_charges: freightCharges || undefined,
				round_off: roundOff || undefined,
				due_date: String(values.due_date ?? formValues.due_date ?? "") || undefined,
				type_of_sale: String(values.type_of_sale ?? formValues.type_of_sale ?? "") || undefined,
				tax_id: Number(values.tax_id ?? formValues.tax_id) || undefined,
				container_no: String(values.container_no ?? formValues.container_no ?? "") || undefined,
				contract_no: Number(values.contract_no ?? formValues.contract_no) || undefined,
				contract_date: String(values.contract_date ?? formValues.contract_date ?? "") || undefined,
				consignment_no: String(values.consignment_no ?? formValues.consignment_no ?? "") || undefined,
				consignment_date: String(values.consignment_date ?? formValues.consignment_date ?? "") || undefined,
				items: itemsPayload,
			};

			setSaving(true);
			try {
				if (mode === "edit" && requestedId) payload.id = requestedId;
				const fn = mode === "edit" && requestedId ? updateInvoice : createInvoice;
				const result = await fn(payload);
				const invoiceId = result?.invoice_id ?? requestedId;
				toast({ title: result?.message ?? (mode === "edit" ? "Sales invoice updated" : "Sales invoice created") });
				if (invoiceId) {
					router.replace(`/dashboardportal/sales/salesInvoice/createSalesInvoice?mode=view&id=${encodeURIComponent(String(invoiceId))}`);
				}
			} catch (error) {
				toast({ variant: "destructive", title: "Unable to save sales invoice", description: error instanceof Error ? error.message : "Please try again." });
			} finally {
				setSaving(false);
			}
		},
		[mode, pageError, setupError, filledLineItems, isLineItemsReady, requestedId, router, formValues],
	);

	return { saving, handleFormSubmit };
};
