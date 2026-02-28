import React from "react";
import MuiForm, { type Schema, type MuiFormMode } from "@/components/ui/muiform";
import { Button } from "@/components/ui/button";

type FormRef = React.MutableRefObject<{ submit: () => Promise<void>; isDirty: () => boolean; setValue: (name: string, value: unknown) => void } | null>;

type DeliveryOrderHeaderFormProps = {
	schema: Schema;
	formKey: number;
	initialValues: Record<string, unknown>;
	mode: MuiFormMode;
	formRef: FormRef;
	onSubmit: (values: Record<string, unknown>) => Promise<void>;
	onValuesChange: (values: Record<string, unknown>) => void;
	showSalesOrderButton: boolean;
	onSalesOrderSelect: () => void;
	salesOrderButtonDisabled: boolean;
};

export function DeliveryOrderHeaderForm({
	schema,
	formKey,
	initialValues,
	mode,
	formRef,
	onSubmit,
	onValuesChange,
	showSalesOrderButton,
	onSalesOrderSelect,
	salesOrderButtonDisabled,
}: DeliveryOrderHeaderFormProps) {
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

			{showSalesOrderButton && (
				<div className="space-y-2">
					<Button variant="outline" onClick={onSalesOrderSelect} disabled={salesOrderButtonDisabled}>
						Import from Sales Order
					</Button>
					<p className="text-xs text-slate-500">Select items from an approved sales order to populate the line items.</p>
				</div>
			)}
		</div>
	);
}

export default DeliveryOrderHeaderForm;
