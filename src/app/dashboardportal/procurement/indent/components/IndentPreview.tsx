"use client";

import React, { useRef } from "react";
import { Box, Stack, Typography, Divider } from "@mui/material";
import { Button } from "@/components/ui/button";
import { openStyledPrintWindow } from "@/utils/printUtils";

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
  companyName?: string;
};

export type IndentPreviewItem = {
  srNo: number;
  department?: string;
  itemGroup?: string;
  itemGroupCode?: string;
  itemGroupName?: string;
  item?: string;
  itemCode?: string;
  itemName?: string;
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
};

const FieldRow = ({ label, value }: { label: string; value?: React.ReactNode }) => (
  <Stack direction="column" spacing={0.25} sx={{ minWidth: 0 }}>
    <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
      {label}:
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: 400, fontSize: "0.875rem" }}>
      {value ?? "-"}
    </Typography>
  </Stack>
);

const IndentPreview: React.FC<IndentPreviewProps> = ({ header, items, remarks, onPrint, onDownload }) => {
  const previewRef = useRef<HTMLDivElement>(null);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-GB", { year: "numeric", month: "2-digit", day: "2-digit" });
    } catch {
      return dateStr;
    }
  };

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      return date.toLocaleString("en-GB", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
      return;
    }

    const printContent = previewRef.current?.innerHTML || "";
    const printWindow = openStyledPrintWindow(
      printContent,
      `Purchase Indent - ${header.indentNo || "Print"}`
    );
    if (!printWindow) return;

    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
      return;
    }

    const printContent = previewRef.current?.innerHTML || "";
    const printWindow = openStyledPrintWindow(
      printContent,
      `Purchase Indent - ${header.indentNo || "Download"}`
    );
    if (!printWindow) return;

    printWindow.focus();
    setTimeout(() => {
      printWindow.print(); // user can choose "Save as PDF"
    }, 300);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box ref={previewRef} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, p: 3, backgroundColor: "#fff" }}>
        {/* Top Section: Company/Branch on left, Title centered, Indent No/Date on right */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
          {/* Left: Company Name and Branch */}
          <Stack
            id="preview-left-pane"
            spacing={0.5}
            sx={{
              minWidth: 200,
              maxWidth: { xs: "100%", md: "25%" },
              flexBasis: { md: "25%" },
            }}
          >
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                fontSize: "1rem",
                wordBreak: "break-word",
                whiteSpace: "normal",
              }}
            >
              {header.companyName || "-"}
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontSize: "0.875rem", color: "text.secondary", wordBreak: "break-word", whiteSpace: "normal" }}
            >
              {header.branch || "-"}
            </Typography>
          </Stack>

          {/* Center: Purchase Indent Title */}
          <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <Stack spacing={0.25} alignItems="center">
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Purchase Indent
              </Typography>
              {header.status ? (
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.875rem" }}>
                  {header.status}
                </Typography>
              ) : null}
            </Stack>
          </Box>

          {/* Right: Indent Date on top line, Indent No on next line */}
          <Stack spacing={0.5} alignItems="flex-end" sx={{ minWidth: 200 }}>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
                Indent Date:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 400, fontSize: "0.875rem" }}>
                {formatDate(header.indentDate)}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
                Indent No:
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 400, fontSize: "0.875rem" }}>
                {header.indentNo || "-"}
              </Typography>
            </Stack>
          </Stack>
        </Stack>

        <Divider sx={{ mb: 2 }} />

        {/* Header Information Grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
            gap: 2,
            mb: 3,
          }}
        >
          {/* Indent Type and Expense Type on same line */}
          <Box
            sx={{
              gridColumn: { xs: "span 1", sm: "span 2", md: "span 1" },
              display: "flex",
              gap: 3,
            }}
          >
            <FieldRow label="Indent Type" value={header.indentType || "-"} />
            <FieldRow label="Expense Type" value={header.expenseType || "-"} />
          </Box>
          <FieldRow label="Project" value={header.project || "-"} />
          {header.requester && <FieldRow label="Indent Name" value={header.requester} />}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ overflowX: "auto" }}>
          <Box component="table" sx={{ width: "100%", borderCollapse: "collapse" }}>
            <Box component="thead" sx={{ backgroundColor: "rgba(12,60,96,0.08)" }}>
              <Box component="tr">
                {[
                  "Sr No",
                  "Department",
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
                items.map((item) => {
                  // Format item as [Item Group Code] Item Code - Item Group Name - Item Name
                  const formattedItem = (() => {
                    // Helper to extract code and name from a label
                    const extractCodeAndName = (label: string | undefined) => {
                      if (!label) return { code: undefined, name: undefined };
                      const separator = label.includes(" — ") ? " — " : label.includes(" - ") ? " - " : null;
                      if (separator) {
                        const parts = label.split(separator);
                        return {
                          code: parts[0]?.trim(),
                          name: parts[1]?.trim(),
                        };
                      }
                      return { code: label.trim(), name: undefined };
                    };

                    // Get codes and names
                    const groupData = extractCodeAndName(item.itemGroup);
                    const itemData = extractCodeAndName(item.item);

                    const groupCode = item.itemGroupCode || groupData.code;
                    const itemCode = item.itemCode || itemData.code;
                    const groupName = item.itemGroupName || groupData.name;
                    const itemName = item.itemName || itemData.name;

                    // Build the formatted string
                    const parts: string[] = [];

                    // Add codes in brackets
                    if (groupCode && itemCode) {
                      parts.push(`[${groupCode}] ${itemCode}`);
                    } else if (groupCode) {
                      parts.push(`[${groupCode}]`);
                    } else if (itemCode) {
                      parts.push(itemCode);
                    }

                    // Add names if available
                    if (groupName) {
                      parts.push(groupName);
                    }
                    if (itemName) {
                      parts.push(itemName);
                    }

                    // Join with " - " separator
                    if (parts.length > 0) {
                      return parts.join(" - ");
                    }

                    return item.item || "-";
                  })();

                  return (
                    <Box component="tr" key={`preview-row-${item.srNo}`}>
                      <Box component="td" sx={{ border: "1px solid", borderColor: "divider", p: 1, fontSize: 12 }}>
                        {item.srNo}
                      </Box>
                      <Box component="td" sx={{ border: "1px solid", borderColor: "divider", p: 1, fontSize: 12 }}>
                        {item.department || "-"}
                      </Box>
                      <Box component="td" sx={{ border: "1px solid", borderColor: "divider", p: 1, fontSize: 12 }}>
                        {formattedItem}
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
                  );
                })
              ) : (
                <Box component="tr">
                  <Box component="td" colSpan={7} sx={{ border: "1px solid", borderColor: "divider", p: 2, fontSize: 12, textAlign: "center" }}>
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

        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="flex-start" spacing={4}>
          <Stack spacing={0.5}>
            <Typography variant="caption" color="text.secondary">
              Updated By
            </Typography>
            <Box sx={{ borderBottom: "1px solid", borderColor: "divider", width: 200, height: 24 }} />
            <Typography variant="caption" color="text.secondary">
              Last Updated: {header.updatedAt ? formatDateTime(header.updatedAt) : "-"}
            </Typography>
          </Stack>
        </Stack>
      </Box>

      {/* Print and Download buttons after the preview */}
      <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end">
        <Button variant="outline" size="sm" onClick={handlePrint}>
          Print
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownload}>
          Download
        </Button>
      </Stack>
    </Box>
  );
};

export default IndentPreview;
