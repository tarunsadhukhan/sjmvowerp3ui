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
}

const MinMaxMappingTable: React.FC<MinMaxMappingTableProps> = ({ mapping }) => {
  const [rows, setRows] = React.useState(mapping);

  const handleChange = (index: number, field: string, value: string) => {
    setRows(prev => prev.map((row, i) =>
      i === index ? { ...row, [field]: value === "" ? null : Number(value) } : row
    ));
  };

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
            <tr key={row.branch_id}>
              <td style={{ border: "1px solid #ccc", padding: 8 }}>{row.branch_name}</td>
              <td style={{ border: "1px solid #ccc", padding: 8 }}>
                <TextField
                  type="number"
                  value={row.minqty ?? ""}
                  onChange={e => handleChange(idx, "minqty", e.target.value)}
                  size="small"
                  variant="outlined"
                  inputProps={{ min: 0 }}
                />
              </td>
              <td style={{ border: "1px solid #ccc", padding: 8 }}>
                <TextField
                  type="number"
                  value={row.maxqty ?? ""}
                  onChange={e => handleChange(idx, "maxqty", e.target.value)}
                  size="small"
                  variant="outlined"
                  inputProps={{ min: 0 }}
                />
              </td>
              <td style={{ border: "1px solid #ccc", padding: 8 }}>
                <TextField
                  type="number"
                  value={row.min_order_qty ?? ""}
                  onChange={e => handleChange(idx, "min_order_qty", e.target.value)}
                  size="small"
                  variant="outlined"
                  inputProps={{ min: 0 }}
                />
              </td>
              <td style={{ border: "1px solid #ccc", padding: 8 }}>
                <TextField
                  type="number"
                  value={row.lead_time ?? ""}
                  onChange={e => handleChange(idx, "lead_time", e.target.value)}
                  size="small"
                  variant="outlined"
                  inputProps={{ min: 0 }}
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
