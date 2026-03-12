/**
 * Tests for the sales invoice field gap remediation (frontend).
 * Covers: factories, mappers, calculations — validating new fields,
 * GST breakup, TCS removal, and dormant field activation.
 */
import { describe, it, expect } from "vitest";
import { buildDefaultFormValues, createBlankLine } from "./salesInvoiceFactories";
import { mapInvoiceDetailsToFormValues } from "./salesInvoiceMappers";
import { calculateInvoiceTotals, calculateLineTax, calculateLineAmount, calculateDiscountAmount } from "./salesInvoiceCalculations";

// ---------------------------------------------------------------------------
// 1. Factory tests
// ---------------------------------------------------------------------------
describe("buildDefaultFormValues", () => {
	const defaults = buildDefaultFormValues();

	it("should include new dormant fields with empty string defaults", () => {
		const newFields = [
			"due_date", "type_of_sale", "tax_id",
			"container_no", "contract_no", "contract_date",
			"consignment_no", "consignment_date",
			"transporter_name", "transporter_address",
			"transporter_state_code", "transporter_state_name",
			"broker", "billing_to", "shipping_to",
		];
		for (const field of newFields) {
			expect(defaults).toHaveProperty(field);
			expect(defaults[field as keyof typeof defaults]).toBe("");
		}
	});

	it("should NOT include TCS fields", () => {
		const keys = Object.keys(defaults);
		expect(keys).not.toContain("tcs_percentage");
		expect(keys).not.toContain("tcs_amount");
	});

	it("should still include original fields", () => {
		expect(defaults.branch).toBe("");
		expect(defaults.party).toBe("");
		expect(defaults.date).toBeTruthy(); // today's date
	});
});

describe("createBlankLine", () => {
	it("should create a line with a unique id", () => {
		const line1 = createBlankLine();
		const line2 = createBlankLine();
		expect(line1.id).not.toBe(line2.id);
	});

	it("should have empty string for item and quantity", () => {
		const line = createBlankLine();
		expect(line.item).toBe("");
		expect(line.quantity).toBe("");
	});
});

// ---------------------------------------------------------------------------
// 2. Mapper tests
// ---------------------------------------------------------------------------
describe("mapInvoiceDetailsToFormValues", () => {
	const defaults = buildDefaultFormValues();

	it("should map new header fields from API response", () => {
		const apiResponse = {
			branch: "1",
			invoiceDate: "2025-06-01",
			party: "10",
			brokerId: 5,
			billingToId: 7,
			shippingToId: 8,
			transporterNameStored: "ABC Transport",
			transporterAddress: "123 Main St",
			transporterStateCode: "29",
			transporterStateName: "Karnataka",
			dueDate: "2025-07-01",
			typeOfSale: "Domestic",
			taxId: 3,
			containerNo: "CONT123",
			contractNo: 456,
			contractDate: "2025-05-01",
			consignmentNo: "CG789",
			consignmentDate: "2025-06-02",
		};

		const result = mapInvoiceDetailsToFormValues(apiResponse, defaults);

		expect(result.broker).toBe("5");
		expect(result.billing_to).toBe("7");
		expect(result.shipping_to).toBe("8");
		expect(result.transporter_name).toBe("ABC Transport");
		expect(result.transporter_address).toBe("123 Main St");
		expect(result.transporter_state_code).toBe("29");
		expect(result.transporter_state_name).toBe("Karnataka");
		expect(result.due_date).toBe("2025-07-01");
		expect(result.type_of_sale).toBe("Domestic");
		expect(result.tax_id).toBe("3");
		expect(result.container_no).toBe("CONT123");
		expect(result.contract_no).toBe("456");
		expect(result.consignment_no).toBe("CG789");
	});

	it("should use defaults when API fields are missing", () => {
		const result = mapInvoiceDetailsToFormValues({}, defaults);

		expect(result.broker).toBe("");
		expect(result.billing_to).toBe("");
		expect(result.shipping_to).toBe("");
		expect(result.transporter_name).toBe("");
		expect(result.due_date).toBe("");
		expect(result.type_of_sale).toBe("");
		expect(result.tax_id).toBe("");
		expect(result.container_no).toBe("");
	});

	it("should NOT include any TCS fields in output", () => {
		const result = mapInvoiceDetailsToFormValues({}, defaults);
		const keys = Object.keys(result);
		const tcsKeys = keys.filter((k) => k.toLowerCase().includes("tcs"));
		expect(tcsKeys).toHaveLength(0);
	});
});

// ---------------------------------------------------------------------------
// 3. Calculation tests
// ---------------------------------------------------------------------------
describe("calculateInvoiceTotals", () => {
	it("should compute totals without TCS", () => {
		const lines = [
			{ netAmount: 1000, gstTotal: 180 },
			{ netAmount: 2000, gstTotal: 360 },
		];

		const result = calculateInvoiceTotals(lines, 50, -5);

		expect(result.grossAmount).toBe(3000);
		expect(result.totalGST).toBe(540);
		expect(result.netAmount).toBe(3000 + 540 + 50 - 5); // 3585
	});

	it("should not have tcsAmount property", () => {
		const result = calculateInvoiceTotals([], 0, 0);
		expect(result).not.toHaveProperty("tcsAmount");
	});

	it("should return zeros for empty lines", () => {
		const result = calculateInvoiceTotals([]);
		expect(result.grossAmount).toBe(0);
		expect(result.totalGST).toBe(0);
		expect(result.netAmount).toBe(0);
	});
});

describe("calculateLineTax", () => {
	it("should split into CGST/SGST for intra-state (same state)", () => {
		const result = calculateLineTax(1000, 18, "29", "29");
		expect(result.igstAmount).toBe(0);
		expect(result.cgstAmount).toBe(90);
		expect(result.sgstAmount).toBe(90);
		expect(result.gstTotal).toBe(180);
	});

	it("should use IGST for inter-state (different state)", () => {
		const result = calculateLineTax(1000, 18, "29", "07");
		expect(result.igstAmount).toBe(180);
		expect(result.cgstAmount).toBe(0);
		expect(result.sgstAmount).toBe(0);
		expect(result.gstTotal).toBe(180);
	});

	it("should return zeros when tax percentage is 0", () => {
		const result = calculateLineTax(1000, 0, "29", "29");
		expect(result.gstTotal).toBe(0);
	});
});

describe("calculateDiscountAmount", () => {
	it("should calculate percentage discount", () => {
		// discountType 2 = percentage (via isPercentageDiscountType)
		const result = calculateDiscountAmount(10, 100, 2, 10);
		expect(result).toBe(100); // 10% of 100 * 10 qty
	});

	it("should return 0 when no discount type", () => {
		expect(calculateDiscountAmount(10, 100, undefined, 10)).toBe(0);
	});

	it("should return 0 when qty is 0", () => {
		expect(calculateDiscountAmount(0, 100, 1, 10)).toBe(0);
	});
});

describe("calculateLineAmount", () => {
	it("should subtract discount from base amount", () => {
		const result = calculateLineAmount(10, 100, 1, 5); // amount discount = 5 * 10 = 50
		expect(result.netAmount).toBe(950);
		expect(result.discountedRate).toBeCloseTo(95);
	});

	it("should not go below zero", () => {
		const result = calculateLineAmount(1, 100, 1, 200); // discount > base
		expect(result.netAmount).toBe(0);
	});
});
