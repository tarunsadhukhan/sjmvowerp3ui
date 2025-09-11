"use client";

import * as React from "react";
import MuiForm, { Schema } from "@/components/ui/muiform";
import { Box, Button, IconButton, Tooltip, CircularProgress, Autocomplete, TextField } from "@mui/material";
import { Trash2 } from 'lucide-react';
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { useBranchOptions } from '@/utils/branchUtils';
import { fetchWithCookie } from '@/utils/apiClient2';
import { apiRoutesPortalMasters } from '@/utils/api';

type Row = {
	id: number;
	department?: string;
	item_group?: string;
	item?: string;
	item_make?: string;
	quantity?: number | string;
	uom?: string;
	remarks?: string;
};

export default function CreateIndentPage() {
	const formRef = React.useRef<any>(null);
	const [formValues, setFormValues] = React.useState<Record<string, unknown>>({});

	// start with one blank row for create flow
	const nextId = React.useRef(1);
	const blankRow = (): Row => ({
		id: nextId.current++,
		department: '',
		item_group: '',
		item: '',
		item_make: '',
		quantity: '',
		uom: '',
		remarks: '',
	});
	const [rows, setRows] = React.useState<Row[]>(() => {
		return [blankRow()];
	});

	const handleDelete = (id: number) => {
		if (id == null) return;
		setRows(prev => {
			const filtered = prev.filter(r => r.id !== id);
			return filtered.length ? filtered : [blankRow()];
		});
		setPerRowOptions(prev => {
			const copy = { ...prev };
			delete copy[id];
			return copy;
		});
	};

	// branch options from reusable hook (reads sidebar_selectedBranches)
	const branchOptionsLocal = useBranchOptions();

	// avoid rendering client-only dependent UI during server render to prevent
	// hydration mismatches (localStorage-dependent options). Wait until mounted.
	const [mounted, setMounted] = React.useState(false);
	React.useEffect(() => { setMounted(true); }, []);

	// columns will be defined after option state vars are declared

	// schema will be declared after API-driven option state so those option arrays are available

	// derive initialValues for the form from branch options (client-only). We avoid putting
	// this value directly into the schema to prevent SSR/CSR HTML mismatch.
	const initialFormValues = React.useMemo(() => {
		if (branchOptionsLocal.length >= 1) {
			return { branch: branchOptionsLocal[0].value } as Record<string, unknown>;
		}
		return {} as Record<string, unknown>;
	}, [branchOptionsLocal]);

	const isRowFilled = (r: Row) => {
		// consider a row non-empty if any of the key fields are present
		return Boolean(r.item_group || r.item || r.quantity);
	};

	const isRowValid = (r: Row) => {
		return Boolean(r.item_group && r.item && r.quantity !== undefined && r.quantity !== "" && Number(r.quantity) > 0);
	};

	const handleCellEdit = (params: any) => {
		const { id, field, value } = params;
		setRows((prev) => {
				const next = prev.map((row) => {
					if (row.id !== id) return row;
					if (field === 'quantity') return { ...row, [field]: (value === '' ? '' : Number(value)) };
					if (field === 'item_group') {
						// set the new item_group and immediately clear dependent fields so UI doesn't show stale ids
						return { ...row, item_group: value, item: '', item_make: '', quantity: '', uom: '' };
					}
					return { ...row, [field]: value };
				});
			// if last row became filled (valid), append a new blank row
			const last = next[next.length - 1];
			if (last && isRowFilled(last) && isRowValid(last)) {
				next.push(blankRow());
				// clear global pools so new row doesn't inherit previous group's options
				setCurrentItemOptions([]);
				setCurrentMakeOptions([]);
				setCurrentUomOptions([]);
			}

				// if item_group was edited, fetch dependent options for that group
				if (field === 'item_group') {
					// clear current pools while we load new ones to avoid stale dropdowns appearing
					setCurrentItemOptions([]);
					setCurrentMakeOptions([]);
					setCurrentUomOptions([]);
					// clear per-row pool for this row while loading
					setPerRowOptions(prev => ({ ...prev, [id]: { items: [], makes: [], uoms: [] } }));
					(async () => {
						try {
							const { items, makes, uoms } = await fetchSetup2(value);
							// store per-row options so other rows are unaffected
							setPerRowOptions(prev => ({ ...prev, [id]: { items, makes, uoms } }));
							// also set global pools for the immediate edit context as fallback
							setCurrentItemOptions(items);
							setCurrentMakeOptions(makes);
							setCurrentUomOptions(uoms);
						} catch (e) {
							// ignore
						}
					})();
				}
			return next;
		});
	};

	// API-driven options populated by GET_INDENT_SETUP_1
	const [apiProjectOptions, setApiProjectOptions] = React.useState<any[]>([]);
	const [apiExpenseOptions, setApiExpenseOptions] = React.useState<any[]>([]);
	const [fullExpenseOptions, setFullExpenseOptions] = React.useState<any[]>([]);
	const [apiDepartmentOptions, setApiDepartmentOptions] = React.useState<any[]>([]);
	const [apiItemGroupOptions, setApiItemGroupOptions] = React.useState<any[]>([]);

	// dynamic item/make/uom options updated per item_group selection
	const [currentItemOptions, setCurrentItemOptions] = React.useState<any[]>([]);
	const [currentMakeOptions, setCurrentMakeOptions] = React.useState<any[]>([]);
	const [currentUomOptions, setCurrentUomOptions] = React.useState<any[]>([]);

	// per-row option pools to avoid cross-row leakage when different item_groups are selected
	const [perRowOptions, setPerRowOptions] = React.useState<Record<number, { items: any[]; makes: any[]; uoms: any[] }>>({});
	// track loading state for rows whose item_group just changed
	const [loadingRows, setLoadingRows] = React.useState<Set<number>>(new Set());

	// local indent type options
	const indentTypeOptions = React.useMemo(() => [
		{ label: "Regular Indent", value: "regular" },
		{ label: "Open Indent", value: "open" },
		{ label: "BOM", value: "bom" },
	], []);

	// generic autocomplete edit cell for singleSelect fields (full-width + widened popper)
	const AutocompleteEditCell = React.useCallback((props: any) => {
		const { id, field, value, api, colDef } = props;
		const options: any[] = props.options || [];
		const currentOption = options.find(o => String(o.value) === String(value)) || null;
		return (
			<Box sx={{ width: '100%', position: 'relative' }}>
				<Autocomplete
					size="small"
					options={options}
					fullWidth
					ListboxProps={{ style: { maxHeight: 320 } }}
					getOptionLabel={(o: any) => o?.label ?? ''}
					isOptionEqualToValue={(a, b) => String(a.value) === String(b.value)}
					value={currentOption}
					onChange={(_, newOpt) => {
						const newValue = newOpt ? newOpt.value : '';
						api.setEditCellValue({ id, field, value: newValue }, undefined);
						api.stopCellEditMode({ id, field });
					}}
					componentsProps={{
						popper: {
							modifiers: [
								{
									name: 'setWidth',
									enabled: true,
									phase: 'beforeWrite',
									fn: ({ state }: any) => {
										// Ensure the popper is at least as wide as the edit cell, or 260px minimum
										const refW = state?.rects?.reference?.width || 0;
										state.styles.popper.width = `${Math.max(refW, 260)}px`;
									},
								},
							],
						},
					}}
					sx={{
						width: '100%',
						'& .MuiOutlinedInput-root': {
							p: 0,
							'& fieldset': { border: 'none' },
							'& input': { py: 0.5, px: 0.5, fontSize: 13 },
						},
					}}
					renderInput={(params) => {
						const { InputProps, ...rest } = params;
						return (
							<TextField
								{...rest}
								InputProps={{ ...InputProps, endAdornment: null, disableUnderline: true } as any}
								variant="standard"
								fullWidth
								placeholder={currentOption ? currentOption.label : ''}
							/>
						);
					}}
				/>
			</Box>
		);
	}, []);

	const columns: GridColDef[] = React.useMemo(() => {
		const findLabel = (options: any[] | undefined, rawVal: any) => {
			// normalize value shapes (row cells sometimes contain objects)
			let val = rawVal;
			if (val == null) return '';
			if (typeof val === 'object') {
				// common server-side row shapes
				if (val.label) return String(val.label);
				if (val.dept_desc) return String(val.dept_desc);
				if (val.item_grp_name_display) return String(val.item_grp_name_display);
				if (val.value !== undefined) val = val.value;
				else if (val.id !== undefined) val = val.id;
				else if (val.item_grp_id !== undefined) val = val.item_grp_id;
			}
			if (!options || options.length === 0) return String(val ?? '');
			const first = options[0];
			if (typeof first !== 'object') {
				const found = options.find((o: any) => String(o) === String(val));
				return found ?? String(val ?? '');
			}
			const found = options.find((o: any) => {
				if (!o) return false;
				return String(o.value) === String(val) || String(o.label) === String(val) || String(o.id) === String(val) || String(o.item_grp_id) === String(val);
			});
			return found?.label ?? String(val ?? '');
		};

		return [
				{
					field: 'actions',
					headerName: 'Actions',
					headerAlign: 'center',
					width: 60,
					sortable: false,
					filterable: false,
					disableColumnMenu: true,
					renderCell: (params: any) => (
						<Tooltip title="Delete Row">
							<IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); if (params?.id != null) handleDelete(Number(params.id)); }} aria-label="delete row">
								<Trash2 size={16} />
							</IconButton>
						</Tooltip>
					),
				},

				{
					field: "department",
					headerName: "Department",
					headerAlign: 'center',
					width: 160,
					editable: true,
					type: 'singleSelect',
					// provide full option objects so DataGrid can display labels
					valueOptions: apiDepartmentOptions,
					valueFormatter: (params: any) => findLabel(apiDepartmentOptions, params?.value),
					renderCell: (params: any) => {
						const label = findLabel(apiDepartmentOptions, params?.value);
						return <Tooltip title={label || ''} arrow><div style={{ width: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div></Tooltip>;
					},
					renderEditCell: (params: any) => <AutocompleteEditCell {...params} options={apiDepartmentOptions} />,
				},
			{
				field: "item_group",
				headerName: "Item Group",
				headerAlign: 'center',
				width: 160,
				editable: true,
				type: 'singleSelect',
				valueOptions: apiItemGroupOptions,
				valueFormatter: (params: any) => findLabel(apiItemGroupOptions, params?.value),
				renderCell: (params: any) => {
					const label = findLabel(apiItemGroupOptions, params?.value);
					return <Tooltip title={label || ''} arrow><div style={{ width: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div></Tooltip>;
				},
				renderEditCell: (params: any) => <AutocompleteEditCell {...params} options={apiItemGroupOptions} />,
			},
			{
				field: "item",
				headerName: "Item",
				headerAlign: 'center',
				width: 220,
				editable: true,
				type: 'singleSelect',
				// use per-row options when available
				valueOptions: (params: any) => params?.id != null ? (perRowOptions[params.id]?.items ?? currentItemOptions) : currentItemOptions,
				valueFormatter: (params: any) => findLabel(params?.id != null ? (perRowOptions[params.id]?.items ?? currentItemOptions) : currentItemOptions, params?.value),
				renderCell: (params: any) => {
					const loading = params?.id != null && loadingRows.has(params.id as number);
					if (loading) return <CircularProgress size={16} />;
					const label = findLabel(params?.id != null ? (perRowOptions[params.id]?.items ?? currentItemOptions) : currentItemOptions, params?.value);
					return <Tooltip title={label || ''} arrow><div style={{ width: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div></Tooltip>;
				},
				renderEditCell: (params: any) => <AutocompleteEditCell {...params} options={params?.id != null ? (perRowOptions[params.id]?.items ?? currentItemOptions) : currentItemOptions} />,
			},
			{
				field: "item_make",
				headerName: "Item Make",
				headerAlign: 'center',
				width: 160,
				editable: true,
				type: 'singleSelect',
				valueOptions: (params: any) => params?.id != null ? (perRowOptions[params.id]?.makes ?? currentMakeOptions) : currentMakeOptions,
				valueFormatter: (params: any) => findLabel(params?.id != null ? (perRowOptions[params.id]?.makes ?? currentMakeOptions) : currentMakeOptions, params?.value),
				renderCell: (params: any) => {
					const loading = params?.id != null && loadingRows.has(params.id as number);
					if (loading) return <CircularProgress size={16} />;
					const label = findLabel(params?.id != null ? (perRowOptions[params.id]?.makes ?? currentMakeOptions) : currentMakeOptions, params?.value);
					return <Tooltip title={label || ''} arrow><div style={{ width: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div></Tooltip>;
				},
				renderEditCell: (params: any) => <AutocompleteEditCell {...params} options={params?.id != null ? (perRowOptions[params.id]?.makes ?? currentMakeOptions) : currentMakeOptions} />,
			},
			{ field: "quantity", headerName: "Quantity", width: 120, type: 'number', editable: true },
			{
				field: "uom",
				headerName: "UOM",
				headerAlign: 'center',
				width: 120,
				editable: true,
				type: 'singleSelect',
				valueOptions: (params: any) => params?.id != null ? (perRowOptions[params.id]?.uoms ?? currentUomOptions) : currentUomOptions,
				valueFormatter: (params: any) => {
					const pools = params?.id != null ? (perRowOptions[params.id]?.uoms ?? currentUomOptions) : currentUomOptions;
					// if no explicit uom chosen yet, try to derive from selected item defaultUom
					if (!params?.value && params?.row?.item) {
						const itemPool = params?.id != null ? (perRowOptions[params.id]?.items ?? currentItemOptions) : currentItemOptions;
						const sel = itemPool.find((it: any) => String(it.value) === String(params.row.item?.value ?? params.row.item));
						if (sel?.defaultUom?.label) return sel.defaultUom.label;
					}
					return findLabel(pools, params?.value);
				},
				renderCell: (params: any) => {
					const loading = params?.id != null && loadingRows.has(params.id as number);
					if (loading) return <CircularProgress size={16} />;
					// auto-fill row.uom with default if empty and available (without causing infinite re-render)
					if (!params.row.uom && params?.id != null && params.row.item) {
						const itemPool = perRowOptions[params.id]?.items ?? currentItemOptions;
						const sel = itemPool.find((it: any) => String(it.value) === String(params.row.item?.value ?? params.row.item));
						if (sel?.defaultUom?.value) {
							// defer state update to microtask to avoid mutation during render
							queueMicrotask(() => {
								setRows(prev => prev.map(r => r.id === params.id ? { ...r, uom: sel.defaultUom.value } : r));
							});
							return <div>{sel.defaultUom.label}</div>;
						}
					}
					const pools = params?.id != null ? (perRowOptions[params.id]?.uoms ?? currentUomOptions) : currentUomOptions;
					return <div>{findLabel(pools, params?.value) || ''}</div>;
				},
				renderEditCell: (params: any) => <AutocompleteEditCell {...params} options={params?.id != null ? (perRowOptions[params.id]?.uoms ?? currentUomOptions) : currentUomOptions} />,
			},
			{ 
				field: "remarks", 
				headerName: "Remarks", 
				headerAlign: 'center',
				width: 220, 
				editable: true,
				renderCell: (params: any) => {
					const text = params?.value ?? '';
					return <Tooltip title={String(text)} arrow><div style={{ width: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>{text}</div></Tooltip>;
				},
			},
		];
	}, [apiDepartmentOptions, apiItemGroupOptions, currentItemOptions, currentMakeOptions, currentUomOptions, loadingRows]);

	// current form values must be declared before effects that reference them
	const [currentFormValues, setCurrentFormValues] = React.useState<Record<string, unknown>>(() => initialFormValues || {});

	// Disable table until indent_type + expense_type are present
	const tableDisabled = !(Boolean(currentFormValues.indent_type) && Boolean(currentFormValues.expense_type));

	// call GET_INDENT_SETUP_1 when branch is selected/changed
	React.useEffect(() => {
		const branchVal = initialFormValues.branch ?? currentFormValues.branch;
		if (!branchVal) return;
		const fetchSetup1 = async () => {
			try {
				// read co_id from sidebar_selectedCompany stored in localStorage if available
				let coId: string | undefined = undefined;
				try {
					const rawCompany = typeof window !== 'undefined' ? localStorage.getItem('sidebar_selectedCompany') : null;
					if (rawCompany) {
						const parsed = JSON.parse(rawCompany);
						if (parsed && (parsed.co_id ?? parsed.coId ?? parsed.id)) coId = String(parsed.co_id ?? parsed.coId ?? parsed.id);
					}
				} catch (e) {
					// ignore parse errors
				}

				const qs = `branch_id=${encodeURIComponent(String(branchVal))}` + (coId ? `&co_id=${encodeURIComponent(String(coId))}` : '');
				const url = `${apiRoutesPortalMasters.GET_INDENT_SETUP_1}?${qs}`;
				const resp = await fetchWithCookie(url, 'GET');
				const payload: any = resp.data ?? null;
				if (payload) {
					// projects: [{ prj_name, project_id }]
					setApiProjectOptions((payload.projects || []).map((p: any) => ({ label: p.prj_name ?? p.prj_name ?? p.name, value: String(p.project_id ?? p.projectId ?? p.id) })));
					// expense_types: [{ expense_type_id, expense_type_name }]
					const expenseOps = (payload.expense_types || []).map((e: any) => ({ label: e.expense_type_name ?? e.expense_type_name ?? e.name, value: String(e.expense_type_id ?? e.id ?? e.value) }));
					setApiExpenseOptions(expenseOps);
					setFullExpenseOptions(expenseOps);
					// departments: [{ dept_id, dept_desc }]
					setApiDepartmentOptions((payload.departments || []).map((d: any) => ({ label: d.dept_desc ?? d.dept_desc ?? d.name, value: String(d.dept_id ?? d.id ?? d.value) })));
					// item_groups: [{ item_grp_id, item_grp_name_display, item_grp_code_display }]
								setApiItemGroupOptions((payload.item_groups || []).map((g: any) => {
									const name = g.item_grp_name_display ?? g.name ?? '';
									const code = g.item_grp_code_display ?? g.item_grp_code ?? g.code ?? '';
									const label = code ? `${name} (${code})` : (name || String(g.item_grp_id));
									return { label, value: String(g.item_grp_id ?? g.id) };
								}));
				}
			} catch (e) {
				// ignore
			}
		};
		fetchSetup1();
	}, [initialFormValues.branch, currentFormValues.branch]);

	// filter expense options based on indent_type selection
	React.useEffect(() => {
		const indent = String(currentFormValues.indent_type ?? "").toLowerCase();
		if (!indent) { setApiExpenseOptions(fullExpenseOptions); return; }
		if (indent === 'regular') {
			setApiExpenseOptions(fullExpenseOptions.filter((e) => ['1','2','3','4'].includes(String(e.value))));
		} else if (indent === 'open indent') {
			setApiExpenseOptions(fullExpenseOptions.filter((e) => ['3','4'].includes(String(e.value))));
		} else if (indent === 'bom') {
			setApiExpenseOptions(fullExpenseOptions.filter((e) => ['1','2','3','4'].includes(String(e.value))));
		}
	}, [currentFormValues.indent_type, fullExpenseOptions]);

	// when item_group is selected for a row, call GET_INDENT_SETUP_2 to fetch item/item_makes/uom
	// Note: backend expects a GET with query params — do not send a body with GET.
	const fetchSetup2 = React.useCallback(async (item_group_value: unknown) => {
		try {
			// normalize if an option object was passed (DataGrid often uses full option objects)
			let ig = '';
			if (item_group_value && typeof item_group_value === 'object') {
				const obj = item_group_value as Record<string, any>;
				ig = String(obj.value ?? obj.item_grp_id ?? obj.id ?? '');
			} else {
				ig = String(item_group_value ?? '');
			}

			const qs = `item_group=${encodeURIComponent(ig)}`;
			const url = `${apiRoutesPortalMasters.GET_INDENT_SETUP_2}?${qs}`;
			const resp = await fetchWithCookie(url, 'GET');
			const payload: any = resp.data ?? null;
			if (payload) {
				// payload.items contains default uom per item (uom_id, uom_name)
				const rawItems: any[] = payload.items || [];
				const rawUoms: any[] = payload.uoms || [];

				const items = rawItems.map((i: any) => {
					const itemId = i.item_id ?? i.id ?? i.value;
					const itemCode = i.item_code ?? i.code ?? '';
					const itemName = i.item_name ?? i.name ?? String(itemId);
					const defaultUom = (i.uom_id || i.uom_name) ? { label: i.uom_name ?? i.uom ?? '', value: String(i.uom_id ?? i.uom ?? '') } : null;
					// find extra mapped uoms for this item from payload.uoms where map.item_id === itemId
					const extraUoms = (rawUoms.filter((u: any) => String(u.item_id) === String(itemId)).map((u: any) => ({ label: u.uom_name ?? u.label ?? u.name ?? '', value: String(u.map_to_id ?? u.id ?? u.value) }))) || [];
					return {
						label: `${itemName} (${itemCode})`,
						value: String(itemId),
						defaultUom,
						extraUoms,
					};
				});

				return {
					items,
					makes: (payload.makes || []).map((m: any) => ({ label: m.item_make_name ?? m.label ?? m.name, value: String(m.item_make_id ?? m.id ?? m.value) })),
					uoms: (rawUoms || []).map((u: any) => ({ label: u.uom_name ?? u.label ?? u.name, value: String(u.map_to_id ?? u.id ?? u.value), item_id: String(u.item_id ?? '') })),
				};
			}
			return { items: [], makes: [], uoms: [] };
		} catch (e) {
			return { items: [], makes: [], uoms: [] };
		}
	}, []);

	// reorder: Indent Type should appear before Expense Type; schema uses API-driven option arrays
	const schema: Schema = React.useMemo(() => ({
		title: "Create Indent",
		fields: [
			{ 
				name: "branch", label: "Branch", type: "select", required: true,
				options: branchOptionsLocal.length ? branchOptionsLocal : [], disabled: branchOptionsLocal.length === 1,
				grid: { xs: 12, sm: 4 }
			},
			{ name: "indent_type", label: "Indent Type", type: "select", required: true, options: indentTypeOptions, grid: { xs: 12, sm: 4 } },
			{ name: "expense_type", label: "Expense Type", type: "select", required: true, options: apiExpenseOptions, grid: { xs: 12, sm: 4 } },
			{ name: "date", label: "Date", type: "date", required: true, grid: { xs: 12, sm: 6 } },
			{ name: "indent_no", label: "Indent No", type: "text", required: false, disabled: true, helperText: "Indent No will be displayed once created", grid: { xs: 12, sm: 6 } },
			{ name: "project", label: "Project", type: "select", required: false, options: apiProjectOptions, grid: { xs: 12, sm: 6 } },
			{ name: "name", label: "Name", type: "text", required: (vals) => String(vals.indent_type ?? "").toLowerCase() === "bom", disabled: (vals) => String(vals.indent_type ?? "") !== "bom", grid: { xs: 12, sm: 6 } },
		],
	}), [branchOptionsLocal, apiExpenseOptions, apiProjectOptions]);


	const handleRowsChange = (newRows: Row[]) => setRows(newRows);

	const handleSubmit = async (vals: Record<string, unknown>) => {
		// filter out the trailing blank row(s)
		const nonEmpty = rows.filter(isRowFilled).map(r => ({ ...r, quantity: Number(r.quantity) }));
		const payload = { ...vals, items: nonEmpty };
		// for now log
		// eslint-disable-next-line no-console
		console.log('Submitting indent payload:', payload);
		alert('Submitted (check console)');
	};

	// track form values so we can enable/disable create button
	React.useEffect(() => {
		// noop
	}, []);

	const nonEmptyRows = rows.filter(isRowFilled);
	const allNonEmptyValid = nonEmptyRows.length > 0 && nonEmptyRows.every(isRowValid);
	const requiredFormFilled = Boolean(currentFormValues.branch && currentFormValues.expense_type && currentFormValues.indent_type && currentFormValues.date);
	const canCreate = requiredFormFilled && allNonEmptyValid;

	if (!mounted) {
		// during SSR and initial hydration, render a minimal placeholder that matches layout
		return <Box sx={{ p: 3, minHeight: 24 }} suppressHydrationWarning />;
	}

	return (
		<Box sx={{ p: 3 }} suppressHydrationWarning>
			<MuiForm ref={formRef} schema={schema} initialValues={initialFormValues} mode="create" hideModeToggle hideSubmit onSubmit={handleSubmit} onValuesChange={(v) => setCurrentFormValues(v)} />

			<Box sx={{ mt: 3, height: 360 }}>
				<Box sx={{ position: 'relative', height: '100%' }}>
					<DataGrid
					rows={rows as any}
					columns={columns}
					sx={{
						'& .MuiDataGrid-columnHeaders': {
							borderBottom: '1px solid #d0d7de',
						},
						'& .MuiDataGrid-columnHeader': {
							borderRight: '1px solid #e2e5e9',
							backgroundColor: '#f8f9fa',
							fontWeight: 600,
							fontSize: 13,
							lineHeight: 1.2,
							p: 0,
						},
						'& .MuiDataGrid-columnHeader:last-of-type': {
							borderRight: 'none',
						},
						'& .MuiDataGrid-cell': {
							borderRight: '1px solid #e2e5e9',
							fontSize: 13,
							padding: '2px 6px',
						},
						'& .MuiDataGrid-cell:last-of-type': {
							borderRight: 'none',
						},
						'& .MuiDataGrid-row:nth-of-type(even) .MuiDataGrid-cell': {
							backgroundColor: '#fafafa',
						},
						'& .MuiDataGrid-row:hover .MuiDataGrid-cell': {
							backgroundColor: '#f0f7ff',
						},
						'& .MuiDataGrid-footerContainer': {
							borderTop: '1px solid #d0d7de',
						},
					}}
					editMode="cell"
					processRowUpdate={async (newRow, oldRow) => {
						// detect item_group change to load dependent options
							if (String(newRow.item_group ?? '') !== String(oldRow?.item_group ?? '')) {
								// mark row loading and clear option pools & dependent fields immediately
								setLoadingRows(prev => { const s = new Set(prev); s.add(newRow.id); return s; });
								setPerRowOptions(prev => ({ ...prev, [newRow.id]: { items: [], makes: [], uoms: [] } }));
								setCurrentItemOptions([]); setCurrentMakeOptions([]); setCurrentUomOptions([]);
								newRow = { ...newRow, item: '', item_make: '', quantity: '', uom: '', remarks: '' };
								setRows(prev => prev.map(r => r.id === newRow.id ? { ...r, ...newRow } : r));
								try {
									const { items, makes, uoms } = await fetchSetup2(newRow.item_group ?? '');
									setPerRowOptions(prev => ({ ...prev, [newRow.id]: { items, makes, uoms } }));
									setCurrentItemOptions(items); setCurrentMakeOptions(makes); setCurrentUomOptions(uoms);
								} finally {
									setLoadingRows(prev => { const s = new Set(prev); s.delete(newRow.id); return s; });
								}
							}

							// if item selection changed, set UOM options to include the item's default uom + any extra mapped uoms
							if (String(newRow.item ?? '') !== String(oldRow?.item ?? '')) {
								// try to locate the selected item in per-row options first, then global
								const rowPool = perRowOptions[newRow.id]?.items ?? currentItemOptions;
								const selectedItem = rowPool.find((it: any) => String(it.value) === String(newRow.item) || String(it.value) === String((newRow.item?.value ?? newRow.item)));
								if (selectedItem) {
									const defaultUom = selectedItem.defaultUom ? [selectedItem.defaultUom] : [];
									const extra = selectedItem.extraUoms ?? [];
									const combined = [...defaultUom, ...extra];
									// set dropdown options for this item
									// set per-row UOM options so other rows don't get these options
									setPerRowOptions(prev => ({ ...prev, [newRow.id]: { items: rowPool, makes: perRowOptions[newRow.id]?.makes ?? currentMakeOptions, uoms: combined } }));
									setCurrentUomOptions(combined.length ? combined : currentUomOptions);
									// if defaultUom exists, set the row's uom to it
									if (defaultUom.length && String(newRow.uom ?? '') !== String(defaultUom[0].value)) {
										setRows((prev) => prev.map(r => r.id === newRow.id ? { ...r, uom: defaultUom[0].value } : r));
									}
								}
							}

						// update the row in state
						setRows((prev) => {
							const next = prev.map((r) => (r.id === newRow.id ? { ...r, ...newRow } : r));
							// when quantity is entered and the row is valid, append a new blank row
							const last = next[next.length - 1];
							if (last && isRowFilled(last) && isRowValid(last)) {
								next.push(blankRow());
							}
							return next;
						});
						return newRow;
					}}
					onProcessRowUpdateError={() => { /* ignore for now */ }}
					/>
					{tableDisabled && (
						<Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto' }}>
							<Box sx={{ bgcolor: 'background.paper', p: 2, borderRadius: 1 }}>Please select Indent Type and Expense Type to enable the table</Box>
						</Box>
					)}
				</Box>
			</Box>

			<Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
				<Button variant="contained" disabled={!canCreate} onClick={() => formRef.current?.submit()}>Create</Button>
			</Box>
		</Box>
	);
}
