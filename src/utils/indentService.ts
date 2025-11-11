import { fetchWithCookie } from "@/utils/apiClient2";
import { apiRoutesPortalMasters } from "@/utils/api";

export type IndentLine = {
  id: string;
  department?: string;
  itemGroup?: string;
  item?: string;
  itemMake?: string;
  quantity?: number;
  uom?: string;
  remarks?: string;
};

export type IndentDetails = {
  id: string;
  indentNo: string;
  indentDate: string;
  branch: string;
  indentType: string;
  expenseType: string;
  project?: string;
  requester?: string;
  status?: string;
  updatedBy?: string;
  updatedAt?: string;
  remarks?: string;
  lines: IndentLine[];
};

export type IndentSetup1Response = {
  branches?: Array<Record<string, unknown>>;
  departments?: Array<Record<string, unknown>>;
  projects?: Array<Record<string, unknown>>;
  expense_types?: Array<Record<string, unknown>>;
  item_groups?: Array<Record<string, unknown>>;
};

export type IndentSetup2Response = {
  items?: Array<Record<string, unknown>>;
  makes?: Array<Record<string, unknown>>;
  uoms?: Array<Record<string, unknown>>;
};

export type CreateIndentRequest = {
  branch: string;
  indent_type: string;
  expense_type: string;
  date: string;
  indent_no?: string;
  project?: string;
  requester?: string;
  remarks?: string;
  items: Array<{
    item_group?: string;
    item?: string;
    quantity?: string;
    uom?: string;
    item_make?: string;
    remarks?: string;
    department?: string;
  }>;
};

export type CreateIndentResponse = {
  message?: string;
  indent_id?: number | string;
  indentId?: number | string;
  indent_no?: number | string;
};

const mockIndent: IndentDetails = {
  id: "123",
  indentNo: "IND-2025-00123",
  indentDate: new Date().toISOString().slice(0, 10),
  branch: "Main Plant",
  indentType: "regular",
  expenseType: "1",
  project: "Expansion Project",
  requester: "John Doe",
  status: "Draft",
  updatedBy: "John Doe",
  updatedAt: new Date().toISOString(),
  remarks: "Please expedite delivery.",
  lines: [
    {
      id: "l1",
      department: "Production",
      itemGroup: "100-RAW",
      item: "Raw Steel Sheet",
      itemMake: "Make A",
      quantity: 25,
      uom: "PCS",
      remarks: "Gauge 18, priority order",
    },
    {
      id: "l2",
      department: "Maintenance",
      itemGroup: "200-SPARES",
      item: "Bearing Assembly",
      itemMake: "SKF",
      quantity: 4,
      uom: "SET",
      remarks: "For line 3 overhaul",
    },
  ],
};

function delay<T>(result: T, ms = 400): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(result), ms));
}

export async function fetchIndentSetup1(params: { coId: string; branchId?: string }): Promise<IndentSetup1Response> {
  const query = new URLSearchParams({ co_id: params.coId });
  if (params.branchId) {
    query.set("branch_id", params.branchId);
  }

  const { data, error } = await fetchWithCookie<IndentSetup1Response>(
    `${apiRoutesPortalMasters.GET_INDENT_SETUP_1}?${query.toString()}`,
    "GET"
  );

  if (error) {
    throw new Error(error);
  }

  if (!data) {
    throw new Error("Empty indent setup response.");
  }

  return data;
}

export async function fetchIndentSetup2(itemGroupId: string): Promise<IndentSetup2Response> {
  const query = new URLSearchParams({ item_group: itemGroupId });
  const { data, error } = await fetchWithCookie<IndentSetup2Response>(
    `${apiRoutesPortalMasters.GET_INDENT_SETUP_2}?${query.toString()}`,
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

export async function createIndent(payload: CreateIndentRequest): Promise<CreateIndentResponse> {
  const { data, error } = await fetchWithCookie<CreateIndentResponse>(
    apiRoutesPortalMasters.INDENT_CREATE,
    "POST",
    payload
  );

  if (error) {
    throw new Error(error);
  }

  return data ?? { message: "Indent created successfully." };
}

export async function getIndentById(id: string, coId?: string): Promise<IndentDetails> {
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
    throw new Error("Company ID (co_id) is required to fetch indent details");
  }

  const query = new URLSearchParams({
    indent_id: id,
    co_id: companyId,
  });

  const { data, error } = await fetchWithCookie<IndentDetails>(
    `${apiRoutesPortalMasters.GET_INDENT_BY_ID}?${query.toString()}`,
    "GET"
  );

  if (error) {
    throw new Error(error);
  }

  if (!data) {
    throw new Error("Empty response from indent API");
  }

  return data;
}

export async function updateIndent(payload: Partial<IndentDetails>): Promise<{ message: string; indent_id?: number }> {
  if (!payload.id) {
    throw new Error("Indent ID is required for update");
  }

  // Map frontend payload to backend format
  const items = (payload.lines ?? []).map((line) => ({
    item: line.item ?? "",
    quantity: line.quantity ?? 0,
    uom: line.uom ?? "",
    item_make: line.itemMake ?? undefined,
    department: line.department ?? undefined,
    remarks: line.remarks ?? undefined,
  }));

  const updatePayload = {
    id: payload.id,
    branch: payload.branch ?? "",
    indent_type: payload.indentType ?? "",
    expense_type: payload.expenseType ?? "",
    date: payload.indentDate ?? "",
    project: payload.project ?? undefined,
    name: payload.requester ?? undefined,
    remarks: payload.remarks ?? undefined,
    items: items,
  };

  const { data, error } = await fetchWithCookie<{ message: string; indent_id?: number }>(
    apiRoutesPortalMasters.INDENT_UPDATE,
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

export async function getIndentPrintable(id: string): Promise<IndentDetails> {
  return getIndentById(id);
}
