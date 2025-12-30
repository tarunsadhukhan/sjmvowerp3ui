/**
 * Issue-specific shared TypeScript definitions.
 * Keeping these in a dedicated module makes it easier to reuse them
 * across hooks, utils, and components without circular dependencies.
 */

/**
 * Basic label/value tuple used across Issue forms.
 */
export type Option = {
	label: string;
	value: string;
};

/**
 * Normalized representation of an Issue line item used in the UI.
 * Includes inward_dtl_id for SR-wise inventory tracking.
 */
export type EditableLineItem = {
	id: string;
	itemGroup: string;
	item: string;
	uom: string;
	quantity: string;
	expenseType: string;
	costFactor: string;
	machine: string;
	inwardDtlId: string; // SR line item reference for price tracking
	rate: string; // Rate from inward for reference
	availableQty: string; // Available qty from selected SR
	srNo: string; // SR number for display
	remarks: string;
};

/**
 * Department record as consumed by the Issue UI.
 */
export type DepartmentRecord = {
	id: string;
	name: string;
	branchId?: string;
};

/**
 * Project record as consumed by the Issue UI.
 */
export type ProjectRecord = {
	id: string;
	name: string;
	branchId?: string;
};

/**
 * Expense type option displayed in Issue line items.
 */
export type ExpenseRecord = {
	id: string;
	name: string;
};

/**
 * Item group option displayed in line items table.
 */
export type ItemGroupRecord = {
	id: string;
	label: string;
};

/**
 * Cost factor record for cost allocation.
 */
export type CostFactorRecord = {
	id: string;
	name: string;
	branchId?: string;
	deptId?: string;
};

/**
 * Machine record for machine-based consumption tracking.
 */
export type MachineRecord = {
	id: string;
	name: string;
	departmentId?: string;
	mechCode?: string;
};

/**
 * Available inventory item from inward details.
 */
export type AvailableInventoryItem = {
	inwardDtlId: string;
	inwardId: string;
	srNo: string; // Stores Receipt number
	inwardDate: string;
	branchId: string;
	branchName: string;
	itemId: string;
	itemName: string;
	itemCode: string;
	itemGrpId: string;
	itemGrpName: string;
	itemMakeId?: string;
	itemMakeName?: string;
	uomId: string;
	uomName: string;
	approvedQty: number;
	availableQty: number;
	rate: number;
	warehouseId?: string;
	warehouseName?: string;
};

/**
 * Item option metadata including default UOM info.
 */
export type ItemOption = Option & {
	defaultUomId?: string;
	defaultUomLabel?: string;
};

/**
 * Cached metadata for an item group to avoid redundant network calls.
 */
export type ItemGroupCacheEntry = {
	items: ItemOption[];
	makes: Option[];
	uomsByItemId: Record<string, Option[]>;
	itemLabelById: Record<string, string>;
	makeLabelById: Record<string, string>;
	uomLabelByItemId: Record<string, Record<string, string>>;
};

/**
 * Normalized setup data returned by `fetchIssueSetup1`.
 */
export type IssueSetupData = {
	departments: DepartmentRecord[];
	projects: ProjectRecord[];
	expenses: ExpenseRecord[];
	itemGroups: ItemGroupRecord[];
};

/**
 * Label resolvers used in the Issue UI.
 */
export type IssueLabelResolvers = {
	department: (id: string) => string;
	project: (id: string) => string;
	expense: (id: string) => string;
	itemGroup: (id: string) => string;
	item: (groupId: string, itemId: string) => string;
	uom: (groupId: string, itemId: string, uomId: string) => string;
	costFactor: (id: string) => string;
	machine: (id: string) => string;
};

/**
 * Issue details returned from API (normalized).
 */
export type IssueDetails = {
	id: number | string;
	issueId?: number;
	issuePassNo?: string;
	date?: string;
	branchId?: number;
	branchName?: string;
	deptId?: number;
	deptName?: string;
	projectId?: number;
	projectName?: string;
	issuedTo?: string;
	reqBy?: string;
	internalNote?: string;
	status?: string;
	statusId?: number;
	createdBy?: string;
	createdAt?: string;
	updatedBy?: string;
	updatedAt?: string;
	lineItems?: IssueLineDetails[];
};

/**
 * Issue line item details from API (normalized).
 */
export type IssueLineDetails = {
	id: number | string;
	itemId?: number;
	itemName?: string;
	itemCode?: string;
	itemGroupId?: number;
	itemGroupName?: string;
	uomId?: number;
	uomName?: string;
	qty?: number;
	rate?: number;
	expenseId?: number;
	expenseTypeName?: string;
	costFactorId?: number;
	costFactorName?: string;
	machineId?: number;
	machineName?: string;
	inwardDtlId?: number;
	srNo?: string;
	remarks?: string;
};
