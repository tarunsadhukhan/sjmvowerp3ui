import { fetchWithCookie } from "@/utils/apiClient2";
import { apiRoutesPortalMasters } from "@/utils/api";

export type InwardLine = {
	id: string;
	poDtlId?: string;
	poNo?: string;
	itemGroup?: string;
	item?: string;
	itemCode?: string;
	itemMake?: string;
	orderedQty?: number;
	receivedQty?: number;
	quantity?: number | string;
	rate?: number | string;
	uom?: string;
	amount?: number;
	remarks?: string;
	taxPercentage?: number;
};

export type ApprovalActionPermissions = {
	canApprove?: boolean;
	canReject?: boolean;
	canOpen?: boolean;
	canCancelDraft?: boolean;
	canSave?: boolean;
};

export type InwardDetails = {
	id: string;
	inwardNo?: string;
	inwardDate: string;
	branch: string;
	branchId?: string;
	supplier: string;
	supplierId?: string;
	challanNo?: string;
	challanDate?: string;
	invoiceNo?: string;
	invoiceDate?: string;
	vehicleNo?: string;
	transporterName?: string;
	remarks?: string;
	status?: string;
	statusId?: 1 | 3 | 4 | 5 | 6 | 20 | 21;
	approvalLevel?: number | null;
	maxApprovalLevel?: number | null;
	updatedBy?: string;
	updatedAt?: string;
	permissions?: ApprovalActionPermissions;
	lines: InwardLine[];
};

export type InwardSetup1Response = {
	suppliers?: Array<Record<string, unknown>>;
	item_groups?: Array<Record<string, unknown>>;
	co_config?: Record<string, unknown>;
};

export type InwardSetup2Response = {
	items?: Array<Record<string, unknown>>;
	makes?: Array<Record<string, unknown>>;
	uoms?: Array<Record<string, unknown>>;
};

export type ApprovedPO = {
	po_id: number;
	po_no: string;
	po_date: string;
	branch_name: string;
	supplier_name: string;
	pending_items_count: number;
};

export type ApprovedPOsResponse = {
	data: ApprovedPO[];
};

export type POLineItemsResponse = {
	po_id: number;
	line_items: Array<Record<string, unknown>>;
};

export type CreateInwardRequest = {
	branch: string;
	supplier: string;
	inward_date: string;
	challan_no?: string;
	challan_date?: string;
	invoice_no?: string;
	invoice_date?: string;
	vehicle_no?: string;
	transporter_name?: string;
	remarks?: string;
	items: Array<{
		po_dtl_id?: string;
		item?: string;
		quantity?: string | number;
		rate?: string | number;
		uom?: string;
		remarks?: string;
	}>;
};

export type CreateInwardResponse = {
	message?: string;
	inward_id?: number | string;
	inwardId?: number | string;
	inward_no?: string;
};

export type StatusChangeResponse = {
	status: string;
	new_status_id: number;
	new_approval_level?: number;
	message: string;
	inward_no?: string;
};

export async function fetchInwardSetup1(params: { coId: string; branchId?: string }): Promise<InwardSetup1Response> {
	const query = new URLSearchParams({ co_id: params.coId });
	if (params.branchId) {
		query.set("branch_id", params.branchId);
	}

	const { data, error } = await fetchWithCookie<InwardSetup1Response>(
		`${apiRoutesPortalMasters.GET_INWARD_SETUP_1}?${query.toString()}`,
		"GET"
	);

	if (error) {
		throw new Error(error);
	}

	if (!data) {
		throw new Error("Empty inward setup response.");
	}

	return data;
}

export async function fetchInwardSetup2(itemGroupId: string): Promise<InwardSetup2Response> {
	const query = new URLSearchParams({ item_group: itemGroupId });
	const { data, error } = await fetchWithCookie<InwardSetup2Response>(
		`${apiRoutesPortalMasters.GET_INWARD_SETUP_2}?${query.toString()}`,
		"GET"
	);

	if (error) {
		throw new Error(error);
	}

	if (!data) {
		throw new Error("Empty item group setup response.");
	}

	return data;
}

export async function getApprovedPOsBySupplier(
	supplierId: string | number,
	branchId?: string | number,
	coId?: string | number
): Promise<ApprovedPOsResponse> {
	const query = new URLSearchParams({ supplier_id: String(supplierId) });
	if (branchId) {
		query.append("branch_id", String(branchId));
	}
	if (coId) {
		query.append("co_id", String(coId));
	}

	const { data, error } = await fetchWithCookie<ApprovedPOsResponse>(
		`${apiRoutesPortalMasters.GET_APPROVED_POS_BY_SUPPLIER}?${query.toString()}`,
		"GET"
	);

	if (error) {
		throw new Error(error);
	}

	if (!data) {
		throw new Error("No data returned from get_approved_pos_by_supplier");
	}

	return data;
}

export async function getPOLineItemsForInward(poId: string | number): Promise<POLineItemsResponse> {
	const query = new URLSearchParams({ po_id: String(poId) });
	const { data, error } = await fetchWithCookie<POLineItemsResponse>(
		`${apiRoutesPortalMasters.GET_PO_LINE_ITEMS_FOR_INWARD}?${query.toString()}`,
		"GET"
	);

	if (error) {
		throw new Error(error);
	}

	if (!data) {
		throw new Error("Empty PO line items response.");
	}

	return data;
}

export async function createInward(payload: CreateInwardRequest): Promise<CreateInwardResponse> {
	const { data, error } = await fetchWithCookie<CreateInwardResponse>(
		apiRoutesPortalMasters.INWARD_CREATE,
		"POST",
		payload
	);

	if (error) {
		throw new Error(error);
	}

	return data ?? { message: "Inward created successfully." };
}

export async function getInwardById(id: string, coId?: string, menuId?: string): Promise<InwardDetails> {
	// Get co_id from localStorage if not provided
	let companyId = coId;
	if (!companyId && typeof window !== "undefined") {
		try {
			const storedCompany = localStorage.getItem("sidebar_selectedCompany");
			if (storedCompany) {
				const parsed = JSON.parse(storedCompany) as { co_id?: string | number } | null;
				if (parsed?.co_id) {
					companyId = typeof parsed.co_id === "string" ? parsed.co_id : String(parsed.co_id);
				}
			}
		} catch {
			// Ignore errors
		}
	}

	if (!companyId) {
		throw new Error("Company ID (co_id) is required to fetch inward details");
	}

	const query = new URLSearchParams({
		inward_id: id,
		co_id: companyId,
	});

	// Add menu_id if provided (needed for permission calculation)
	if (menuId) {
		query.set("menu_id", menuId);
	}

	const { data, error } = await fetchWithCookie<InwardDetails>(
		`${apiRoutesPortalMasters.GET_INWARD_BY_ID}?${query.toString()}`,
		"GET"
	);

	if (error) {
		throw new Error(error);
	}

	if (!data) {
		throw new Error("Empty response from inward API");
	}

	return data;
}

export async function updateInward(payload: Partial<InwardDetails>): Promise<{ message: string; inward_id?: number }> {
	if (!payload.id) {
		throw new Error("Inward ID is required for update");
	}

	// Map frontend payload to backend format
	const items = (payload.lines ?? []).map((line) => ({
		po_dtl_id: line.poDtlId,
		item: line.item ?? "",
		quantity: line.quantity ?? 0,
		rate: line.rate ?? 0,
		uom: line.uom ?? "",
		remarks: line.remarks ?? undefined,
	}));

	const updatePayload = {
		id: payload.id,
		branch: payload.branchId ?? payload.branch ?? "",
		supplier: payload.supplierId ?? payload.supplier ?? "",
		inward_date: payload.inwardDate ?? "",
		challan_no: payload.challanNo ?? undefined,
		challan_date: payload.challanDate ?? undefined,
		invoice_no: payload.invoiceNo ?? undefined,
		invoice_date: payload.invoiceDate ?? undefined,
		vehicle_no: payload.vehicleNo ?? undefined,
		transporter_name: payload.transporterName ?? undefined,
		remarks: payload.remarks ?? undefined,
		items: items,
	};

	const { data, error } = await fetchWithCookie<{ message: string; inward_id?: number }>(
		apiRoutesPortalMasters.INWARD_UPDATE,
		"PUT",
		updatePayload
	);

	if (error) {
		throw new Error(error);
	}

	if (!data) {
		throw new Error("Empty response from update API");
	}

	return data;
}

export async function openInward(inwardId: string, branchId: string, menuId: string): Promise<StatusChangeResponse> {
	const payload = {
		inward_id: inwardId,
		branch_id: branchId,
		menu_id: menuId,
	};

	const { data, error } = await fetchWithCookie<StatusChangeResponse>(
		apiRoutesPortalMasters.INWARD_OPEN,
		"POST",
		payload
	);

	if (error) {
		throw new Error(error);
	}

	if (!data) {
		throw new Error("Empty response from open API");
	}

	return data;
}

export async function cancelDraftInward(inwardId: string, branchId: string, menuId: string): Promise<StatusChangeResponse> {
	const payload = {
		inward_id: inwardId,
		branch_id: branchId,
		menu_id: menuId,
	};

	const { data, error } = await fetchWithCookie<StatusChangeResponse>(
		apiRoutesPortalMasters.INWARD_CANCEL_DRAFT,
		"POST",
		payload
	);

	if (error) {
		throw new Error(error);
	}

	if (!data) {
		throw new Error("Empty response from cancel draft API");
	}

	return data;
}

export async function approveInward(inwardId: string, branchId: string, menuId: string): Promise<StatusChangeResponse> {
	const payload = {
		inward_id: inwardId,
		branch_id: branchId,
		menu_id: menuId,
	};

	const { data, error } = await fetchWithCookie<StatusChangeResponse>(
		apiRoutesPortalMasters.INWARD_APPROVE,
		"POST",
		payload
	);

	if (error) {
		throw new Error(error);
	}

	if (!data) {
		throw new Error("Empty response from approve API");
	}

	return data;
}

export async function rejectInward(inwardId: string, branchId: string, menuId: string, reason: string): Promise<StatusChangeResponse> {
	const payload = {
		inward_id: inwardId,
		branch_id: branchId,
		menu_id: menuId,
		reason: reason,
	};

	const { data, error } = await fetchWithCookie<StatusChangeResponse>(
		apiRoutesPortalMasters.INWARD_REJECT,
		"POST",
		payload
	);

	if (error) {
		throw new Error(error);
	}

	if (!data) {
		throw new Error("Empty response from reject API");
	}

	return data;
}
