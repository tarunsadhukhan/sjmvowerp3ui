"use client";

/**
 * @component BillPassDetailPage
 * @description Bill Pass detail view showing SR lines, DRCR adjustments, and net payable.
 * This is a read-only view for payment consolidation.
 *
 * Layout:
 * - Header: Bill Pass info, Inward reference, Supplier, Invoice
 * - Summary Cards: SR Total, Debit Notes, Credit Notes, Net Payable
 * - SR Line Items Table
 * - Debit Notes Section (if any)
 * - Credit Notes Section (if any)
 * - Footer Totals
 */

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { ArrowLeft, FileText, Printer, Download, MinusCircle, PlusCircle, Receipt } from "lucide-react";

import {
  fetchBillPassById,
  formatCurrency,
  formatBillPassDate,
  type BillPassDetail,
  type BillPassSRLine,
  type BillPassDRCRNote,
} from "@/utils/billPassService";

// =============================================================================
// SUMMARY CARD COMPONENT
// =============================================================================

type SummaryCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  color?: "primary" | "error" | "success" | "info";
  icon?: React.ReactNode;
};

function SummaryCard({ title, value, subtitle, color = "primary", icon }: SummaryCardProps) {
  const colorMap = {
    primary: { bg: "primary.50", border: "primary.200", text: "primary.700" },
    error: { bg: "error.50", border: "error.200", text: "error.700" },
    success: { bg: "success.50", border: "success.200", text: "success.700" },
    info: { bg: "info.50", border: "info.200", text: "info.700" },
  };
  const colors = colorMap[color];

  return (
    <Card
      variant="outlined"
      sx={{
        bgcolor: colors.bg,
        borderColor: colors.border,
        height: "100%",
      }}
    >
      <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
          {icon && <Box sx={{ color: colors.text }}>{icon}</Box>}
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {title}
          </Typography>
        </Stack>
        <Typography variant="h5" fontWeight={700} sx={{ color: colors.text, fontFamily: "monospace" }}>
          {value}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// INFO ROW COMPONENT
// =============================================================================

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Grid container spacing={1} sx={{ py: 0.5 }}>
      <Grid size={{ xs: 4 }}>
        <Typography variant="body2" color="text.secondary">
          {label}:
        </Typography>
      </Grid>
      <Grid size={{ xs: 8 }}>
        <Typography variant="body2" fontWeight={500}>
          {value || "-"}
        </Typography>
      </Grid>
    </Grid>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function BillPassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const inwardId = params?.id as string;

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [detail, setDetail] = React.useState<BillPassDetail | null>(null);

  // Fetch detail data
  React.useEffect(() => {
    async function loadData() {
      if (!inwardId) {
        setError("Invalid Bill Pass ID");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await fetchBillPassById(inwardId);

      if (fetchError) {
        setError(fetchError);
        setLoading(false);
        return;
      }

      if (data) {
        setDetail(data);
      } else {
        setError("Bill Pass not found");
      }

      setLoading(false);
    }

    void loadData();
  }, [inwardId]);

  const handleBack = () => {
    router.push("/dashboardportal/procurement/billPass");
  };

  const handlePrint = () => {
    window.print();
  };

  // Loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Error state
  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="outlined" startIcon={<ArrowLeft size={16} />} onClick={handleBack}>
          Back to List
        </Button>
      </Box>
    );
  }

  // No data state
  if (!detail) {
    return (
      <Box p={3}>
        <Alert severity="warning">No Bill Pass data found.</Alert>
        <Button variant="outlined" startIcon={<ArrowLeft size={16} />} onClick={handleBack} sx={{ mt: 2 }}>
          Back to List
        </Button>
      </Box>
    );
  }

  const { summary, sr_lines, debit_notes, credit_notes } = detail;

  return (
    <Box p={3} className="print:p-0">
      {/* Header Actions */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3} className="print:hidden">
        <Button variant="outlined" startIcon={<ArrowLeft size={16} />} onClick={handleBack}>
          Back to List
        </Button>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<Printer size={16} />} onClick={handlePrint}>
            Print
          </Button>
        </Stack>
      </Stack>

      {/* Title */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: "1px solid", borderColor: "divider" }}>
        <Stack direction="row" alignItems="center" spacing={2} mb={2}>
          <FileText size={28} />
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Bill Pass: {detail.bill_pass_no || "-"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Payment consolidation for Stores Receipt
            </Typography>
          </Box>
          <Box flex={1} />
          <Chip label={detail.sr_status_name} color="success" />
        </Stack>

        {/* Header Info Grid */}
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <InfoRow label="Bill Pass Date" value={formatBillPassDate(detail.bill_pass_date)} />
            <InfoRow label="Inward No" value={detail.inward_no} />
            <InfoRow label="Inward Date" value={formatBillPassDate(detail.inward_date)} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <InfoRow label="Supplier" value={detail.supplier_name} />
            <InfoRow label="Branch" value={detail.branch_name} />
            <InfoRow label="Challan No" value={detail.challan_no} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <InfoRow label="Invoice No" value={detail.invoice_no} />
            <InfoRow label="Invoice Date" value={formatBillPassDate(detail.invoice_date)} />
            <InfoRow label="Invoice Amount" value={formatCurrency(detail.invoice_amt)} />
          </Grid>
        </Grid>
      </Paper>

      {/* Summary Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="SR TOTAL"
            value={formatCurrency(summary.sr_total)}
            subtitle={`${summary.sr_line_count} item(s)`}
            color="info"
            icon={<Receipt size={18} />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="DEBIT NOTES"
            value={summary.dr_count > 0 ? `-${formatCurrency(summary.dr_total)}` : "-"}
            subtitle={summary.dr_count > 0 ? `${summary.dr_count} note(s)` : "No debit notes"}
            color="error"
            icon={<MinusCircle size={18} />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="CREDIT NOTES"
            value={summary.cr_count > 0 ? `+${formatCurrency(summary.cr_total)}` : "-"}
            subtitle={summary.cr_count > 0 ? `${summary.cr_count} note(s)` : "No credit notes"}
            color="success"
            icon={<PlusCircle size={18} />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <SummaryCard
            title="NET PAYABLE"
            value={formatCurrency(summary.net_payable)}
            subtitle="Final amount to pay"
            color="primary"
            icon={<FileText size={18} />}
          />
        </Grid>
      </Grid>

      {/* SR Line Items */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, border: "1px solid", borderColor: "divider" }}>
        <Typography variant="h6" fontWeight={600} mb={2}>
          Stores Receipt Line Items
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "grey.50" }}>
                <TableCell>#</TableCell>
                <TableCell>Item</TableCell>
                <TableCell>Make</TableCell>
                <TableCell align="right">Qty</TableCell>
                <TableCell>UOM</TableCell>
                <TableCell align="right">Rate</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="right">Tax</TableCell>
                <TableCell align="right">Total</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sr_lines.map((line, idx) => (
                <TableRow key={line.inward_dtl_id} hover>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {line.item_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {line.item_code}
                    </Typography>
                  </TableCell>
                  <TableCell>{line.accepted_make_name || "-"}</TableCell>
                  <TableCell align="right">{line.approved_qty}</TableCell>
                  <TableCell>{line.uom_name}</TableCell>
                  <TableCell align="right" sx={{ fontFamily: "monospace" }}>
                    {formatCurrency(line.accepted_rate)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontFamily: "monospace" }}>
                    {formatCurrency(line.line_amount)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontFamily: "monospace" }}>
                    {formatCurrency(line.tax_amount)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontFamily: "monospace", fontWeight: 600 }}>
                    {formatCurrency(line.line_total)}
                  </TableCell>
                </TableRow>
              ))}
              {sr_lines.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography variant="body2" color="text.secondary">
                      No line items
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Debit Notes Section */}
      {debit_notes.length > 0 && (
        <Paper elevation={0} sx={{ p: 2, mb: 3, border: "1px solid", borderColor: "error.200", bgcolor: "error.50" }}>
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            <MinusCircle size={20} color="var(--mui-palette-error-main)" />
            <Typography variant="h6" fontWeight={600} color="error.dark">
              Debit Note Adjustments
            </Typography>
          </Stack>
          {debit_notes.map((note) => (
            <Box key={note.drcr_note_id} mb={2}>
              <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                <Chip label={`DN-${note.drcr_note_id}`} size="small" color="error" variant="outlined" />
                <Typography variant="body2" color="text.secondary">
                  {formatBillPassDate(note.note_date)}
                </Typography>
                <Typography variant="body2" fontWeight={600} color="error.dark">
                  {formatCurrency(note.net_amount)}
                </Typography>
              </Stack>
              {note.remarks && (
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Remarks: {note.remarks}
                </Typography>
              )}
              {note.lines.length > 0 && (
                <TableContainer sx={{ bgcolor: "background.paper", borderRadius: 1 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell>Reason</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell align="right">Rate</TableCell>
                        <TableCell align="right">Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {note.lines.map((line) => (
                        <TableRow key={line.drcr_note_dtl_id}>
                          <TableCell>{line.item_name}</TableCell>
                          <TableCell>{line.adjustment_reason}</TableCell>
                          <TableCell align="right">{line.quantity}</TableCell>
                          <TableCell align="right" sx={{ fontFamily: "monospace" }}>
                            {formatCurrency(line.rate)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontFamily: "monospace" }}>
                            {formatCurrency(line.line_amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          ))}
        </Paper>
      )}

      {/* Credit Notes Section */}
      {credit_notes.length > 0 && (
        <Paper elevation={0} sx={{ p: 2, mb: 3, border: "1px solid", borderColor: "success.200", bgcolor: "success.50" }}>
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            <PlusCircle size={20} color="var(--mui-palette-success-main)" />
            <Typography variant="h6" fontWeight={600} color="success.dark">
              Credit Note Adjustments
            </Typography>
          </Stack>
          {credit_notes.map((note) => (
            <Box key={note.drcr_note_id} mb={2}>
              <Stack direction="row" spacing={2} alignItems="center" mb={1}>
                <Chip label={`CN-${note.drcr_note_id}`} size="small" color="success" variant="outlined" />
                <Typography variant="body2" color="text.secondary">
                  {formatBillPassDate(note.note_date)}
                </Typography>
                <Typography variant="body2" fontWeight={600} color="success.dark">
                  {formatCurrency(note.net_amount)}
                </Typography>
              </Stack>
              {note.remarks && (
                <Typography variant="body2" color="text.secondary" mb={1}>
                  Remarks: {note.remarks}
                </Typography>
              )}
              {note.lines.length > 0 && (
                <TableContainer sx={{ bgcolor: "background.paper", borderRadius: 1 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Item</TableCell>
                        <TableCell>Reason</TableCell>
                        <TableCell align="right">Qty</TableCell>
                        <TableCell align="right">Rate</TableCell>
                        <TableCell align="right">Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {note.lines.map((line) => (
                        <TableRow key={line.drcr_note_dtl_id}>
                          <TableCell>{line.item_name}</TableCell>
                          <TableCell>{line.adjustment_reason}</TableCell>
                          <TableCell align="right">{line.quantity}</TableCell>
                          <TableCell align="right" sx={{ fontFamily: "monospace" }}>
                            {formatCurrency(line.rate)}
                          </TableCell>
                          <TableCell align="right" sx={{ fontFamily: "monospace" }}>
                            {formatCurrency(line.line_amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          ))}
        </Paper>
      )}

      {/* Footer Totals */}
      <Paper elevation={0} sx={{ p: 3, border: "1px solid", borderColor: "divider" }}>
        <Grid container spacing={2} justifyContent="flex-end">
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">SR Subtotal:</Typography>
                <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                  {formatCurrency(summary.sr_taxable)}
                </Typography>
              </Stack>
              {summary.sr_cgst > 0 && (
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    CGST:
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                    {formatCurrency(summary.sr_cgst)}
                  </Typography>
                </Stack>
              )}
              {summary.sr_sgst > 0 && (
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    SGST:
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                    {formatCurrency(summary.sr_sgst)}
                  </Typography>
                </Stack>
              )}
              {summary.sr_igst > 0 && (
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    IGST:
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                    {formatCurrency(summary.sr_igst)}
                  </Typography>
                </Stack>
              )}
              <Divider />
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body1" fontWeight={600}>
                  SR Total:
                </Typography>
                <Typography variant="body1" fontWeight={600} sx={{ fontFamily: "monospace" }}>
                  {formatCurrency(summary.sr_total)}
                </Typography>
              </Stack>
              {summary.dr_count > 0 && (
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="error.main">
                    Less: Debit Notes:
                  </Typography>
                  <Typography variant="body2" color="error.main" sx={{ fontFamily: "monospace" }}>
                    -{formatCurrency(summary.dr_total)}
                  </Typography>
                </Stack>
              )}
              {summary.cr_count > 0 && (
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="body2" color="success.main">
                    Add: Credit Notes:
                  </Typography>
                  <Typography variant="body2" color="success.main" sx={{ fontFamily: "monospace" }}>
                    +{formatCurrency(summary.cr_total)}
                  </Typography>
                </Stack>
              )}
              <Divider sx={{ borderStyle: "double", borderWidth: 3 }} />
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="h6" fontWeight={700} color="primary">
                  NET PAYABLE:
                </Typography>
                <Typography variant="h6" fontWeight={700} color="primary" sx={{ fontFamily: "monospace" }}>
                  {formatCurrency(summary.net_payable)}
                </Typography>
              </Stack>
            </Stack>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
