import React from "react";
import type { Schema, Field } from "@/components/ui/muiform";

export type UseSalesOrderGovtskgSchemaParams = {
	mode: "create" | "edit" | "view";
	headerFieldsDisabled: boolean;
};

export const useSalesOrderGovtskgSchema = ({
	mode,
	headerFieldsDisabled,
}: UseSalesOrderGovtskgSchemaParams): Schema =>
	React.useMemo(() => {
		const disabled = headerFieldsDisabled;
		const fields: Field[] = [
			{ name: "govtskg_pcso_no", label: "PCSO No.", type: "text", disabled, grid: { xs: 12, md: 4 } },
			{ name: "govtskg_pcso_date", label: "PCSO Date", type: "date", disabled, grid: { xs: 12, md: 4 } },
			{ name: "govtskg_admin_office", label: "Administrative Office Address", type: "textarea", disabled, grid: { xs: 12 } },
			{ name: "govtskg_rail_head", label: "Destination Rail Head", type: "text", disabled, grid: { xs: 12, md: 4 } },
			{ name: "govtskg_loading_point", label: "Loading Point", type: "text", disabled, grid: { xs: 12, md: 4 } },
		];
		return { fields } satisfies Schema;
	}, [mode, headerFieldsDisabled]);
