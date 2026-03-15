"use client";

import React from "react";
import { Typography, Chip } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import type { GridColDef, GridPaginationModel } from "@mui/x-data-grid";
import type { SrReportRow } from "../types/reportTypes";

const formatDate = (value?: string) => {
  if (!value) return "-";
  const trimmed = value.trim();
  const ymdMatch = trimmed.match(/^([0-9]{4})-([0-9]{2})-([0-9]{2})$/);
  if (ymdMatch) {
    const [, year, month, day] = ymdMatch;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    if (!Number.isNaN(date.getTime())) {
      return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(date);
    }
  }
  return trimmed;
};

const fmtQty = (value: number | null | undefined) =>
  value != null ? Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 }) : "-";

const fmtRate = (value: number | null | undefined) =>
  value != null ? Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "-";

const statusColor = (status: string) => {
  const s = status?.toLowerCase();
  if (s === "approved") return "success" as const;
  if (s === "rejected") return "error" as const;
  if (s === "closed") return "info" as const;
  return "default" as const;
};

const columns: GridColDef[] = [
  {
    field: "inward_no",
    headerName: "GRN No.",
    minWidth: 180,
    flex: 1,
    renderCell: (params) => (
      <Typography component="span" variant="body2" color="primary" sx={{ fontWeight: 600 }}>
        {params.value || "-"}
      </Typography>
    ),
  },
  {
    field: "inward_date",
    headerName: "GRN Date",
    minWidth: 120,
    renderCell: (params) => formatDate(params.value),
  },
  { field: "branch_name", headerName: "Branch", minWidth: 140, flex: 1 },
  { field: "supplier_name", headerName: "Supplier", minWidth: 180, flex: 1.5 },
  { field: "item_name", headerName: "Item", minWidth: 200, flex: 1.5 },
  { field: "item_grp_name", headerName: "Item Group", minWidth: 150, flex: 1 },
  { field: "uom_name", headerName: "UOM", minWidth: 80 },
  {
    field: "approved_qty",
    headerName: "Approved Qty",
    minWidth: 120,
    type: "number",
    renderCell: (params) => fmtQty(params.value),
  },
  {
    field: "rejected_qty",
    headerName: "Rejected Qty",
    minWidth: 120,
    type: "number",
    renderCell: (params) => (
      <Typography
        component="span"
        variant="body2"
        sx={{ fontWeight: 600, color: Number(params.value) > 0 ? "#d32f2f" : "inherit" }}
      >
        {fmtQty(params.value)}
      </Typography>
    ),
  },
  {
    field: "rate",
    headerName: "Rate",
    minWidth: 100,
    type: "number",
    renderCell: (params) => fmtRate(params.value),
  },
  {
    field: "amount",
    headerName: "Amount",
    minWidth: 120,
    type: "number",
    renderCell: (params) => fmtRate(params.value),
  },
  {
    field: "status_name",
    headerName: "Status",
    minWidth: 120,
    renderCell: (params) => (
      <Chip
        size="small"
        color={statusColor(params.value ?? "")}
        label={params.value || "Pending"}
      />
    ),
  },
];

interface SrItemwiseReportProps {
  rows: SrReportRow[];
  rowCount: number;
  loading: boolean;
  paginationModel: GridPaginationModel;
  onPaginationModelChange: (model: GridPaginationModel) => void;
}

export default function SrItemwiseReport({
  rows,
  rowCount,
  loading,
  paginationModel,
  onPaginationModelChange,
}: SrItemwiseReportProps) {
  return (
    <DataGrid
      rows={rows}
      columns={columns}
      getRowId={(row) => row.inward_dtl_id}
      rowCount={rowCount}
      loading={loading}
      paginationMode="server"
      paginationModel={paginationModel}
      onPaginationModelChange={onPaginationModelChange}
      pageSizeOptions={[10, 25, 50, 100]}
      disableRowSelectionOnClick
      autoHeight
      sx={{
        border: 1,
        borderColor: "divider",
        "& .MuiDataGrid-columnHeaders": {
          backgroundColor: "#f5f5f5",
          fontWeight: 700,
        },
      }}
    />
  );
}
