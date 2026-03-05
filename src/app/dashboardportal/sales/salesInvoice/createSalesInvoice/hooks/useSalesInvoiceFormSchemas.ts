import React from "react";
import type { Schema, Field } from "@/components/ui/muiform";
import type { Option } from "../types/salesInvoiceTypes";

export type UseHeaderSchemaParams = {
	branchOptions: Option[];
	customerOptions: Option[];
	customerBranchOptions: Option[];
	transporterOptions: Option[];
	brokerOptions: Option[];
	deliveryOrderOptions: Option[];
	invoiceTypeOptions: Option[];
	mode: "create" | "edit" | "view";
	headerFieldsDisabled: boolean;
};

export type UseFooterSchemaParams = {
	mode: "create" | "edit" | "view";
};

export const useSalesInvoiceHeaderSchema = ({
	branchOptions, customerOptions, customerBranchOptions,
	transporterOptions, brokerOptions, deliveryOrderOptions, invoiceTypeOptions, mode, headerFieldsDisabled,
}: UseHeaderSchemaParams): Schema =>
	React.useMemo(() => {
		const fields: Field[] = [
			{ name: "branch", label: "Branch", type: "select", options: branchOptions, required: true, disabled: mode !== "create", grid: { xs: 12, md: 4 } },
			{ name: "date", label: "Invoice Date", type: "date", required: true, disabled: mode === "view", grid: { xs: 12, md: 4 } },
			{ name: "invoice_type", label: "Invoice Type", type: "select", options: invoiceTypeOptions, disabled: headerFieldsDisabled, grid: { xs: 12, md: 4 } },
			{ name: "party", label: "Customer", type: "select", options: customerOptions, required: true, disabled: headerFieldsDisabled, grid: { xs: 12, md: 4 } },
			{ name: "broker", label: "Broker", type: "select", options: brokerOptions, disabled: headerFieldsDisabled, grid: { xs: 12, md: 4 } },
			{ name: "delivery_order", label: "Delivery Order", type: "select", options: deliveryOrderOptions, disabled: headerFieldsDisabled, grid: { xs: 12, md: 4 } },
			{ name: "billing_to", label: "Billing To", type: "select", options: customerBranchOptions, disabled: headerFieldsDisabled, grid: { xs: 12, md: 4 } },
			{ name: "shipping_to", label: "Shipping To", type: "select", options: customerBranchOptions, disabled: headerFieldsDisabled, grid: { xs: 12, md: 4 } },
			{ name: "transporter", label: "Transporter", type: "select", options: transporterOptions, disabled: headerFieldsDisabled, grid: { xs: 12, md: 4 } },
			{ name: "vehicle_no", label: "Vehicle No.", type: "text", disabled: headerFieldsDisabled, grid: { xs: 12, md: 4 } },
			{ name: "challan_no", label: "Challan No.", type: "text", disabled: headerFieldsDisabled, grid: { xs: 12, md: 4 } },
			{ name: "challan_date", label: "Challan Date", type: "date", disabled: headerFieldsDisabled, grid: { xs: 12, md: 4 } },
			{ name: "eway_bill_no", label: "E-Way Bill No.", type: "text", disabled: headerFieldsDisabled, grid: { xs: 12, md: 4 } },
			{ name: "eway_bill_date", label: "E-Way Bill Date", type: "date", disabled: headerFieldsDisabled, grid: { xs: 12, md: 4 } },
		];
		return { fields } satisfies Schema;
	}, [branchOptions, customerOptions, customerBranchOptions, transporterOptions, brokerOptions, deliveryOrderOptions, invoiceTypeOptions, mode, headerFieldsDisabled]);

export type UseJuteHeaderSchemaParams = {
	mode: "create" | "edit" | "view";
	headerFieldsDisabled: boolean;
	mukamOptions?: Option[];
};

export const useSalesInvoiceJuteHeaderSchema = ({
	mode, headerFieldsDisabled, mukamOptions,
}: UseJuteHeaderSchemaParams): Schema =>
	React.useMemo(() => {
		const disabled = headerFieldsDisabled || mode === "view";
		const fields: Field[] = [
			{ name: "jute_mr_no", label: "MR No.", type: "text", disabled, grid: { xs: 12, md: 3 } },
			{ name: "jute_mukam_id", label: "Mukam", type: "select", options: mukamOptions ?? [], disabled, grid: { xs: 12, md: 3 } },
			{ name: "jute_claim_amount", label: "Claim Amount", type: "text", disabled, grid: { xs: 12, md: 3 } },
			{ name: "jute_claim_description", label: "Claim Description", type: "textarea", disabled, grid: { xs: 12, md: 3 } },
		];
		return { fields } satisfies Schema;
	}, [mode, headerFieldsDisabled, mukamOptions]);

export const useSalesInvoiceFooterSchema = ({ mode }: UseFooterSchemaParams): Schema =>
	React.useMemo(() => {
		const disabled = mode === "view";
		const fields: Field[] = [
			{ name: "freight_charges", label: "Freight Charges", type: "text", disabled, grid: { xs: 12, md: 3 } },
			{ name: "round_off", label: "Round Off", type: "text", disabled, grid: { xs: 12, md: 3 } },
			{ name: "tcs_percentage", label: "TCS %", type: "text", disabled, grid: { xs: 12, md: 3 } },
			{ name: "tcs_amount", label: "TCS Amount", type: "text", disabled, grid: { xs: 12, md: 3 } },
			{ name: "footer_note", label: "Footer Note", type: "textarea", disabled, grid: { xs: 12 } },
			{ name: "internal_note", label: "Internal Note", type: "textarea", disabled, grid: { xs: 12 } },
			{ name: "terms_conditions", label: "Terms & Conditions", type: "textarea", disabled, grid: { xs: 12 } },
		];
		return { fields } satisfies Schema;
	}, [mode]);
