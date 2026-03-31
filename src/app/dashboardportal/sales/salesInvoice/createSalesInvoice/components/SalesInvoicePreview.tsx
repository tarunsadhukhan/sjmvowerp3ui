"use client";

import React, { useRef } from "react";
import { Box, Divider, Stack, Typography } from "@mui/material";
import { Button } from "@/components/ui/button";

export type InvoicePreviewHeader = {
	invoiceNo?: string;
	invoiceDate?: string;
	challanNo?: string;
	challanDate?: string;
	saleNo?: string;
	saleDate?: string;
	deliveryOrderNo?: string;
	deliveryOrderDate?: string;
	salesOrderNo?: string;
	salesOrderDate?: string;
	branch?: string;
	customer?: string;
	customerBranch?: string;
	billingTo?: string;
	shippingTo?: string;
	// Structured billing/shipping fields
	billingToName?: string;
	billingToAddress?: string;
	billingToState?: string;
	billingToStateCode?: string;
	billingToGstin?: string;
	shippingToName?: string;
	shippingToAddress?: string;
	shippingToState?: string;
	shippingToStateCode?: string;
	shippingToGstin?: string;
	deliveryOrder?: string;
	transporter?: string;
	vehicleNo?: string;
	ewayBillNo?: string;
	ewayBillDate?: string;
	invoiceType?: string;
	transactionType?: string;
	status?: string;
	updatedBy?: string;
	updatedAt?: string;
	companyName?: string;
	companyAddress?: string;
	companyPhone?: string;
	companyGstin?: string;
	companyStateCode?: string;
	companyCinNo?: string;
	branchAddress?: string;
	branchGstNo?: string;
	branchStateCode?: string;
	bankName?: string;
	bankAccNo?: string;
	bankIfscCode?: string;
};

export type InvoicePreviewItem = {
	srNo: number;
	hsnCode?: string;
	itemGroup?: string;
	item?: string;
	netWeight?: string | number;
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
	cgstPercent?: number;
	sgstPercent?: number;
	igstPercent?: number;
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
	if (Number.isNaN(num)) return String(value);
	return num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const ONES = [
	"", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE",
	"TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN",
	"SEVENTEEN", "EIGHTEEN", "NINETEEN",
];
const TENS = ["", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY"];

const twoDigitsToWords = (n: number): string => {
	if (n < 20) return ONES[n];
	return TENS[Math.floor(n / 10)] + (n % 10 ? " " + ONES[n % 10] : "");
};

const threeDigitsToWords = (n: number): string => {
	if (n === 0) return "";
	let s = "";
	if (n >= 100) {
		s += ONES[Math.floor(n / 100)] + " HUNDRED";
		n %= 100;
		if (n > 0) s += " ";
	}
	if (n > 0) s += twoDigitsToWords(n);
	return s;
};

const numberToWordsIndian = (amount: number): string => {
	if (!amount || amount === 0) return "ZERO";
	const rupees = Math.floor(amount);
	const paiseRaw = Math.round((amount - rupees) * 100);
	const parts: string[] = [];
	let rem = rupees;
	const crore = Math.floor(rem / 10000000); rem %= 10000000;
	const lakh = Math.floor(rem / 100000); rem %= 100000;
	const thousand = Math.floor(rem / 1000); rem %= 1000;
	if (crore > 0) parts.push(threeDigitsToWords(crore) + " CRORE");
	if (lakh > 0) parts.push(threeDigitsToWords(lakh) + " LAC");
	if (thousand > 0) parts.push(threeDigitsToWords(thousand) + " THOUSAND");
	if (rem > 0) parts.push(threeDigitsToWords(rem));
	let result = "RUPEES " + parts.join(" ");
	if (paiseRaw > 0) result += " AND " + twoDigitsToWords(paiseRaw) + " PAISE";
	result += " ONLY";
	return result;
};

const SalesInvoicePreview: React.FC<InvoicePreviewProps> = ({ header, items, totals, remarks, termsConditions, onPrint, onDownload }) => {
	const previewRef = useRef<HTMLDivElement>(null);

	const totalValue = totals
		? (totals.grossAmount ?? 0) + (totals.totalIGST ?? 0) + (totals.totalCGST ?? 0) + (totals.totalSGST ?? 0) + (totals.freightCharges ?? 0)
		: 0;

	const buildPrintableWindow = (titleSuffix: string) => {
		const printWindow = window.open("", "_blank");
		if (!printWindow) {
			alert("Please allow popups to continue.");
			return null;
		}

		const h = header;
		const hasNetWeight = items.some((it) => it.netWeight !== undefined && it.netWeight !== "");

		const itemRowsHtml = items.length
			? items
					.map(
						(item) => `
				<tr>
					<td style="border:1px solid #000;padding:5px 7px;font-size:11px;text-align:center;">${item.srNo}</td>
					<td style="border:1px solid #000;padding:5px 7px;font-size:11px;text-align:center;">${item.hsnCode || "-"}</td>
					<td style="border:1px solid #000;padding:5px 7px;font-size:11px;">${item.item || "-"}</td>
					${hasNetWeight ? `<td style="border:1px solid #000;padding:5px 7px;font-size:11px;text-align:right;">${item.netWeight !== undefined && item.netWeight !== "" ? formatAmount(item.netWeight) : "-"}</td>` : ""}
					<td style="border:1px solid #000;padding:5px 7px;font-size:11px;text-align:right;">${item.quantity ?? "-"}</td>
					<td style="border:1px solid #000;padding:5px 7px;font-size:11px;text-align:center;">${item.uom || "-"}</td>
					<td style="border:1px solid #000;padding:5px 7px;font-size:11px;text-align:right;">${formatAmount(item.rate)}</td>
					<td style="border:1px solid #000;padding:5px 7px;font-size:11px;text-align:right;">${formatAmount(item.netAmount)}</td>
				</tr>`,
					)
					.join("")
			: `<tr><td colspan="${hasNetWeight ? 8 : 7}" style="border:1px solid #000;padding:10px;text-align:center;font-size:11px;">No line items.</td></tr>`;

		const cgstLabel = totals?.cgstPercent ? `CGST@${totals.cgstPercent}%` : "CGST";
		const sgstLabel = totals?.sgstPercent ? `SGST@${totals.sgstPercent}%` : "SGST";
		const igstLabel = totals?.igstPercent ? `IGST@${totals.igstPercent}%` : "IGST";

		const totalsHtml = totals
			? `
			<table style="width:100%;border-collapse:collapse;">
				<tr>
					<td style="width:50%;padding:8px;vertical-align:top;font-size:11px;">
						${remarks ? `<strong>REMARKS:</strong><br/><span>${remarks}</span>` : ""}
					</td>
					<td style="width:50%;border-left:1px solid #000;padding:0;vertical-align:top;">
						<table style="width:100%;border-collapse:collapse;">
							<tr><td style="border-bottom:1px solid #000;padding:4px 10px;font-size:11px;">Total</td><td style="border-bottom:1px solid #000;border-left:1px solid #000;padding:4px 10px;font-size:11px;text-align:right;">${formatAmount(totals.grossAmount)}</td></tr>
							<tr><td style="border-bottom:1px solid #000;padding:4px 10px;font-size:11px;">${cgstLabel}</td><td style="border-bottom:1px solid #000;border-left:1px solid #000;padding:4px 10px;font-size:11px;text-align:right;">${formatAmount(totals.totalCGST)}</td></tr>
							<tr><td style="border-bottom:1px solid #000;padding:4px 10px;font-size:11px;">${sgstLabel}</td><td style="border-bottom:1px solid #000;border-left:1px solid #000;padding:4px 10px;font-size:11px;text-align:right;">${formatAmount(totals.totalSGST)}</td></tr>
							<tr><td style="border-bottom:1px solid #000;padding:4px 10px;font-size:11px;">${igstLabel}</td><td style="border-bottom:1px solid #000;border-left:1px solid #000;padding:4px 10px;font-size:11px;text-align:right;">${formatAmount(totals.totalIGST)}</td></tr>
							${totals.freightCharges ? `<tr><td style="border-bottom:1px solid #000;padding:4px 10px;font-size:11px;">Freight Charges</td><td style="border-bottom:1px solid #000;border-left:1px solid #000;padding:4px 10px;font-size:11px;text-align:right;">${formatAmount(totals.freightCharges)}</td></tr>` : ""}
							<tr><td style="border-bottom:1px solid #000;padding:4px 10px;font-size:11px;font-weight:600;">Total Value</td><td style="border-bottom:1px solid #000;border-left:1px solid #000;padding:4px 10px;font-size:11px;font-weight:600;text-align:right;">${formatAmount(totalValue)}</td></tr>
							<tr><td style="border-bottom:1px solid #000;padding:4px 10px;font-size:11px;">Round off</td><td style="border-bottom:1px solid #000;border-left:1px solid #000;padding:4px 10px;font-size:11px;text-align:right;">${totals.roundOff ? formatAmount(totals.roundOff) : "0.00"}</td></tr>
							<tr><td style="padding:4px 10px;font-size:12px;font-weight:700;">Grand Total</td><td style="border-left:1px solid #000;padding:4px 10px;font-size:12px;font-weight:700;text-align:right;">${formatAmount(totals.netAmount)}</td></tr>
						</table>
					</td>
				</tr>
			</table>`
			: "";

		const amountInWords = totals?.netAmount ? numberToWordsIndian(totals.netAmount) : "";

		const docInfoRows = [
			h.invoiceNo ? `<tr><td style="padding:3px 6px;font-size:11px;white-space:nowrap;font-weight:600;">Invoice No.</td><td style="padding:3px 6px;font-size:11px;">${h.invoiceNo}</td><td style="padding:3px 6px;font-size:11px;white-space:nowrap;">Date</td><td style="padding:3px 6px;font-size:11px;">${formatDate(h.invoiceDate)}</td></tr>` : "",
			h.saleNo ? `<tr><td style="padding:3px 6px;font-size:11px;white-space:nowrap;">Sale No.</td><td style="padding:3px 6px;font-size:11px;">${h.saleNo}</td><td style="padding:3px 6px;font-size:11px;white-space:nowrap;">Date</td><td style="padding:3px 6px;font-size:11px;">${formatDate(h.saleDate)}</td></tr>` : "",
			h.deliveryOrderNo ? `<tr><td style="padding:3px 6px;font-size:11px;white-space:nowrap;">Del Ord No.</td><td style="padding:3px 6px;font-size:11px;">${h.deliveryOrderNo}</td><td style="padding:3px 6px;font-size:11px;white-space:nowrap;">Date</td><td style="padding:3px 6px;font-size:11px;">${formatDate(h.deliveryOrderDate)}</td></tr>` : "",
			h.vehicleNo ? `<tr><td colspan="4" style="padding:3px 6px;font-size:11px;">Vechicle No. ${h.vehicleNo}</td></tr>` : "",
			h.transporter ? `<tr><td colspan="4" style="padding:3px 6px;font-size:11px;">TRANSPORTER NAME-: ${h.transporter}</td></tr>` : "",
		].filter(Boolean).join("");

		const billedToHtml = `
			<div style="font-weight:700;font-size:11px;margin-bottom:4px;">Billed To</div>
			${h.billingToName ? `<div style="font-size:11px;">Name : ${h.billingToName}</div>` : ""}
			${h.billingToAddress ? `<div style="font-size:11px;">Address : ${h.billingToAddress}</div>` : (h.billingTo ? `<div style="font-size:11px;">Address : ${h.billingTo}</div>` : "")}
			${h.billingToState ? `<div style="font-size:11px;">State : ${h.billingToState}</div>` : ""}
			${h.billingToStateCode ? `<div style="font-size:11px;">State Code : ${h.billingToStateCode}</div>` : ""}
			${h.billingToGstin ? `<div style="font-size:11px;">GSTIN No : ${h.billingToGstin}</div>` : ""}`;

		const shippedToHtml = `
			<div style="font-weight:700;font-size:11px;margin-bottom:4px;">Shipped To/Place of Supply</div>
			${h.shippingToName ? `<div style="font-size:11px;">Name : ${h.shippingToName}</div>` : ""}
			${h.shippingToAddress ? `<div style="font-size:11px;">Address : ${h.shippingToAddress}</div>` : (h.shippingTo ? `<div style="font-size:11px;">Address : ${h.shippingTo}</div>` : "")}
			${h.shippingToState ? `<div style="font-size:11px;">State : ${h.shippingToState}</div>` : ""}
			${h.shippingToStateCode ? `<div style="font-size:11px;">State Code : ${h.shippingToStateCode}</div>` : ""}
			${h.shippingToGstin ? `<div style="font-size:11px;">GSTIN No : ${h.shippingToGstin}</div>` : ""}`;

		const netWeightTh = hasNetWeight ? `<th style="border:1px solid #000;padding:5px 7px;font-size:11px;background:#f0f0f0;">Net wt.</th>` : "";

		const html = `<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8"/>
	<title>Tax Invoice - ${titleSuffix}</title>
	<style>
		@page { margin: 8mm; }
		* { box-sizing: border-box; }
		body { font-family: Arial, sans-serif; margin: 0; padding: 0; color: #111; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
	</style>
</head>
<body>
<div style="border:1.5px solid #000;">

	<!-- Title -->
	<div style="text-align:center;font-size:15px;font-weight:700;border-bottom:1px solid #000;padding:7px 0;letter-spacing:1px;">TAX INVOICE</div>

	<!-- Company info + Document numbers -->
	<table style="width:100%;border-collapse:collapse;border-bottom:1px solid #000;">
		<tr>
			<td style="width:50%;border-right:1px solid #000;padding:10px;vertical-align:top;">
				<div style="font-size:13px;font-weight:700;">${h.companyName || "-"}</div>
				${h.companyAddress ? `<div style="font-size:11px;margin-top:2px;">${h.companyAddress}</div>` : ""}
				${h.companyPhone ? `<div style="font-size:11px;margin-top:2px;">Phone no. : ${h.companyPhone}</div>` : ""}
				${h.companyStateCode ? `<div style="font-size:11px;margin-top:2px;">State Code : ${h.companyStateCode}</div>` : ""}
				${h.companyCinNo ? `<div style="font-size:11px;margin-top:2px;">CIN/LLP : ${h.companyCinNo}</div>` : ""}
				${h.companyGstin ? `<div style="font-size:11px;margin-top:2px;">GSTIN No : ${h.companyGstin}</div>` : ""}
			</td>
			<td style="width:50%;padding:10px;vertical-align:top;">
				<table style="border-collapse:collapse;width:100%;">
					${docInfoRows}
					${h.ewayBillNo ? `<tr><td colspan="4" style="padding:3px 6px;font-size:11px;">E-Way Bill No.: ${h.ewayBillNo}${h.ewayBillDate ? " | Date: " + formatDate(h.ewayBillDate) : ""}</td></tr>` : ""}
					${h.challanNo ? `<tr><td colspan="4" style="padding:3px 6px;font-size:11px;">Challan No.: ${h.challanNo}${h.challanDate ? " | Date: " + formatDate(h.challanDate) : ""}</td></tr>` : ""}
				</table>
			</td>
		</tr>
	</table>

	<!-- Transaction Type -->
	${h.transactionType || h.invoiceType ? `<div style="padding:5px 10px;border-bottom:1px solid #000;font-size:11px;">Transaction Type: ${h.transactionType || h.invoiceType}</div>` : ""}

	<!-- Dispatch From + Shipped To -->
	<table style="width:100%;border-collapse:collapse;border-bottom:1px solid #000;">
		<tr>
			<td style="width:50%;border-right:1px solid #000;padding:10px;vertical-align:top;">
				<div style="font-weight:700;font-size:11px;margin-bottom:4px;">Dispatch From,</div>
				<div style="font-size:11px;font-weight:600;">${h.companyName || "-"}</div>
				${h.branchAddress ? `<div style="font-size:11px;">${h.branchAddress}</div>` : (h.branch ? `<div style="font-size:11px;">${h.branch}</div>` : "")}
				${h.branchStateCode ? `<div style="font-size:11px;">State Code : ${h.branchStateCode}</div>` : (h.companyStateCode ? `<div style="font-size:11px;">State Code : ${h.companyStateCode}</div>` : "")}
				${h.branchGstNo ? `<div style="font-size:11px;">GSTIN No : ${h.branchGstNo}</div>` : (h.companyGstin ? `<div style="font-size:11px;">GSTIN No : ${h.companyGstin}</div>` : "")}
			</td>
			<td style="width:50%;padding:10px;vertical-align:top;">
				${shippedToHtml}
			</td>
		</tr>
	</table>

	<!-- Billed To -->
	<table style="width:100%;border-collapse:collapse;border-bottom:1px solid #000;">
		<tr>
			<td style="width:50%;border-right:1px solid #000;padding:10px;vertical-align:top;">
				${billedToHtml}
			</td>
			<td style="width:50%;padding:10px;vertical-align:top;font-size:11px;"></td>
		</tr>
	</table>

	<!-- Line Items -->
	<table style="width:100%;border-collapse:collapse;border-bottom:1px solid #000;">
		<thead>
			<tr style="background-color:#efefef;">
				<th style="border:1px solid #000;padding:5px 7px;font-size:11px;text-align:center;">S.No</th>
				<th style="border:1px solid #000;padding:5px 7px;font-size:11px;text-align:center;">HSN CODE</th>
				<th style="border:1px solid #000;padding:5px 7px;font-size:11px;text-align:center;">Description &amp; Specification of Goods</th>
				${netWeightTh}
				<th style="border:1px solid #000;padding:5px 7px;font-size:11px;text-align:center;">Quantity</th>
				<th style="border:1px solid #000;padding:5px 7px;font-size:11px;text-align:center;">UOM</th>
				<th style="border:1px solid #000;padding:5px 7px;font-size:11px;text-align:center;">Rate</th>
				<th style="border:1px solid #000;padding:5px 7px;font-size:11px;text-align:center;">Value (Rs.)</th>
			</tr>
		</thead>
		<tbody>${itemRowsHtml}</tbody>
	</table>

	<!-- Totals -->
	${totalsHtml}

	<!-- Invoice Value in Words -->
	${amountInWords ? `
	<div style="border-top:1px solid #000;padding:5px 10px;font-size:11px;font-weight:600;">Invoice Value (In Words)</div>
	<div style="padding:5px 10px;font-size:11px;border-bottom:1px solid #000;">Rupees in words: ${amountInWords}</div>` : ""}

	<!-- Footer: Bank Details + Terms + Signature -->
	<table style="width:100%;border-collapse:collapse;">
		<tr>
			<td style="width:40%;border-right:1px solid #000;padding:10px;vertical-align:top;font-size:11px;">
				${h.bankName || h.bankAccNo ? `
					<div style="font-weight:700;margin-bottom:4px;">Bank Details</div>
					${h.bankName ? `<div>${h.bankName}</div>` : ""}
					${h.bankAccNo ? `<div>A/c No. : ${h.bankAccNo}</div>` : ""}
					${h.bankIfscCode ? `<div>IFS Code : ${h.bankIfscCode}</div>` : ""}
					<div style="margin-bottom:8px;"></div>
				` : ""}
				${termsConditions ? `<div style="font-weight:700;margin-bottom:4px;">Term &amp; Conditions</div><div style="white-space:pre-wrap;">${termsConditions}</div>` : ""}
			</td>
			<td style="width:60%;padding:10px;vertical-align:top;">
				<div style="text-align:right;font-size:12px;font-weight:700;">${h.companyName || ""}</div>
				<div style="text-align:right;margin-top:40px;font-size:11px;border-top:1px solid #888;display:inline-block;min-width:160px;padding-top:4px;">Authorised Signatory</div>
			</td>
		</tr>
	</table>

</div>
</body>
</html>`;

		printWindow.document.open();
		printWindow.document.write(html);
		printWindow.document.close();
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

	const hasNetWeight = items.some((it) => it.netWeight !== undefined && it.netWeight !== "");
	const cgstLabel = totals?.cgstPercent ? `CGST@${totals.cgstPercent}%` : "CGST";
	const sgstLabel = totals?.sgstPercent ? `SGST@${totals.sgstPercent}%` : "SGST";
	const igstLabel = totals?.igstPercent ? `IGST@${totals.igstPercent}%` : "IGST";

	return (
		<Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
			<Box ref={previewRef} sx={{ border: "2px solid", borderColor: "divider", borderRadius: 0, p: 0, backgroundColor: "#fff" }}>

				{/* Title */}
				<Box sx={{ textAlign: "center", py: 1, borderBottom: "1px solid", borderColor: "divider" }}>
					<Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 1 }}>TAX INVOICE</Typography>
					{header.status ? <Typography variant="caption" color="text.secondary">{header.status}</Typography> : null}
				</Box>

				{/* Company info + Document numbers */}
				<Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid", borderColor: "divider" }}>
					<Box sx={{ p: 1.5, borderRight: "1px solid", borderColor: "divider" }}>
						<Typography sx={{ fontWeight: 700, fontSize: "0.9rem" }}>{header.companyName || "-"}</Typography>
						{header.companyAddress && <Typography variant="caption" display="block">{header.companyAddress}</Typography>}
						{header.companyPhone && <Typography variant="caption" display="block">Phone: {header.companyPhone}</Typography>}
						{header.companyStateCode && <Typography variant="caption" display="block">State Code: {header.companyStateCode}</Typography>}
						{header.companyCinNo && <Typography variant="caption" display="block">CIN/LLP: {header.companyCinNo}</Typography>}
						{header.companyGstin && <Typography variant="caption" display="block">GSTIN: {header.companyGstin}</Typography>}
					</Box>
					<Box sx={{ p: 1.5 }}>
						{header.invoiceNo && (
							<Box sx={{ display: "flex", gap: 2, mb: 0.25 }}>
								<Typography variant="caption" sx={{ fontWeight: 600, minWidth: 80 }}>Invoice No.</Typography>
								<Typography variant="caption">{header.invoiceNo}</Typography>
								<Typography variant="caption" sx={{ ml: 1 }}>Date</Typography>
								<Typography variant="caption">{formatDate(header.invoiceDate)}</Typography>
							</Box>
						)}
						{header.saleNo && (
							<Box sx={{ display: "flex", gap: 2, mb: 0.25 }}>
								<Typography variant="caption" sx={{ minWidth: 80 }}>Sale No.</Typography>
								<Typography variant="caption">{header.saleNo}</Typography>
								<Typography variant="caption" sx={{ ml: 1 }}>Date</Typography>
								<Typography variant="caption">{formatDate(header.saleDate)}</Typography>
							</Box>
						)}
						{header.deliveryOrderNo && (
							<Box sx={{ display: "flex", gap: 2, mb: 0.25 }}>
								<Typography variant="caption" sx={{ minWidth: 80 }}>Del Ord No.</Typography>
								<Typography variant="caption">{header.deliveryOrderNo}</Typography>
								<Typography variant="caption" sx={{ ml: 1 }}>Date</Typography>
								<Typography variant="caption">{formatDate(header.deliveryOrderDate)}</Typography>
							</Box>
						)}
						{header.vehicleNo && <Typography variant="caption" display="block">Vehicle No.: {header.vehicleNo}</Typography>}
						{header.transporter && <Typography variant="caption" display="block">Transporter: {header.transporter}</Typography>}
						{header.ewayBillNo && <Typography variant="caption" display="block">E-Way Bill: {header.ewayBillNo}</Typography>}
						{header.challanNo && <Typography variant="caption" display="block">Challan No.: {header.challanNo}</Typography>}
					</Box>
				</Box>

				{/* Transaction Type */}
				{(header.transactionType || header.invoiceType) && (
					<Box sx={{ px: 1.5, py: 0.75, borderBottom: "1px solid", borderColor: "divider" }}>
						<Typography variant="caption">Transaction Type: {header.transactionType || header.invoiceType}</Typography>
					</Box>
				)}

				{/* Dispatch From + Shipped To */}
				<Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid", borderColor: "divider" }}>
					<Box sx={{ p: 1.5, borderRight: "1px solid", borderColor: "divider" }}>
						<Typography variant="caption" sx={{ fontWeight: 700, display: "block", mb: 0.5 }}>Dispatch From,</Typography>
						<Typography variant="caption" display="block" sx={{ fontWeight: 600 }}>{header.companyName || "-"}</Typography>
						{header.branchAddress ? <Typography variant="caption" display="block">{header.branchAddress}</Typography> : (header.branch ? <Typography variant="caption" display="block">{header.branch}</Typography> : null)}
						{header.branchStateCode ? <Typography variant="caption" display="block">State Code: {header.branchStateCode}</Typography> : (header.companyStateCode ? <Typography variant="caption" display="block">State Code: {header.companyStateCode}</Typography> : null)}
						{header.branchGstNo ? <Typography variant="caption" display="block">GSTIN: {header.branchGstNo}</Typography> : (header.companyGstin ? <Typography variant="caption" display="block">GSTIN: {header.companyGstin}</Typography> : null)}
					</Box>
					<Box sx={{ p: 1.5 }}>
						<Typography variant="caption" sx={{ fontWeight: 700, display: "block", mb: 0.5 }}>Shipped To/Place of Supply</Typography>
						{header.shippingToName && <Typography variant="caption" display="block">Name : {header.shippingToName}</Typography>}
						{(header.shippingToAddress || header.shippingTo) && <Typography variant="caption" display="block">Address : {header.shippingToAddress || header.shippingTo}</Typography>}
						{header.shippingToState && <Typography variant="caption" display="block">State : {header.shippingToState}</Typography>}
						{header.shippingToStateCode && <Typography variant="caption" display="block">State Code : {header.shippingToStateCode}</Typography>}
						{header.shippingToGstin && <Typography variant="caption" display="block">GSTIN No : {header.shippingToGstin}</Typography>}
					</Box>
				</Box>

				{/* Billed To */}
				<Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderBottom: "1px solid", borderColor: "divider" }}>
					<Box sx={{ p: 1.5, borderRight: "1px solid", borderColor: "divider" }}>
						<Typography variant="caption" sx={{ fontWeight: 700, display: "block", mb: 0.5 }}>Billed To</Typography>
						{header.billingToName && <Typography variant="caption" display="block">Name : {header.billingToName}</Typography>}
						{(header.billingToAddress || header.billingTo) && <Typography variant="caption" display="block">Address : {header.billingToAddress || header.billingTo}</Typography>}
						{header.billingToState && <Typography variant="caption" display="block">State : {header.billingToState}</Typography>}
						{header.billingToStateCode && <Typography variant="caption" display="block">State Code : {header.billingToStateCode}</Typography>}
						{header.billingToGstin && <Typography variant="caption" display="block">GSTIN No : {header.billingToGstin}</Typography>}
					</Box>
					<Box sx={{ p: 1.5 }} />
				</Box>

				{/* Line Items */}
				<Box sx={{ overflowX: "auto" }}>
					<Box component="table" sx={{ width: "100%", borderCollapse: "collapse" }}>
						<Box component="thead" sx={{ backgroundColor: "rgba(12,60,96,0.07)" }}>
							<Box component="tr">
								{["Sr No", "HSN Code", "Description & Specification of Goods", ...(hasNetWeight ? ["Net wt."] : []), "Quantity", "UOM", "Rate", "Value (Rs.)"].map((col) => (
									<Box key={col} component="th" sx={{ border: "1px solid", borderColor: "divider", p: "5px 8px", fontSize: 11, textAlign: col === "Description & Specification of Goods" ? "left" : "center", whiteSpace: "nowrap" }}>
										{col}
									</Box>
								))}
							</Box>
						</Box>
						<Box component="tbody">
							{items.length ? (
								items.map((item) => (
									<Box component="tr" key={`inv-row-${item.srNo}`}>
										<Box component="td" sx={{ border: "1px solid", borderColor: "divider", p: "5px 8px", fontSize: 11, textAlign: "center" }}>{item.srNo}</Box>
										<Box component="td" sx={{ border: "1px solid", borderColor: "divider", p: "5px 8px", fontSize: 11, textAlign: "center" }}>{item.hsnCode || "-"}</Box>
										<Box component="td" sx={{ border: "1px solid", borderColor: "divider", p: "5px 8px", fontSize: 11 }}>{item.item || "-"}</Box>
										{hasNetWeight && <Box component="td" sx={{ border: "1px solid", borderColor: "divider", p: "5px 8px", fontSize: 11, textAlign: "right" }}>{item.netWeight !== undefined && item.netWeight !== "" ? formatAmount(item.netWeight) : "-"}</Box>}
										<Box component="td" sx={{ border: "1px solid", borderColor: "divider", p: "5px 8px", fontSize: 11, textAlign: "right" }}>{item.quantity ?? "-"}</Box>
										<Box component="td" sx={{ border: "1px solid", borderColor: "divider", p: "5px 8px", fontSize: 11, textAlign: "center" }}>{item.uom || "-"}</Box>
										<Box component="td" sx={{ border: "1px solid", borderColor: "divider", p: "5px 8px", fontSize: 11, textAlign: "right" }}>{formatAmount(item.rate)}</Box>
										<Box component="td" sx={{ border: "1px solid", borderColor: "divider", p: "5px 8px", fontSize: 11, textAlign: "right" }}>{formatAmount(item.netAmount)}</Box>
									</Box>
								))
							) : (
								<Box component="tr">
									<Box component="td" colSpan={hasNetWeight ? 8 : 7} sx={{ border: "1px solid", borderColor: "divider", p: 2, fontSize: 11, textAlign: "center" }}>
										No line items captured yet.
									</Box>
								</Box>
							)}
						</Box>
					</Box>
				</Box>

				{/* Totals */}
				{totals && (
					<Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: "1px solid", borderColor: "divider" }}>
						<Box sx={{ p: 1.5, borderRight: "1px solid", borderColor: "divider" }}>
							{remarks && (
								<>
									<Typography variant="caption" sx={{ fontWeight: 600, display: "block", mb: 0.5 }}>REMARKS:</Typography>
									<Typography variant="caption" color="text.secondary">{remarks}</Typography>
								</>
							)}
						</Box>
						<Box>
							{[
								{ label: "Total", value: formatAmount(totals.grossAmount) },
								{ label: cgstLabel, value: formatAmount(totals.totalCGST) },
								{ label: sgstLabel, value: formatAmount(totals.totalSGST) },
								{ label: igstLabel, value: formatAmount(totals.totalIGST) },
								...(totals.freightCharges ? [{ label: "Freight Charges", value: formatAmount(totals.freightCharges) }] : []),
								{ label: "Total Value", value: formatAmount(totalValue), bold: true },
								{ label: "Round off", value: totals.roundOff ? formatAmount(totals.roundOff) : "0.00" },
								{ label: "Grand Total", value: formatAmount(totals.netAmount), bold: true },
							].map(({ label, value, bold }) => (
								<Box key={label} sx={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid", borderColor: "divider", px: 1.5, py: "3px" }}>
									<Typography variant="caption" sx={{ fontWeight: bold ? 700 : 400 }}>{label}</Typography>
									<Typography variant="caption" sx={{ fontWeight: bold ? 700 : 400, fontVariantNumeric: "tabular-nums" }}>{value}</Typography>
								</Box>
							))}
						</Box>
					</Box>
				)}

				{/* Invoice value in words */}
				{totals?.netAmount != null && (
					<>
						<Box sx={{ px: 1.5, py: 0.5, borderTop: "1px solid", borderBottom: "1px solid", borderColor: "divider", backgroundColor: "rgba(0,0,0,0.02)" }}>
							<Typography variant="caption" sx={{ fontWeight: 600 }}>Invoice Value (In Words)</Typography>
						</Box>
						<Box sx={{ px: 1.5, py: 0.75, borderBottom: "1px solid", borderColor: "divider" }}>
							<Typography variant="caption">Rupees in words: {numberToWordsIndian(totals.netAmount)}</Typography>
						</Box>
					</>
				)}

				{/* Bank Details + Terms & Conditions + Authorized Signatory */}
				<Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: 80 }}>
					<Box sx={{ p: 1.5, borderRight: "1px solid", borderColor: "divider" }}>
						{(header.bankName || header.bankAccNo) && (
							<>
								<Typography variant="caption" sx={{ fontWeight: 600, display: "block", mb: 0.5 }}>Bank Details</Typography>
								{header.bankName && <Typography variant="caption" display="block">{header.bankName}</Typography>}
								{header.bankAccNo && <Typography variant="caption" display="block">A/c No. : {header.bankAccNo}</Typography>}
								{header.bankIfscCode && <Typography variant="caption" display="block">IFS Code : {header.bankIfscCode}</Typography>}
								<Box sx={{ mb: 1 }} />
							</>
						)}
						{termsConditions && (
							<>
								<Typography variant="caption" sx={{ fontWeight: 600, display: "block", mb: 0.5 }}>Term & Conditions</Typography>
								<Typography variant="caption" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>{termsConditions}</Typography>
							</>
						)}
					</Box>
					<Box sx={{ p: 1.5, display: "flex", flexDirection: "column", alignItems: "flex-end", justifyContent: "space-between" }}>
						<Typography variant="caption" sx={{ fontWeight: 700 }}>{header.companyName || ""}</Typography>
						<Box sx={{ textAlign: "right" }}>
							<Box sx={{ borderTop: "1px solid", borderColor: "divider", pt: 0.5, mt: 4, minWidth: 140 }}>
								<Typography variant="caption">Authorised Signatory</Typography>
							</Box>
							{header.updatedAt && (
								<Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5, fontSize: "0.65rem" }}>
									Last Updated: {formatDateTime(header.updatedAt)}
								</Typography>
							)}
						</Box>
					</Box>
				</Box>

			</Box>

			<Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end">
				<Button variant="outline" size="sm" onClick={handlePrint}>Print</Button>
				<Button variant="outline" size="sm" onClick={handleDownload}>Download</Button>
			</Stack>
		</Box>
	);
};

export default SalesInvoicePreview;
