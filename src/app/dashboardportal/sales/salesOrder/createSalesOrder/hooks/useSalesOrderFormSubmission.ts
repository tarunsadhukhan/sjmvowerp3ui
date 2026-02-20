import React from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { createSalesOrder, updateSalesOrder, type CreateSalesOrderRequest } from "@/utils/salesOrderService";
import type { EditableLineItem } from "../types/salesOrderTypes";

type UseSalesOrderFormSubmissionParams = {
	mode: "create" | "edit" | "view";
	pageError: string | null;
	setupError: string | null;
	filledLineItems: ReadonlyArray<EditableLineItem>;
	isLineItemsReady: boolean;
	requestedId: string;
};

export const useSalesOrderFormSubmission = ({
	mode,
	pageError,
	setupError,
	filledLineItems,
	isLineItemsReady,
	requestedId,
}: UseSalesOrderFormSubmissionParams) => {
	const [saving, setSaving] = React.useState(false);
	const router = useRouter();

	const handleFormSubmit = React.useCallback(
		async (values: Record<string, unknown>) => {
			if (mode === "view" || pageError || setupError) return;

			if (!isLineItemsReady) {
				toast({ variant: "destructive", title: "Line items incomplete", description: "Add at least one item with valid quantity and rate." });
				return;
			}

			const itemsPayload: CreateSalesOrderRequest["items"] = filledLineItems.map((item) => ({
				item: item.item || undefined,
				item_make: item.itemMake || undefined,
				quotation_lineitem_id: item.quotationLineitemId ?? undefined,
				hsn_code: item.hsnCode || undefined,
				quantity: item.quantity || undefined,
				uom: item.uom || undefined,
				rate: item.rate || undefined,
				discount_type: item.discountType ?? undefined,
				discounted_rate: item.discountAmount != null ? Number(item.discountAmount) || undefined : undefined,
				discount_amount: item.discountAmount ?? undefined,
				net_amount: item.amount ?? undefined,
				total_amount: (item.amount ?? 0) + (item.taxAmount ?? 0) || undefined,
				remarks: item.remarks || undefined,
				gst: {
					igst_amount: item.igstAmount ?? 0,
					igst_percent: item.taxPercentage && item.igstAmount ? item.taxPercentage : 0,
					cgst_amount: item.cgstAmount ?? 0,
					cgst_percent: item.taxPercentage && item.cgstAmount ? item.taxPercentage / 2 : 0,
					sgst_amount: item.sgstAmount ?? 0,
					sgst_percent: item.taxPercentage && item.sgstAmount ? item.taxPercentage / 2 : 0,
					gst_total: item.taxAmount ?? 0,
				},
			}));

			// Calculate totals
			const grossAmount = filledLineItems.reduce((sum, li) => sum + (li.amount ?? 0), 0);
			const totalTax = filledLineItems.reduce((sum, li) => sum + (li.taxAmount ?? 0), 0);
			const freightCharges = values.freight_charges ? Number(values.freight_charges) : 0;
			const netAmount = grossAmount + totalTax + freightCharges;

			setSaving(true);
			try {
				if (mode === "edit" && requestedId) {
					await updateSalesOrder({
						id: requestedId,
						branch: String(values.branch ?? ""),
						party: values.party ? String(values.party) : undefined,
						partyBranch: values.party_branch ? String(values.party_branch) : undefined,
						salesOrderDate: String(values.date ?? ""),
						salesOrderExpiryDate: values.expiry_date ? String(values.expiry_date) : undefined,
						quotation: values.quotation ? String(values.quotation) : undefined,
						invoiceType: values.invoice_type ? Number(values.invoice_type) : undefined,
						broker: values.broker ? String(values.broker) : undefined,
						brokerCommissionPercent: values.broker_commission_percent ? Number(values.broker_commission_percent) : undefined,
						billingTo: values.billing_to ? String(values.billing_to) : undefined,
						shippingTo: values.shipping_to ? String(values.shipping_to) : undefined,
						transporter: values.transporter ? String(values.transporter) : undefined,
						deliveryTerms: values.delivery_terms ? String(values.delivery_terms) : undefined,
						paymentTerms: values.payment_terms ? String(values.payment_terms) : undefined,
						deliveryDays: values.delivery_days ? Number(values.delivery_days) : undefined,
						freightCharges: freightCharges || undefined,
						footerNote: values.footer_note ? String(values.footer_note) : undefined,
						internalNote: values.internal_note ? String(values.internal_note) : undefined,
						termsConditions: values.terms_conditions ? String(values.terms_conditions) : undefined,
						grossAmount,
						netAmount,
						items: itemsPayload,
					} as Parameters<typeof updateSalesOrder>[0]);
					toast({ title: "Sales order updated" });
					router.replace(`/dashboardportal/sales/salesOrder/createSalesOrder?mode=view&id=${requestedId}`);
				} else {
					const payload: CreateSalesOrderRequest = {
						branch: String(values.branch ?? ""),
						date: String(values.date ?? ""),
						party: values.party ? String(values.party) : undefined,
						party_branch: values.party_branch ? String(values.party_branch) : undefined,
						quotation: values.quotation ? String(values.quotation) : undefined,
						invoice_type: values.invoice_type ? Number(values.invoice_type) : undefined,
						broker: values.broker ? String(values.broker) : undefined,
						broker_commission_percent: values.broker_commission_percent ? Number(values.broker_commission_percent) : undefined,
						billing_to: values.billing_to ? String(values.billing_to) : undefined,
						shipping_to: values.shipping_to ? String(values.shipping_to) : undefined,
						transporter: values.transporter ? String(values.transporter) : undefined,
						expiry_date: values.expiry_date ? String(values.expiry_date) : undefined,
						delivery_terms: values.delivery_terms ? String(values.delivery_terms) : undefined,
						payment_terms: values.payment_terms ? String(values.payment_terms) : undefined,
						delivery_days: values.delivery_days ? Number(values.delivery_days) : undefined,
						freight_charges: freightCharges || undefined,
						footer_note: values.footer_note ? String(values.footer_note) : undefined,
						internal_note: values.internal_note ? String(values.internal_note) : undefined,
						terms_conditions: values.terms_conditions ? String(values.terms_conditions) : undefined,
						gross_amount: grossAmount,
						net_amount: netAmount,
						items: itemsPayload,
					};
					const result = await createSalesOrder(payload);
					toast({ title: result?.message ?? "Sales order created" });
					const newId = result?.sales_order_id;
					if (newId) {
						router.replace(`/dashboardportal/sales/salesOrder/createSalesOrder?mode=view&id=${newId}`);
					}
				}
			} catch (error) {
				toast({ variant: "destructive", title: "Unable to save sales order", description: error instanceof Error ? error.message : "Please try again." });
			} finally {
				setSaving(false);
			}
		},
		[mode, pageError, setupError, filledLineItems, isLineItemsReady, requestedId, router],
	);

	return { saving, handleFormSubmit };
};
