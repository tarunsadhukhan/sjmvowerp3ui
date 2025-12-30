import React from "react";
import type {
	Option,
	DepartmentRecord,
	ProjectRecord,
	ExpenseRecord,
	ItemGroupRecord,
	CostFactorRecord,
	MachineRecord,
	ItemGroupCacheEntry,
	IssueLabelResolvers,
} from "../types/issueTypes";
import {
	buildLabelMap,
	createLabelResolver,
} from "@/utils/labelUtils";

type UseIssueSelectOptionsParams = {
	departments: readonly DepartmentRecord[];
	projects: readonly ProjectRecord[];
	expenses: readonly ExpenseRecord[];
	itemGroups: readonly ItemGroupRecord[];
	costFactors: readonly CostFactorRecord[];
	machines: readonly MachineRecord[];
	branchIdForSetup?: string;
	departmentIdForMachines?: string;
	itemGroupCache: Partial<Record<string, ItemGroupCacheEntry>>;
};

/**
 * Hook to memoize all select options and label resolvers for the Issue transaction page.
 */
export const useIssueSelectOptions = ({
	departments,
	projects,
	expenses,
	itemGroups,
	costFactors,
	machines,
	branchIdForSetup,
	departmentIdForMachines,
	itemGroupCache,
}: UseIssueSelectOptionsParams) => {
	// --- DEPARTMENT OPTIONS (filtered by branch) ---
	const departmentOptions = React.useMemo<Option[]>(
		() =>
			departments
				.filter(
					(dept) =>
						!branchIdForSetup ||
						!dept.branchId ||
						dept.branchId === branchIdForSetup
				)
				.map((dept) => ({ label: dept.name, value: dept.id })),
		[departments, branchIdForSetup]
	);

	// --- PROJECT OPTIONS (filtered by branch) ---
	const projectOptions = React.useMemo<Option[]>(
		() =>
			projects
				.filter(
					(proj) =>
						!branchIdForSetup ||
						!proj.branchId ||
						proj.branchId === branchIdForSetup
				)
				.map((proj) => ({ label: proj.name, value: proj.id })),
		[projects, branchIdForSetup]
	);

	// --- EXPENSE TYPE OPTIONS ---
	const expenseOptions = React.useMemo<Option[]>(
		() => expenses.map((exp) => ({ label: exp.name, value: exp.id })),
		[expenses]
	);

	// --- ITEM GROUP OPTIONS ---
	const itemGroupOptions = React.useMemo<Option[]>(
		() => itemGroups.map((grp) => ({ label: grp.label, value: grp.id })),
		[itemGroups]
	);

	// --- COST FACTOR OPTIONS (filtered by branch) ---
	const costFactorOptions = React.useMemo<Option[]>(
		() =>
			costFactors
				.filter(
					(cf) =>
						!branchIdForSetup ||
						!cf.branchId ||
						cf.branchId === branchIdForSetup
				)
				.map((cf) => ({ label: cf.name, value: cf.id })),
		[costFactors, branchIdForSetup]
	);

	// --- MACHINE OPTIONS (filtered by department) ---
	const machineOptions = React.useMemo<Option[]>(
		() =>
			machines
				.filter(
					(m) =>
						!departmentIdForMachines ||
						!m.departmentId ||
						m.departmentId === departmentIdForMachines
				)
				.map((m) => ({ label: m.name, value: m.id })),
		[machines, departmentIdForMachines]
	);

	// --- LABEL MAPS ---
	const departmentLabelMap = React.useMemo(
		() =>
			buildLabelMap(
				[...departments],
				(d) => d.id,
				(d) => d.name
			),
		[departments]
	);

	const projectLabelMap = React.useMemo(
		() =>
			buildLabelMap(
				[...projects],
				(p) => p.id,
				(p) => p.name
			),
		[projects]
	);

	const expenseLabelMap = React.useMemo(
		() =>
			buildLabelMap(
				[...expenses],
				(e) => e.id,
				(e) => e.name
			),
		[expenses]
	);

	const itemGroupLabelMap = React.useMemo(
		() =>
			buildLabelMap(
				[...itemGroups],
				(g) => g.id,
				(g) => g.label
			),
		[itemGroups]
	);

	const costFactorLabelMap = React.useMemo(
		() =>
			buildLabelMap(
				[...costFactors],
				(cf) => cf.id,
				(cf) => cf.name
			),
		[costFactors]
	);

	const machineLabelMap = React.useMemo(
		() =>
			buildLabelMap(
				[...machines],
				(m) => m.id,
				(m) => m.name
			),
		[machines]
	);

	// --- LABEL RESOLVERS ---
	const getDepartmentLabel = React.useMemo(
		() => createLabelResolver(departmentLabelMap),
		[departmentLabelMap]
	);

	const getProjectLabel = React.useMemo(
		() => createLabelResolver(projectLabelMap),
		[projectLabelMap]
	);

	const getExpenseLabel = React.useMemo(
		() => createLabelResolver(expenseLabelMap),
		[expenseLabelMap]
	);

	const getItemGroupLabel = React.useMemo(
		() => createLabelResolver(itemGroupLabelMap),
		[itemGroupLabelMap]
	);

	const getCostFactorLabel = React.useMemo(
		() => createLabelResolver(costFactorLabelMap),
		[costFactorLabelMap]
	);

	const getMachineLabel = React.useMemo(
		() => createLabelResolver(machineLabelMap),
		[machineLabelMap]
	);

	// --- ITEM/UOM GETTERS FROM CACHE ---
	const getItemOptions = React.useCallback(
		(groupId: string): Option[] => {
			const cache = itemGroupCache[groupId];
			if (!cache) return [];
			return cache.items.map((item) => ({ label: item.label, value: item.value }));
		},
		[itemGroupCache]
	);

	const getUomOptions = React.useCallback(
		(groupId: string, itemId: string): Option[] => {
			const cache = itemGroupCache[groupId];
			if (!cache) return [];
			return cache.uomsByItemId[itemId] ?? [];
		},
		[itemGroupCache]
	);

	const getItemLabel = React.useCallback(
		(groupId: string, itemId: string): string => {
			const cache = itemGroupCache[groupId];
			if (!cache) return itemId;
			return cache.itemLabelById[itemId] ?? itemId;
		},
		[itemGroupCache]
	);

	const getUomLabel = React.useCallback(
		(groupId: string, itemId: string, uomId: string): string => {
			const cache = itemGroupCache[groupId];
			if (!cache) return uomId;
			const uomLabels = cache.uomLabelByItemId[itemId];
			if (!uomLabels) return uomId;
			return uomLabels[uomId] ?? uomId;
		},
		[itemGroupCache]
	);

	// --- COMBINED LABEL RESOLVERS ---
	const labelResolvers: IssueLabelResolvers = React.useMemo(
		() => ({
			department: getDepartmentLabel,
			project: getProjectLabel,
			expense: getExpenseLabel,
			itemGroup: getItemGroupLabel,
			item: getItemLabel,
			uom: getUomLabel,
			costFactor: getCostFactorLabel,
			machine: getMachineLabel,
		}),
		[
			getDepartmentLabel,
			getProjectLabel,
			getExpenseLabel,
			getItemGroupLabel,
			getItemLabel,
			getUomLabel,
			getCostFactorLabel,
			getMachineLabel,
		]
	);

	return {
		// Options arrays
		departmentOptions,
		projectOptions,
		expenseOptions,
		itemGroupOptions,
		costFactorOptions,
		machineOptions,
		// Individual resolvers
		getDepartmentLabel,
		getProjectLabel,
		getExpenseLabel,
		getItemGroupLabel,
		getCostFactorLabel,
		getMachineLabel,
		getItemOptions,
		getUomOptions,
		getItemLabel,
		getUomLabel,
		// Combined resolvers
		labelResolvers,
	};
};
