"use client";

import React, { useRef } from "react";
import { Box, Divider, Stack, Typography } from "@mui/material";
import { Button } from "@/components/ui/button";

export type DOPreviewHeader = {
	doNo?: string;
	doDate?: string;
	branch?: string;
	customer?: string;
	billingToAddress?: string;
	shippingToAddress?: string;
	salesOrder?: string;
	transporter?: string;
	vehicleNo?: string;
	driverName?: string;
	status?: string;
	companyName?: string;
};

export type DOPreviewItem = {
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

export type DOPreviewTotals = {
	grossAmount?: number;
	totalIGST?: number;
	totalCGST?: number;
	totalSGST?: number;
	freightCharges?: number;
	roundOffValue?: number;
	netAmount?: number;
};

type DOPreviewProps = {
	header: DOPreviewHeader;
	items: DOPreviewItem[];
	totals?: DOPreviewTotals;
	remarks?: string;
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

const cellSx = {
	border: "1px solid",
	borderColor: "divider",
	p: 0.75,
	fontSize: 12,
} as const;

const DeliveryOrderPreview: React.FC<DOPreviewProps> = ({ header, items, totals, remarks, onPrint, onDownload }) => {
	const previewRef = useRef<HTMLDivElement>(null);

	const buildPrintableWindow = (titleSuffix: string) => {
		const printContent = previewRef.current?.innerHTML || "";
		const printWindow = window.open("", "_blank");
		if (!printWindow) {
			alert("Please allow popups to continue.");
			return null;
		}

		printWindow.document.open();
		printWindow.document.write(`<!DOCTYPE html><html><head><title>Delivery Order - ${titleSuffix}</title></head><body><div id="print-root"></div></body></html>`);
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
		`;
		printWindow.document.head.appendChild(helperStyle);

		const root = printWindow.document.getElementById("print-root");
		if (root) root.innerHTML = printContent;
		return printWindow;
	};

	const handlePrint = () => {
		if (onPrint) { onPrint(); return; }
		const printWindow = buildPrintableWindow(header.doNo || "Print");
		if (!printWindow) return;
		printWindow.focus();
		setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
	};

	const handleDownload = () => {
		if (onDownload) { onDownload(); return; }
		const printWindow = buildPrintableWindow(header.doNo || "Download");
		if (!printWindow) return;
		printWindow.focus();
		setTimeout(() => { printWindow.print(); }, 300);
	};

	return (
		<Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
			<Box ref={previewRef} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, p: 3, backgroundColor: "#fff" }}>
				{/* Company Header */}
				<Typography variant="body1" sx={{ fontWeight: 700, fontSize: "1rem", textTransform: "uppercase" }}>
					{header.companyName || "-"}
				</Typography>
				<Typography variant="body2" sx={{ fontSize: "0.8125rem", color: "text.secondary", mb: 1 }}>
					{header.branch || ""}
				</Typography>

				<Divider sx={{ mb: 2 }} />

				{/* Title + DO/Sale info */}
				<Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
					<Typography variant="h6" sx={{ fontWeight: 700, textDecoration: "underline" }}>
						DELIVERY ORDER
					</Typography>

					<Box component="table" sx={{ borderCollapse: "collapse", width: "auto" }}>
						<Box component="tbody">
							<Box component="tr">
								<Box component="td" sx={{ pr: 1, fontSize: 12, fontWeight: 600 }}>DO No.</Box>
								<Box component="td" sx={{ pr: 1, fontSize: 12 }}>:</Box>
								<Box component="td" sx={{ fontSize: 12, fontWeight: 500 }}>{header.doNo || "Pending"}</Box>
							</Box>
							<Box component="tr">
								<Box component="td" sx={{ pr: 1, fontSize: 12, fontWeight: 600 }}>Date</Box>
								<Box component="td" sx={{ pr: 1, fontSize: 12 }}>:</Box>
								<Box component="td" sx={{ fontSize: 12 }}>{formatDate(header.doDate)}</Box>
							</Box>
							{header.salesOrder ? (
								<>
									<Box component="tr">
										<Box component="td" sx={{ pr: 1, fontSize: 12, fontWeight: 600 }}>Sale No.</Box>
										<Box component="td" sx={{ pr: 1, fontSize: 12 }}>:</Box>
										<Box component="td" sx={{ fontSize: 12 }}>{header.salesOrder}</Box>
									</Box>
								</>
							) : null}
						</Box>
					</Box>
				</Stack>

				{/* Items Table */}
				<Box sx={{ overflowX: "auto", mb: 2 }}>
					<Box component="table" sx={{ width: "100%", borderCollapse: "collapse" }}>
						<Box component="thead" sx={{ backgroundColor: "rgba(12,60,96,0.08)" }}>
							<Box component="tr">
								{["Sr No", "Description", "Quantity", "UOM"].map((col) => (
									<Box key={col} component="th" sx={{
										...cellSx,
										fontWeight: 600,
										textAlign: col === "Description" ? "left" : "center",
										...(col === "Description" ? { width: "55%" } : {}),
									}}>
										{col}
									</Box>
								))}
							</Box>
						</Box>
						<Box component="tbody">
							{items.length ? (
								items.map((item) => (
									<Box component="tr" key={`do-preview-row-${item.srNo}`}>
										<Box component="td" sx={{ ...cellSx, textAlign: "center", width: 50 }}>{item.srNo}</Box>
										<Box component="td" sx={{ ...cellSx }}>{item.item || "-"}</Box>
										<Box component="td" sx={{ ...cellSx, textAlign: "right", width: 100 }}>{item.quantity ?? "-"}</Box>
										<Box component="td" sx={{ ...cellSx, textAlign: "center", width: 80 }}>{item.uom || "-"}</Box>
									</Box>
								))
							) : (
								<Box component="tr">
									<Box component="td" colSpan={4} sx={{ ...cellSx, textAlign: "center", py: 2 }}>
										No line items captured yet.
									</Box>
								</Box>
							)}
						</Box>
					</Box>
				</Box>

				{/* Customer / Billing / Shipping Info */}
				<Stack spacing={0.5} sx={{ mb: 2 }}>
					<Typography variant="body2" sx={{ fontSize: "0.8125rem" }}>
						<strong>A/C Messrs.</strong> {header.customer || "-"}
					</Typography>
					{header.billingToAddress ? (
						<Typography variant="body2" sx={{ fontSize: "0.8125rem" }}>
							<strong>Billing To :</strong> {header.billingToAddress}
						</Typography>
					) : null}
					{header.shippingToAddress ? (
						<Typography variant="body2" sx={{ fontSize: "0.8125rem" }}>
							<strong>Ship To :</strong> {header.shippingToAddress}
						</Typography>
					) : null}
				</Stack>

				<Divider sx={{ my: 1.5 }} />

				{/* Transport Details */}
				{(header.transporter || header.vehicleNo || header.driverName) ? (
					<Stack direction="row" spacing={4} sx={{ mb: 2, flexWrap: "wrap" }}>
						{header.transporter ? (
							<Typography variant="body2" sx={{ fontSize: "0.8125rem" }}>
								<strong>Transporter:</strong> {header.transporter}
							</Typography>
						) : null}
						{header.vehicleNo ? (
							<Typography variant="body2" sx={{ fontSize: "0.8125rem" }}>
								<strong>Vehicle No.:</strong> {header.vehicleNo}
							</Typography>
						) : null}
						{header.driverName ? (
							<Typography variant="body2" sx={{ fontSize: "0.8125rem" }}>
								<strong>Driver:</strong> {header.driverName}
							</Typography>
						) : null}
					</Stack>
				) : null}

				{/* Remarks */}
				{remarks ? (
					<>
						<Typography variant="body2" sx={{ fontSize: "0.8125rem", mb: 2 }}>
							<strong>Remarks:</strong> {remarks}
						</Typography>
					</>
				) : null}

				<Divider sx={{ my: 1.5 }} />

				{/* Signature Area */}
				<Stack direction="row" justifyContent="space-between" sx={{ mt: 4 }}>
					<Stack spacing={0.5} alignItems="center">
						<Box sx={{ borderBottom: "1px solid", borderColor: "divider", width: 180, height: 24 }} />
						<Typography variant="caption" color="text.secondary">Receiver&apos;s Signature</Typography>
					</Stack>
					<Stack spacing={0.5} alignItems="center">
						<Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.8125rem", textTransform: "uppercase" }}>
							{header.companyName || ""}
						</Typography>
						<Box sx={{ borderBottom: "1px solid", borderColor: "divider", width: 180, height: 24 }} />
						<Typography variant="caption" color="text.secondary">Authorised Signatory</Typography>
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

export default DeliveryOrderPreview;
