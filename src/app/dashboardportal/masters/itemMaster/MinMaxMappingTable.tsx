import React from "react";
import { Box, TextField } from "@mui/material";

interface MinMaxMappingTableProps {
  mapping: Array<{
    branch_id: number;
    branch_name: string;
    minqty: number | null;
    maxqty: number | null;
    min_order_qty: number | null;
    lead_time: number | null;
  }>;
  onChange?: (rows: Array<{
    branch_id: number;
    branch_name: string;
    minqty: number | null;
    maxqty: number | null;
    min_order_qty: number | null;
    lead_time: number | null;
  }>) => void;
}

const MinMaxMappingTable: React.FC<MinMaxMappingTableProps> = ({ mapping, onChange }) => {
  const [rows, setRows] = React.useState(mapping);
  const [errors, setErrors] = React.useState<Record<number, { minqty?: string; maxqty?: string; min_order_qty?: string; lead_time?: string }>>({});

  // keep internal rows in sync when parent mapping prop changes
  React.useEffect(() => {
  syncingFromPropRef.current = true;
  setRows(mapping ?? []);
  const t = setTimeout(() => { syncingFromPropRef.current = false; }, 0);
  return () => clearTimeout(t);
  }, [mapping]);
  
  const syncingFromPropRef = React.useRef(false);
  
  const handleChange = (index: number, field: string, value: string) => {
    setRows(prev => prev.map((row, i) => i === index ? { ...row, [field]: value === "" ? null : Number(value) } : row));
  };
  
  // emit changes to parent when rows change, but avoid emitting while we're syncing from prop
  React.useEffect(() => {
    // validate rows first
    const newErrors: Record<number, { minqty?: string; maxqty?: string; min_order_qty?: string; lead_time?: string }> = {};
    rows.forEach((row, i) => {
      const min = row.minqty;
      const max = row.maxqty;
      const moq = (row as any).min_order_qty ?? (row as any).minOrderQty ?? null;
      const lead = (row as any).lead_time ?? (row as any).leadTime ?? null;

      const rowErr: any = {};
      // numeric checks: allow decimals (finite numbers) or null
      if (min !== null && min !== undefined && !Number.isFinite(Number(min))) rowErr.minqty = 'Must be a number';
      if (max !== null && max !== undefined && !Number.isFinite(Number(max))) rowErr.maxqty = 'Must be a number';
      if (moq !== null && moq !== undefined && !Number.isFinite(Number(moq))) rowErr.min_order_qty = 'Must be a number';
      if (lead !== null && lead !== undefined && !Number.isFinite(Number(lead))) rowErr.lead_time = 'Must be a number';

      // relation checks
      if (min != null && max != null && Number(max) <= Number(min)) {
        rowErr.maxqty = 'Max must be greater than Min';
      }
      if (moq != null && min != null && Number(moq) > Number(min)) {
        rowErr.min_order_qty = 'Min order qty must be <= Min qty';
      }

      if (Object.keys(rowErr).length > 0) newErrors[i] = rowErr;
    });
    setErrors(newErrors);

    if (syncingFromPropRef.current) return;
    onChange?.(rows);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows]);

  return (
    <Box sx={{ mt: 2 }}>
      <div style={{ fontWeight: "bold", marginBottom: 8 }}>Branch Min/Max/Order/Lead Time</div>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ border: "1px solid #ccc", padding: 8 }}>Branch</th>
            <th style={{ border: "1px solid #ccc", padding: 8 }}>Min Qty</th>
            <th style={{ border: "1px solid #ccc", padding: 8 }}>Max Qty</th>
            <th style={{ border: "1px solid #ccc", padding: 8 }}>Min Order Qty</th>
            <th style={{ border: "1px solid #ccc", padding: 8 }}>Lead Time</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={`${row.branch_id ?? 'row'}-${idx}`}>
              <td style={{ border: "1px solid #ccc", padding: 8 }}>{row.branch_name}</td>
              <td style={{ border: "1px solid #ccc", padding: 8 }}>
                <TextField
                  type="number"
                  value={row.minqty ?? ""}
                  onChange={e => handleChange(idx, "minqty", e.target.value)}
                  size="small"
                  variant="outlined"
                  inputProps={{ min: 0, step: 'any' }}
                  error={Boolean(errors[idx]?.minqty)}
                  helperText={errors[idx]?.minqty}
                />
              </td>
              <td style={{ border: "1px solid #ccc", padding: 8 }}>
                <TextField
                  type="number"
                  value={row.maxqty ?? ""}
                  onChange={e => handleChange(idx, "maxqty", e.target.value)}
                  size="small"
                  variant="outlined"
                  inputProps={{ min: 0, step: 'any' }}
                  error={Boolean(errors[idx]?.maxqty)}
                  helperText={errors[idx]?.maxqty}
                />
              </td>
              <td style={{ border: "1px solid #ccc", padding: 8 }}>
                <TextField
                  type="number"
                  value={row.min_order_qty ?? ""}
                  onChange={e => handleChange(idx, "min_order_qty", e.target.value)}
                  size="small"
                  variant="outlined"
                  inputProps={{ min: 0, step: 'any' }}
                  error={Boolean(errors[idx]?.min_order_qty)}
                  helperText={errors[idx]?.min_order_qty}
                />
              </td>
              <td style={{ border: "1px solid #ccc", padding: 8 }}>
                <TextField
                  type="number"
                  value={row.lead_time ?? ""}
                  onChange={e => handleChange(idx, "lead_time", e.target.value)}
                  size="small"
                  variant="outlined"
                  inputProps={{ min: 0, step: 'any' }}
                  error={Boolean(errors[idx]?.lead_time)}
                  helperText={errors[idx]?.lead_time}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Box>
  );
};

export default MinMaxMappingTable;
