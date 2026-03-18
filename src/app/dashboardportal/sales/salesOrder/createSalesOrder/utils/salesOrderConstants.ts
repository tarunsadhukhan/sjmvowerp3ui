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
export const EMPTY_INVOICE_TYPES: never[] = [];
export const EMPTY_MUKAM_OPTIONS: never[] = [];
export const EMPTY_SETUP_PARAMS: { branchId?: string } = {};

// Invoice type IDs
export const REGULAR_TYPE_ID = "1";
export const HESSIAN_TYPE_ID = "2";
export const JUTE_YARN_TYPE_ID = "3";
export const JUTE_TYPE_ID = "4";
export const GOVT_SKG_TYPE_ID = "5";

// Type-checking helpers
export const isHessianOrder = (id?: string | number | null): boolean => {
	if (id == null || id === "") return false;
	return String(id) === HESSIAN_TYPE_ID;
};

export const isJuteYarnOrder = (id?: string | number | null): boolean => {
	if (id == null || id === "") return false;
	return String(id) === JUTE_YARN_TYPE_ID;
};

export const isJuteOrder = (id?: string | number | null): boolean => {
	if (id == null || id === "") return false;
	return String(id) === JUTE_TYPE_ID;
};

export const isGovtSkgOrder = (id?: string | number | null): boolean => {
	if (id == null || id === "") return false;
	return String(id) === GOVT_SKG_TYPE_ID;
};
