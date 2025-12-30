import type {
	DepartmentRecord,
	ProjectRecord,
	ExpenseRecord,
	ItemGroupRecord,
	CostFactorRecord,
	MachineRecord,
	IssueSetupData,
	AvailableInventoryItem,
	ItemGroupCacheEntry,
	ItemOption,
	Option,
} from "../types/issueTypes";

/**
 * Maps raw department records from API to DepartmentRecord type.
 */
export const mapDepartmentRecords = (records: unknown[]): DepartmentRecord[] =>
	records
		.map((row) => {
			const data = row as Record<string, unknown>;
			const id = data?.dept_id ?? data?.department_id ?? data?.id;
			if (!id) return null;
			return {
				id: String(id),
				name: String(data?.dept_desc ?? data?.dept_name ?? data?.name ?? id),
				branchId: data?.branch_id != null ? String(data.branch_id) : undefined,
			} satisfies DepartmentRecord;
		})
		.filter(Boolean) as DepartmentRecord[];

/**
 * Maps raw project records from API to ProjectRecord type.
 */
export const mapProjectRecords = (records: unknown[]): ProjectRecord[] =>
	records
		.map((row) => {
			const data = row as Record<string, unknown>;
			const id = data?.project_id ?? data?.id;
			if (!id) return null;
			return {
				id: String(id),
				name: String(data?.prj_name ?? data?.project_name ?? data?.name ?? id),
				branchId: data?.branch_id != null ? String(data.branch_id) : undefined,
			} satisfies ProjectRecord;
		})
		.filter(Boolean) as ProjectRecord[];

/**
 * Maps raw expense type records from API to ExpenseRecord type.
 */
export const mapExpenseRecords = (records: unknown[]): ExpenseRecord[] =>
	records
		.map((row) => {
			const data = row as Record<string, unknown>;
			const id = data?.expense_type_id ?? data?.id;
			if (!id) return null;
			return {
				id: String(id),
				name: String(data?.expense_type_name ?? data?.name ?? id),
			} satisfies ExpenseRecord;
		})
		.filter(Boolean) as ExpenseRecord[];

/**
 * Maps raw item group records from API to ItemGroupRecord type.
 */
export const mapItemGroupRecords = (records: unknown[]): ItemGroupRecord[] =>
	records
		.map((row) => {
			const data = row as Record<string, unknown>;
			const id = data?.item_grp_id ?? data?.id;
			if (!id) return null;
			return {
				id: String(id),
				label: String(data?.item_grp_name ?? data?.label ?? data?.name ?? id),
			} satisfies ItemGroupRecord;
		})
		.filter(Boolean) as ItemGroupRecord[];

/**
 * Maps raw cost factor records from API to CostFactorRecord type.
 */
export const mapCostFactorRecords = (records: unknown[]): CostFactorRecord[] =>
	records
		.map((row) => {
			const data = row as Record<string, unknown>;
			const id = data?.cost_factor_id ?? data?.id;
			if (!id) return null;
			return {
				id: String(id),
				name: String(data?.cost_factor_name ?? data?.name ?? id),
				branchId: data?.branch_id != null ? String(data.branch_id) : undefined,
				deptId: data?.dept_id != null ? String(data.dept_id) : undefined,
			} satisfies CostFactorRecord;
		})
		.filter(Boolean) as CostFactorRecord[];

/**
 * Maps raw machine records from API to MachineRecord type.
 */
export const mapMachineRecords = (records: unknown[]): MachineRecord[] =>
	records
		.map((row) => {
			const data = row as Record<string, unknown>;
			const id = data?.machine_id ?? data?.id;
			if (!id) return null;
			return {
				id: String(id),
				name: String(data?.machine_name ?? data?.name ?? id),
				departmentId: data?.dept_id != null ? String(data.dept_id) : undefined,
				mechCode: data?.mech_code != null ? String(data.mech_code) : undefined,
			} satisfies MachineRecord;
		})
		.filter(Boolean) as MachineRecord[];

/**
 * Maps the issue setup API response to IssueSetupData.
 */
export const mapIssueSetupResponse = (response: unknown): IssueSetupData => {
	const result = response as Record<string, unknown>;
	return {
		departments: mapDepartmentRecords((result?.departments as unknown[]) ?? []),
		projects: mapProjectRecords((result?.projects as unknown[]) ?? []),
		expenses: mapExpenseRecords((result?.expense_types as unknown[]) ?? []),
		itemGroups: mapItemGroupRecords((result?.item_groups as unknown[]) ?? []),
	};
};

/**
 * Maps raw available inventory items from API.
 */
export const mapAvailableInventoryItems = (records: unknown[]): AvailableInventoryItem[] =>
	records
		.map((row) => {
			const data = row as Record<string, unknown>;
			const inwardDtlId = data?.inward_dtl_id;
			if (!inwardDtlId) return null;
			return {
				inwardDtlId: String(inwardDtlId),
				inwardId: String(data?.inward_id ?? ""),
				srNo: String(data?.sr_no ?? data?.inward_no ?? ""),
				inwardDate: String(data?.inward_date ?? ""),
				branchId: String(data?.branch_id ?? ""),
				branchName: String(data?.branch_name ?? ""),
				itemId: String(data?.item_id ?? ""),
				itemName: String(data?.item_name ?? ""),
				itemCode: String(data?.item_code ?? ""),
				itemGrpId: String(data?.item_grp_id ?? ""),
				itemGrpName: String(data?.item_grp_name ?? ""),
				itemMakeId: data?.item_make_id ? String(data.item_make_id) : undefined,
				itemMakeName: data?.item_make_name ? String(data.item_make_name) : undefined,
				uomId: String(data?.uom_id ?? ""),
				uomName: String(data?.uom_name ?? ""),
				approvedQty: Number(data?.approved_qty ?? 0),
				availableQty: Number(data?.available_qty ?? 0),
				rate: Number(data?.rate ?? 0),
				warehouseId: data?.warehouse_id ? String(data.warehouse_id) : undefined,
				warehouseName: data?.warehouse_name ? String(data.warehouse_name) : undefined,
			} satisfies AvailableInventoryItem;
		})
		.filter(Boolean) as AvailableInventoryItem[];

/**
 * Maps item group detail response (setup 2) for caching.
 */
export const mapItemGroupDetailResponse = (response: unknown): ItemGroupCacheEntry => {
	const data = response as Record<string, unknown>;
	const innerData = (data?.data ?? {}) as Record<string, unknown>;
	const rawItems = (data?.items ?? innerData?.items ?? []) as Record<string, unknown>[];
	const rawMakes = (data?.makes ?? innerData?.makes ?? []) as Record<string, unknown>[];
	const rawUoms = (data?.uoms ?? innerData?.uoms ?? []) as Record<string, unknown>[];

	const items: ItemOption[] = rawItems.map((it) => ({
		label: String(it?.item_name ?? it?.label ?? ""),
		value: String(it?.item_id ?? it?.value ?? ""),
		defaultUomId: it?.uom_id != null ? String(it.uom_id) : undefined,
		defaultUomLabel: it?.uom_name != null ? String(it.uom_name) : undefined,
	}));

	const makes: Option[] = rawMakes.map((mk) => ({
		label: String(mk?.item_make_name ?? mk?.label ?? ""),
		value: String(mk?.item_make_id ?? mk?.value ?? ""),
	}));

	// Build UOM map by item ID
	const uomsByItemId: Record<string, Option[]> = {};
	for (const uom of rawUoms) {
		const itemId = String(uom?.item_id ?? "");
		if (!itemId) continue;
		if (!uomsByItemId[itemId]) uomsByItemId[itemId] = [];
		uomsByItemId[itemId].push({
			label: String(uom?.uom_name ?? ""),
			value: String(uom?.uom_id ?? ""),
		});
	}

	// Build label lookup maps
	const itemLabelById: Record<string, string> = {};
	for (const it of items) itemLabelById[it.value] = it.label;

	const makeLabelById: Record<string, string> = {};
	for (const mk of makes) makeLabelById[mk.value] = mk.label;

	const uomLabelByItemId: Record<string, Record<string, string>> = {};
	for (const [itemId, uomList] of Object.entries(uomsByItemId)) {
		uomLabelByItemId[itemId] = {};
		for (const uom of uomList) uomLabelByItemId[itemId][uom.value] = uom.label;
	}

	return {
		items,
		makes,
		uomsByItemId,
		itemLabelById,
		makeLabelById,
		uomLabelByItemId,
	};
};
