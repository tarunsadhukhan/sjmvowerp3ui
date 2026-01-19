import * as React from "react";
import { Card, CardContent, Grid, TextField, Typography } from "@mui/material";
import type { JuteMRHeader } from "../types/mrTypes";

type MRHeaderFormProps = {
	header: JuteMRHeader;
	mode: "edit" | "view";
	onHeaderChange?: (field: keyof JuteMRHeader, value: string | number | null) => void;
};

export function MRHeaderForm({ header, mode, onHeaderChange }: MRHeaderFormProps) {
	const showGateEntryDate = header.src_com_id != null;
	const readOnly = mode === "view";

	return (
		<Card variant="outlined">
			<CardContent>
				<Typography variant="h6" gutterBottom>
					Material Receipt - MR #{header.branch_mr_no ?? header.jute_mr_id}
				</Typography>
				<Grid container spacing={2}>
					<Grid item xs={12} md={4}>
						<TextField
							label="Branch"
							fullWidth
							value={header.branch_name ?? ""}
							InputProps={{ readOnly: true }}
						/>
					</Grid>
					<Grid item xs={12} md={4}>
						<TextField
							label="Supplier"
							fullWidth
							value={header.supplier_name ?? ""}
							InputProps={{ readOnly: true }}
						/>
					</Grid>
					<Grid item xs={12} md={4}>
						<TextField
							label="Party"
							fullWidth
							value={header.party_name ?? ""}
							InputProps={{ readOnly: true }}
						/>
					</Grid>
					<Grid item xs={12} md={4}>
						<TextField
							label="Party Branch"
							fullWidth
							value={header.party_branch_name ?? ""}
							InputProps={{ readOnly: true }}
						/>
					</Grid>
					<Grid item xs={12} md={4}>
						<TextField
							label="PO No"
							fullWidth
							value={header.po_no ?? ""}
							InputProps={{ readOnly: true }}
						/>
					</Grid>
					<Grid item xs={12} md={4}>
						<TextField
							label="PO Date"
							fullWidth
							value={header.po_date ?? ""}
							InputProps={{ readOnly: true }}
						/>
					</Grid>
					<Grid item xs={12} md={4}>
						<TextField
							label="Challan No"
							fullWidth
							value={header.challan_no ?? ""}
							InputProps={{ readOnly: true }}
						/>
					</Grid>
					<Grid item xs={12} md={4}>
						<TextField
							label="Challan Date"
							fullWidth
							value={header.challan_date ?? ""}
							InputProps={{ readOnly: true }}
						/>
					</Grid>
					<Grid item xs={12} md={4}>
						<TextField
							label="MR No"
							fullWidth
							value={header.branch_mr_no ?? ""}
							InputProps={{ readOnly: true }}
						/>
					</Grid>
					<Grid item xs={12} md={4}>
						<TextField
							label="MR Date"
							fullWidth
							value={header.jute_mr_date ?? ""}
							InputProps={{ readOnly: true }}
						/>
					</Grid>
					<Grid item xs={12} md={4}>
						<TextField
							label="Mukam"
							fullWidth
							value={header.mukam ?? ""}
							InputProps={{ readOnly: true }}
						/>
					</Grid>
					<Grid item xs={12} md={4}>
						<TextField
							label="Vehicle No"
							fullWidth
							value={header.vehicle_no ?? ""}
							InputProps={{ readOnly: true }}
						/>
					</Grid>
					<Grid item xs={12} md={4}>
						<TextField
							label="Unit Conversion"
							fullWidth
							value={header.unit_conversion ?? ""}
							InputProps={{ readOnly: true }}
						/>
					</Grid>
					<Grid item xs={12} md={4}>
						<TextField
							label="MR Weight"
							fullWidth
							type="number"
							value={header.mr_weight ?? ""}
							onChange={(e) =>
								onHeaderChange?.("mr_weight", e.target.value ? parseFloat(e.target.value) : null)
							}
							InputProps={{ readOnly: readOnly }}
						/>
					</Grid>
					{showGateEntryDate && (
						<Grid item xs={12} md={4}>
							<TextField
								label="Gate Entry Date"
								fullWidth
								value={header.jute_gate_entry_date ?? ""}
								InputProps={{ readOnly: true }}
							/>
						</Grid>
					)}
					<Grid item xs={12}>
						<TextField
							label="Remarks"
							fullWidth
							multiline
							rows={2}
							value={header.remarks ?? ""}
							onChange={(e) => onHeaderChange?.("remarks", e.target.value || null)}
							InputProps={{ readOnly: readOnly }}
						/>
					</Grid>
				</Grid>
			</CardContent>
		</Card>
	);
}
