/**
 * Tests for useIndentItemValidation hook logic.
 *
 * We test the getQuantityError behavior by rendering the hook with different
 * validation states to verify that backend errors (including has_minmax=false)
 * are correctly surfaced and block item entry.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIndentItemValidation } from "./useIndentItemValidation";

// Mock the service layer
vi.mock("@/utils/indentService", () => ({
	validateItemForIndent: vi.fn(),
}));

import { validateItemForIndent } from "@/utils/indentService";
const mockValidate = vi.mocked(validateItemForIndent);

const defaultParams = {
	branchId: "1",
	indentType: "Regular",
	expenseTypeName: "General",
	expenseTypeId: "1",
};

describe("useIndentItemValidation", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getQuantityError — backend errors take priority", () => {
		it("should return backend error when has_minmax is false (no min/max configured)", async () => {
			const errorMsg =
				"Min/Max stock levels not configured for this item at this branch. Please configure item min/max before raising an indent.";

			mockValidate.mockResolvedValueOnce({
				validation_logic: 1,
				item_id: 10,
				branch_id: 1,
				indent_type: "Regular",
				expense_type_name: "General",
				errors: [errorMsg],
				branch_stock: 0,
				minqty: null,
				maxqty: null,
				min_order_qty: null,
				lead_time: null,
				outstanding_indent_qty: 0,
				has_open_indent: false,
				stock_exceeds_max: false,
				max_indent_qty: null,
				min_indent_qty: null,
				has_minmax: false,
				fy_indent_exists: false,
				fy_indent_no: null,
				fy_duplicate_indent_no: null,
				regular_bom_outstanding: 0,
				forced_qty: null,
				warnings: [],
			});

			const { result } = renderHook(() => useIndentItemValidation(defaultParams));

			// Trigger validation for a line
			await act(async () => {
				await result.current.validateLine("line-1", "10");
			});

			// Should return the backend error
			const err = result.current.getQuantityError("line-1", "5");
			expect(err).toBe(errorMsg);
		});

		it("should return backend error when stock exceeds max", async () => {
			const errorMsg =
				"Branch stock (90) + outstanding indent qty (20) exceeds max qty (100). Cannot create indent.";

			mockValidate.mockResolvedValueOnce({
				validation_logic: 1,
				item_id: 10,
				branch_id: 1,
				indent_type: "Regular",
				expense_type_name: "General",
				errors: [errorMsg],
				branch_stock: 90,
				minqty: 20,
				maxqty: 100,
				min_order_qty: 10,
				lead_time: null,
				outstanding_indent_qty: 20,
				has_open_indent: false,
				stock_exceeds_max: true,
				max_indent_qty: null,
				min_indent_qty: null,
				has_minmax: true,
				fy_indent_exists: false,
				fy_indent_no: null,
				fy_duplicate_indent_no: null,
				regular_bom_outstanding: 0,
				forced_qty: null,
				warnings: [],
			});

			const { result } = renderHook(() => useIndentItemValidation(defaultParams));

			await act(async () => {
				await result.current.validateLine("line-1", "10");
			});

			const err = result.current.getQuantityError("line-1", "5");
			expect(err).toBe(errorMsg);
		});

		it("should return null when min/max is configured and qty is within limit", async () => {
			mockValidate.mockResolvedValueOnce({
				validation_logic: 1,
				item_id: 10,
				branch_id: 1,
				indent_type: "Regular",
				expense_type_name: "General",
				errors: [],
				branch_stock: 10,
				minqty: 20,
				maxqty: 100,
				min_order_qty: 10,
				lead_time: null,
				outstanding_indent_qty: 5,
				has_open_indent: false,
				stock_exceeds_max: false,
				max_indent_qty: 85,
				min_indent_qty: 20,
				has_minmax: true,
				fy_indent_exists: false,
				fy_indent_no: null,
				fy_duplicate_indent_no: null,
				regular_bom_outstanding: 0,
				forced_qty: null,
				warnings: [],
			});

			const { result } = renderHook(() => useIndentItemValidation(defaultParams));

			await act(async () => {
				await result.current.validateLine("line-1", "10");
			});

			const err = result.current.getQuantityError("line-1", "50");
			expect(err).toBeNull();
		});

		it("should return qty exceeded error when qty > maxIndentQty (no backend errors)", async () => {
			mockValidate.mockResolvedValueOnce({
				validation_logic: 1,
				item_id: 10,
				branch_id: 1,
				indent_type: "Regular",
				expense_type_name: "General",
				errors: [],
				branch_stock: 10,
				minqty: 20,
				maxqty: 100,
				min_order_qty: 10,
				lead_time: null,
				outstanding_indent_qty: 5,
				has_open_indent: false,
				stock_exceeds_max: false,
				max_indent_qty: 85,
				min_indent_qty: 20,
				has_minmax: true,
				fy_indent_exists: false,
				fy_indent_no: null,
				fy_duplicate_indent_no: null,
				regular_bom_outstanding: 0,
				forced_qty: null,
				warnings: [],
			});

			const { result } = renderHook(() => useIndentItemValidation(defaultParams));

			await act(async () => {
				await result.current.validateLine("line-1", "10");
			});

			const err = result.current.getQuantityError("line-1", "100");
			expect(err).toContain("exceeds the maximum allowed");
		});
	});

	describe("allLinesValid — blocks submission when errors exist", () => {
		it("should return false when a line has backend errors", async () => {
			mockValidate.mockResolvedValueOnce({
				validation_logic: 1,
				item_id: 10,
				branch_id: 1,
				indent_type: "Regular",
				expense_type_name: "General",
				errors: ["Min/Max stock levels not configured for this item at this branch."],
				branch_stock: 0,
				minqty: null,
				maxqty: null,
				min_order_qty: null,
				lead_time: null,
				outstanding_indent_qty: 0,
				has_open_indent: false,
				stock_exceeds_max: false,
				max_indent_qty: null,
				min_indent_qty: null,
				has_minmax: false,
				fy_indent_exists: false,
				fy_indent_no: null,
				fy_duplicate_indent_no: null,
				regular_bom_outstanding: 0,
				forced_qty: null,
				warnings: [],
			});

			const { result } = renderHook(() => useIndentItemValidation(defaultParams));

			await act(async () => {
				await result.current.validateLine("line-1", "10");
			});

			const valid = result.current.allLinesValid(["line-1"], { "line-1": "5" });
			expect(valid).toBe(false);
		});

		it("should return true when all lines pass validation", async () => {
			mockValidate.mockResolvedValueOnce({
				validation_logic: 1,
				item_id: 10,
				branch_id: 1,
				indent_type: "Regular",
				expense_type_name: "General",
				errors: [],
				branch_stock: 10,
				minqty: 20,
				maxqty: 100,
				min_order_qty: 10,
				lead_time: null,
				outstanding_indent_qty: 5,
				has_open_indent: false,
				stock_exceeds_max: false,
				max_indent_qty: 85,
				min_indent_qty: 20,
				has_minmax: true,
				fy_indent_exists: false,
				fy_indent_no: null,
				fy_duplicate_indent_no: null,
				regular_bom_outstanding: 0,
				forced_qty: null,
				warnings: [],
			});

			const { result } = renderHook(() => useIndentItemValidation(defaultParams));

			await act(async () => {
				await result.current.validateLine("line-1", "10");
			});

			const valid = result.current.allLinesValid(["line-1"], { "line-1": "50" });
			expect(valid).toBe(true);
		});
	});

	describe("Logic 2 (Open indent) — FY duplicate check", () => {
		it("should return FY duplicate error from backend errors array", async () => {
			const fyError =
				"An open indent (#IND-2025-001) already exists for this item in the current financial year.";

			mockValidate.mockResolvedValueOnce({
				validation_logic: 2,
				item_id: 10,
				branch_id: 1,
				indent_type: "Open",
				expense_type_name: "General",
				errors: [fyError],
				branch_stock: 0,
				minqty: null,
				maxqty: null,
				min_order_qty: null,
				lead_time: null,
				outstanding_indent_qty: 0,
				has_open_indent: false,
				stock_exceeds_max: false,
				max_indent_qty: null,
				min_indent_qty: null,
				has_minmax: false,
				fy_indent_exists: true,
				fy_indent_no: "IND-2025-001",
				fy_duplicate_indent_no: 1,
				regular_bom_outstanding: 0,
				forced_qty: null,
				warnings: [],
			});

			const openParams = { ...defaultParams, indentType: "Open", expenseTypeName: "General" };
			const { result } = renderHook(() => useIndentItemValidation(openParams));

			await act(async () => {
				await result.current.validateLine("line-1", "10");
			});

			const err = result.current.getQuantityError("line-1", "5");
			expect(err).toBe(fyError);
		});

		it("should block when has_minmax is false for Open indent", async () => {
			const noMinMaxError = "No max/min quantity defined for this item. Cannot create open indent.";

			mockValidate.mockResolvedValueOnce({
				validation_logic: 2,
				item_id: 10,
				branch_id: 1,
				indent_type: "Open",
				expense_type_name: "General",
				errors: [noMinMaxError],
				branch_stock: 0,
				minqty: null,
				maxqty: null,
				min_order_qty: null,
				lead_time: null,
				outstanding_indent_qty: 0,
				has_open_indent: false,
				stock_exceeds_max: false,
				max_indent_qty: null,
				min_indent_qty: null,
				has_minmax: false,
				fy_indent_exists: false,
				fy_indent_no: null,
				fy_duplicate_indent_no: null,
				regular_bom_outstanding: 0,
				forced_qty: null,
				warnings: [],
			});

			const openParams = { ...defaultParams, indentType: "Open", expenseTypeName: "General" };
			const { result } = renderHook(() => useIndentItemValidation(openParams));

			await act(async () => {
				await result.current.validateLine("line-1", "10");
			});

			const err = result.current.getQuantityError("line-1", "5");
			expect(err).toBe(noMinMaxError);

			const valid = result.current.allLinesValid(["line-1"], { "line-1": "5" });
			expect(valid).toBe(false);
		});
	});

	describe("Logic 3 — no validation", () => {
		it("should skip validation for Logic 3 (Capital expense)", () => {
			const capitalParams = {
				branchId: "1",
				indentType: "Regular",
				expenseTypeName: "Capital",
				expenseTypeId: "5",
			};

			const { result } = renderHook(() => useIndentItemValidation(capitalParams));

			// validateLine should be a no-op for Logic 3
			// getQuantityError should return null for unknown lines
			const err = result.current.getQuantityError("line-1", "999");
			expect(err).toBeNull();
		});
	});
});
