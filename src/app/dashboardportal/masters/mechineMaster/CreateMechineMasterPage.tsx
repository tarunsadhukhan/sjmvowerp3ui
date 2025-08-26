"use client";

import React, { useEffect, useState } from "react";
import { Box, Button, Dialog, DialogContent, DialogTitle, MenuItem, TextField, FormControlLabel, Switch, CircularProgress, FormHelperText } from "@mui/material";
import { fetchWithCookie } from "@/utils/apiClient2";
import { apiRoutesPortalMasters } from "@/utils/api";

interface Props { open?: boolean; onClose?: (saved?: boolean) => void; existingRows?: any[]; readOnly?: boolean; initialValues?: any; isEdit?: boolean; mechine_master_id?: string | number }

export default function CreateMechineMasterPage({ open = false, onClose, existingRows = [], readOnly = false, initialValues = null, isEdit = false, mechine_master_id }: Props) {
  const [loading, setLoading] = useState(true);
  const [setupData, setSetupData] = useState<any>(null);
  const [branchOptions, setBranchOptions] = useState<any[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<any[]>([]);
  const [allDepartments, setAllDepartments] = useState<any[]>([]);
  const [mechineTypeOptions, setMechineTypeOptions] = useState<any[]>([]);
  const [form, setForm] = useState({ branch_id: "", dept_id: "", mechine_type_id: "", mechine_name: "", mechine_code: "", mechine_posting_code: "" , active: true });
  const [submitting, setSubmitting] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        const selectedCompany = localStorage.getItem("sidebar_selectedCompany");
            const sidebar_selectedBranches = localStorage.getItem("sidebar_selectedBranches");
            const co_id = selectedCompany ? JSON.parse(selectedCompany).co_id : "";
        // build branch_id param similar to page.tsx
        let branch_ids = "";
        if (sidebar_selectedBranches) {
          try {
            const parsed = JSON.parse(sidebar_selectedBranches);
            if (Array.isArray(parsed)) {
              const ids = parsed
                .map((b: any) => {
                  if (b && typeof b === 'object') return b.branch_id ?? b.id ?? b.value ?? '';
                  if (b === 0) return '0';
                  if (b) return String(b);
                  return '';
                })
                .map(String)
                .filter(Boolean);
              branch_ids = ids.join(',');
            } else if (parsed) {
              branch_ids = String(parsed);
            }
          } catch (e) { /* ignore parse errors */ }
        }

        const params = new URLSearchParams({ co_id, branch_id: branch_ids });
        const url = `${apiRoutesPortalMasters.MECHINE_MASTER_CREATE_SETUP}?${params}`;
        const { data, error } = await fetchWithCookie(url, "GET") as any;
  if (error || !data) throw new Error(error || 'Failed to load setup');
  void 0;
      const candidate = data?.data ?? data;
        const branches = candidate?.branchs || candidate?.branches || candidate?.branch_list || candidate?.branch || [];
        const depts = candidate?.departments || candidate?.dept_list || candidate?.dept || [];
        const mechineTypes = candidate?.mechine_types || candidate?.mechine_types_list || candidate?.mechines || [];

        const rawBranches = Array.isArray(branches) ? branches : [branches];
        const normalizedBranches = rawBranches.map((b:any)=> ({ id: String(b.branch_id ?? b.id ?? b.value ?? ''), label: b.branch_name ?? b.branch_desc ?? b.name, raw: b })).filter((x:any)=>x.id);

  const rawDepts = Array.isArray(depts) ? depts : (depts ? [depts] : []);
  const normalizedDepts = rawDepts.map((d:any)=> ({ id: String(d.dept_id ?? d.id ?? d.value ?? ''), label: d.dept_name ?? d.dept_name_display ?? d.name, raw: d })).filter((x:any)=>x.id);

        const rawTypes = Array.isArray(mechineTypes) ? mechineTypes : [mechineTypes];
        const normalizedTypes = rawTypes.map((t:any)=> ({ id: String(t.id ?? t.mechine_type_id ?? t.value ?? ''), label: t.mechine_type ?? t.name ?? t.display, raw: t })).filter((x:any)=>x.id);

        setBranchOptions(normalizedBranches);
        setDepartmentOptions(normalizedDepts);
        setAllDepartments(normalizedDepts);
        setMechineTypeOptions(normalizedTypes);

        // default first values if available (only when no initialValues provided)
        if (!initialValues) {
          setForm((f) => ({ ...f, branch_id: normalizedBranches[0]?.id ?? "", dept_id: normalizedDepts[0]?.id ?? "", mechine_type_id: normalizedTypes[0]?.id ?? "" }));
        }
        setSetupData(candidate);
      } catch (err:any) {
        // Failed to load create setup; surface via state and avoid console noise
        setBranchOptions([]); setDepartmentOptions([]); setMechineTypeOptions([]); setSetupData(null);
      } finally { setLoading(false); }
    })();
  }, []);

  useEffect(()=>{ setNameError(null); setCodeError(null); }, [form.branch_id, form.dept_id, form.mechine_type_id]);

  useEffect(() => {
  if (!initialValues) return;
  // initial values received; mapping logic handled in next effect
  void 0;
}, [initialValues]);

  // apply initial values when provided (for view/edit)
  useEffect(()=>{
    if (!initialValues) return;
    // debug
  try { void 0; } catch(e) {}
    // support initialValues passed as an array (e.g. [{...}]) by normalizing to the first element
    const iv = Array.isArray(initialValues) ? initialValues[0] : initialValues;
    const pick = (keys: string[]) => {
      if (!iv) return undefined;
      for (const k of keys) if (iv[k] !== undefined && iv[k] !== null) return iv[k];
      return undefined;
    };
  void 0;

    const branchVal = pick(['branch_id','branch','branch_display']);
    const deptVal = pick(['dept_id','dept','department_id','dept_name']);
    const typeVal = pick(['mechine_type_name']);
    const nameVal = pick(['mechine_name','mechine_nm','name']);
    const codeVal = pick(['mechine_code','code','mechine_cd']);
    const postingVal = pick(['mechine_posting_code','mech_posting_code','mech_posting','posting_code','mech_post_code']);
    const activeVal = pick(['active']);
  setForm((f)=> ({
      ...f,
      branch_id: String(branchVal ?? ''),
      dept_id: String(deptVal ?? ''),
      mechine_type_id: String(typeVal ?? ''),
      mechine_name: nameVal ?? f.mechine_name ?? '',
      mechine_code: codeVal ?? f.mechine_code ?? '',
      mechine_posting_code: postingVal ?? f.mechine_posting_code ?? '',
      active: activeVal === undefined ? f.active : (activeVal === 1 || activeVal === true || activeVal === '1'),
    }));
  try { void 0; } catch(e) {}
  }, [initialValues]);

  const getCandidates = (props?: any[])=> {
    if (props && props.length) return props;
    const c = setupData?.mechines || setupData?.mechine_masters || setupData?.data || [];
    return Array.isArray(c)?c:[];
  };

  const validateName = (props?: any[]) => {
    const name = String(form.mechine_name ?? "").trim();
    if (!name) { setNameError('Machine name is required'); return false; }
    const branchId = String(form.branch_id ?? "");
    const deptId = String(form.dept_id ?? "");
    const typeId = String(form.mechine_type_id ?? "");
    const candidates = getCandidates(props);
    const exists = candidates.some((r:any)=>{
      const rName = String(r.mechine_name ?? r.name ?? '').trim().toLowerCase();
      if (rName !== name.toLowerCase()) return false;
      if (branchId && String(r.branch_id ?? r.branch ?? '') !== branchId) return false;
      if (deptId && String(r.dept_id ?? r.dept ?? '') !== deptId) return false;
      if (typeId && String(r.mechine_type_id ?? r.mechine_type ?? r.mechine_type_id ?? '') !== typeId) return false;
      return true;
    });
    if (exists) { setNameError('Machine already exists'); return false; }
    setNameError(null); return true;
  }

  const validateCode = (props?: any[])=>{
    const code = String(form.mechine_code ?? "").trim();
    if (!code) { setCodeError('Machine code is required'); return false; }
  const candidates = getCandidates(props);
  const exists = candidates.some((r:any)=> String(r.mechine_code ?? r.code ?? '').trim().toLowerCase() === code.toLowerCase());
    if (exists) { setCodeError('Machine code already exists'); return false; }
    setCodeError(null); return true;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => { const { name, value, type } = e.target; setForm((f)=> ({ ...f, [name!]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value })); setError(null); if (name === 'mechine_name') setNameError(null); if (name === 'mechine_code') setCodeError(null); if (name === 'branch_id') {
  // filter departments when branch changes using cached allDepartments
  const b = String(e.target.value);
  const filtered = allDepartments.filter((d:any)=> String(d.raw?.branch_id ?? d.raw?.branch ?? d.raw?.branch_id ?? '') === b || String(d.raw?.branch_id ?? d.raw?.branch ?? '') === b);
  const normalized = Array.isArray(filtered)? filtered.map((d:any)=> ({ id: String(d.id ?? d.dept_id ?? d.raw?.dept_id ?? ''), label: d.label ?? d.dept_name ?? d.raw?.dept_name ?? d.raw?.name, raw: d.raw ?? d })) : [];
  setDepartmentOptions(normalized.length ? normalized : allDepartments);
  // default dept to first if exists, otherwise clear
  if (normalized.length) setForm((f)=> ({ ...f, dept_id: normalized[0].id })); else setForm((f)=> ({ ...f, dept_id: '' }));
    }};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const okName = validateName(existingRows);
    const okCode = validateCode(existingRows);
    if (!okName || !okCode) return setError('Fix validation errors');
    setSubmitting(true);
    try {
      const selectedCompany = localStorage.getItem('sidebar_selectedCompany'); const co_id = selectedCompany ? JSON.parse(selectedCompany).co_id : '';
      const payload: any = { co_id, mechine_name: form.mechine_name, mechine_code: form.mechine_code };
      if (form.mechine_posting_code !== undefined && form.mechine_posting_code !== '') payload.mechine_posting_code = Number(form.mechine_posting_code || 0);
      payload.active = form.active ? 1 : 0;
      if (form.branch_id) payload.branch_id = form.branch_id;
      if (form.dept_id) payload.dept_id = form.dept_id;
      if (form.mechine_type_id) payload.mechine_type_id = form.mechine_type_id;
      let result: any = null;
      if (isEdit) {
        payload.mechine_master_id = mechine_master_id;
        const { data, error } = await fetchWithCookie(apiRoutesPortalMasters.MECHINE_MASTER_EDIT, 'POST', payload) as any;
        result = data;
        if (error || !data) throw new Error(error || 'Edit failed');
      } else {
        const { data, error } = await fetchWithCookie(apiRoutesPortalMasters.MECHINE_MASTER_CREATE, 'POST', payload) as any;
        result = data;
        if (error || !data) throw new Error(error || 'Create failed');
      }
      if (onClose) onClose(true);
    } catch(err:any){ setError(err?.message || String(err)); } finally { setSubmitting(false); }
  }

  const Form = (
    <Box component="form" onSubmit={handleSubmit} sx={{ p:2, minWidth: 380 }}>
      <TextField select label="Branch" name="branch_id" value={form.branch_id} onChange={handleChange} fullWidth margin="normal" disabled={readOnly}>
        {branchOptions.map(b=> <MenuItem key={b.id} value={b.id}>{b.label}</MenuItem>)}
      </TextField>
      <TextField select label="Department" name="dept_id" value={form.dept_id} onChange={handleChange} fullWidth margin="normal" disabled={readOnly}>
        {departmentOptions.map(d=> <MenuItem key={d.id} value={d.id}>{d.label}</MenuItem>)}
      </TextField>
      <TextField select label="Machine Type" name="mechine_type_id" value={form.mechine_type_id} onChange={handleChange} fullWidth margin="normal" disabled={readOnly}>
        {mechineTypeOptions.map(t=> <MenuItem key={t.id} value={t.id}>{t.label}</MenuItem>)}
      </TextField>
      <TextField name="mechine_name" label="Machine Name" value={form.mechine_name} onChange={handleChange} onBlur={() => validateName(existingRows)} error={!!nameError} helperText={nameError ?? undefined} fullWidth margin="normal" required InputProps={{ readOnly }} />
      <TextField name="mechine_code" label="Machine Code" value={form.mechine_code} onChange={handleChange} onBlur={() => validateCode(existingRows)} error={!!codeError} helperText={codeError ?? undefined} fullWidth margin="normal" required InputProps={{ readOnly }} />
      <TextField name="mechine_posting_code" label="Machine Posting Code" type="number" value={form.mechine_posting_code} onChange={handleChange} fullWidth margin="normal" InputProps={{ readOnly }} />
      <FormControlLabel control={<Switch checked={!!form.active} onChange={(e)=> setForm((f)=> ({ ...f, active: e.target.checked }))} disabled={readOnly} />} label="Active" />
      {error && <FormHelperText error>{error}</FormHelperText>}
      <Box sx={{ mt:2, display:'flex', justifyContent:'flex-end' }}>
  {typeof open === 'boolean' && <Button onClick={() => onClose && onClose()} color="secondary" sx={{ mr: 2 }} disabled={submitting}>{readOnly ? 'Close' : 'Cancel'}</Button>}
  {!readOnly && <Button type="submit" variant="contained" disabled={submitting || loading || !!nameError || !!codeError}>{submitting? <CircularProgress size={18} /> : 'Create'}</Button>}
      </Box>
    </Box>
  );

  return (
    <>
      {typeof open === 'boolean' ? (
        <Dialog open={open} onClose={() => onClose && onClose()} maxWidth="sm" fullWidth>
          <DialogTitle>Create Machine</DialogTitle>
          <DialogContent>{loading ? <CircularProgress /> : Form}</DialogContent>
        </Dialog>
      ) : (
        <Box sx={{ maxWidth: 500, mx:'auto', mt:4 }}>
          <DialogTitle>Create Machine</DialogTitle>
          <DialogContent>{loading ? <CircularProgress /> : Form}</DialogContent>
        </Box>
      )}
    </>
  );
}
