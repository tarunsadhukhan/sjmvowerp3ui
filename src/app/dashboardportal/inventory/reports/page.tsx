"use client";

import React, { useState } from "react";
import { Box, Typography, TextField, MenuItem } from "@mui/material";
import { useSidebarContext } from "@/components/dashboard/sidebarContext";
import InventoryStockSection from "./InventoryStockSection";
import IssueItemwiseSection from "./IssueItemwiseSection";

const REPORT_OPTIONS = [
  { value: "inventory_stock", label: "Current Inventory Report" },
  { value: "issue_itemwise", label: "Item-wise Issue Report" },
] as const;

type ReportType = (typeof REPORT_OPTIONS)[number]["value"];

export default function InventoryReportsPage() {
  const { selectedCompany } = useSidebarContext();
  const [selectedReport, setSelectedReport] = useState<ReportType>("inventory_stock");

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ color: "#0C3C60", fontWeight: "bold", mb: 2 }}>
        Inventory Reports
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

      {selectedReport === "inventory_stock" && (
        <InventoryStockSection selectedCompany={selectedCompany} />
      )}

      {selectedReport === "issue_itemwise" && (
        <IssueItemwiseSection selectedCompany={selectedCompany} />
      )}
    </Box>
  );
}
