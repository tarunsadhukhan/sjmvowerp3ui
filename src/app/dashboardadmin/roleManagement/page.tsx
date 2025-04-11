"use client";

import { SearchablePaginatedTable } from "@/components/ui/searchablePaginatedTable";
import { Column } from "@/components/ui/datatablewithedit";
import { Button } from "@/components/ui/button";
import { PencilIcon } from "lucide-react";
import apiRoutes from "@/utils/api";
import { apiClient } from "@/utils/apiClient";

// Sample Role type
type Role = {
  role_id: number;
  role_name: string;
  active: string;
};

type ApiResponse = {
  data: Role[];
  total: number;
};

// Real API fetch function with pagination and search
const fetchRoles = async (page: number, search?: string) => {
  const limit = 20;
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    user_id: localStorage.getItem('user_id') || '', // Ensure user_id is not null
  });
  
  if (search) {
    queryParams.append('search', search);
  }
  
  const subdomain = localStorage.getItem('subdomain');
  
  const response = await apiClient<ApiResponse>({
    url: `${apiRoutes.ROLES_COMP_CONSOLE}?${queryParams}`,
    method: 'GET',
    headers: {
      'X-Subdomain': subdomain || '',
    },
    withCredentials: true,
  });
  
  if (response.isError) {
    throw new Error(response.error || 'Failed to fetch roles');
  }
  
  return response.data;
};

// Table columns
const columns: Column<Role>[] = [
  {
    key: "role_name",
    label: "Role Name",
    className: "bg-[#3ea6da] text-white font-medium",
  },
  {
    key: "active",
    label: "Active",
    className: "bg-[#3ea6da] text-white",
  },
  {
    key: "actions",
    label: "Actions",
    className: "bg-[#3ea6da] text-white",
    render: (_val, row) => (
      <Button variant="ghost" size="icon" onClick={() => alert(`Edit ${row.role_name}`)}>
        <PencilIcon className="h-4 w-4" />
      </Button>
    ),
  },
];

export default function SampleRoleTablePage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#0C3C60]">Sample Role Table</h1>
          <Button
            className="bg-[#95C11F] hover:bg-[#85ad1b] text-white"
            onClick={() => alert("Create Role")}
          >
            + Create Role
          </Button>
        </div>

        <SearchablePaginatedTable columns={columns} fetchFn={fetchRoles} />
      </div>
    </div>
  );
}
