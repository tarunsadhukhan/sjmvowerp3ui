"use client";

import React from "react";
import { DataGrid, type GridColDef, type GridPaginationModel } from "@mui/x-data-grid";
import { Box, Chip } from "@mui/material";
import type { IssueItemwiseRow } from "../types/reportTypes";

interface IssueItemwiseReportProps {
  rows: IssueItemwiseRow[];
  rowCount: number;
  loading: boolean;
  paginationModel: GridPaginationModel;
  onPaginationModelChange: (model: GridPaginationModel) => void;
}

const formatQty = (value: number | null | undefined): string => {
  if (value == null) return "0";
  return Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 });
};

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${String(d.getDate()).padStart(2, "0")}-${months[d.getMonth()]}-${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
};

const columns: GridColDef<IssueItemwiseRow>[] = [
  {
    field: "issue_no",
    headerName: "Issue No.",
    flex: 0.8,
    minWidth: 100,
  },
  {
    field: "issue_date",
    headerName: "Date",
    flex: 0.8,
    minWidth: 110,
    renderCell: (params) => formatDate(params.value),
  },
  {
    field: "branch_name",
    headerName: "Branch",
    flex: 1,
    minWidth: 120,
  },
  {
    field: "department",
    headerName: "Department",
    flex: 1,
    minWidth: 120,
  },
  {
    field: "item_name",
    headerName: "Item",
    flex: 1.5,
    minWidth: 180,
  },
  {
    field: "item_grp_name",
    headerName: "Item Group",
    flex: 1,
    minWidth: 120,
  },
  {
    field: "uom_name",
    headerName: "UOM",
    flex: 0.5,
    minWidth: 60,
  },
  {
    field: "req_quantity",
    headerName: "Req Qty",
    flex: 0.7,
    minWidth: 80,
    align: "right",
    headerAlign: "right",
    renderCell: (params) => formatQty(params.value),
  },
  {
    field: "issue_qty",
    headerName: "Issue Qty",
    flex: 0.7,
    minWidth: 80,
    align: "right",
    headerAlign: "right",
    renderCell: (params) => formatQty(params.value),
  },
  {
    field: "expense_type_name",
    headerName: "Expense Type",
    flex: 0.9,
    minWidth: 110,
  },
  {
    field: "cost_factor_name",
    headerName: "Cost Factor",
    flex: 0.9,
    minWidth: 110,
  },
  {
    field: "machine_name",
    headerName: "Machine",
    flex: 0.9,
    minWidth: 110,
  },
  {
    field: "status_name",
    headerName: "Status",
    flex: 0.7,
    minWidth: 90,
    renderCell: (params) => {
      if (!params.value) return null;
      const statusColors: Record<string, "success" | "warning" | "error" | "info" | "default"> = {
        Approved: "success",
        "Pending Approval": "warning",
        Rejected: "error",
        Open: "info",
        Draft: "default",
      };
      return (
        <Chip
          label={params.value}
          size="small"
          color={statusColors[params.value as string] ?? "default"}
          variant="outlined"
        />
      );
    },
  },
];

export default function IssueItemwiseReport({
  rows,
  rowCount,
  loading,
  paginationModel,
  onPaginationModelChange,
}: IssueItemwiseReportProps) {
  return (
    <Box sx={{ width: "100%" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row.issue_li_id}
        rowCount={rowCount}
        loading={loading}
        paginationMode="server"
        paginationModel={paginationModel}
        onPaginationModelChange={onPaginationModelChange}
        pageSizeOptions={[10, 25, 50, 100]}
        disableRowSelectionOnClick
        autoHeight
        sx={{
          "& .MuiDataGrid-cell": { fontSize: "0.85rem" },
          "& .MuiDataGrid-columnHeaderTitle": { fontWeight: 600 },
        }}
      />
    </Box>
  );
}
