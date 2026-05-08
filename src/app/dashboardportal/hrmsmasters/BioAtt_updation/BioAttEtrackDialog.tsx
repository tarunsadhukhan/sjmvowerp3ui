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

type EtrackTableSummary = {
	table: string;
	from_log_id: number;
	fetched: number;
	inserted: number;
};

type EtrackResponse = {
	status: string;
	from_log_date: string | null;
	from_log_id: number;
	tran_date: string;
	company_id: number;
	source_table: string;
	tables: EtrackTableSummary[];
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
	const todayIso = new Date().toISOString().slice(0, 10);
	const [tranDate] = useState<string>(todayIso);
	const [companyId, setCompanyId] = useState<string>("2");
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [result, setResult] = useState<EtrackResponse | null>(null);

	useEffect(() => {
		if (open) {
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
				{ company_id: Number(companyId) || 2 },
				{ withCredentials: true },
			);
			setResult(resp.data);
			onSuccess?.(
				`Etrack: fetched ${resp.data.fetched}, inserted ${resp.data.inserted}, duplicates ${resp.data.duplicates} across ${resp.data.tables.length} table(s).`,
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
	}, [companyId, onSuccess]);

	return (
		<Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
			<DialogTitle>Etrack Data Transfer</DialogTitle>
			<DialogContent dividers>
				<Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
					<TextField
						type="date"
						label="Transfer Date (auto)"
						size="small"
						value={tranDate}
						slotProps={{ inputLabel: { shrink: true }, input: { readOnly: true } }}
						disabled
						fullWidth
						helperText="Range is auto-derived from the latest record in bio_attendance_table up to today."
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
					{error && <Alert severity="error">{error}</Alert>}
					{result && (
						<Alert severity="success">
							<Typography variant="body2" sx={{ fontWeight: 600 }}>
								From: {result.from_log_date ?? "(empty table)"} · last log id{" "}
								{result.from_log_id}
							</Typography>
							<Typography variant="body2">
								Up to: {result.tran_date}
							</Typography>
							<Box component="ul" sx={{ pl: 2.5, my: 1 }}>
								{result.tables.map((t) => (
									<li key={t.table}>
										<code>{t.table}</code>
										{t.from_log_id > 0 ? ` (> ${t.from_log_id})` : " (full month)"}{" "}
										— fetched {t.fetched}, inserted {t.inserted}
									</li>
								))}
							</Box>
							<Typography variant="body2">
								Total: fetched {result.fetched}, inserted {result.inserted},
								duplicates {result.duplicates}
							</Typography>
						</Alert>
					)}
				</Box>
			</DialogContent>
			<DialogActions>
				<Button onClick={handleClose} disabled={busy}>
					Close
				</Button>
				<Button variant="contained" onClick={handleTransfer} disabled={busy}>
					{busy ? "Transferring..." : "Apply"}
				</Button>
			</DialogActions>
		</Dialog>
	);
}
