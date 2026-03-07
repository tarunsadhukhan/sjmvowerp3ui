"use client";

import React from "react";
import { DataGrid, type GridColDef, type GridPaginationModel } from "@mui/x-data-grid";
import { Box } from "@mui/material";
import type { InventoryStockRow } from "../types/reportTypes";

interface InventoryStockReportProps {
  rows: InventoryStockRow[];
  rowCount: number;
  loading: boolean;
  paginationModel: GridPaginationModel;
  onPaginationModelChange: (model: GridPaginationModel) => void;
}

const formatQty = (value: number | null | undefined): string => {
  if (value == null) return "0";
  return Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 });
};

const columns: GridColDef<InventoryStockRow>[] = [
  {
    field: "item_name",
    headerName: "Item",
    flex: 2,
    minWidth: 200,
  },
  {
    field: "item_grp_name",
    headerName: "Item Group",
    flex: 1.2,
    minWidth: 140,
  },
  {
    field: "uom_name",
    headerName: "UOM",
    flex: 0.6,
    minWidth: 70,
  },
  {
    field: "opening_qty",
    headerName: "Opening",
    flex: 0.8,
    minWidth: 100,
    align: "right",
    headerAlign: "right",
    renderCell: (params) => formatQty(params.value),
  },
  {
    field: "receipt_qty",
    headerName: "Receipt",
    flex: 0.8,
    minWidth: 100,
    align: "right",
    headerAlign: "right",
    renderCell: (params) => (
      <span style={{ color: params.value > 0 ? "#2e7d32" : undefined }}>
        {formatQty(params.value)}
      </span>
    ),
  },
  {
    field: "issue_qty",
    headerName: "Issue",
    flex: 0.8,
    minWidth: 100,
    align: "right",
    headerAlign: "right",
    renderCell: (params) => (
      <span style={{ color: params.value > 0 ? "#d32f2f" : undefined }}>
        {formatQty(params.value)}
      </span>
    ),
  },
  {
    field: "closing_qty",
    headerName: "Closing",
    flex: 0.8,
    minWidth: 100,
    align: "right",
    headerAlign: "right",
    renderCell: (params) => (
      <span style={{ fontWeight: 600 }}>{formatQty(params.value)}</span>
    ),
  },
];

export default function InventoryStockReport({
  rows,
  rowCount,
  loading,
  paginationModel,
  onPaginationModelChange,
}: InventoryStockReportProps) {
  return (
    <Box sx={{ width: "100%" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(row) => row.item_id}
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
