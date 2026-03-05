import type { ApprovalStatusId } from "@/components/ui/transaction";
import type {
	CustomerRecord,
	TransporterRecord,
	BrokerRecord,
	ApprovedDeliveryOrderRecord,
	InvoiceTypeRecord,
	ItemGroupRecord,
	Option,
	EditableLineItem,
} from "../types/salesInvoiceTypes";

export const DISCOUNT_TYPE = {
	PERCENTAGE: 1,
	AMOUNT: 2,
} as const;

export type DiscountType = (typeof DISCOUNT_TYPE)[keyof typeof DISCOUNT_TYPE];

export const INVOICE_STATUS_IDS = {
	DRAFT: 21,
	OPEN: 1,
	PENDING_APPROVAL: 20,
	APPROVED: 3,
	REJECTED: 4,
	CLOSED: 5,
	CANCELLED: 6,
} as const satisfies Record<string, ApprovalStatusId>;

export const INVOICE_STATUS_LABELS: Record<ApprovalStatusId, string> = {
	[INVOICE_STATUS_IDS.DRAFT]: "Draft",
	[INVOICE_STATUS_IDS.OPEN]: "Open",
	[INVOICE_STATUS_IDS.PENDING_APPROVAL]: "Pending Approval",
	[INVOICE_STATUS_IDS.APPROVED]: "Approved",
	[INVOICE_STATUS_IDS.REJECTED]: "Rejected",
	[INVOICE_STATUS_IDS.CLOSED]: "Closed",
	[INVOICE_STATUS_IDS.CANCELLED]: "Cancelled",
};

export const EMPTY_CUSTOMERS: ReadonlyArray<CustomerRecord> = Object.freeze([]);
export const EMPTY_TRANSPORTERS: ReadonlyArray<TransporterRecord> = Object.freeze([]);
export const EMPTY_BROKERS: ReadonlyArray<BrokerRecord> = Object.freeze([]);
export const EMPTY_APPROVED_DELIVERY_ORDERS: ReadonlyArray<ApprovedDeliveryOrderRecord> = Object.freeze([]);
export const EMPTY_ITEM_GROUPS: ReadonlyArray<ItemGroupRecord> = Object.freeze([]);
export const EMPTY_INVOICE_TYPES: ReadonlyArray<InvoiceTypeRecord> = Object.freeze([]);
export const EMPTY_OPTIONS: ReadonlyArray<Option> = Object.freeze([]);
export const EMPTY_LINE_ITEMS: ReadonlyArray<EditableLineItem> = Object.freeze([]);

export const EMPTY_SETUP_PARAMS: Readonly<{ branchId?: string }> = Object.freeze({});

export const REGULAR_INVOICE_TYPE_ID = "1";

export const isJuteInvoice = (invoiceTypeId?: string | number | null): boolean => {
	if (invoiceTypeId == null || invoiceTypeId === "") return false;
	return String(invoiceTypeId) !== REGULAR_INVOICE_TYPE_ID;
};

export const isPercentageDiscountType = (type?: number | null): type is typeof DISCOUNT_TYPE.PERCENTAGE =>
	type === DISCOUNT_TYPE.PERCENTAGE;

export const isAmountDiscountType = (type?: number | null): type is typeof DISCOUNT_TYPE.AMOUNT =>
	type === DISCOUNT_TYPE.AMOUNT;
