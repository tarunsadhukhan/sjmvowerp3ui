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
  mapToUom?: string | number | null;
  isFixed?: boolean;
  relationValue?: number | null; // decimal
  rounding?: number | null; // integer
  id?: string; // client-side id
};

interface UOMMappingTableProps {
  mapping?: UOMRow[]; // initial mapping
  uomOptions: UOMOption[];
  onChange?: (rows: UOMRow[]) => void;
}

const blankRow = (): UOMRow => ({ mapToUom: null, isFixed: false, relationValue: null, rounding: null, id: String(Date.now()) });

const UOMMappingTable: React.FC<UOMMappingTableProps> = ({ mapping = [], uomOptions, onChange }) => {
  const [rows, setRows] = React.useState<UOMRow[]>(() => (mapping.length > 0 ? mapping.map(r => ({ ...r, id: String(Math.random()) })) : [blankRow()]));

  React.useEffect(() => {
    // ensure there's always one empty row at the end
    setRows((cur) => {
      const hasEmpty = cur.some(r => !r.mapToUom && (r.relationValue === null || r.relationValue === undefined) && (r.rounding === null || r.rounding === undefined));
      if (!hasEmpty) return [...cur, blankRow()];
      return cur;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerChange = (next: UOMRow[]) => {
    // remove the trailing blank row before emitting
    const trimmed = next.filter((r, i) => !(i === next.length - 1 && !r.mapToUom && (r.relationValue === null || r.relationValue === undefined) && (r.rounding === null || r.rounding === undefined)));
    onChange?.(trimmed);
  };

  const updateRow = (idx: number, patch: Partial<UOMRow>) => {
    setRows((cur) => {
      const next = cur.map((r, i) => (i === idx ? { ...r, ...patch } : r));
      // ensure trailing blank row
      const last = next[next.length - 1];
      if (last && (last.mapToUom || last.relationValue !== null || last.rounding !== null)) {
        next.push(blankRow());
      }
      triggerChange(next);
      return next;
    });
  };

  const removeRow = (idx: number) => {
    setRows((cur) => {
      const next = cur.filter((_, i) => i !== idx);
      if (next.length === 0) next.push(blankRow());
      triggerChange(next);
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
              <TableCell>Map To UOM</TableCell>
              <TableCell>Fixed / Variable</TableCell>
              <TableCell>Relation Value</TableCell>
              <TableCell>Rounding</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r, idx) => (
              <TableRow key={r.id}>
                <TableCell>
                  <Select
                    fullWidth
                    size="small"
                    value={r.mapToUom ?? ""}
                    onChange={(e) => updateRow(idx, { mapToUom: e.target.value })}
                  >
                    <MenuItem value=""><em>None</em></MenuItem>
                    {uomOptions.map((o) => (
                      <MenuItem key={String(o.value)} value={o.value}>{o.label}</MenuItem>
                    ))}
                  </Select>
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
