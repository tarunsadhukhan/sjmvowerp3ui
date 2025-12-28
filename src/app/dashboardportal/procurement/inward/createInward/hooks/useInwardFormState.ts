import React from "react";
import type { MuiFormMode } from "@/components/ui/muiform";
import { buildDefaultFormValues } from "../utils/inwardFactories";

type UseInwardFormStateParams = {
	mode: MuiFormMode;
};

/**
 * Hook to manage form state for the Inward transaction page.
 */
export function useInwardFormState({ mode }: UseInwardFormStateParams) {
	const [initialValues, setInitialValues] = React.useState(buildDefaultFormValues);
	const [formValues, setFormValues] = React.useState(buildDefaultFormValues);
	const [formKey, setFormKey] = React.useState(0);
	const formRef = React.useRef<{ submit: () => Promise<void>; isDirty: () => boolean } | null>(null);
	const createDefaultsSeededRef = React.useRef(false);

	const bumpFormKey = React.useCallback(() => setFormKey((prev) => prev + 1), []);

	// Seed defaults in create mode
	React.useEffect(() => {
		if (mode !== "create") {
			createDefaultsSeededRef.current = false;
			return;
		}
		if (!createDefaultsSeededRef.current) {
			const base = buildDefaultFormValues();
			setInitialValues(base);
			setFormValues(base);
			setFormKey((prev) => prev + 1);
			createDefaultsSeededRef.current = true;
		}
	}, [mode]);

	return {
		initialValues,
		setInitialValues,
		formValues,
		setFormValues,
		formKey,
		bumpFormKey,
		formRef,
	};
}
