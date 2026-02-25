"use client";

import * as React from "react";
import { Box, Divider, Stack, Typography } from "@mui/material";
import { Button } from "@/components/ui/button";
import type { SRHeader, SRLineItem, SRTotals } from "../types/srTypes";

/**
 * Format date for display.
 */
const formatDate = (value?: string): string => {
	if (!value) return "-";
	try {
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return value;
		return new Intl.DateTimeFormat("en-GB", {
			day: "2-digit",
			month: "short",
			year: "numeric",
		}).format(date);
	} catch {
		return value;
	}
};

/**
 * Format currency for display.
 */
const formatCurrency = (value?: number): string => {
	if (value === undefined || value === null) return "₹0.00";
	return new Intl.NumberFormat("en-IN", {
		style: "currency",
		currency: "INR",
		minimumFractionDigits: 2,
	}).format(value);
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
		<Typography
			variant="body2"
			color="text.secondary"
			sx={{ fontSize: "0.8125rem", fontWeight: isBold ? 600 : 400 }}
		>
			{label}:
		</Typography>
		<Typography
			variant="body2"
			sx={{ fontWeight: isBold ? 600 : 400, fontSize: isBold ? "0.9375rem" : "0.8125rem" }}
		>
			{value ?? "-"}
		</Typography>
	</Stack>
);

type SRPreviewProps = {
	header: SRHeader | null;
	lineItems: SRLineItem[];
	totals: SRTotals;
	srDate: string;
	srRemarks: string;
	onPrint?: () => void;
};

/**
 * Printable preview component for SR.
 */
export const SRPreview: React.FC<SRPreviewProps> = ({
	header,
	lineItems,
	totals,
	srDate,
	srRemarks,
	onPrint,
}) => {
	const previewRef = React.useRef<HTMLDivElement>(null);

	const handlePrint = () => {
		if (onPrint) {
			onPrint();
			return;
		}

		const printContent = previewRef.current?.innerHTML || "";
		const printWindow = window.open("", "_blank");
		if (!printWindow) {
			alert("Please allow popups to print.");
			return;
		}

		printWindow.document.open();
		printWindow.document.write(`<!DOCTYPE html><html><head><title>Stores Receipt - ${header?.sr_no || header?.inward_no}</title></head><body><div id="print-root"></div></body></html>`);
		printWindow.document.close();

		const styleNodes = document.querySelectorAll("style, link[rel=\"stylesheet\"]");
		styleNodes.forEach((node) => {
			printWindow.document.head.appendChild(node.cloneNode(true));
		});

		const helperStyle = printWindow.document.createElement("style");
		helperStyle.textContent = `
			@media print { @page { margin: 12mm; } }
			body { margin: 0; padding: 20px; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-family: Arial, sans-serif; }
			table { width: 100%; border-collapse: collapse; margin-top: 16px; }
			th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
			th { background-color: #f5f5f5; font-weight: 600; }
			.text-right { text-align: right; }
		`;
		printWindow.document.head.appendChild(helperStyle);

		const root = printWindow.document.getElementById("print-root");
		if (root) root.innerHTML = printContent;

		printWindow.focus();
		setTimeout(() => {
			printWindow.print();
			printWindow.close();
		}, 300);
	};

	return (
		<Box>
			<Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }} className="print-hidden">
				<Button variant="outline" size="sm" onClick={handlePrint}>
					Print Preview
				</Button>
			</Stack>

			<Box ref={previewRef} sx={{ p: 2 }}>
				{/* Title */}
				<Typography variant="h5" fontWeight={600} textAlign="center" sx={{ mb: 3 }}>
					Stores Receipt
				</Typography>

				{/* Header Info */}
				<Box
					sx={{
						display: "grid",
						gridTemplateColumns: { xs: "1fr 1fr", md: "1fr 1fr 1fr 1fr" },
						gap: 2,
						mb: 3,
					}}
				>
					<FieldRow label="SR No" value={<Typography component="span" fontWeight={600} color="primary">{header?.sr_no || "Draft"}</Typography>} />
					<FieldRow label="SR Date" value={formatDate(srDate)} />
					<FieldRow label="GRN No" value={header?.inward_no} />
					<FieldRow label="GRN Date" value={formatDate(header?.inward_date)} />
					<FieldRow label="Branch" value={header?.branch_name} />
					<FieldRow label="Supplier" value={header?.supplier_name} />
					<FieldRow label="Challan No" value={header?.challan_no} />
					<FieldRow label="Inspection Date" value={formatDate(header?.inspection_date)} />
				</Box>

				<Divider sx={{ my: 2 }} />

				{/* Line Items Table */}
				<Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
					Line Items
				</Typography>
				<Box
					component="table"
					sx={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}
				>
					<thead>
						<tr style={{ backgroundColor: "#f5f5f5" }}>
							<th style={{ border: "1px solid #ddd", padding: "8px" }}>#</th>
							<th style={{ border: "1px solid #ddd", padding: "8px" }}>Item</th>
							<th style={{ border: "1px solid #ddd", padding: "8px" }}>UOM</th>
							<th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "right" }}>Qty</th>
							<th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "right" }}>Rate</th>
							<th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "right" }}>Disc.</th>
							<th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "right" }}>Disc. Amt</th>
							<th style={{ border: "1px solid #ddd", padding: "8px" }}>Warehouse</th>
							<th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "right" }}>Amount</th>
							<th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "right" }}>Tax %</th>
							<th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "right" }}>Tax Amt</th>
							<th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "right" }}>Total</th>
						</tr>
					</thead>
					<tbody>
						{lineItems.map((item, idx) => (
							<tr key={item.id}>
								<td style={{ border: "1px solid #ddd", padding: "8px" }}>{idx + 1}</td>
								<td style={{ border: "1px solid #ddd", padding: "8px" }}>
									{item.item_name}
									{item.accepted_item_make_name && (
										<span style={{ color: "#666", fontSize: "11px" }}>
											{" "}({item.accepted_item_make_name})
										</span>
									)}
								</td>
								<td style={{ border: "1px solid #ddd", padding: "8px" }}>{item.uom_name}</td>
								<td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "right" }}>
									{item.approved_qty}
								</td>
								<td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "right" }}>
									{item.accepted_rate.toFixed(2)}
								</td>
								<td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "right" }}>
									{item.discount_mode === 1
										? `${item.discount_value ?? 0}%`
										: item.discount_mode === 2
											? (item.discount_value ?? 0).toFixed(2)
											: "-"}
								</td>
								<td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "right" }}>
									{item.discount_amount > 0 ? item.discount_amount.toFixed(2) : "-"}
								</td>
								<td style={{ border: "1px solid #ddd", padding: "8px" }}>
									{item.warehouse_name || "-"}
								</td>
								<td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "right" }}>
									{item.amount.toFixed(2)}
								</td>
								<td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "right" }}>
									{item.tax_percentage}%
								</td>
								<td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "right" }}>
									{item.tax_amount.toFixed(2)}
								</td>
								<td style={{ border: "1px solid #ddd", padding: "8px", textAlign: "right", fontWeight: 600 }}>
									{item.total_amount.toFixed(2)}
								</td>
							</tr>
						))}
					</tbody>
				</Box>

				{/* Totals */}
				<Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
					<Stack spacing={0.5}>
						<TotalsRow label="Gross Amount" value={formatCurrency(totals.grossAmount)} />
						{totals.totalDiscount > 0 && (
							<TotalsRow label="Discount" value={`-${formatCurrency(totals.totalDiscount)}`} />
						)}
						<TotalsRow label="Net Amount" value={formatCurrency(totals.netAmount)} />
						{totals.totalIGST > 0 && <TotalsRow label="IGST" value={formatCurrency(totals.totalIGST)} />}
						{totals.totalCGST > 0 && <TotalsRow label="CGST" value={formatCurrency(totals.totalCGST)} />}
						{totals.totalSGST > 0 && <TotalsRow label="SGST" value={formatCurrency(totals.totalSGST)} />}
						<Divider sx={{ my: 0.5 }} />
						<TotalsRow label="Grand Total" value={formatCurrency(totals.grandTotal)} isBold />
					</Stack>
				</Box>

				{/* Remarks */}
				{srRemarks && (
					<Box sx={{ mt: 3 }}>
						<Typography variant="subtitle2" color="text.secondary">
							Remarks:
						</Typography>
						<Typography variant="body2">{srRemarks}</Typography>
					</Box>
				)}
			</Box>
		</Box>
	);
};
