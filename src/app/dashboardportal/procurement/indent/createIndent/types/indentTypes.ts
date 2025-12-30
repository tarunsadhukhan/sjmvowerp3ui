/**
 * Indent-specific shared TypeScript definitions.
 * Keeping these in a dedicated module makes it easier to reuse them
 * across hooks, utils, and components without circular dependencies.
 */

/**
 * Basic label/value tuple used across Indent forms.
 */
export type Option = {
	label: string;
	value: string;
};

/**
 * Normalized representation of an Indent line item used in the UI.
 */
export type EditableLineItem = {
	id: string;
	department: string;
	itemGroup: string;
	item: string;
	itemMake: string;
	quantity: string;
	uom: string;
	remarks: string;
};

/**
 * Department record as consumed by the Indent UI.
 */
export type DepartmentRecord = {
	id: string;
	name: string;
	branchId?: string;
};

/**
 * Project record as consumed by the Indent UI.
 */
export type ProjectRecord = {
	id: string;
	name: string;
	branchId?: string;
};

/**
 * Expense type option displayed in Indent header.
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
 * Normalized setup data returned by `fetchIndentSetup1`.
 */
export type IndentSetupData = {
	departments: DepartmentRecord[];
	projects: ProjectRecord[];
	expenses: ExpenseRecord[];
	itemGroups: ItemGroupRecord[];
};

/**
 * Label resolvers used in the Indent UI.
 */
export type IndentLabelResolvers = {
	department: (id: string) => string;
	itemGroup: (id: string) => string;
	item: (groupId: string, itemId: string) => string;
	itemMake: (groupId: string, makeId: string) => string;
	uom: (groupId: string, itemId: string, uomId: string) => string;
};
