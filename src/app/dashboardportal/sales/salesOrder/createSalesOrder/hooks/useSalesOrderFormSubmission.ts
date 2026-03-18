import React from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { createSalesOrder, updateSalesOrder, type CreateSalesOrderRequest } from "@/utils/salesOrderService";
import type { EditableLineItem } from "../types/salesOrderTypes";
import { isJuteOrder, isGovtSkgOrder, isJuteYarnOrder } from "../utils/salesOrderConstants";

type UseSalesOrderFormSubmissionParams = {
	mode: "create" | "edit" | "view";
	pageError: string | null;
	setupError: string | null;
	filledLineItems: ReadonlyArray<EditableLineItem>;
	isLineItemsReady: boolean;
	requestedId: string;
	formValues: Record<string, unknown>;
};

export const useSalesOrderFormSubmission = ({
	mode,
	pageError,
	setupError,
	filledLineItems,
	isLineItemsReady,
	requestedId,
	formValues,
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

			const invoiceTypeId = String(values.invoice_type ?? "");
			const isHessian = invoiceTypeId ? Number(invoiceTypeId) === 2 : false;

			const itemsPayload: CreateSalesOrderRequest["items"] = filledLineItems.map((item) => ({
				item: item.item || undefined,
				item_make: item.itemMake || undefined,
				quotation_lineitem_id: item.quotationLineitemId ?? undefined,
				hsn_code: item.hsnCode || undefined,
				quantity: item.quantity || undefined,
				qty_uom: item.uom || undefined,
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
				hessian: isHessian && item.qtyBales ? {
					qty_bales: Number(item.qtyBales) || null,
					rate_per_bale: item.ratePerBale ?? null,
					billing_rate_mt: item.billingRateMt ?? null,
					billing_rate_bale: item.billingRateBale ?? null,
				} : undefined,
				jute_dtl: isJuteOrder(invoiceTypeId) && item.juteClaimRate ? {
					claim_amount_dtl: Number(item.juteClaimAmountDtl) || null,
					claim_desc: item.juteClaimDesc || null,
					claim_rate: Number(item.juteClaimRate) || null,
					unit_conversion: item.juteUnitConversion || null,
					qty_untit_conversion: Number(item.juteQtyUnitConversion) || null,
				} : undefined,
				govtskg_dtl: isGovtSkgOrder(invoiceTypeId) ? {
					pack_sheet: Number(item.govtskgPackSheet) || null,
					net_weight: Number(item.govtskgNetWeight) || null,
					total_weight: Number(item.govtskgTotalWeight) || null,
				} : undefined,
			}));

			// Calculate totals
			const grossAmount = filledLineItems.reduce((sum, li) => sum + (li.amount ?? 0), 0);
			const totalTax = filledLineItems.reduce((sum, li) => sum + (li.taxAmount ?? 0), 0);
			const freightCharges = values.freight_charges ? Number(values.freight_charges) : 0;
			const netAmount = grossAmount + totalTax + freightCharges;

			// Build header-level extension data conditionally
			const juteHeader = isJuteOrder(invoiceTypeId) ? {
				mr_no: String(values.jute_mr_no ?? formValues.jute_mr_no ?? "") || undefined,
				mukam_id: String(values.jute_mukam_id ?? formValues.jute_mukam_id ?? "") || undefined,
				claim_amount: Number(values.jute_claim_amount ?? formValues.jute_claim_amount) || undefined,
				claim_description: String(values.jute_claim_description ?? formValues.jute_claim_description ?? "") || undefined,
			} : undefined;

			const govtskgHeader = isGovtSkgOrder(invoiceTypeId) ? {
				pcso_no: String(values.govtskg_pcso_no ?? formValues.govtskg_pcso_no ?? "") || undefined,
				pcso_date: String(values.govtskg_pcso_date ?? formValues.govtskg_pcso_date ?? "") || undefined,
				administrative_office_address: String(values.govtskg_admin_office ?? formValues.govtskg_admin_office ?? "") || undefined,
				destination_rail_head: String(values.govtskg_rail_head ?? formValues.govtskg_rail_head ?? "") || undefined,
				loading_point: String(values.govtskg_loading_point ?? formValues.govtskg_loading_point ?? "") || undefined,
			} : undefined;

			const juteyarnHeader = isJuteYarnOrder(invoiceTypeId) ? {
				pcso_no: String(values.juteyarn_pcso_no ?? formValues.juteyarn_pcso_no ?? "") || undefined,
				container_no: String(values.juteyarn_container_no ?? formValues.juteyarn_container_no ?? "") || undefined,
				customer_ref_no: String(values.juteyarn_customer_ref_no ?? formValues.juteyarn_customer_ref_no ?? "") || undefined,
			} : undefined;

			setSaving(true);
			try {
				if (mode === "edit" && requestedId) {
					const updatePayload = {
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
					} as Parameters<typeof updateSalesOrder>[0];
					if (juteHeader) (updatePayload as Record<string, unknown>).jute = juteHeader;
					if (govtskgHeader) (updatePayload as Record<string, unknown>).govtskg = govtskgHeader;
					if (juteyarnHeader) (updatePayload as Record<string, unknown>).juteyarn = juteyarnHeader;
					await updateSalesOrder(updatePayload);
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
					if (juteHeader) payload.jute = juteHeader;
					if (govtskgHeader) payload.govtskg = govtskgHeader;
					if (juteyarnHeader) payload.juteyarn = juteyarnHeader;
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
		[mode, pageError, setupError, filledLineItems, isLineItemsReady, requestedId, formValues, router],
	);

	return { saving, handleFormSubmit };
};
