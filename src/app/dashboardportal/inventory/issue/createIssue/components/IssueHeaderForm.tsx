"use client";

import React from "react";
import MuiForm, { type Schema, type MuiFormMode } from "@/components/ui/muiform";

type MuiFormHandle = { submit: () => Promise<void>; isDirty: () => boolean };

type IssueHeaderFormProps = {
	schema: Schema;
	formKey: number;
	initialValues: Record<string, unknown>;
	mode: MuiFormMode;
	formRef: React.RefObject<MuiFormHandle | null>;
	onSubmit: (values: Record<string, unknown>) => Promise<void>;
	onValuesChange: (values: Record<string, unknown>) => void;
};

/**
 * @component IssueHeaderForm
 * @description Renders the header form for Issue transactions.
 * Uses MuiForm for schema-driven rendering.
 */
export const IssueHeaderForm: React.FC<IssueHeaderFormProps> = ({
	schema,
	formKey,
	initialValues,
	mode,
	formRef,
	onSubmit,
	onValuesChange,
}) => {
	return (
		<MuiForm
			key={formKey}
			schema={schema}
			initialValues={initialValues}
			mode={mode}
			ref={formRef}
			onSubmit={onSubmit}
			onValuesChange={onValuesChange}
		/>
	);
};
