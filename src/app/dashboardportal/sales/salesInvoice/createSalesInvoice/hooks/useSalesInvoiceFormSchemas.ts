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
			{ name: "due_date", label: "Due Date", type: "date", disabled: headerFieldsDisabled, grid: { xs: 12, md: 4 } },
			{ name: "transporter", label: "Transporter", type: "select", options: transporterOptions, disabled: headerFieldsDisabled, grid: { xs: 12, md: 4 } },
			{ name: "transporter_name", label: "Transporter Name", type: "text", disabled: headerFieldsDisabled, grid: { xs: 12, md: 4 } },
			{ name: "transporter_address", label: "Transporter Address", type: "text", disabled: headerFieldsDisabled, grid: { xs: 12, md: 4 } },
			{ name: "transporter_state_code", label: "Transporter State Code", type: "text", disabled: headerFieldsDisabled, grid: { xs: 12, md: 4 } },
			{ name: "transporter_state_name", label: "Transporter State Name", type: "text", disabled: headerFieldsDisabled, grid: { xs: 12, md: 4 } },
			{ name: "vehicle_no", label: "Vehicle No.", type: "text", disabled: headerFieldsDisabled, grid: { xs: 12, md: 4 } },
			{ name: "challan_no", label: "Challan No.", type: "text", disabled: headerFieldsDisabled, grid: { xs: 12, md: 4 } },
			{ name: "challan_date", label: "Challan Date", type: "date", disabled: headerFieldsDisabled, grid: { xs: 12, md: 4 } },
			{ name: "eway_bill_no", label: "E-Way Bill No.", type: "text", disabled: headerFieldsDisabled, grid: { xs: 12, md: 4 } },
			{ name: "eway_bill_date", label: "E-Way Bill Date", type: "date", disabled: headerFieldsDisabled, grid: { xs: 12, md: 4 } },
			{ name: "type_of_sale", label: "Type of Sale", type: "text", disabled: headerFieldsDisabled, grid: { xs: 12, md: 4 } },
			{ name: "container_no", label: "Container No.", type: "text", disabled: headerFieldsDisabled, grid: { xs: 12, md: 4 } },
			{ name: "contract_no", label: "Contract No.", type: "text", disabled: headerFieldsDisabled, grid: { xs: 12, md: 4 } },
			{ name: "contract_date", label: "Contract Date", type: "date", disabled: headerFieldsDisabled, grid: { xs: 12, md: 4 } },
			{ name: "consignment_no", label: "Consignment No.", type: "text", disabled: headerFieldsDisabled, grid: { xs: 12, md: 4 } },
			{ name: "consignment_date", label: "Consignment Date", type: "date", disabled: headerFieldsDisabled, grid: { xs: 12, md: 4 } },
		];
		return { fields } satisfies Schema;
	}, [branchOptions, customerOptions, customerBranchOptions, transporterOptions, brokerOptions, deliveryOrderOptions, invoiceTypeOptions, mode, headerFieldsDisabled]);

export const useSalesInvoiceFooterSchema = ({ mode }: UseFooterSchemaParams): Schema =>
	React.useMemo(() => {
		const disabled = mode === "view";
		const fields: Field[] = [
			{ name: "freight_charges", label: "Freight Charges", type: "text", disabled, grid: { xs: 12, md: 3 } },
			{ name: "round_off", label: "Round Off", type: "text", disabled, grid: { xs: 12, md: 3 } },
			{ name: "tax_id", label: "Tax ID", type: "text", disabled, grid: { xs: 12, md: 3 } },
			{ name: "footer_note", label: "Footer Note", type: "textarea", disabled, grid: { xs: 12 } },
			{ name: "internal_note", label: "Internal Note", type: "textarea", disabled, grid: { xs: 12 } },
			{ name: "terms_conditions", label: "Terms & Conditions", type: "textarea", disabled, grid: { xs: 12 } },
		];
		return { fields } satisfies Schema;
	}, [mode]);
