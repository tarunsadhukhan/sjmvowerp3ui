"use client";

import React from "react";
import MuiForm, { type Schema, type MuiFormMode } from "@/components/ui/muiform";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

type InwardHeaderFormProps = {
	schema: Schema;
	formKey: number;
	initialValues: Record<string, unknown>;
	mode: MuiFormMode;
	formRef: React.RefObject<{ submit: () => Promise<void>; isDirty: () => boolean } | null>;
	onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
	onValuesChange: (values: Record<string, unknown>) => void;
	showPOButton?: boolean;
	onPOSelect?: () => void;
	poButtonDisabled?: boolean;
};

export const InwardHeaderForm: React.FC<InwardHeaderFormProps> = ({
	schema,
	formKey,
	initialValues,
	mode,
	formRef,
	onSubmit,
	onValuesChange,
	showPOButton = false,
	onPOSelect,
	poButtonDisabled = false,
}) => {
	return (
		<div className="space-y-4">
			<MuiForm
				key={formKey}
				schema={schema}
				initialValues={initialValues}
				mode={mode}
				formRef={formRef}
				onSubmit={onSubmit}
				onValuesChange={onValuesChange}
				hideModeToggle
			/>
			{showPOButton && onPOSelect && (
				<div className="flex justify-end">
					<Button
						type="button"
						variant="outline"
						onClick={onPOSelect}
						disabled={poButtonDisabled}
					>
						<FileText className="mr-2 h-4 w-4" />
						Select from PO
					</Button>
				</div>
			)}
		</div>
	);
};
