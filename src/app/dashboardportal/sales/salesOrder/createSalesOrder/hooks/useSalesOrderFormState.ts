import React from "react";
import type { MuiFormMode } from "@/components/ui/muiform";

type UseSalesOrderFormStateParams = {
	mode: MuiFormMode;
	buildDefaultFormValues: () => Record<string, unknown>;
	branchIdFromUrl?: string;
};

type UseSalesOrderFormStateReturn = {
	initialValues: Record<string, unknown>;
	setInitialValues: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
	formValues: Record<string, unknown>;
	setFormValues: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
	formKey: number;
	bumpFormKey: () => void;
	formRef: React.MutableRefObject<{ submit: () => Promise<void>; isDirty: () => boolean; setValue: (name: string, value: unknown) => void } | null>;
	handleFormValuesChange: (values: Record<string, unknown>) => void;
};

export function useSalesOrderFormState({
	mode,
	buildDefaultFormValues,
	branchIdFromUrl,
}: UseSalesOrderFormStateParams): UseSalesOrderFormStateReturn {
	const [initialValues, setInitialValues] = React.useState<Record<string, unknown>>(() => {
		const base = buildDefaultFormValues();
		if (mode !== "create" && branchIdFromUrl) base.branch = branchIdFromUrl;
		return base;
	});
	const [formValues, setFormValues] = React.useState<Record<string, unknown>>(() => {
		const base = buildDefaultFormValues();
		if (mode !== "create" && branchIdFromUrl) base.branch = branchIdFromUrl;
		return base;
	});
	const [formKey, setFormKey] = React.useState(0);
	const formRef = React.useRef<{ submit: () => Promise<void>; isDirty: () => boolean; setValue: (name: string, value: unknown) => void } | null>(null);
	const createDefaultsSeededRef = React.useRef(false);

	const bumpFormKey = React.useCallback(() => setFormKey((prev) => prev + 1), []);

	// Sync branch from URL
	const branchSyncedRef = React.useRef(false);
	React.useEffect(() => {
		if (mode === "create" || !branchIdFromUrl || branchSyncedRef.current) return;
		branchSyncedRef.current = true;
		setFormValues((prev) => (prev.branch === branchIdFromUrl ? prev : { ...prev, branch: branchIdFromUrl }));
		setInitialValues((prev) => (prev.branch === branchIdFromUrl ? prev : { ...prev, branch: branchIdFromUrl }));
		bumpFormKey();
	}, [mode, branchIdFromUrl, bumpFormKey]);

	React.useEffect(() => {
		if (mode !== "create") {
			createDefaultsSeededRef.current = false;
			return;
		}
		if (!createDefaultsSeededRef.current) {
			const base = buildDefaultFormValues();
			setInitialValues(base);
			setFormValues(base);
			bumpFormKey();
			createDefaultsSeededRef.current = true;
		}
	}, [mode, buildDefaultFormValues, bumpFormKey]);

	const handleFormValuesChange = React.useCallback((values: Record<string, unknown>) => {
		setFormValues((prev) => {
			let hasChanges = false;
			for (const key in values) {
				if (prev[key] !== values[key]) { hasChanges = true; break; }
			}
			return hasChanges ? { ...prev, ...values } : prev;
		});
	}, []);

	return {
		initialValues, setInitialValues,
		formValues, setFormValues,
		formKey, bumpFormKey,
		formRef,
		handleFormValuesChange,
	};
}
