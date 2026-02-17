import React from "react";
import MuiForm, { type Schema, type MuiFormMode } from "@/components/ui/muiform";
import { Button } from "@/components/ui/button";

type FormRef = React.MutableRefObject<{ submit: () => Promise<void>; isDirty: () => boolean } | null>;

type SalesOrderHeaderFormProps = {
	schema: Schema;
	formKey: number;
	initialValues: Record<string, unknown>;
	mode: MuiFormMode;
	formRef: FormRef;
	onSubmit: (values: Record<string, unknown>) => Promise<void>;
	onValuesChange: (values: Record<string, unknown>) => void;
	showQuotationButton?: boolean;
	onQuotationSelect?: () => void;
	quotationButtonDisabled?: boolean;
};

export function SalesOrderHeaderForm({
	schema,
	formKey,
	initialValues,
	mode,
	formRef,
	onSubmit,
	onValuesChange,
	showQuotationButton,
	onQuotationSelect,
	quotationButtonDisabled,
}: SalesOrderHeaderFormProps) {
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

			{showQuotationButton && (
				<div className="space-y-2">
					<Button variant="outline" onClick={onQuotationSelect} disabled={quotationButtonDisabled}>
						Load from Quotation
					</Button>
					<p className="text-xs text-slate-500">Pre-fill line items from a selected quotation.</p>
				</div>
			)}
		</div>
	);
}

export default SalesOrderHeaderForm;
