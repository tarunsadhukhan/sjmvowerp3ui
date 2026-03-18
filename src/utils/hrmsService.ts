/**
 * HRMS service layer — wraps all HRMS API calls with fetchWithCookie.
 */
import { fetchWithCookie } from "@/utils/apiClient2";
import { apiRoutesPortalMasters } from "@/utils/api";
import axios from "axios";

// ─── Employee ──────────────────────────────────────────────────────

export const fetchEmployeeList = async (
  coId: string,
  params?: {
    page?: number;
    page_size?: number;
    search?: string;
    status_id?: string;
    branch_id?: string;
    sub_dept_id?: string;
  },
) => {
  const qs = new URLSearchParams({ co_id: coId });
  if (params?.page) qs.set("page", String(params.page));
  if (params?.page_size) qs.set("page_size", String(params.page_size));
  if (params?.search) qs.set("search", params.search);
  if (params?.status_id) qs.set("status_id", params.status_id);
  if (params?.branch_id) qs.set("branch_id", params.branch_id);
  if (params?.sub_dept_id) qs.set("sub_dept_id", params.sub_dept_id);
  return fetchWithCookie(
    `${apiRoutesPortalMasters.HRMS_EMPLOYEE_LIST}?${qs.toString()}`,
    "GET",
  );
};

export const fetchEmployeeById = async (coId: string, ebId: string, branchId: string) =>
  fetchWithCookie(
    `${apiRoutesPortalMasters.HRMS_EMPLOYEE_BY_ID}/${ebId}?co_id=${coId}&branch_id=${branchId}`,
    "GET",
  );

export const fetchEmployeeCreateSetup = async (coId: string, branchId?: string) => {
  const qs = new URLSearchParams({ co_id: coId });
  if (branchId) qs.set("branch_id", branchId);
  return fetchWithCookie(
    `${apiRoutesPortalMasters.HRMS_EMPLOYEE_CREATE_SETUP}?${qs.toString()}`,
    "GET",
  );
};

export const fetchDesignationsByBranch = async (coId: string, branchId: string) =>
  fetchWithCookie(
    `${apiRoutesPortalMasters.HRMS_DESIGNATIONS_BY_BRANCH}?co_id=${coId}&branch_id=${branchId}`,
    "GET",
  );

export const createEmployee = async (coId: string, branchId: string, data: Record<string, unknown>) =>
  fetchWithCookie(
    `${apiRoutesPortalMasters.HRMS_EMPLOYEE_CREATE}?co_id=${coId}&branch_id=${branchId}`,
    "POST",
    data,
  );

export const saveEmployeeSection = async (
  coId: string,
  payload: { eb_id: number; section: string; data: Record<string, unknown> | Record<string, unknown>[] },
) =>
  fetchWithCookie(
    `${apiRoutesPortalMasters.HRMS_EMPLOYEE_SECTION_SAVE}?co_id=${coId}`,
    "POST",
    payload,
  );

export const fetchEmployeeProgress = async (coId: string, ebId: string, branchId: string) =>
  fetchWithCookie(
    `${apiRoutesPortalMasters.HRMS_EMPLOYEE_PROGRESS}/${ebId}?co_id=${coId}&branch_id=${branchId}`,
    "GET",
  );

export const uploadEmployeePhoto = async (coId: string, ebId: number, file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("eb_id", String(ebId));
  try {
    const response = await axios.post(
      `${apiRoutesPortalMasters.HRMS_EMPLOYEE_PHOTO_UPLOAD}?co_id=${coId}`,
      formData,
      { withCredentials: true },
    );
    return { data: response.data, error: null, status: response.status };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { data: null, error: message, status: 0 };
  }
};

export const getEmployeePhotoUrl = (coId: string, ebId: number | string) =>
  `${apiRoutesPortalMasters.HRMS_EMPLOYEE_PHOTO}/${ebId}?co_id=${coId}`;

export const deleteEmployeePhoto = async (coId: string, ebId: number) =>
  fetchWithCookie(
    `${apiRoutesPortalMasters.HRMS_EMPLOYEE_PHOTO}/${ebId}?co_id=${coId}`,
    "DELETE",
  );

// ─── Pay Scheme ────────────────────────────────────────────────────

export const fetchPaySchemeList = async (
  coId: string,
  params?: { page?: number; page_size?: number; search?: string },
) => {
  const qs = new URLSearchParams({ co_id: coId });
  if (params?.page) qs.set("page", String(params.page));
  if (params?.page_size) qs.set("page_size", String(params.page_size));
  if (params?.search) qs.set("search", params.search);
  return fetchWithCookie(
    `${apiRoutesPortalMasters.HRMS_PAY_SCHEME_LIST}?${qs.toString()}`,
    "GET",
  );
};

export const fetchPaySchemeById = async (coId: string, id: string) =>
  fetchWithCookie(
    `${apiRoutesPortalMasters.HRMS_PAY_SCHEME_BY_ID}/${id}?co_id=${coId}`,
    "GET",
  );

export const fetchPaySchemeCreateSetup = async (coId: string) =>
  fetchWithCookie(
    `${apiRoutesPortalMasters.HRMS_PAY_SCHEME_CREATE_SETUP}?co_id=${coId}`,
    "GET",
  );

export const createPayScheme = async (coId: string, data: Record<string, unknown>) =>
  fetchWithCookie(
    `${apiRoutesPortalMasters.HRMS_PAY_SCHEME_CREATE}?co_id=${coId}`,
    "POST",
    data,
  );

export const updatePayScheme = async (
  coId: string,
  id: string,
  data: Record<string, unknown>,
) =>
  fetchWithCookie(
    `${apiRoutesPortalMasters.HRMS_PAY_SCHEME_UPDATE}/${id}?co_id=${coId}`,
    "PUT",
    data,
  );

// ─── Pay Param / Period ────────────────────────────────────────────

export const fetchPayParamList = async (
  coId: string,
  params?: { page?: number; page_size?: number; search?: string },
) => {
  const qs = new URLSearchParams({ co_id: coId });
  if (params?.page) qs.set("page", String(params.page));
  if (params?.page_size) qs.set("page_size", String(params.page_size));
  if (params?.search) qs.set("search", params.search);
  return fetchWithCookie(
    `${apiRoutesPortalMasters.HRMS_PAY_PARAM_LIST}?${qs.toString()}`,
    "GET",
  );
};

export const fetchPayParamCreateSetup = async (coId: string) =>
  fetchWithCookie(
    `${apiRoutesPortalMasters.HRMS_PAY_PARAM_CREATE_SETUP}?co_id=${coId}`,
    "GET",
  );

export const createPayParam = async (coId: string, data: Record<string, unknown>) =>
  fetchWithCookie(
    `${apiRoutesPortalMasters.HRMS_PAY_PARAM_CREATE}?co_id=${coId}`,
    "POST",
    data,
  );

export const updatePayParam = async (
  coId: string,
  id: string,
  data: Record<string, unknown>,
) =>
  fetchWithCookie(
    `${apiRoutesPortalMasters.HRMS_PAY_PARAM_UPDATE}/${id}?co_id=${coId}`,
    "PUT",
    data,
  );
