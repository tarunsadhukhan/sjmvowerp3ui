import React from "react";
import MuiForm, { type Schema, type MuiFormMode } from "@/components/ui/muiform";
import { Button } from "@/components/ui/button";

type FormRef = React.MutableRefObject<{ submit: () => Promise<void>; isDirty: () => boolean; setValue: (name: string, value: unknown) => void } | null>;

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
