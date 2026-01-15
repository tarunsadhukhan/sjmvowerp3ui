import * as React from "react";
import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	IconButton,
	List,
	ListItem,
	ListItemText,
	TextField,
	Typography,
} from "@mui/material";
import { Pencil, Trash2 } from "lucide-react";

type MoistureReadingDialogProps = {
	open: boolean;
	onClose: () => void;
	readings: number[];
	onChange: (readings: number[], average: number | null) => void;
};

export function MoistureReadingDialog({ open, onClose, readings, onChange }: MoistureReadingDialogProps) {
	const [inputValue, setInputValue] = React.useState("");

	const calculateAverage = React.useCallback((values: number[]): number | null => {
		if (!values.length) return null;
		const sum = values.reduce((acc, v) => acc + v, 0);
		return sum / values.length;
	}, []);

	const handleAdd = () => {
		const value = parseFloat(inputValue);
		if (Number.isNaN(value) || value <= 0) return;
		const next = [...readings, value];
		onChange(next, calculateAverage(next));
		setInputValue("");
	};

	const handleRemove = (index: number) => {
		const next = readings.filter((_, i) => i !== index);
		onChange(next, calculateAverage(next));
	};

	const average = calculateAverage(readings);

	return (
		<Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
			<DialogTitle>Moisture Readings</DialogTitle>
			<DialogContent>
				<Box display="flex" gap={1} mt={1} mb={2}>
					<TextField
						label="Add Reading (%)"
						type="number"
						fullWidth
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						inputProps={{ min: 0, step: 0.01 }}
					/>
					<Button variant="contained" onClick={handleAdd}>
						Add
					</Button>
				</Box>

				{readings.length === 0 ? (
					<Typography variant="body2" color="text.secondary">
						No readings added yet.
					</Typography>
				) : (
					<List dense>
						{readings.map((val, idx) => (
							<ListItem
								key={`${val}-${idx}`}
								secondaryAction={
									<IconButton edge="end" aria-label="delete" onClick={() => handleRemove(idx)}>
										<Trash2 size={16} />
									</IconButton>
								}
							>
								<ListItemText primary={`${val.toFixed(2)} %`} />
							</ListItem>
						))}
					</List>
				)}

				<Box mt={2}>
					<Typography variant="subtitle2">
						Average Moisture:{" "}
						<strong>{average !== null && !Number.isNaN(average) ? `${average.toFixed(2)} %` : "-"}</strong>
					</Typography>
				</Box>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Close</Button>
			</DialogActions>
		</Dialog>
	);
}

export function MoistureButton({ onClick }: { onClick: () => void }) {
	return (
		<Button
			variant="outlined"
			size="small"
			startIcon={<Pencil size={14} />}
			onClick={onClick}
		>
			Moisture
		</Button>
	);
}

