"use client";

import React, { useRef } from "react";
import { Box, Divider, Stack, Typography } from "@mui/material";
import { Button } from "@/components/ui/button";

export type InvoicePreviewHeader = {
	invoiceNo?: string;
	invoiceDate?: string;
	challanNo?: string;
	challanDate?: string;
	branch?: string;
	customer?: string;
	customerBranch?: string;
	billingTo?: string;
	shippingTo?: string;
	deliveryOrder?: string;
	transporter?: string;
	vehicleNo?: string;
	ewayBillNo?: string;
	ewayBillDate?: string;
	invoiceType?: string;
	status?: string;
	updatedBy?: string;
	updatedAt?: string;
	companyName?: string;
};

export type InvoicePreviewItem = {
	srNo: number;
	itemGroup?: string;
	item?: string;
	quantity?: string | number;
	uom?: string;
	rate?: string | number;
	discountType?: string;
	discountAmount?: string | number;
	netAmount?: string | number;
	remarks?: string;
};

export type InvoicePreviewTotals = {
	grossAmount?: number;
	totalIGST?: number;
	totalCGST?: number;
	totalSGST?: number;
	freightCharges?: number;
	roundOff?: number;
	netAmount?: number;
};

type InvoicePreviewProps = {
	header: InvoicePreviewHeader;
	items: InvoicePreviewItem[];
	totals?: InvoicePreviewTotals;
	remarks?: string;
	termsConditions?: string;
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

const TotalsRow = ({ label, value, isBold = false }: { label: string; value?: React.ReactNode; isBold?: boolean }) => (
	<Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ minWidth: 280 }}>
		<Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.8125rem", fontWeight: isBold ? 600 : 400 }}>
			{label}:
		</Typography>
		<Typography variant="body2" sx={{ fontWeight: isBold ? 600 : 400, fontSize: "0.875rem", textAlign: "right", minWidth: 120, fontVariantNumeric: "tabular-nums" }}>
			{value ?? "-"}
		</Typography>
	</Stack>
);

const formatDate = (dateStr?: string) => {
	if (!dateStr) return "-";
	try {
		const date = new Date(dateStr);
		if (Number.isNaN(date.getTime())) return dateStr;
		return date.toLocaleDateString("en-GB", { year: "numeric", month: "2-digit", day: "2-digit" });
	} catch {
		return dateStr;
	}
};

const formatDateTime = (dateStr?: string) => {
	if (!dateStr) return "-";
	try {
		const date = new Date(dateStr);
		if (Number.isNaN(date.getTime())) return dateStr;
		return date.toLocaleString("en-GB", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
	} catch {
		return dateStr;
	}
};

const formatAmount = (value?: number | string) => {
	if (value === null || value === undefined || value === "") return "-";
	const num = Number(value);
	if (Number.isNaN(num)) return value;
	return num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const SalesInvoicePreview: React.FC<InvoicePreviewProps> = ({ header, items, totals, remarks, termsConditions, onPrint, onDownload }) => {
	const previewRef = useRef<HTMLDivElement>(null);

	const buildPrintableWindow = (titleSuffix: string) => {
		const printContent = previewRef.current?.innerHTML || "";
		const printWindow = window.open("", "_blank");
		if (!printWindow) {
			alert("Please allow popups to continue.");
			return null;
		}

		printWindow.document.open();
		printWindow.document.write(`<!DOCTYPE html><html><head><title>Sales Invoice - ${titleSuffix}</title></head><body><div id="print-root"></div></body></html>`);
		printWindow.document.close();

		const styleNodes = document.querySelectorAll("style, link[rel=\"stylesheet\"]");
		styleNodes.forEach((node) => {
			printWindow.document.head.appendChild(node.cloneNode(true));
		});

		const helperStyle = printWindow.document.createElement("style");
		helperStyle.textContent = `
			@media print { @page { margin: 12mm; } }
			body { margin: 0; padding: 20px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
			table { width: 100%; border-collapse: collapse; }
			#preview-left-pane { max-width: 25% !important; flex-basis: 25% !important; word-break: break-word; white-space: normal; }
		`;
		printWindow.document.head.appendChild(helperStyle);

		const root = printWindow.document.getElementById("print-root");
		if (root) root.innerHTML = printContent;
		return printWindow;
	};

	const handlePrint = () => {
		if (onPrint) { onPrint(); return; }
		const printWindow = buildPrintableWindow(header.invoiceNo || "Print");
		if (!printWindow) return;
		printWindow.focus();
		setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
	};

	const handleDownload = () => {
		if (onDownload) { onDownload(); return; }
		const printWindow = buildPrintableWindow(header.invoiceNo || "Download");
		if (!printWindow) return;
		printWindow.focus();
		setTimeout(() => { printWindow.print(); }, 300);
	};

	return (
		<Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
			<Box ref={previewRef} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, p: 3, backgroundColor: "#fff" }}>
				<Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
					<Stack id="preview-left-pane" spacing={0.5} sx={{ minWidth: 200, maxWidth: { xs: "100%", md: "25%" }, flexBasis: { md: "25%" } }}>
						<Typography variant="body1" sx={{ fontWeight: 600, fontSize: "1rem", wordBreak: "break-word", whiteSpace: "normal" }}>
							{header.companyName || "-"}
						</Typography>
						<Typography variant="body2" sx={{ fontSize: "0.875rem", color: "text.secondary", wordBreak: "break-word", whiteSpace: "normal" }}>
							{header.branch || "-"}
						</Typography>
					</Stack>

					<Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
						<Stack spacing={0.25} alignItems="center">
							<Typography variant="h5" sx={{ fontWeight: 600 }}>Sales Invoice</Typography>
							{header.status ? (
								<Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.875rem" }}>{header.status}</Typography>
							) : null}
						</Stack>
					</Box>

					<Stack spacing={0.5} alignItems="flex-end" sx={{ minWidth: 200 }}>
						<Stack direction="row" spacing={0.5} alignItems="center">
							<Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>Invoice Date:</Typography>
							<Typography variant="body2" sx={{ fontWeight: 400, fontSize: "0.875rem" }}>{formatDate(header.invoiceDate)}</Typography>
						</Stack>
						<Stack direction="row" spacing={0.5} alignItems="center">
							<Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>Invoice No:</Typography>
							<Typography variant="body2" sx={{ fontWeight: 400, fontSize: "0.875rem" }}>{header.invoiceNo || "-"}</Typography>
						</Stack>
					</Stack>
				</Stack>

				<Divider sx={{ mb: 2 }} />

				<Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }, gap: 2, mb: 3 }}>
					<FieldRow label="Customer" value={header.customer || "-"} />
					<FieldRow label="Customer Branch" value={header.customerBranch || "-"} />
					<FieldRow label="Delivery Order" value={header.deliveryOrder || "-"} />
					<FieldRow label="Billing To" value={header.billingTo || "-"} />
					<FieldRow label="Shipping To" value={header.shippingTo || "-"} />
					<FieldRow label="Transporter" value={header.transporter || "-"} />
					<FieldRow label="Vehicle No." value={header.vehicleNo || "-"} />
					{header.challanNo ? <FieldRow label="Challan No." value={header.challanNo} /> : null}
					{header.challanDate ? <FieldRow label="Challan Date" value={formatDate(header.challanDate)} /> : null}
					{header.ewayBillNo ? <FieldRow label="E-Way Bill No." value={header.ewayBillNo} /> : null}
					{header.ewayBillDate ? <FieldRow label="E-Way Bill Date" value={formatDate(header.ewayBillDate)} /> : null}
					{header.invoiceType ? <FieldRow label="Invoice Type" value={header.invoiceType} /> : null}
				</Box>

				<Divider sx={{ my: 2 }} />

				<Box sx={{ overflowX: "auto" }}>
					<Box component="table" sx={{ width: "100%", borderCollapse: "collapse" }}>
						<Box component="thead" sx={{ backgroundColor: "rgba(12,60,96,0.08)" }}>
							<Box component="tr">
								{["Sr No", "Item", "Qty", "UOM", "Rate", "Disc. Amt", "Amount", "Remarks"].map((col) => (
									<Box key={col} component="th" sx={{ border: "1px solid", borderColor: "divider", p: 1, fontSize: 12, textAlign: col === "Remarks" ? "left" : "center" }}>
										{col}
									</Box>
								))}
							</Box>
						</Box>
						<Box component="tbody">
							{items.length ? (
								items.map((item) => (
									<Box component="tr" key={`inv-preview-row-${item.srNo}`}>
										<Box component="td" sx={{ border: "1px solid", borderColor: "divider", p: 1, fontSize: 12, textAlign: "center" }}>{item.srNo}</Box>
										<Box component="td" sx={{ border: "1px solid", borderColor: "divider", p: 1, fontSize: 12 }}>{item.item || "-"}</Box>
										<Box component="td" sx={{ border: "1px solid", borderColor: "divider", p: 1, fontSize: 12, textAlign: "right" }}>{item.quantity ?? "-"}</Box>
										<Box component="td" sx={{ border: "1px solid", borderColor: "divider", p: 1, fontSize: 12, textAlign: "center" }}>{item.uom || "-"}</Box>
										<Box component="td" sx={{ border: "1px solid", borderColor: "divider", p: 1, fontSize: 12, textAlign: "right" }}>{formatAmount(item.rate)}</Box>
										<Box component="td" sx={{ border: "1px solid", borderColor: "divider", p: 1, fontSize: 12, textAlign: "right" }}>{formatAmount(item.discountAmount)}</Box>
										<Box component="td" sx={{ border: "1px solid", borderColor: "divider", p: 1, fontSize: 12, textAlign: "right" }}>{formatAmount(item.netAmount)}</Box>
										<Box component="td" sx={{ border: "1px solid", borderColor: "divider", p: 1, fontSize: 12 }}>{item.remarks || "-"}</Box>
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

				{totals ? (
					<>
						<Divider sx={{ my: 2 }} />
						<Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="flex-end" sx={{ pr: 2 }}>
							<Box sx={{ minWidth: 280 }}>
								<Stack spacing={0.75}>
									<TotalsRow label="Gross Amount" value={formatAmount(totals.grossAmount)} />
									<TotalsRow label="IGST" value={formatAmount(totals.totalIGST)} />
									<TotalsRow label="CGST" value={formatAmount(totals.totalCGST)} />
									<TotalsRow label="SGST" value={formatAmount(totals.totalSGST)} />
									{totals.freightCharges ? <TotalsRow label="Freight Charges" value={formatAmount(totals.freightCharges)} /> : null}
									{totals.roundOff ? <TotalsRow label="Round Off" value={formatAmount(totals.roundOff)} /> : null}
									<Divider sx={{ my: 0.5 }} />
									<TotalsRow label="Net Amount" value={formatAmount(totals.netAmount)} isBold />
								</Stack>
							</Box>
						</Stack>
					</>
				) : null}

				<Divider sx={{ my: 2 }} />

				<Stack spacing={1}>
					<Typography variant="subtitle2">Remarks</Typography>
					<Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, p: 1.5, minHeight: 80 }}>
						<Typography variant="body2" color="text.secondary">
							{remarks || "No remarks provided."}
						</Typography>
					</Box>
				</Stack>

				{termsConditions ? (
					<>
						<Divider sx={{ my: 2 }} />
						<Stack spacing={1}>
							<Typography variant="subtitle2">Terms & Conditions</Typography>
							<Box sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, p: 1.5, minHeight: 60 }}>
								<Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
									{termsConditions}
								</Typography>
							</Box>
						</Stack>
					</>
				) : null}

				<Divider sx={{ my: 2 }} />

				<Stack direction={{ xs: "column", sm: "row" }} justifyContent="flex-start" spacing={4}>
					<Stack spacing={0.5}>
						<Typography variant="caption" color="text.secondary">Updated By</Typography>
						<Box sx={{ borderBottom: "1px solid", borderColor: "divider", width: 200, height: 24 }} />
						<Typography variant="caption" color="text.secondary">
							Last Updated: {header.updatedAt ? formatDateTime(header.updatedAt) : "-"}
						</Typography>
					</Stack>
				</Stack>
			</Box>

			<Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end">
				<Button variant="outline" size="sm" onClick={handlePrint}>Print</Button>
				<Button variant="outline" size="sm" onClick={handleDownload}>Download</Button>
			</Stack>
		</Box>
	);
};

export default SalesInvoicePreview;
