"use client";

import * as React from "react";
import {
	Box,
	Button,
	Chip,
	Checkbox,
	FormControl,
	FormControlLabel,
	FormHelperText,
	InputLabel,
	MenuItem,
	Select,
	TextField,
	Typography,
} from "@mui/material";
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
	required?: boolean;
	placeholder?: string;
	helperText?: string;
	options?: Option[]; // for select/multiselect
	defaultValue?: any;
	disabled?: boolean | ((values: Record<string, any>) => boolean);
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
	initialValues?: Record<string, any>;
	mode?: MuiFormMode; // if omitted, defaults to "create"
	hideModeToggle?: boolean;
	onSubmit?: (values: Record<string, any>, mode: MuiFormMode) => void | Promise<void>;
	onModeChange?: (mode: MuiFormMode) => void;
	submitLabel?: string;
	cancelLabel?: string;
	onCancel?: () => void;
};

function getInitialValues(schema: Schema, provided?: Record<string, any>) {
	const base: Record<string, any> = {};
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

function getDisabled(field: Field, values: Record<string, any>, mode: MuiFormMode) {
	if (field.readOnly) return true;
	if (typeof field.disabled === "function") return field.disabled(values);
	if (typeof field.disabled === "boolean") return field.disabled;
	if (mode === "view") return true;
	return false;
}

function displayValue(field: Field, value: any): React.ReactNode {
	if (field.type === "checkbox") return value ? "Yes" : "No";
	if ((field.type === "select" || field.type === "multiselect") && field.options) {
		const map = new Map(field.options.map((o) => [o.value, o.label]));
		if (field.type === "multiselect" && Array.isArray(value)) {
			return value.map((v: any) => map.get(v) ?? String(v)).join(", ");
		}
		return map.get(value) ?? String(value ?? "");
	}
	return String(value ?? "");
}

export const MuiForm: React.FC<MuiFormProps> = ({
	schema,
	initialValues,
	mode: modeProp,
	hideModeToggle,
	onSubmit,
	onModeChange,
	submitLabel,
	cancelLabel,
	onCancel,
}) => {
	const [mode, setMode] = React.useState<MuiFormMode>(modeProp ?? "create");
	const [values, setValues] = React.useState<Record<string, any>>(
		getInitialValues(schema, initialValues)
	);
	const [errors, setErrors] = React.useState<Record<string, string>>({});
	const [submitting, setSubmitting] = React.useState(false);

	React.useEffect(() => {
		if (typeof modeProp !== "undefined") setMode(modeProp);
	}, [modeProp]);

	React.useEffect(() => {
		setValues(getInitialValues(schema, initialValues));
	}, [schema, initialValues]);

	const handleModeChange = (m: MuiFormMode) => {
		setMode(m);
		onModeChange?.(m);
	};

	const handleChange = (name: string, value: any) => {
		setValues((prev) => ({ ...prev, [name]: value }));
	};

	const validate = () => {
		const next: Record<string, string> = {};
		for (const f of schema.fields) {
			if (!isVisible(f, mode)) continue;
			if (f.required) {
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
		} finally {
			setSubmitting(false);
		}
	};

	const renderField = (field: Field) => {
		if (!isVisible(field, mode)) return null;
		const disabled = getDisabled(field, values, mode);
		const grid = field.grid ?? { xs: 12, sm: 6 };
		const value = values[field.name];

		const commonTextProps = {
			label: field.label,
			fullWidth: true,
			required: field.required,
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

				return (
					<Box key={field.name} sx={{ ...widthSx }}>
				{mode === "view" && field.type !== "checkbox" && field.type !== "multiselect" &&
				field.type !== "select" ? (
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
					<FormControl fullWidth size="small" disabled={disabled} error={Boolean(errors[field.name])}>
						<InputLabel id={`${field.name}-label`}>{field.label}{field.required ? " *" : ""}</InputLabel>
						<Select
							labelId={`${field.name}-label`}
							value={value ?? ""}
							label={`${field.label}${field.required ? " *" : ""}`}
							onChange={(e) => {
								console.log(`Select change for ${field.name}:`, e.target.value);
								handleChange(field.name, e.target.value);
							}}
						>
							<MenuItem value="">
								<em>None</em>
							</MenuItem>
							{(field.options ?? []).map((opt) => {
								console.log(`Rendering MenuItem for ${field.name}:`, opt);
								return (
									<MenuItem key={String(opt.value)} value={opt.value as any}>
										{opt.label}
									</MenuItem>
								);
							})}
						</Select>
						<FormHelperText>{errors[field.name] || field.helperText}</FormHelperText>
					</FormControl>
				) : field.type === "multiselect" ? (
					<Autocomplete
						sx={{ width: '100%' }}
						multiple
						options={(field.options ?? []) as Option[]}
						getOptionLabel={(opt) => (opt && typeof opt === 'object' && 'label' in opt ? (opt as Option).label : String(opt ?? ''))}
						isOptionEqualToValue={(o, v) => !!o && !!v && (o as Option).value === (v as Option).value}
						value={((field.options ?? []) as Option[]).filter((o) => Array.isArray(value) && (value as any[]).includes(o.value))}
						onChange={(_, newOpts) => handleChange(field.name, (newOpts as Option[]).map((o) => o.value))}
						disabled={disabled}
						noOptionsText={"No options"}
						renderTags={(selected, getTagProps) => (
							<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
								{selected.map((opt, index) => (
									<Chip {...getTagProps({ index })} key={String((opt as Option).value)} label={(opt as Option).label} size="small" />
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

					<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
						{schema.fields.map((f) => renderField(f))}
					</Box>

			{mode !== "view" && (
				<Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", mt: 2 }}>
					{onCancel && (
						<Button variant="text" onClick={onCancel} disabled={submitting}>
							{cancelLabel ?? "Cancel"}
						</Button>
					)}
					<Button variant="contained" onClick={submit} disabled={submitting}>
						{submitLabel ?? (mode === "create" ? "Create" : "Save")}
					</Button>
				</Box>
			)}
		</Box>
	);
};

export default MuiForm;

