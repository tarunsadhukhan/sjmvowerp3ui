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

export async function getIndentById(id: string): Promise<IndentDetails> {
  const data = { ...mockIndent, id, indentNo: mockIndent.indentNo.replace("123", id.padStart(3, "0")) };
  return delay(data);
}

export async function updateIndent(payload: Partial<IndentDetails>): Promise<{ message: string }> {
  console.info("updateIndent payload", payload);
  return delay({ message: "Indent updated (stub)." });
}

export async function getIndentPrintable(id: string): Promise<IndentDetails> {
  return getIndentById(id);
}
