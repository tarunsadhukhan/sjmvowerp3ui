import type { ApprovalStatusId } from "@/components/ui/transaction";
import type {
	EditableLineItem,
	ItemGroupRecord,
	Option,
	SupplierRecord,
} from "../types/inwardTypes";

/**
 * Standard Inward status identifiers used throughout the workflow.
 */
export const INWARD_STATUS_IDS = {
	DRAFT: 21,
	OPEN: 1,
	PENDING_APPROVAL: 20,
	APPROVED: 3,
	REJECTED: 4,
	CLOSED: 5,
	CANCELLED: 6,
} as const satisfies Record<string, ApprovalStatusId>;

/**
 * Friendly labels for each Inward status identifier.
 */
export const INWARD_STATUS_LABELS: Record<ApprovalStatusId, string> = {
	[INWARD_STATUS_IDS.DRAFT]: "Draft",
	[INWARD_STATUS_IDS.OPEN]: "Open",
	[INWARD_STATUS_IDS.PENDING_APPROVAL]: "Pending Approval",
	[INWARD_STATUS_IDS.APPROVED]: "Approved",
	[INWARD_STATUS_IDS.REJECTED]: "Rejected",
	[INWARD_STATUS_IDS.CLOSED]: "Closed",
	[INWARD_STATUS_IDS.CANCELLED]: "Cancelled",
};

/**
 * Immutable fallbacks to avoid recreating empty arrays on every render.
 */
export const EMPTY_SUPPLIERS: ReadonlyArray<SupplierRecord> = Object.freeze([]);
export const EMPTY_ITEM_GROUPS: ReadonlyArray<ItemGroupRecord> = Object.freeze([]);
export const EMPTY_OPTIONS: ReadonlyArray<Option> = Object.freeze([]);
export const EMPTY_LINE_ITEMS: ReadonlyArray<EditableLineItem> = Object.freeze([]);

/**
 * Default empty params used by setup hooks to prevent needless re-renders.
 */
export const EMPTY_SETUP_PARAMS: Readonly<{ branchId?: string }> = Object.freeze({});
