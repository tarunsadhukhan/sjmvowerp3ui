"use client";

import React from "react";
import Link from "next/link";
import { Box, Button, Typography } from "@mui/material";

export default function IndentPage() {
	return (
		<Box sx={{ p: 4 }}>
			<Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
				<Typography variant="h4">Indent</Typography>
				<Button component={Link} href="/dashboardportal/procurement/indent/createIndent" variant="contained">Create</Button>
			</Box>
		</Box>
	);
}
