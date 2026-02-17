"use client";

import React from "react";
import { Paper, Typography, Divider, Table, TableHead, TableRow, TableCell, TableBody, Chip } from "@mui/material";

type PreviewHeader = {
	salesNo?: string;
	salesOrderDate?: string;
	branch?: string;
	customerName?: string;
	brokerName?: string;
	transporterName?: string;
	status?: string;
	companyName?: string;
};

type PreviewItem = {
	index: number;
	itemName: string;
	quantity: number | string;
	uom: string;
	rate: number | string;
	amount: number | string;
	gst: number | string;
	total: number | string;
};

type SalesOrderPreviewProps = {
	header: PreviewHeader;
	items: PreviewItem[];
	remarks?: string;
};

const formatCurrency = (value: number | string | undefined) => {
	if (value === undefined || value === null || value === "") return "-";
	const num = typeof value === "string" ? parseFloat(value) : value;
	if (isNaN(num)) return "-";
	return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(num);
};

export function SalesOrderPreview({ header, items, remarks }: SalesOrderPreviewProps) {
	return (
		<Paper variant="outlined" sx={{ p: 3 }}>
			<div className="flex justify-between items-start mb-4">
				<div>
					<Typography variant="h6" fontWeight={700}>
						{header.companyName || "Company"}
					</Typography>
					<Typography variant="body2" color="text.secondary">
						Sales Order Preview
					</Typography>
				</div>
				{header.status && <Chip label={header.status} size="small" />}
			</div>

			<Divider sx={{ my: 2 }} />

			<div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
				{header.salesNo && (
					<div>
						<Typography variant="caption" color="text.secondary">Sales Order No</Typography>
						<Typography variant="body2" fontWeight={600}>{header.salesNo}</Typography>
					</div>
				)}
				{header.salesOrderDate && (
					<div>
						<Typography variant="caption" color="text.secondary">Order Date</Typography>
						<Typography variant="body2">{header.salesOrderDate}</Typography>
					</div>
				)}
				{header.branch && (
					<div>
						<Typography variant="caption" color="text.secondary">Branch</Typography>
						<Typography variant="body2">{header.branch}</Typography>
					</div>
				)}
				{header.customerName && (
					<div>
						<Typography variant="caption" color="text.secondary">Customer</Typography>
						<Typography variant="body2">{header.customerName}</Typography>
					</div>
				)}
				{header.brokerName && (
					<div>
						<Typography variant="caption" color="text.secondary">Broker</Typography>
						<Typography variant="body2">{header.brokerName}</Typography>
					</div>
				)}
				{header.transporterName && (
					<div>
						<Typography variant="caption" color="text.secondary">Transporter</Typography>
						<Typography variant="body2">{header.transporterName}</Typography>
					</div>
				)}
			</div>

			{items.length > 0 && (
				<>
					<Divider sx={{ my: 2 }} />
					<Typography variant="subtitle2" sx={{ mb: 1 }}>Line Items</Typography>
					<Table size="small">
						<TableHead>
							<TableRow>
								<TableCell>#</TableCell>
								<TableCell>Item</TableCell>
								<TableCell align="right">Qty</TableCell>
								<TableCell>UOM</TableCell>
								<TableCell align="right">Rate</TableCell>
								<TableCell align="right">Amount</TableCell>
								<TableCell align="right">GST</TableCell>
								<TableCell align="right">Total</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{items.map((item) => (
								<TableRow key={item.index}>
									<TableCell>{item.index}</TableCell>
									<TableCell>{item.itemName}</TableCell>
									<TableCell align="right">{item.quantity}</TableCell>
									<TableCell>{item.uom}</TableCell>
									<TableCell align="right">{formatCurrency(item.rate)}</TableCell>
									<TableCell align="right">{formatCurrency(item.amount)}</TableCell>
									<TableCell align="right">{formatCurrency(item.gst)}</TableCell>
									<TableCell align="right">{formatCurrency(item.total)}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</>
			)}

			{remarks && (
				<>
					<Divider sx={{ my: 2 }} />
					<Typography variant="caption" color="text.secondary">Remarks</Typography>
					<Typography variant="body2">{remarks}</Typography>
				</>
			)}
		</Paper>
	);
}

export default SalesOrderPreview;
