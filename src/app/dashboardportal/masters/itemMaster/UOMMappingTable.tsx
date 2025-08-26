import React from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  Checkbox,
  TextField,
  IconButton,
  Tooltip,
} from "@mui/material";
import { Trash } from 'lucide-react';

type UOMOption = { label: string; value: string | number };

export type UOMRow = {
  mapFromUom?: string | number | null;
  mapFromName?: string | null;
  mapToUom?: string | number | null;
  mapToName?: string | null;
  isFixed?: boolean;
  relationValue?: number | null; // decimal
  rounding?: number | null; // integer
  id?: string; // client-side id
};

interface UOMMappingTableProps {
  mapping?: UOMRow[]; // initial mapping
  uomOptions: UOMOption[];
  itemDefaultUom?: string | number | null; // the item's current UOM (map_from default)
  onChange?: (rows: UOMRow[]) => void;
}

const blankRow = (itemDefaultUom?: string | number | null): UOMRow => ({ mapFromUom: itemDefaultUom != null ? String(itemDefaultUom) : null, mapFromName: null, mapToUom: null, mapToName: null, isFixed: false, relationValue: null, rounding: null, id: String(Date.now()) });

const UOMMappingTable: React.FC<UOMMappingTableProps> = ({ mapping = [], uomOptions, itemDefaultUom = null, onChange }) => {
  // Start with a single blank row; we'll sync to `mapping` when effect runs.
  const [rows, setRows] = React.useState<UOMRow[]>(() => [blankRow(itemDefaultUom)]);

  // Keep internal rows in sync when parent `mapping` or `itemDefaultUom` changes.
  // Accept both server-shaped rows ({ map_from_id, map_to_id, is_fixed, ... })
  // and UI-shaped rows ({ mapFromUom, mapToUom, isFixed, ... }).
  const syncingFromPropRef = React.useRef(false);
  React.useEffect(() => {
    syncingFromPropRef.current = true;

    const mkBlank = () => {
      const bf = blankRow(itemDefaultUom);
      const fromVal = bf.mapFromUom;
      return { ...bf, mapFromName: fromVal ? uomOptions.find(o => String(o.value) === String(fromVal))?.label ?? null : null } as UOMRow;
    };

    if (Array.isArray(mapping) && mapping.length > 0) {
      const normalized = mapping.map((r) => {
        const m: any = r || {};
        const mapFromUomRaw = m.mapFromUom ?? m.map_from_id ?? m.map_from ?? null;
        const mapFromUom = mapFromUomRaw != null ? String(mapFromUomRaw) : null;
        const mapToUomRaw = m.mapToUom ?? m.map_to_id ?? m.map_to ?? null;
        const mapToUom = mapToUomRaw != null ? String(mapToUomRaw) : null;
        const mapFromName = m.mapFromName ?? m.map_from_name ?? uomOptions.find(o => String(o.value) === String(mapFromUom))?.label ?? null;
        const mapToName = m.mapToName ?? m.map_to_name ?? uomOptions.find(o => String(o.value) === String(mapToUom))?.label ?? null;
        const isFixed = Boolean(m.isFixed ?? m.is_fixed ?? false);
        const relationValue = m.relationValue ?? m.relation_value ?? null;
        const rounding = m.rounding ?? null;
        return {
          id: String(Math.random()),
          mapFromUom,
          mapFromName,
          mapToUom,
          mapToName,
          isFixed,
          relationValue,
          rounding,
        } as UOMRow;
      });
      setRows([...normalized, mkBlank()]);
    } else {
      setRows([mkBlank()]);
    }

    const t = setTimeout(() => { syncingFromPropRef.current = false; }, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapping, itemDefaultUom, uomOptions]);

  const isRowEmpty = (r: UOMRow) => !r.mapToUom && (r.relationValue === null || r.relationValue === undefined) && (r.rounding === null || r.rounding === undefined);

  // simple validation state: track duplicate map_to values
  const [errors, setErrors] = React.useState<Record<number, string>>({});

  // emit changes to parent and validate uniqueness — but do it in an effect to avoid
  // updating parent state while rendering this component.
  React.useEffect(() => {
    // ensure there's always one empty trailing row
    const last = rows[rows.length - 1];
    const lastEmpty = last ? isRowEmpty(last) : true;
    if (!lastEmpty) {
      setRows((prev) => [...prev, blankRow(itemDefaultUom)]);
      return; // wait for next render where trailing blank exists
    }

    // if we're currently syncing from prop, skip emitting back to parent to avoid loops
    if (syncingFromPropRef.current) {
      // compute validation only
      const seenSkip = new Map<string, number>();
      const newErrorsSkip: Record<number, string> = {};
      rows.forEach((r, i) => {
        if (r.mapToUom) {
          const key = String(r.mapToUom);
          if (seenSkip.has(key)) {
            newErrorsSkip[i] = 'Duplicate mapping';
            newErrorsSkip[seenSkip.get(key)!] = 'Duplicate mapping';
          } else {
            seenSkip.set(key, i);
          }
        }
      });
      setErrors(newErrorsSkip);
      return;
    }

    // compute validation: unique mapToUom across non-empty rows
    const seen = new Map<string, number>();
    const newErrors: Record<number, string> = {};
    rows.forEach((r, i) => {
      if (r.mapToUom) {
        const key = String(r.mapToUom);
        if (seen.has(key)) {
          newErrors[i] = 'Duplicate mapping';
          newErrors[seen.get(key)!] = 'Duplicate mapping';
        } else {
          seen.set(key, i);
        }
      }
    });
    setErrors(newErrors);

    // emit trimmed rows (exclude trailing blank)
    const trimmed = rows.filter((r, i) => !(i === rows.length - 1 && isRowEmpty(r)));
    const emitted = trimmed.map(r => ({
      map_from_id: r.mapFromUom ? Number(r.mapFromUom) : null,
      map_to_id: r.mapToUom ? Number(r.mapToUom) : null,
      is_fixed: r.isFixed ? 1 : 0,
      relation_value: r.relationValue ?? null,
      rounding: r.rounding ?? null,
    }));
    onChange?.(emitted as any);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, itemDefaultUom, uomOptions]);

  const updateRow = (idx: number, patch: Partial<UOMRow>) => {
  setRows((cur) => cur.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const removeRow = (idx: number) => {
    setRows((cur) => {
      const next = cur.filter((_, i) => i !== idx);
      if (next.length === 0) next.push(blankRow(itemDefaultUom));
      return next;
    });
  };

  return (
    <Box>
      <div style={{ fontWeight: "bold", marginBottom: 8 }}>UOM Mapping</div>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Map From</TableCell>
              <TableCell>Map To UOM</TableCell>
              <TableCell>Fixed </TableCell>
              <TableCell>Relation Value</TableCell>
              <TableCell>Rounding</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r, idx) => (
              <TableRow key={r.id}>
                <TableCell>
                  {/* show map from name read-only; fallback to itemDefaultUom label */}
                  <div>{r.mapFromName ?? (uomOptions.find(o => String(o.value) === String(r.mapFromUom))?.label ?? '')}</div>
                </TableCell>
                <TableCell>
                  <Select
                    fullWidth
                    size="small"
                    value={r.mapToUom ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      const label = uomOptions.find(o => String(o.value) === String(val))?.label ?? null;
                      updateRow(idx, { mapToUom: val, mapToName: label });
                    }}
                  >
                    <MenuItem value=""><em>None</em></MenuItem>
                    {uomOptions
                      .filter(o => String(o.value) !== String(r.mapFromUom))
                      .filter(o => {
                        // exclude values already used in other rows' mapToUom
                        const usedByOther = rows.some((rr, ri) => ri !== idx && String(rr.mapToUom) === String(o.value));
                        return !usedByOther;
                      })
                      .map((o) => (
                        <MenuItem key={String(o.value)} value={o.value}>{o.label}</MenuItem>
                      ))}
                  </Select>
                  {errors[idx] && (
                    <div style={{ color: 'red', fontSize: 12 }}>{errors[idx]}</div>
                  )}
                </TableCell>
                <TableCell>
                  <Checkbox
                    checked={Boolean(r.isFixed)}
                    onChange={(e) => updateRow(idx, { isFixed: e.target.checked })}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    fullWidth
                    value={r.relationValue ?? ""}
                    onChange={(e) => {
                      // accept only decimal
                      const v = e.target.value;
                      const num = v === "" ? null : Number(v);
                      if (v === "" || !Number.isNaN(num)) updateRow(idx, { relationValue: num });
                    }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    size="small"
                    fullWidth
                    value={r.rounding ?? ""}
                    onChange={(e) => {
                      // accept only integer
                      const v = e.target.value.replace(/[^0-9-]/g, "");
                      const num = v === "" ? null : parseInt(v, 10);
                      if (v === "" || !Number.isNaN(num)) updateRow(idx, { rounding: num });
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title="Remove row">
                    <IconButton size="small" onClick={() => removeRow(idx)}>
                      <Trash size={14} />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default UOMMappingTable;
