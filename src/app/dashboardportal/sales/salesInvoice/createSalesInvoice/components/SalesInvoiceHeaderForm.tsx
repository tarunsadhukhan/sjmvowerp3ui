import React from "react";
import MuiForm, { type Schema, type MuiFormMode } from "@/components/ui/muiform";
import { hasTypeSpecificHeader, isRawJuteInvoice, isGovtSkgInvoice } from "../utils/salesInvoiceConstants";

type FormRef = React.MutableRefObject<{ submit: () => Promise<void>; isDirty: () => boolean; setValue: (name: string, value: unknown) => void } | null>;
type TypeSpecificFormRef = React.MutableRefObject<{ submit: () => Promise<void>; isDirty: () => boolean; setValue: (name: string, value: unknown) => void } | null>;

function getTypeSpecificSectionTitle(invoiceTypeId?: string): string {
	if (isRawJuteInvoice(invoiceTypeId)) return "Raw Jute Details";
	if (isGovtSkgInvoice(invoiceTypeId)) return "Govt Sacking Details";
	return "Additional Details";
}

type SalesInvoiceHeaderFormProps = {
	schema: Schema;
	formKey: number;
	initialValues: Record<string, unknown>;
	mode: MuiFormMode;
	formRef: FormRef;
	onSubmit: (values: Record<string, unknown>) => Promise<void>;
	onValuesChange: (values: Record<string, unknown>) => void;
	typeSpecificSchema?: Schema | null;
	invoiceTypeId?: string;
	juteFormRef?: TypeSpecificFormRef;
};

export function SalesInvoiceHeaderForm({
	schema,
	formKey,
	initialValues,
	mode,
	formRef,
	onSubmit,
	onValuesChange,
	typeSpecificSchema,
	invoiceTypeId,
	juteFormRef,
}: SalesInvoiceHeaderFormProps) {
	return (
		<div className="space-y-6">
			<MuiForm
				key={formKey}
				ref={formRef}
				schema={schema}
				initialValues={initialValues}
				mode={mode}
				hideModeToggle
				hideSubmit
				onSubmit={onSubmit}
				onValuesChange={onValuesChange}
			/>

			{typeSpecificSchema && hasTypeSpecificHeader(invoiceTypeId) && (
				<div className="space-y-3 pt-4 border-t border-dashed">
					<h3 className="text-sm font-medium text-muted-foreground">{getTypeSpecificSectionTitle(invoiceTypeId)}</h3>
					<MuiForm
						key={`type-specific-${formKey}`}
						ref={juteFormRef}
						schema={typeSpecificSchema}
						initialValues={initialValues}
						mode={mode}
						hideModeToggle
						hideSubmit
						onValuesChange={onValuesChange}
					/>
				</div>
			)}
		</div>
	);
}

export default SalesInvoiceHeaderForm;
