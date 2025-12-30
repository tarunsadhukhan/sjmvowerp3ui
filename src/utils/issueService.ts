import { fetchWithCookie } from "./apiClient2";
import { apiRoutesPortalMasters } from "./api";

/**
 * Issue line item type from API response
 */
export type IssueLineResponse = {
	id: number | string;
	issue_li_id?: number;
	item_id?: number;
	item_name?: string;
	item_group_id?: number;
	item_group_name?: string;
	qty?: number;
	uom_id?: number;
	uom_name?: string;
	rate?: number;
	expense_id?: number;
	expense_name?: string;
	cost_factor_id?: number;
	cost_factor_name?: string;
	machine_id?: number;
	machine_name?: string;
	inward_dtl_id?: number;
	sr_no?: string;
	remarks?: string;
};

/**
 * Issue details type from API response
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
	lineItems?: IssueLineResponse[];
};

/**
 * Issue setup data from API
 */
export type IssueSetupResponse = {
	departments?: unknown[];
	projects?: unknown[];
	expense_types?: unknown[];
	item_groups?: unknown[];
};

/**
 * Available inventory item from API
 */
export type AvailableInventoryResponse = {
	inward_dtl_id: number;
	sr_no: string;
	item_id: number;
	item_name?: string;
	approved_qty: number;
	issued_qty: number;
	available_qty: number;
	rate: number;
	uom_id?: number;
	uom_name?: string;
};

/**
 * Cost factor from API
 */
export type CostFactorResponse = {
	cost_factor_id: number;
	cost_factor_name: string;
	branch_id?: number;
};

/**
 * Machine from API
 */
export type MachineResponse = {
	machine_id: number;
	machine_name: string;
	dept_id?: number;
};

/**
 * Fetch the list of issues for the table
 */
export const fetchIssueList = async (
	coId: string,
	params?: {
		page?: number;
		pageSize?: number;
		search?: string;
		branchId?: string;
		startDate?: string;
		endDate?: string;
		statusId?: number;
	}
): Promise<{ data: unknown[]; total: number }> => {
	const searchParams = new URLSearchParams();
	searchParams.append("co_id", coId);
	if (params?.page) searchParams.append("page", String(params.page));
	if (params?.pageSize) searchParams.append("page_size", String(params.pageSize));
	if (params?.search) searchParams.append("search", params.search);
	if (params?.branchId) searchParams.append("branch_id", params.branchId);
	if (params?.startDate) searchParams.append("start_date", params.startDate);
	if (params?.endDate) searchParams.append("end_date", params.endDate);
	if (params?.statusId !== undefined) searchParams.append("status_id", String(params.statusId));

	const url = `${apiRoutesPortalMasters.ISSUE_TABLE}?${searchParams.toString()}`;
	const response = await fetchWithCookie(url, "GET");
	
	if (response.error) {
		throw new Error(response.error);
	}
	
	const result = response.data as Record<string, unknown> | null;
	return {
		data: (result?.data as unknown[]) ?? [],
		total: (result?.total as number) ?? 0,
	};
};

/**
 * Fetch issue details by ID
 */
export const getIssueById = async (
	issueId: string,
	coId: string,
	menuId?: string
): Promise<IssueDetails> => {
	const searchParams = new URLSearchParams();
	searchParams.append("co_id", coId);
	if (menuId) searchParams.append("menu_id", menuId);

	const url = `${apiRoutesPortalMasters.ISSUE_GET_BY_ID}/${issueId}?${searchParams.toString()}`;
	const response = await fetchWithCookie(url, "GET");
	
	if (!response || response.error) {
		throw new Error(response?.error ?? "Failed to fetch issue details");
	}

	// Map API response to IssueDetails
	const data = response.data ?? response;
	return {
		id: data.issue_id ?? data.id,
		issueId: data.issue_id,
		issuePassNo: data.issue_pass_no,
		date: data.issue_date,
		branchId: data.branch_id,
		branchName: data.branch_name,
		deptId: data.dept_id,
		deptName: data.dept_name ?? data.dept_desc,
		projectId: data.project_id,
		projectName: data.project_name,
		issuedTo: data.issued_to,
		reqBy: data.req_by,
		internalNote: data.internal_note,
		status: data.status ?? data.status_name,
		statusId: data.status_id,
		createdBy: data.created_by,
		createdAt: data.created_at,
		updatedBy: data.updated_by,
		updatedAt: data.updated_at,
		lineItems: (data.line_items ?? data.lines ?? []).map((line: Record<string, unknown>) => ({
			id: line.issue_li_id ?? line.id,
			itemId: line.item_id,
			itemName: line.item_name,
			itemGroupId: line.item_group_id,
			itemGroupName: line.item_group_name,
			qty: line.qty,
			uomId: line.uom_id,
			uomName: line.uom_name,
			rate: line.rate,
			expenseId: line.expense_id,
			expenseName: line.expense_name ?? line.expense_type_name,
			costFactorId: line.cost_factor_id,
			costFactorName: line.cost_factor_name,
			machineId: line.machine_id,
			machineName: line.machine_name,
			inwardDtlId: line.inward_dtl_id,
			srNo: line.sr_no,
			remarks: line.remarks,
		})),
	};
};

/**
 * Fetch issue setup data (departments, projects, expense types, item groups)
 */
export const fetchIssueSetup1 = async (
	params: { coId: string; branchId?: string }
): Promise<IssueSetupResponse> => {
	const searchParams = new URLSearchParams();
	searchParams.append("co_id", params.coId);
	if (params?.branchId) searchParams.append("branch_id", params.branchId);

	const url = `${apiRoutesPortalMasters.ISSUE_SETUP_1}?${searchParams.toString()}`;
	const response = await fetchWithCookie(url, "GET");
	
	if (!response || response.error) {
		throw new Error(response?.error ?? "Failed to fetch issue setup data");
	}

	return response.data ?? response;
};

/**
 * Fetch item group details (items, makes, UOMs) - reuses existing procurement endpoint
 */
export const fetchIssueSetup2 = async (
	itemGroupId: string,
	_coId?: string
): Promise<{ items?: unknown[]; makes?: unknown[]; uoms?: unknown[] }> => {
	// Use the existing procurement indent setup 2 endpoint which returns items by group
	const searchParams = new URLSearchParams();
	searchParams.append("item_group", itemGroupId);

	const url = `${apiRoutesPortalMasters.GET_INDENT_SETUP_2}?${searchParams.toString()}`;
	const response = await fetchWithCookie(url, "GET");
	
	if (response.error) {
		throw new Error(response.error ?? "Failed to fetch item group details");
	}

	return response.data ?? response ?? {};
};

/**
 * Fetch available inventory for issuing
 */
export const fetchAvailableInventory = async (
	coId: string,
	params?: { branchId?: string; itemGroupId?: string; itemId?: string }
): Promise<AvailableInventoryResponse[]> => {
	const searchParams = new URLSearchParams();
	searchParams.append("co_id", coId);
	if (params?.branchId) searchParams.append("branch_id", params.branchId);
	if (params?.itemGroupId) searchParams.append("item_group_id", params.itemGroupId);
	if (params?.itemId) searchParams.append("item_id", params.itemId);

	const url = `${apiRoutesPortalMasters.ISSUE_AVAILABLE_INVENTORY}?${searchParams.toString()}`;
	const response = await fetchWithCookie(url, "GET");
	
	if (!response || response.error) {
		throw new Error(response?.error ?? "Failed to fetch available inventory");
	}

	return response.data ?? response ?? [];
};

/**
 * Fetch cost factors by branch
 */
export const fetchCostFactors = async (
	coId: string,
	branchId?: string
): Promise<CostFactorResponse[]> => {
	const searchParams = new URLSearchParams();
	searchParams.append("co_id", coId);
	if (branchId) searchParams.append("branch_id", branchId);

	const url = `${apiRoutesPortalMasters.ISSUE_COST_FACTORS}?${searchParams.toString()}`;
	const response = await fetchWithCookie(url, "GET");
	
	if (!response || response.error) {
		throw new Error(response?.error ?? "Failed to fetch cost factors");
	}

	return response.data ?? response ?? [];
};

/**
 * Fetch machines by department
 */
export const fetchMachines = async (
	coId: string,
	deptId?: string
): Promise<MachineResponse[]> => {
	const searchParams = new URLSearchParams();
	searchParams.append("co_id", coId);
	if (deptId) searchParams.append("dept_id", deptId);

	const url = `${apiRoutesPortalMasters.ISSUE_MACHINES}?${searchParams.toString()}`;
	const response = await fetchWithCookie(url, "GET");
	
	if (!response || response.error) {
		throw new Error(response?.error ?? "Failed to fetch machines");
	}

	return response.data ?? response ?? [];
};

/**
 * Create a new issue
 */
export type CreateIssuePayload = {
	branch_id: string | number;
	dept_id: string | number;
	issue_date: string;
	project_id?: string | number;
	issued_to?: string;
	req_by?: string;
	internal_note?: string;
	line_items: Array<{
		item_id?: string | number;
		item_group_id?: string | number;
		qty: number;
		uom_id?: string | number;
		expense_id?: string | number;
		cost_factor_id?: string | number;
		machine_id?: string | number;
		inward_dtl_id?: string | number;
		remarks?: string;
	}>;
};

export type CreateIssueResponse = {
	message?: string;
	issue_id?: number;
	issue_pass_no?: string;
};

export const createIssue = async (
	coId: string,
	payload: CreateIssuePayload
): Promise<CreateIssueResponse> => {
	const searchParams = new URLSearchParams();
	searchParams.append("co_id", coId);

	const url = `${apiRoutesPortalMasters.ISSUE_CREATE}?${searchParams.toString()}`;
	const response = await fetchWithCookie(url, "POST", payload);
	
	if (!response || response.error) {
		throw new Error(response?.error ?? "Failed to create issue");
	}

	return response.data ?? response;
};

/**
 * Update an existing issue
 */
export type UpdateIssuePayload = Partial<CreateIssuePayload> & {
	issue_id: string | number;
};

export const updateIssue = async (
	coId: string,
	payload: UpdateIssuePayload
): Promise<{ message?: string }> => {
	const searchParams = new URLSearchParams();
	searchParams.append("co_id", coId);

	const url = `${apiRoutesPortalMasters.ISSUE_UPDATE}/${payload.issue_id}?${searchParams.toString()}`;
	const response = await fetchWithCookie(url, "PUT", payload);
	
	if (!response || response.error) {
		throw new Error(response?.error ?? "Failed to update issue");
	}

	return response.data ?? response;
};

/**
 * Update issue status
 */
export type UpdateIssueStatusPayload = {
	status_id: number;
	remarks?: string;
};

export const updateIssueStatus = async (
	coId: string,
	issueId: string | number,
	payload: UpdateIssueStatusPayload,
	menuId?: string
): Promise<{ message?: string }> => {
	const searchParams = new URLSearchParams();
	searchParams.append("co_id", coId);
	if (menuId) searchParams.append("menu_id", menuId);

	const url = `${apiRoutesPortalMasters.ISSUE_UPDATE_STATUS}/${issueId}?${searchParams.toString()}`;
	const response = await fetchWithCookie(url, "PUT", payload);
	
	if (!response || response.error) {
		throw new Error(response?.error ?? "Failed to update issue status");
	}

	return response.data ?? response;
};
