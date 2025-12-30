import type { ApprovalStatusId } from "@/components/ui/transaction";
import type { SRLineItem, Option } from "../types/srTypes";

/**
 * Standard SR status identifiers used throughout the workflow.
 */
export const SR_STATUS_IDS = {
	DRAFT: 21,
	OPEN: 1,
	PENDING_APPROVAL: 20,
	APPROVED: 3,
	REJECTED: 4,
} as const satisfies Record<string, ApprovalStatusId>;

/**
 * Friendly labels for each SR status identifier.
 */
export const SR_STATUS_LABELS: Partial<Record<ApprovalStatusId, string>> = {
	[SR_STATUS_IDS.DRAFT]: "Draft",
	[SR_STATUS_IDS.OPEN]: "Open",
	[SR_STATUS_IDS.PENDING_APPROVAL]: "Pending Approval",
	[SR_STATUS_IDS.APPROVED]: "Approved",
	[SR_STATUS_IDS.REJECTED]: "Rejected",
};

/**
 * Immutable fallbacks to avoid recreating empty arrays on every render.
 */
export const EMPTY_LINE_ITEMS: ReadonlyArray<SRLineItem> = Object.freeze([]);
export const EMPTY_OPTIONS: ReadonlyArray<Option> = Object.freeze([]);

/**
 * Get status color for chips.
 */
export const getStatusColor = (
	statusId: number,
): "default" | "primary" | "secondary" | "success" | "error" | "warning" | "info" => {
	switch (statusId) {
		case SR_STATUS_IDS.DRAFT:
			return "default";
		case SR_STATUS_IDS.OPEN:
			return "info";
		case SR_STATUS_IDS.PENDING_APPROVAL:
			return "warning";
		case SR_STATUS_IDS.APPROVED:
			return "success";
		case SR_STATUS_IDS.REJECTED:
			return "error";
		default:
			return "default";
	}
};
