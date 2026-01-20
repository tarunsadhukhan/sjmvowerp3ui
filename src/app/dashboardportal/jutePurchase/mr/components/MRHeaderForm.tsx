import * as React from "react";
import { Card, CardContent, Grid, TextField, Typography, MenuItem, FormControl, InputLabel, Select, FormHelperText } from "@mui/material";
import type { JuteMRHeader, PartyBranchOption } from "../types/mrTypes";

type MRHeaderFormProps = {
	header: JuteMRHeader;
	mode: "edit" | "view";
	onHeaderChange?: (field: keyof JuteMRHeader, value: string | number | null) => void;
	partyBranchOptions?: PartyBranchOption[];
	partyBranchLoading?: boolean;
	/** Total accepted weight calculated from line items */
	totalAcceptedWeight?: number;
};

export function MRHeaderForm({ header, mode, onHeaderChange, partyBranchOptions = [], partyBranchLoading = false, totalAcceptedWeight }: MRHeaderFormProps) {
	const showGateEntryDate = header.src_com_id != null;
	const readOnly = mode === "view";
	
	// Use prop if provided, otherwise fall back to header value
	const displayMRWeight = totalAcceptedWeight ?? header.mr_weight ?? 0;
	
	// Check if party branch is missing (mandatory validation)
	const partyBranchError = !header.party_branch_id && header.party_id && partyBranchOptions.length > 0;

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
						{readOnly || partyBranchOptions.length <= 1 ? (
							<TextField
								label="Party Branch *"
								fullWidth
								value={header.party_branch_name ?? ""}
								InputProps={{ readOnly: true }}
							/>
						) : (
							<FormControl fullWidth error={!!partyBranchError}>
								<InputLabel id="party-branch-label">Party Branch *</InputLabel>
								<Select
									labelId="party-branch-label"
									label="Party Branch *"
									value={header.party_branch_id ?? ""}
									onChange={(e) => onHeaderChange?.("party_branch_id", e.target.value ? Number(e.target.value) : null)}
									disabled={partyBranchLoading}
								>
									{partyBranchOptions.map((branch) => (
										<MenuItem key={branch.party_mst_branch_id} value={branch.party_mst_branch_id}>
											{branch.display}
										</MenuItem>
									))}
								</Select>
								{partyBranchError && <FormHelperText>Party Branch is required</FormHelperText>}
							</FormControl>
						)}
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
							label="Actual Weight (Gate Entry)"
							fullWidth
							type="number"
							value={header.actual_weight ?? ""}
							InputProps={{ readOnly: true }}
							helperText="Auto-distributed to line items by quantity"
						/>
					</Grid>
					<Grid item xs={12} md={4}>
						<TextField
							label="MR Weight (Sum of Accepted)"
							fullWidth
							type="number"
							value={displayMRWeight.toFixed(2)}
							InputProps={{ readOnly: true }}
							helperText="Auto-calculated from accepted weights"
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
