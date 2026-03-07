"use client";

import React, { useState } from "react";
import { Box, Typography, TextField, MenuItem } from "@mui/material";
import { useSidebarContext } from "@/components/dashboard/sidebarContext";
import IndentItemwiseSection from "./IndentItemwiseSection";
import PoItemwiseSection from "./PoItemwiseSection";
import SrItemwiseSection from "./SrItemwiseSection";

const REPORT_OPTIONS = [
  { value: "indent_itemwise", label: "Item-wise Indent Report" },
  { value: "po_itemwise", label: "Item-wise PO Report" },
  { value: "sr_itemwise", label: "Item-wise SR Report" },
] as const;

type ReportType = (typeof REPORT_OPTIONS)[number]["value"];

export default function ProcurementReportsPage() {
  const { selectedCompany } = useSidebarContext();
  const [selectedReport, setSelectedReport] = useState<ReportType>("indent_itemwise");

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ color: "#0C3C60", fontWeight: "bold", mb: 2 }}>
        Procurement Reports
      </Typography>

      <TextField
        select
        label="Select Report"
        value={selectedReport}
        onChange={(e) => setSelectedReport(e.target.value as ReportType)}
        size="small"
        sx={{ mb: 3, minWidth: 280 }}
      >
        {REPORT_OPTIONS.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </TextField>

      {selectedReport === "indent_itemwise" && (
        <IndentItemwiseSection selectedCompany={selectedCompany} />
      )}

      {selectedReport === "po_itemwise" && (
        <PoItemwiseSection selectedCompany={selectedCompany} />
      )}

      {selectedReport === "sr_itemwise" && (
        <SrItemwiseSection selectedCompany={selectedCompany} />
      )}
    </Box>
  );
}
