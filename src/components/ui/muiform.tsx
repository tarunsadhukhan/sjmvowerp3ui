"use client";

import * as React from "react";
import { Box, Button, Chip, Checkbox, FormControl, FormControlLabel, FormHelperText, TextField, Typography } from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";
// Using Box-based layout to keep typings simple across MUI versions

export type MuiFormMode = "create" | "view" | "edit";

export type Option = {
	label: string;
	value: string | number;
};

export type FieldType =
	| "text"
	| "number"
	| "textarea"
	| "select"
	| "multiselect"
	| "checkbox"
	| "date";

export type Field = {
	name: string;
	label: string;
	type: FieldType;
	required?: boolean | ((values: Record<string, unknown>) => boolean);
	placeholder?: string;
	helperText?: string;
	options?: Option[]; // for select/multiselect
	defaultValue?: unknown;
	disabled?: boolean | ((values: Record<string, unknown>) => boolean);
	readOnly?: boolean; // force read only regardless of mode
	grid?: { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
	visibleInModes?: MuiFormMode[]; // default: all
};

export type Schema = {
	title?: string;
	description?: string;
	fields: Field[];
};

export type MuiFormProps = {
	schema: Schema;
	initialValues?: Record<string, unknown>;
	mode?: MuiFormMode; // if omitted, defaults to "create"
	hideModeToggle?: boolean;
	onSubmit?: (values: Record<string, unknown>, mode: MuiFormMode) => void | Promise<void>;
	onModeChange?: (mode: MuiFormMode) => void;
	onValuesChange?: (values: Record<string, unknown>) => void;
	submitLabel?: string;
	cancelLabel?: string;
	onCancel?: () => void;
	externalDirty?: boolean; // allow parent to mark form dirty (e.g. tables outside form)
	hideSubmit?: boolean; // parent can hide internal submit button and render it elsewhere
};

function getInitialValues(schema: Schema, provided?: Record<string, unknown>) {
	const base: Record<string, unknown> = {};
	for (const f of schema.fields) {
		if (provided && f.name in provided) base[f.name] = provided[f.name];
		else if (typeof f.defaultValue !== "undefined") base[f.name] = f.defaultValue;
		else if (f.type === "checkbox") base[f.name] = false;
		else if (f.type === "multiselect") base[f.name] = [];
		else base[f.name] = "";
	}
	return base;
}

function isVisible(field: Field, mode: MuiFormMode) {
	return !field.visibleInModes || field.visibleInModes.includes(mode);
}

function getDisabled(field: Field, values: Record<string, unknown>, mode: MuiFormMode) {
	if (field.readOnly) return true;
	if (typeof field.disabled === "function") return field.disabled(values);
	if (typeof field.disabled === "boolean") return field.disabled;
	if (mode === "view") return true;
	return false;
}
function displayValue(field: Field, value: unknown): React.ReactNode {
	if (field.type === "checkbox") return value ? "Yes" : "No";
	if ((field.type === "select" || field.type === "multiselect") && field.options) {
		const map = new Map(field.options.map((o) => [String(o.value), o.label]));
		if (field.type === "multiselect" && Array.isArray(value)) {
			return (value as Array<unknown>).map((v) => map.get(String(v)) ?? String(v)).join(", ");
		}
		return map.get(String(value)) ?? String(value ?? "");
	}
	return String(value ?? "");
}

export const MuiForm = React.forwardRef(function MuiForm(
	{
		schema,
		initialValues,
		mode: modeProp,
		hideModeToggle,
		hideSubmit,
		onSubmit,
		onModeChange,
		onValuesChange,
		submitLabel,
		cancelLabel,
		onCancel,
		externalDirty,
	}: MuiFormProps,
	ref: React.ForwardedRef<{ submit: () => Promise<void>; isDirty: () => boolean } | null>
) {
	const [mode, setMode] = React.useState<MuiFormMode>(modeProp ?? "create");
	const [values, setValues] = React.useState<Record<string, unknown>>(
		getInitialValues(schema, initialValues)
	);
	const [errors, setErrors] = React.useState<Record<string, string>>({});
	const [submitting, setSubmitting] = React.useState(false);

	// track an initial snapshot of values to detect dirty state in edit mode
	const initialSnapshotRef = React.useRef<string>(JSON.stringify(getInitialValues(schema, initialValues)));

	const dirty = React.useMemo(() => {
		if (externalDirty) return true;
		try {
			return initialSnapshotRef.current !== JSON.stringify(values);
		} catch {
			return false;
		}
	}, [values, externalDirty]);

	React.useEffect(() => {
		if (typeof modeProp !== "undefined") setMode(modeProp);
	}, [modeProp]);

	React.useEffect(() => {
		const base = getInitialValues(schema, initialValues);
		// merge existing values to avoid resetting user input when schema/options update
		setValues((prev) => {
			const merged = { ...base, ...prev };
			// update the snapshot to reflect the merged baseline
			initialSnapshotRef.current = JSON.stringify(merged);
			return merged;
		});
	}, [schema, initialValues]);

	const handleModeChange = (m: MuiFormMode) => {
		setMode(m);
		onModeChange?.(m);
	};

	const handleChange = (name: string, value: unknown) => {
		setValues((prev) => ({ ...prev, [name]: value }));
	};

	// call onValuesChange after values have been updated to avoid setState during render
	React.useEffect(() => {
		if (onValuesChange) {
			onValuesChange(values);
		}
	}, [values, onValuesChange]);

	const validate = () => {
		const next: Record<string, string> = {};
		for (const f of schema.fields) {
			if (!isVisible(f, mode)) continue;
			// support dynamic required: boolean or (values) => boolean
			const isReq = typeof f.required === 'function' ? f.required(values) : Boolean(f.required);
			if (isReq) {
				const v = values[f.name];
				if (f.type === "checkbox") {
					if (!v) next[f.name] = "Required";
				} else if (f.type === "multiselect") {
					if (!Array.isArray(v) || v.length === 0) next[f.name] = "Required";
				} else if (v === null || v === undefined || v === "") {
					next[f.name] = "Required";
				}
			}
		}
		setErrors(next);
		return Object.keys(next).length === 0;
	};

	const submit = async () => {
		if (mode === "view") return;
		if (!validate()) return;
		try {
			setSubmitting(true);
			await onSubmit?.(values, mode);
			// if submit succeeded, reset the initial snapshot so the form is no longer dirty
			initialSnapshotRef.current = JSON.stringify(values);
		} finally {
			setSubmitting(false);
		}
	};

	// expose submit to parent via ref
	React.useImperativeHandle(ref, () => ({
		submit,
		// expose dirty state so parents can show/hide their own submit buttons
		isDirty: () => dirty,
	}));

	const renderField = (field: Field) => {
		if (!isVisible(field, mode)) return null;
		const disabled = getDisabled(field, values, mode);
		const grid = field.grid ?? { xs: 12, sm: 6 };
		const value = values[field.name];

		// compute required as boolean for MUI props; field.required may be a function
		const requiredBool = typeof field.required === 'function' ? Boolean((field.required as any)(values)) : Boolean(field.required);
		const commonTextProps = {
			label: field.label,
			fullWidth: true,
			required: requiredBool,
			helperText: errors[field.name] || field.helperText,
			error: Boolean(errors[field.name]),
			disabled,
			placeholder: field.placeholder,
			size: "small" as const,
		};

				// map grid columns (12-based) to width percentages
				const toWidth = (n?: number) => (typeof n === "number" ? `${(n / 12) * 100}%` : undefined);
				const widthSx = {
					width: toWidth(grid.xs) ?? '100%',
					'@media (min-width:600px)': { width: toWidth(grid.sm) ?? toWidth(grid.xs) ?? '100%' },
					'@media (min-width:900px)': { width: toWidth(grid.md) ?? toWidth(grid.sm) ?? toWidth(grid.xs) ?? '100%' },
					'@media (min-width:1200px)': { width: toWidth(grid.lg) ?? toWidth(grid.md) ?? toWidth(grid.sm) ?? toWidth(grid.xs) ?? '100%' },
					'@media (min-width:1536px)': { width: toWidth(grid.xl) ?? toWidth(grid.lg) ?? toWidth(grid.md) ?? toWidth(grid.sm) ?? toWidth(grid.xs) ?? '100%' },
				} as const;

				const spanXs = grid.xs ?? 12;
				const spanSm = grid.sm ?? spanXs;
				const spanMd = grid.md ?? spanSm;
				const spanLg = grid.lg ?? spanMd;
				const spanXl = grid.xl ?? spanLg;
				return (
					<Box key={field.name} sx={{
						gridColumn: {
							xs: `span ${spanXs}`,
							sm: `span ${spanSm}`,
							md: `span ${spanMd}`,
							lg: `span ${spanLg}`,
							xl: `span ${spanXl}`,
						},
						minWidth: 0,
					}}>
				{mode === "view" && field.type !== "checkbox" ? (
					<Box>
						<Typography variant="caption" color="text.secondary">
							{field.label}
						</Typography>
						<Typography variant="body1">{displayValue(field, value)}</Typography>
					</Box>
				) : field.type === "text" || field.type === "number" || field.type === "date" ? (
					<TextField
						type={field.type === "text" ? "text" : field.type === "number" ? "number" : "date"}
						value={value ?? ""}
						onChange={(e) => handleChange(field.name, e.target.value)}
						InputLabelProps={field.type === "date" ? { shrink: true } : undefined}
						inputProps={mode === "view" ? { readOnly: true } : undefined}
						{...commonTextProps}
					/>
				) : field.type === "textarea" ? (
					<TextField
						multiline
						minRows={3}
						value={value ?? ""}
						onChange={(e) => handleChange(field.name, e.target.value)}
						inputProps={mode === "view" ? { readOnly: true } : undefined}
						{...commonTextProps}
					/>
				) : field.type === "checkbox" ? (
					<FormControl disabled={disabled}>
						<FormControlLabel
							control={
								<Checkbox
									checked={Boolean(value)}
									onChange={(e) => handleChange(field.name, e.target.checked)}
								/>
							}
							label={field.label}
						/>
						{errors[field.name] && (
							<FormHelperText error>{errors[field.name]}</FormHelperText>
						)}
					</FormControl>
				) : field.type === "select" ? (
					// single-select rendered as Autocomplete for autofill/filtering
					<Autocomplete<Option, false, boolean, false>
						options={(field.options ?? []) as Option[]}
						getOptionLabel={(opt: Option) => opt.label}
						isOptionEqualToValue={(o: Option, v: Option) => String(o.value) === String(v.value)}
						value={((field.options ?? []) as Option[]).find((o) => String(o.value) === String(value)) ?? null}
						onChange={(_, newOpt) => handleChange(field.name, (newOpt as Option | null)?.value ?? "")}
						disableClearable={Boolean(field.required)}
						disabled={disabled}
						noOptionsText={"No options"}
						renderInput={(params) => (
							<TextField
								{...params}
								label={`${field.label}${field.required ? " *" : ""}`}
								fullWidth
								size="small"
								helperText={errors[field.name] || field.helperText}
								error={Boolean(errors[field.name])}
							/>
						)}
					/>
				) : field.type === "multiselect" ? (
					<Autocomplete<Option, true, boolean, false>
						sx={{ width: '100%' }}
						multiple
						options={(field.options ?? []) as Option[]}
						getOptionLabel={(opt: Option) => opt.label}
						isOptionEqualToValue={(o: Option, v: Option) => String(o.value) === String(v.value)}
						value={((field.options ?? []) as Option[]).filter((o) => Array.isArray(value) && (value as Array<unknown>).some((v) => String(v) === String(o.value)))}
						onChange={(_, newOpts) => handleChange(field.name, (newOpts as Option[]).map((o) => o.value))}
						disabled={disabled}
						noOptionsText={"No options"}
						renderTags={(selected: Option[], getTagProps) => (
							<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
								{selected.map((opt, index) => (
									<Chip {...getTagProps({ index })} key={String(opt.value)} label={opt.label} size="small" />
								))}
							</Box>
						)}
						renderInput={(params) => (
							<TextField
								{...params}
								label={`${field.label}${field.required ? " *" : ""}`}
								fullWidth
								size="small"
								helperText={errors[field.name] || field.helperText}
								error={Boolean(errors[field.name])}
							/>
						)}
					/>
				) : (
					// Fallback render as text
					<Box>
						<Typography variant="caption" color="text.secondary">
							{field.label}
						</Typography>
						<Typography variant="body1">{displayValue(field, value)}</Typography>
					</Box>
				)}
					</Box>
		);
	};

	return (
				<Box>
			{(schema.title || !hideModeToggle) && (
				<Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
					<Box>
						{schema.title && <Typography variant="h6">{schema.title}</Typography>}
						{schema.description && (
							<Typography variant="body2" color="text.secondary">{schema.description}</Typography>
						)}
					</Box>
					{!hideModeToggle && (
						<Box sx={{ display: "flex", gap: 1 }}>
							<Button size="small" variant={mode === "create" ? "contained" : "outlined"} onClick={() => handleModeChange("create")}>Create</Button>
							<Button size="small" variant={mode === "view" ? "contained" : "outlined"} onClick={() => handleModeChange("view")}>View</Button>
							<Button size="small" variant={mode === "edit" ? "contained" : "outlined"} onClick={() => handleModeChange("edit")}>Edit</Button>
						</Box>
					)}
				</Box>
			)}

					<Box sx={{
						display: 'grid',
						gap: 2,
						gridTemplateColumns: {
							xs: 'repeat(1, 1fr)',
							sm: 'repeat(12, 1fr)'
						},
					}}>
						{schema.fields.map((f) => renderField(f))}
					</Box>

				{mode !== "view" && !hideSubmit && (
					<Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", mt: 2 }}>
						{onCancel && (
							<Button variant="text" onClick={onCancel} disabled={submitting}>
								{cancelLabel ?? "Cancel"}
							</Button>
						)}
						{/* show submit/save only when creating or when edit form is dirty */}
						{(mode === "create" || (mode === "edit" && dirty)) && (
							<>
								{ /* existing submit button rendering (keeps labels and disabled state) */ }
								<Button variant="contained" onClick={submit} disabled={submitting}>
									{submitLabel ?? (mode === "create" ? "Create" : "Save")}
								</Button>
							</>
						)}
					</Box>
				)}
		</Box>
	);
});

export default MuiForm;

