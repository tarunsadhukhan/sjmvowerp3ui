import * as React from "react";
import { Card, CardContent, Grid, TextField, Typography } from "@mui/material";
import type { JuteMaterialInspectionHeader } from "../types/materialInspectionTypes";

type InspectionHeaderFormProps = {
	header: JuteMaterialInspectionHeader;
};

export function InspectionHeaderForm({ header }: InspectionHeaderFormProps) {
	const gateEntryNo = header.branch_gate_entry_no ?? header.jute_gate_entry_id;

	return (
		<Card variant="outlined">
			<CardContent>
				<Typography variant="h6" gutterBottom>
					Material Inspection - Gate Entry #{gateEntryNo}
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
							label="Gate Entry ID"
							fullWidth
							value={header.jute_gate_entry_id}
							InputProps={{ readOnly: true }}
						/>
					</Grid>
					<Grid item xs={12} md={4}>
						<TextField
							label="Gate Entry No"
							fullWidth
							value={gateEntryNo ?? ""}
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
							label="Mukam"
							fullWidth
							value={header.mukam ?? ""}
							InputProps={{ readOnly: true }}
						/>
					</Grid>
					<Grid item xs={12} md={4}>
						<TextField
							label="Jute UOM"
							fullWidth
							value={header.unit_conversion ?? ""}
							InputProps={{ readOnly: true }}
						/>
					</Grid>
				</Grid>
			</CardContent>
		</Card>
	);
}

