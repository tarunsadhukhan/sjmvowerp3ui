"use client";

import React from "react";
import { Box, Stack, Typography, Divider } from "@mui/material";
import { Button } from "@/components/ui/button";

export type IndentPreviewHeader = {
  indentNo?: string;
  indentDate?: string;
  branch?: string;
  indentType?: string;
  expenseType?: string;
  project?: string;
  requester?: string;
  status?: string;
  updatedBy?: string;
  updatedAt?: string;
};

export type IndentPreviewItem = {
  srNo: number;
  department?: string;
  itemGroup?: string;
  item?: string;
  itemMake?: string;
  quantity?: number | string;
  uom?: string;
  remarks?: string;
};

type IndentPreviewProps = {
  header: IndentPreviewHeader;
  items: IndentPreviewItem[];
  remarks?: string;
  onPrint?: () => void;
  onDownload?: () => void;
  onEmail?: () => void;
};

const FieldRow = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <Stack direction={{ xs: "column", sm: "row" }} spacing={0.5} sx={{ minWidth: 0 }}>
    <Typography variant="caption" color="text.secondary" sx={{ minWidth: { sm: 140 } }}>
      {label}
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: 500 }}>
      {value ?? "-"}
    </Typography>
  </Stack>
);

const IndentPreview: React.FC<IndentPreviewProps> = ({ header, items, remarks, onPrint, onDownload, onEmail }) => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end">
        <Button variant="outline" size="sm" onClick={onPrint}>
          Print
        </Button>
        <Button variant="outline" size="sm" onClick={onDownload}>
          Download
        </Button>
        <Button variant="outline" size="sm" onClick={onEmail}>
          Email
        </Button>
      </Stack>

      <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, p: 2, backgroundColor: "#fff" }}>
        <Stack spacing={1} sx={{ textAlign: "center", mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Purchase Indent
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {header.status ? `Status: ${header.status}` : "ERP Preview"}
          </Typography>
        </Stack>

        <Divider sx={{ mb: 2 }} />

        <Stack spacing={1.5}>
          <FieldRow label="Indent No" value={header.indentNo} />
          <FieldRow label="Indent Date" value={header.indentDate} />
          <FieldRow label="Branch" value={header.branch} />
          <FieldRow label="Indent Type" value={header.indentType} />
          <FieldRow label="Expense Type" value={header.expenseType} />
          <FieldRow label="Project" value={header.project} />
          <FieldRow label="Indent Name" value={header.requester} />
          <FieldRow label="Last Updated" value={header.updatedAt ? new Date(header.updatedAt).toLocaleString() : undefined} />
          <FieldRow label="Updated By" value={header.updatedBy} />
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ overflowX: "auto" }}>
          <Box component="table" sx={{ width: "100%", borderCollapse: "collapse" }}>
            <Box component="thead" sx={{ backgroundColor: "rgba(12,60,96,0.08)" }}>
              <Box component="tr">
                {[
                  "Sr No",
                  "Department",
                  "Item Group",
                  "Item",
                  "Make",
                  "Qty",
                  "UOM",
                  "Remarks",
                ].map((col) => (
                  <Box
                    key={col}
                    component="th"
                    sx={{ border: "1px solid", borderColor: "divider", p: 1, fontSize: 12, textAlign: "left" }}
                  >
                    {col}
                  </Box>
                ))}
              </Box>
            </Box>
            <Box component="tbody">
              {items.length ? (
                items.map((item) => (
                  <Box component="tr" key={`preview-row-${item.srNo}`}>
                    <Box component="td" sx={{ border: "1px solid", borderColor: "divider", p: 1, fontSize: 12 }}>
                      {item.srNo}
                    </Box>
                    <Box component="td" sx={{ border: "1px solid", borderColor: "divider", p: 1, fontSize: 12 }}>
                      {item.department || "-"}
                    </Box>
                    <Box component="td" sx={{ border: "1px solid", borderColor: "divider", p: 1, fontSize: 12 }}>
                      {item.itemGroup || "-"}
                    </Box>
                    <Box component="td" sx={{ border: "1px solid", borderColor: "divider", p: 1, fontSize: 12 }}>
                      {item.item || "-"}
                    </Box>
                    <Box component="td" sx={{ border: "1px solid", borderColor: "divider", p: 1, fontSize: 12 }}>
                      {item.itemMake || "-"}
                    </Box>
                    <Box component="td" sx={{ border: "1px solid", borderColor: "divider", p: 1, fontSize: 12, textAlign: "right" }}>
                      {item.quantity ?? "-"}
                    </Box>
                    <Box component="td" sx={{ border: "1px solid", borderColor: "divider", p: 1, fontSize: 12 }}>
                      {item.uom || "-"}
                    </Box>
                    <Box component="td" sx={{ border: "1px solid", borderColor: "divider", p: 1, fontSize: 12 }}>
                      {item.remarks || "-"}
                    </Box>
                  </Box>
                ))
              ) : (
                <Box component="tr">
                  <Box component="td" colSpan={8} sx={{ border: "1px solid", borderColor: "divider", p: 2, fontSize: 12, textAlign: "center" }}>
                    No line items captured yet.
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Stack spacing={1}>
          <Typography variant="subtitle2">Remarks</Typography>
          <Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, p: 1.5, minHeight: 80 }}>
            <Typography variant="body2" color="text.secondary">
              {remarks || "No remarks provided."}
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={2}>
          <Stack spacing={0.5}>
            <Typography variant="caption" color="text.secondary">
              Prepared By
            </Typography>
            <Box sx={{ borderBottom: "1px solid", borderColor: "divider", width: 200, height: 24 }} />
          </Stack>
          <Stack spacing={0.5}>
            <Typography variant="caption" color="text.secondary">
              Approved By
            </Typography>
            <Box sx={{ borderBottom: "1px solid", borderColor: "divider", width: 200, height: 24 }} />
          </Stack>
        </Stack>
      </Box>
    </Box>
  );
};

export default IndentPreview;
