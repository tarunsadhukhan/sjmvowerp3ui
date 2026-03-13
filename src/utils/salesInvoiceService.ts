import { fetchWithCookie } from "@/utils/apiClient2";
import { apiRoutesPortalMasters } from "@/utils/api";

export type { ApprovalActionPermissions } from "@/utils/poService";

export type InvoiceLine = {
  id: string;
  deliveryOrderDtlId?: number;
  hsnCode?: string;
  itemGroup?: string;
  item?: string;
  itemName?: string;
  itemCode?: string;
  itemMake?: string;
  quantity?: number | string;
  rate?: number | string;
  uom?: string;
  uomName?: string;
  discountType?: number;
  discountedRate?: number;
  discountAmount?: number;
  netAmount?: number;
  totalAmount?: number;
  remarks?: string;
  taxPercentage?: number;
  gst?: {
    igstAmount?: number;
    igstPercent?: number;
    cgstAmount?: number;
    cgstPercent?: number;
    sgstAmount?: number;
    sgstPercent?: number;
    gstTotal?: number;
  };
};

export type InvoiceDetails = {
  id: string;
  invoiceNo: string;
  invoiceDate: string;
  challanNo?: string;
  challanDate?: string;
  branch: string;
  deliveryOrder?: string;
  deliveryOrderNo?: string;
  salesDeliveryOrderId?: number | string;
  saleNo?: string;
  brokerId?: number | string;
  party: string;
  partyName?: string;
  partyBranch?: string;
  billingTo?: string;
  billingToId?: number | string;
  shippingTo?: string;
  shippingToId?: number | string;
  shippingStateCode?: number | string;
  transporter?: string;
  transporterName?: string;
  transporterNameStored?: string;
  transporterAddress?: string;
  transporterStateCode?: string;
  transporterStateName?: string;
  vehicleNo?: string;
  ewayBillNo?: string;
  ewayBillDate?: string;
  invoiceType?: string;
  footerNote?: string;
  internalNote?: string;
  termsConditions?: string;
  grossAmount?: number;
  taxAmount?: number;
  taxPayable?: number;
  netAmount?: number;
  freightCharges?: number;
  roundOff?: number;
  intraInterState?: string;
  dueDate?: string;
  typeOfSale?: string;
  taxId?: number | string;
  containerNo?: string;
  contractNo?: number | string;
  contractDate?: string;
  consignmentNo?: string;
  consignmentDate?: string;
  status?: string;
  statusId?: 1 | 3 | 4 | 5 | 6 | 20 | 21;
  approvalLevel?: number | null;
  maxApprovalLevel?: number | null;
  updatedBy?: string;
  updatedAt?: string;
  permissions?: import("@/utils/poService").ApprovalActionPermissions;
  lines: InvoiceLine[];
};

export type InvoiceSetup1Response = {
  branches?: Array<Record<string, unknown>>;
  customers?: Array<Record<string, unknown>>;
  transporters?: Array<Record<string, unknown>>;
  approved_delivery_orders?: Array<Record<string, unknown>>;
  item_groups?: Array<Record<string, unknown>>;
};

export type InvoiceSetup2Response = {
  items?: Array<Record<string, unknown>>;
  makes?: Array<Record<string, unknown>>;
  uoms?: Array<Record<string, unknown>>;
};

export type DeliveryOrderLineForInvoice = {
  delivery_order_dtl_id: number;
  item_id: number;
  item_code?: string;
  item_name?: string;
  item_grp_id: number;
  item_grp_code?: string;
  item_grp_name?: string;
  item_make_id?: number;
  item_make_name?: string;
  hsn_code?: string;
  quantity: number;
  uom_id: number;
  uom_name?: string;
  rate?: number;
  discount_type?: number;
  discounted_rate?: number;
  discount_amount?: number;
  net_amount?: number;
  total_amount?: number;
  remarks?: string;
  tax_percentage?: number;
};

export type CreateInvoiceRequest = {
  branch: string;
  date: string;
  party: string;
  party_branch?: string;
  delivery_order?: string;
  sales_delivery_order_id?: string;
  broker_id?: string;
  billing_to?: string;
  billing_to_id?: string;
  shipping_to?: string;
  shipping_to_id?: string;
  transporter?: string;
  transporter_name?: string;
  transporter_address?: string;
  transporter_state_code?: string;
  transporter_state_name?: string;
  vehicle_no?: string;
  eway_bill_no?: string;
  eway_bill_date?: string;
  challan_no?: string;
  challan_date?: string;
  invoice_type?: string;
  footer_note?: string;
  internal_note?: string;
  terms_conditions?: string;
  gross_amount?: number;
  tax_amount?: number;
  tax_payable?: number;
  net_amount?: number;
  freight_charges?: number;
  round_off?: number;
  shipping_state_code?: number;
  intra_inter_state?: string;
  due_date?: string;
  type_of_sale?: string;
  tax_id?: number;
  container_no?: string;
  contract_no?: number;
  contract_date?: string;
  consignment_no?: string;
  consignment_date?: string;
  items: Array<{
    item: string;
    item_make?: string;
    delivery_order_dtl_id?: number;
    hsn_code?: string;
    quantity: string;
    uom: string;
    rate?: string;
    discount_type?: number;
    discounted_rate?: number;
    discount_amount?: number;
    net_amount?: number;
    total_amount?: number;
    remarks?: string;
    gst?: {
      igst_amount?: number;
      igst_percent?: number;
      cgst_amount?: number;
      cgst_percent?: number;
      sgst_amount?: number;
      sgst_percent?: number;
      gst_total?: number;
    };
  }>;
};

export type SaveInvoiceRequest = CreateInvoiceRequest & { id?: string };

export type CreateInvoiceResponse = {
  message?: string;
  invoice_id?: number | string;
};

export type StatusChangeResponse = {
  status: string;
  new_status_id: number;
  new_approval_level?: number;
  message: string;
  invoice_no?: string;
};

export async function fetchInvoiceSetup1(params: { coId: string; branchId?: string }): Promise<InvoiceSetup1Response> {
  const query = new URLSearchParams({ co_id: params.coId });
  if (params.branchId) query.set("branch_id", params.branchId);
  const { data, error } = await fetchWithCookie<InvoiceSetup1Response>(
    `${apiRoutesPortalMasters.SALES_INVOICE_SETUP_1}?${query.toString()}`,
    "GET"
  );
  if (error) throw new Error(error);
  if (!data) throw new Error("Empty invoice setup response.");
  return data;
}

export async function fetchInvoiceSetup2(itemGroupId: string): Promise<InvoiceSetup2Response> {
  const query = new URLSearchParams({ item_group: itemGroupId });
  const { data, error } = await fetchWithCookie<InvoiceSetup2Response>(
    `${apiRoutesPortalMasters.SALES_INVOICE_SETUP_2}?${query.toString()}`,
    "GET"
  );
  if (error) throw new Error(error);
  if (!data) throw new Error("Empty item group setup response.");
  return data;
}

export async function fetchDeliveryOrderLines(deliveryOrderId: string): Promise<{ data: DeliveryOrderLineForInvoice[] }> {
  const query = new URLSearchParams({ sales_delivery_order_id: deliveryOrderId });
  const { data, error } = await fetchWithCookie<{ data: DeliveryOrderLineForInvoice[] }>(
    `${apiRoutesPortalMasters.SALES_INVOICE_DELIVERY_ORDER_LINES}?${query.toString()}`,
    "GET"
  );
  if (error) throw new Error(error);
  if (!data) throw new Error("Empty delivery order lines response.");
  return data;
}

export async function getInvoiceById(id: string, coId?: string, menuId?: string): Promise<InvoiceDetails> {
  let companyId = coId;
  if (!companyId && typeof window !== "undefined") {
    try {
      const storedCompany = localStorage.getItem("sidebar_selectedCompany");
      if (storedCompany) {
        const parsed = JSON.parse(storedCompany) as { co_id?: string | number } | null;
        if (parsed?.co_id) companyId = String(parsed.co_id);
      }
    } catch { /* ignore */ }
  }
  if (!companyId) throw new Error("Company ID (co_id) is required to fetch invoice details");

  const query = new URLSearchParams({ invoice_id: id, co_id: companyId });
  if (menuId) query.set("menu_id", menuId);

  const { data, error } = await fetchWithCookie<InvoiceDetails>(
    `${apiRoutesPortalMasters.SALES_INVOICE_BY_ID}?${query.toString()}`,
    "GET"
  );
  if (error) throw new Error(error);
  if (!data) throw new Error("Empty response from invoice API");
  return data;
}

export async function createInvoice(payload: CreateInvoiceRequest): Promise<CreateInvoiceResponse> {
  const { data, error } = await fetchWithCookie<CreateInvoiceResponse>(
    apiRoutesPortalMasters.SALES_INVOICE_CREATE, "POST", payload
  );
  if (error) throw new Error(error);
  return data ?? { message: "Sales invoice created successfully." };
}

export async function updateInvoice(payload: SaveInvoiceRequest): Promise<CreateInvoiceResponse> {
  const { data, error } = await fetchWithCookie<CreateInvoiceResponse>(
    apiRoutesPortalMasters.SALES_INVOICE_UPDATE, "PUT", payload
  );
  if (error) throw new Error(error);
  return data ?? { message: "Sales invoice updated successfully." };
}

export async function openInvoice(invoiceId: string, branchId: string): Promise<StatusChangeResponse> {
  const { data, error } = await fetchWithCookie<StatusChangeResponse>(
    apiRoutesPortalMasters.SALES_INVOICE_OPEN, "POST", { invoice_id: invoiceId, branch_id: branchId }
  );
  if (error) throw new Error(error);
  if (!data) throw new Error("Empty response from open API");
  return data;
}

export async function cancelDraftInvoice(invoiceId: string): Promise<StatusChangeResponse> {
  const { data, error } = await fetchWithCookie<StatusChangeResponse>(
    apiRoutesPortalMasters.SALES_INVOICE_CANCEL_DRAFT, "POST", { invoice_id: invoiceId }
  );
  if (error) throw new Error(error);
  if (!data) throw new Error("Empty response from cancel draft API");
  return data;
}

export async function sendInvoiceForApproval(invoiceId: string): Promise<StatusChangeResponse> {
  const { data, error } = await fetchWithCookie<StatusChangeResponse>(
    apiRoutesPortalMasters.SALES_INVOICE_SEND_FOR_APPROVAL, "POST", { invoice_id: invoiceId }
  );
  if (error) throw new Error(error);
  if (!data) throw new Error("Empty response from send for approval API");
  return data;
}

export async function approveInvoice(invoiceId: string, menuId: string): Promise<StatusChangeResponse> {
  const { data, error } = await fetchWithCookie<StatusChangeResponse>(
    apiRoutesPortalMasters.SALES_INVOICE_APPROVE, "POST", { invoice_id: invoiceId, menu_id: menuId }
  );
  if (error) throw new Error(error);
  if (!data) throw new Error("Empty response from approve API");
  return data;
}

export async function rejectInvoice(invoiceId: string, reason: string): Promise<StatusChangeResponse> {
  const { data, error } = await fetchWithCookie<StatusChangeResponse>(
    apiRoutesPortalMasters.SALES_INVOICE_REJECT, "POST", { invoice_id: invoiceId, reason }
  );
  if (error) throw new Error(error);
  if (!data) throw new Error("Empty response from reject API");
  return data;
}

export async function reopenInvoice(invoiceId: string): Promise<StatusChangeResponse> {
  const { data, error } = await fetchWithCookie<StatusChangeResponse>(
    apiRoutesPortalMasters.SALES_INVOICE_REOPEN, "POST", { invoice_id: invoiceId }
  );
  if (error) throw new Error(error);
  if (!data) throw new Error("Empty response from reopen API");
  return data;
}
