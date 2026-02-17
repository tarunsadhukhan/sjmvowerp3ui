import type { ApprovalStatusId } from "@/components/ui/transaction";

export const SO_STATUS_IDS = {
	DRAFT: 21 as ApprovalStatusId,
	OPEN: 1 as ApprovalStatusId,
	PENDING_APPROVAL: 20 as ApprovalStatusId,
	APPROVED: 3 as ApprovalStatusId,
	REJECTED: 4 as ApprovalStatusId,
	CLOSED: 5 as ApprovalStatusId,
	CANCELLED: 6 as ApprovalStatusId,
};

export const SO_STATUS_LABELS: Record<number, string> = {
	21: "Draft",
	1: "Open",
	20: "Pending Approval",
	3: "Approved",
	4: "Rejected",
	5: "Closed",
	6: "Cancelled",
};

export const DISCOUNT_MODE = {
	NONE: 0,
	PERCENTAGE: 1,
	FLAT: 2,
} as const;

export const EMPTY_CUSTOMERS: never[] = [];
export const EMPTY_BROKERS: never[] = [];
export const EMPTY_TRANSPORTERS: never[] = [];
export const EMPTY_ITEM_GROUPS: never[] = [];
export const EMPTY_QUOTATIONS: never[] = [];
export const EMPTY_BRANCH_ADDRESSES: never[] = [];
export const EMPTY_SETUP_PARAMS: { branchId?: string } = {};
