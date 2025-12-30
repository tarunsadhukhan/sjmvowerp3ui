import type { EditableLineItem } from "../types/issueTypes";

let lineIdSeed = 0;

/**
 * Generates a unique identifier for a line item.
 */
export const generateLineId = (): string => {
	lineIdSeed += 1;
	return `issue-line-${lineIdSeed}`;
};

/**
 * Creates a blank line item with default empty values.
 */
export const createBlankLine = (): EditableLineItem => ({
	id: generateLineId(),
	itemGroup: "",
	item: "",
	uom: "",
	quantity: "",
	expenseType: "",
	costFactor: "",
	machine: "",
	inwardDtlId: "",
	rate: "",
	availableQty: "",
	srNo: "",
	remarks: "",
});

/**
 * Builds default form values for a new issue.
 */
export const buildDefaultFormValues = (): Record<string, unknown> => ({
	branch: "",
	department: "",
	date: new Date().toISOString().slice(0, 10),
	issue_no: "",
	project: "",
	issued_to: "",
	req_by: "",
	internal_note: "",
});

/**
 * Checks if a line item has any user-entered data.
 */
export const lineHasAnyData = (line: EditableLineItem): boolean =>
	Boolean(
		line.itemGroup ||
		line.item ||
		line.uom ||
		line.quantity ||
		line.inwardDtlId ||
		line.remarks
	);

/**
 * Checks if a line item is complete and ready for submission.
 */
export const lineIsComplete = (line: EditableLineItem): boolean => {
	const qty = Number(line.quantity);
	return Boolean(line.item && line.uom && Number.isFinite(qty) && qty > 0);
};
