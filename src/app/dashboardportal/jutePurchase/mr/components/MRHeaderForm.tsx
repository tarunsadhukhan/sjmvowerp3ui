import * as React from "react";
import { Card, CardContent, Grid, TextField, Typography } from "@mui/material";
import { SearchableSelect } from "@/components/ui/transaction";
import type { JuteMRHeader } from "../types/mrTypes";

type AgentOption = {
	value: number;
	label: string;
};

type MRHeaderFormProps = {
	header: JuteMRHeader;
	mode: "edit" | "view";
	onHeaderChange?: (field: keyof JuteMRHeader, value: string | number | null) => void;
	agentOptions?: AgentOption[];
};

export function MRHeaderForm({ header, mode, onHeaderChange, agentOptions = [] }: MRHeaderFormProps) {
	// Show agent field if: in edit mode (always) OR in view mode (only if src_com_id has value)
	const showAgent = mode === "edit" || header.src_com_id != null;
	const showGateEntryDate = header.src_com_id != null;
	const readOnly = mode === "view";

	// Find selected agent option
	const selectedAgent = React.useMemo(() => {
		if (!header.src_com_id) return null;
		return agentOptions.find((opt) => opt.value === header.src_com_id) || null;
	}, [header.src_com_id, agentOptions]);

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
					{showAgent && (
						<Grid item xs={12} md={4}>
							{readOnly ? (
								<TextField
									label="Agent"
									fullWidth
									value={selectedAgent?.label ?? header.src_com_id ?? ""}
									InputProps={{ readOnly: true }}
								/>
							) : (
								<SearchableSelect
									options={agentOptions}
									value={selectedAgent}
									onChange={(opt) => onHeaderChange?.("src_com_id", opt?.value ?? null)}
									getOptionLabel={(opt) => opt.label}
									isOptionEqualToValue={(a, b) => a.value === b.value}
									placeholder="Select agent branch"
									fullWidth
									textFieldProps={{ label: "Agent", size: "small" }}
								/>
							)}
						</Grid>
					)}
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
