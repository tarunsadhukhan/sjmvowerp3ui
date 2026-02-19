import { describe, it, expect } from "vitest";
import { getValidationLogic } from "./indentConstants";

describe("getValidationLogic", () => {
	// ── Logic 1: Regular + General/Maintenance/Production/Overhaul ──
	it("Regular + General → 1", () => {
		expect(getValidationLogic("Regular", "General")).toBe(1);
	});

	it("Regular + Maintenance → 1", () => {
		expect(getValidationLogic("Regular", "Maintenance")).toBe(1);
	});

	it("Regular + Production → 1", () => {
		expect(getValidationLogic("Regular", "Production")).toBe(1);
	});

	it("Regular + Overhaul → 1", () => {
		expect(getValidationLogic("Regular", "Overhaul")).toBe(1);
	});

	// ── Logic 3: Regular + Capital ──
	it("Regular + Capital → 3", () => {
		expect(getValidationLogic("Regular", "Capital")).toBe(3);
	});

	// ── Logic 2: Open type ──
	it("Open + General → 2", () => {
		expect(getValidationLogic("Open", "General")).toBe(2);
	});

	it("Open + Maintenance → 2", () => {
		expect(getValidationLogic("Open", "Maintenance")).toBe(2);
	});

	it("Open + Production → 2", () => {
		expect(getValidationLogic("Open", "Production")).toBe(2);
	});

	// ── Logic 1: BOM + General/Maintenance/Production ──
	it("BOM + General → 1", () => {
		expect(getValidationLogic("BOM", "General")).toBe(1);
	});

	it("BOM + Maintenance → 1", () => {
		expect(getValidationLogic("BOM", "Maintenance")).toBe(1);
	});

	it("BOM + Production → 1", () => {
		expect(getValidationLogic("BOM", "Production")).toBe(1);
	});

	// ── Logic 3: BOM + Capital/Overhaul ──
	it("BOM + Capital → 3", () => {
		expect(getValidationLogic("BOM", "Capital")).toBe(3);
	});

	it("BOM + Overhaul → 3", () => {
		expect(getValidationLogic("BOM", "Overhaul")).toBe(3);
	});

	// ── Edge cases ──
	it("returns 3 for unknown indent type", () => {
		expect(getValidationLogic("Unknown", "General")).toBe(3);
	});

	it("returns 3 for unknown expense type", () => {
		expect(getValidationLogic("Regular", "UnknownExpense")).toBe(3);
	});

	it("returns 3 when indent type is empty", () => {
		expect(getValidationLogic("", "General")).toBe(3);
	});

	it("returns 3 when expense type is undefined", () => {
		expect(getValidationLogic("Regular", undefined)).toBe(3);
	});

	it("returns 3 when both are empty", () => {
		expect(getValidationLogic("", "")).toBe(3);
	});
});
