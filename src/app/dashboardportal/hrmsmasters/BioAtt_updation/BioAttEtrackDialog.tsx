"use client";
import React, { useCallback, useEffect, useState } from "react";
import {
	Alert,
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	TextField,
	Typography,
} from "@mui/material";
import axios, { AxiosError } from "axios";
import { apiRoutesPortalMasters } from "@/utils/api";

type Props = {
	open: boolean;
	onClose: () => void;
	onSuccess?: (message: string) => void;
};

type EtrackResponse = {
	status: string;
	tran_date: string;
	company_id: number;
	source_table: string;
	fetched: number;
	inserted: number;
	duplicates: number;
};

function getCoId(): string {
	if (typeof window === "undefined") return "";
	const sel = localStorage.getItem("sidebar_selectedCompany");
	return sel ? JSON.parse(sel).co_id : "";
}

export default function BioAttEtrackDialog({ open, onClose, onSuccess }: Props) {
	const [tranDate, setTranDate] = useState<string>(() =>
		new Date().toISOString().slice(0, 10),
	);
	const [companyId, setCompanyId] = useState<string>("2");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [result, setResult] = useState<EtrackResponse | null>(null);

	useEffect(() => {
		if (open) {
			setTranDate(new Date().toISOString().slice(0, 10));
			setCompanyId("2");
			setError(null);
			setResult(null);
			setBusy(false);
		}
	}, [open]);

	const handleClose = useCallback(() => {
		if (busy) return;
		onClose();
	}, [busy, onClose]);

	const handleTransfer = useCallback(async () => {
		if (!tranDate) {
			setError("Date is required");
			return;
		}
		const co_id = getCoId();
		if (!co_id) {
			setError("No company selected");
			return;
		}
		setBusy(true);
		setError(null);
		setResult(null);
		try {
			const url = `${apiRoutesPortalMasters.BIO_ATT_ETRACK}?co_id=${encodeURIComponent(
				co_id,
			)}`;
			const resp = await axios.post<EtrackResponse>(
				url,
				{ tran_date: tranDate, company_id: Number(companyId) || 2 },
				{ withCredentials: true },
			);
			setResult(resp.data);
			onSuccess?.(
				`Etrack: fetched ${resp.data.fetched}, inserted ${resp.data.inserted}, duplicates ${resp.data.duplicates}.`,
			);
		} catch (err) {
			const ax = err as AxiosError<{ detail?: string }>;
			setError(
				ax.response?.data?.detail ||
					ax.message ||
					"Etrack transfer failed",
			);
		} finally {
			setBusy(false);
		}
	}, [tranDate, companyId, onSuccess]);

	return (
		<Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
			<DialogTitle>Etrack Data Transfer</DialogTitle>
			<DialogContent dividers>
				<Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
					<TextField
						type="date"
						label="Transfer Date"
						size="small"
						value={tranDate}
						onChange={(e) => setTranDate(e.target.value)}
						slotProps={{ inputLabel: { shrink: true } }}
						disabled={busy}
						fullWidth
					/>
					<TextField
						type="number"
						label="Company Id"
						size="small"
						value={companyId}
						onChange={(e) => setCompanyId(e.target.value)}
						disabled={busy}
						slotProps={{ input: { readOnly: true } }}
						fullWidth
					/>
					<Typography variant="caption" color="text.secondary">
						Source table is picked automatically:
						<br />
						<code>
							DeviceLogs_{Number((tranDate || "").slice(5, 7)) || "?"}_
							{(tranDate || "").slice(0, 4) || "????"}
						</code>
					</Typography>
					{error && <Alert severity="error">{error}</Alert>}
					{result && (
						<Alert severity="success">
							Source: <code>{result.source_table}</code>
							<br />
							Fetched: {result.fetched}, Inserted: {result.inserted},
							Duplicates: {result.duplicates}
						</Alert>
					)}
				</Box>
			</DialogContent>
			<DialogActions>
				<Button onClick={handleClose} disabled={busy}>
					Close
				</Button>
				<Button variant="contained" onClick={handleTransfer} disabled={busy}>
					{busy ? "Transferring..." : "Transfer"}
				</Button>
			</DialogActions>
		</Dialog>
	);
}
