"use client";
import React, { useCallback, useRef, useState } from "react";
import {
	Alert,
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Typography,
} from "@mui/material";
import axios, { AxiosError } from "axios";
import { apiRoutesPortalMasters } from "@/utils/api";

type Props = {
	open: boolean;
	onClose: () => void;
	/** Called immediately after the server accepts the upload. */
	onSubmitted?: (info: { jobId: string; queued: number }) => void;
};

function getCoId(): string {
	if (typeof window === "undefined") return "";
	const sel = localStorage.getItem("sidebar_selectedCompany");
	return sel ? JSON.parse(sel).co_id : "";
}

export default function BioAttUploadDialog({ open, onClose, onSubmitted }: Props) {
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const reset = useCallback(() => {
		setSelectedFile(null);
		setError(null);
		setBusy(false);
		if (fileInputRef.current) fileInputRef.current.value = "";
	}, []);

	const handleClose = useCallback(() => {
		if (busy) return;
		reset();
		onClose();
	}, [busy, onClose, reset]);

	const handlePick = () => fileInputRef.current?.click();

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setError(null);
		const f = e.target.files?.[0] ?? null;
		setSelectedFile(f);
	};

	const handleUpload = useCallback(async () => {
		if (!selectedFile) {
			setError("Please choose a CSV/Excel file");
			return;
		}
		const co_id = getCoId();
		if (!co_id) {
			setError("No company selected");
			return;
		}

		setBusy(true);
		setError(null);
		try {
			const formData = new FormData();
			formData.append("file", selectedFile);

			const url = `${apiRoutesPortalMasters.BIO_ATT_UPLOAD}?co_id=${encodeURIComponent(co_id)}`;
			const resp = await axios.post<{ job_id: string; queued: number }>(url, formData, {
				withCredentials: true,
				headers: { "x-forwarded-host": "sls.vowerp.co.in" },
				validateStatus: (s) => s >= 200 && s < 500,
			});
			if (resp.status >= 300) {
				const detail =
					(resp.data as unknown as { detail?: string })?.detail ??
					`Upload failed (${resp.status})`;
				setError(detail);
				return;
			}
			const data = resp.data;
			onSubmitted?.({ jobId: data.job_id, queued: data.queued });
			reset();
			onClose();
		} catch (e) {
			const ax = e as AxiosError<{ detail?: string }>;
			setError(ax.response?.data?.detail ?? (e instanceof Error ? e.message : String(e)));
		} finally {
			setBusy(false);
		}
	}, [selectedFile, onSubmitted, onClose, reset]);

	return (
		<Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
			<DialogTitle>Upload Bio Attendance (CSV / Excel)</DialogTitle>
			<DialogContent dividers>
				<Box className="flex flex-col gap-3">
					<Typography variant="body2" color="text.secondary">
						The file is loaded into a staging area first; validation and
						de-duplication then run in the background. Required columns
						(device-export headers also accepted): Employee Code, Employee Name,
						Employee Code In Device, LogDate, Company, Department, Designation,
						Employement type, Direction, Device Name.
					</Typography>

					<Box className="flex items-center gap-2">
						<input
							ref={fileInputRef}
							type="file"
							accept=".csv,.xls,.xlsx"
							style={{ display: "none" }}
							onChange={handleFileChange}
						/>
						<Button variant="outlined" onClick={handlePick} disabled={busy}>
							Choose File
						</Button>
						<Typography variant="body2">
							{selectedFile ? selectedFile.name : "No file chosen"}
						</Typography>
					</Box>

					{error ? <Alert severity="error">{error}</Alert> : null}
				</Box>
			</DialogContent>
			<DialogActions>
				<Button onClick={handleClose} disabled={busy}>
					Close
				</Button>
				<Button
					variant="contained"
					onClick={handleUpload}
					disabled={busy || !selectedFile}
				>
					Upload
				</Button>
			</DialogActions>
		</Dialog>
	);
}
