import type { ApprovalStatusId } from "@/components/ui/transaction";
import type {
	DepartmentRecord,
	EditableLineItem,
	ExpenseRecord,
	ItemGroupRecord,
	Option,
	ProjectRecord,
} from "../types/indentTypes";

/**
 * Standard Indent status identifiers used throughout the workflow.
 */
export const INDENT_STATUS_IDS = {
	DRAFT: 21,
	OPEN: 1,
	PENDING_APPROVAL: 20,
	APPROVED: 3,
	REJECTED: 4,
	CLOSED: 5,
	CANCELLED: 6,
} as const satisfies Record<string, ApprovalStatusId>;

/**
 * Friendly labels for each Indent status identifier.
 */
export const INDENT_STATUS_LABELS: Record<ApprovalStatusId, string> = {
	[INDENT_STATUS_IDS.DRAFT]: "Draft",
	[INDENT_STATUS_IDS.OPEN]: "Open",
	[INDENT_STATUS_IDS.PENDING_APPROVAL]: "Pending Approval",
	[INDENT_STATUS_IDS.APPROVED]: "Approved",
	[INDENT_STATUS_IDS.REJECTED]: "Rejected",
	[INDENT_STATUS_IDS.CLOSED]: "Closed",
	[INDENT_STATUS_IDS.CANCELLED]: "Cancelled",
};

/**
 * Indent type options for the header dropdown.
 * 
 * IMPORTANT: This must stay in sync with the backend:
 *   vowerp3be/src/procurement/constants.py
 * 
 * Labels match values for 100% frontend-backend consistency.
 */
export const INDENT_TYPES = {
	Regular: { id: 1, label: "Regular", value: "Regular" },
	Open: { id: 2, label: "Open", value: "Open" },
	BOM: { id: 3, label: "BOM", value: "BOM" },
} as const;

export const INDENT_TYPE_OPTIONS: ReadonlyArray<Option> = Object.freeze(
	Object.values(INDENT_TYPES).map(({ label, value }) => ({ label, value }))
);

export const VALID_INDENT_TYPE_VALUES = Object.keys(INDENT_TYPES) as Array<keyof typeof INDENT_TYPES>;

/**
 * Immutable fallbacks to avoid recreating empty arrays on every render.
 */
export const EMPTY_DEPARTMENTS: ReadonlyArray<DepartmentRecord> = Object.freeze([]);
export const EMPTY_PROJECTS: ReadonlyArray<ProjectRecord> = Object.freeze([]);
export const EMPTY_EXPENSES: ReadonlyArray<ExpenseRecord> = Object.freeze([]);
export const EMPTY_ITEM_GROUPS: ReadonlyArray<ItemGroupRecord> = Object.freeze([]);
export const EMPTY_OPTIONS: ReadonlyArray<Option> = Object.freeze([]);
export const EMPTY_LINE_ITEMS: ReadonlyArray<EditableLineItem> = Object.freeze([]);

/**
 * Default empty params used by setup hooks to prevent needless re-renders.
 */
export const EMPTY_SETUP_PARAMS: Readonly<{ branchId?: string }> = Object.freeze({});

/**
 * Expense type IDs allowed for "Open" indent type.
 */
export const OPEN_INDENT_ALLOWED_EXPENSE_IDS = new Set(["3", "5", "6"]);
