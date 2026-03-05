import React from "react";
import MuiForm, { type Schema, type MuiFormMode } from "@/components/ui/muiform";
import { Button } from "@/components/ui/button";
import { isJuteInvoice } from "../utils/salesInvoiceConstants";

type FormRef = React.MutableRefObject<{ submit: () => Promise<void>; isDirty: () => boolean; setValue: (name: string, value: unknown) => void } | null>;
type JuteFormRef = React.MutableRefObject<{ setValue: (name: string, value: unknown) => void } | null>;

type SalesInvoiceHeaderFormProps = {
	schema: Schema;
	formKey: number;
	initialValues: Record<string, unknown>;
	mode: MuiFormMode;
	formRef: FormRef;
	onSubmit: (values: Record<string, unknown>) => Promise<void>;
	onValuesChange: (values: Record<string, unknown>) => void;
	showDeliveryOrderButton: boolean;
	onDeliveryOrderSelect: () => void;
	deliveryOrderButtonDisabled: boolean;
	juteSchema?: Schema;
	invoiceTypeId?: string;
	juteFormRef?: JuteFormRef;
};

export function SalesInvoiceHeaderForm({
	schema,
	formKey,
	initialValues,
	mode,
	formRef,
	onSubmit,
	onValuesChange,
	showDeliveryOrderButton,
	onDeliveryOrderSelect,
	deliveryOrderButtonDisabled,
	juteSchema,
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

			{juteSchema && isJuteInvoice(invoiceTypeId) && (
				<div className="space-y-3 pt-4 border-t border-dashed">
					<h3 className="text-sm font-medium text-muted-foreground">Jute Details</h3>
					<MuiForm
						key={`jute-${formKey}`}
						ref={juteFormRef}
						schema={juteSchema}
						initialValues={initialValues}
						mode={mode}
						hideModeToggle
						hideSubmit
						onValuesChange={onValuesChange}
					/>
				</div>
			)}

			{showDeliveryOrderButton && (
				<div className="space-y-2">
					<Button variant="outline" onClick={onDeliveryOrderSelect} disabled={deliveryOrderButtonDisabled}>
						Import from Delivery Order
					</Button>
					<p className="text-xs text-slate-500">Select items from an approved delivery order to populate the line items.</p>
				</div>
			)}
		</div>
	);
}

export default SalesInvoiceHeaderForm;
