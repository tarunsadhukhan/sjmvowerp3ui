import React from "react";
import { Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";

interface UOMMapping {
  uom_id: number;
  uom_name: string;
}

interface UOMMappingTableProps {
  mapping: UOMMapping[];
}

const UOMMappingTable: React.FC<UOMMappingTableProps> = ({ mapping }) => {
  return (
    <Box>
      <div style={{ fontWeight: "bold", marginBottom: 8 }}>UOM Mapping</div>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>UOM ID</TableCell>
              <TableCell>UOM Name</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {mapping.map(uom => (
              <TableRow key={uom.uom_id}>
                <TableCell>{uom.uom_id}</TableCell>
                <TableCell>{uom.uom_name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default UOMMappingTable;
