import * as React from "react";
import type { TransactionLineColumn } from "@/components/ui/transaction";
import { MoistureButton } from "../components/MoistureReadingDialog";
import type { InspectionLineItem } from "../types/materialInspectionTypes";

type UseMaterialInspectionLineItemsParams = {
	onOpenMoistureDialog: (lineItemId: string) => void;
};

export function useMaterialInspectionLineItems({
	onOpenMoistureDialog,
}: UseMaterialInspectionLineItemsParams): TransactionLineColumn<InspectionLineItem>[] {
	return React.useMemo(
		(): TransactionLineColumn<InspectionLineItem>[] => [
			{
				id: "actualItemName",
				header: "Actual Item",
				width: "1.6fr",
				renderCell: ({ item }) => (
					<span className="text-xs">{item.actualItemName || "-"}</span>
				),
			},
			{
				id: "actualQualityName",
				header: "Actual Quality",
				width: "1.4fr",
				renderCell: ({ item }) => (
					<span className="text-xs">{item.actualQualityName || "-"}</span>
				),
			},
			{
				id: "actualQty",
				header: "Actual Qty",
				width: "0.8fr",
				align: "right",
				renderCell: ({ item }) => (
					<span className="text-xs">
						{item.actualQty != null ? item.actualQty.toFixed(2) : "-"}
					</span>
				),
			},
			{
				id: "actualWeight",
				header: "Actual Wt",
				width: "0.8fr",
				align: "right",
				renderCell: ({ item }) => (
					<span className="text-xs">
						{item.actualWeight != null ? item.actualWeight.toFixed(2) : "-"}
					</span>
				),
			},
			{
				id: "allowableMoisture",
				header: "Allowable Moisture (%)",
				width: "1fr",
				align: "right",
				renderCell: ({ item }) => (
					<span className="text-xs">
						{item.allowableMoisture != null ? item.allowableMoisture.toFixed(2) : "-"}
					</span>
				),
			},
			{
				id: "averageMoisture",
				header: "Actual Moisture (%)",
				width: "1fr",
				align: "right",
				renderCell: ({ item }) => (
					<span className="text-xs">
						{item.averageMoisture != null ? item.averageMoisture.toFixed(2) : "Not Set"}
					</span>
				),
			},
			{
				id: "actions",
				header: "Actions",
				width: "1fr",
				renderCell: ({ item }) => (
					<MoistureButton onClick={() => onOpenMoistureDialog(item.id)} />
				),
			},
		],
		[onOpenMoistureDialog],
	);
}

