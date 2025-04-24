"use client";

import { SearchablePaginatedTable } from "@/components/ui/searchablePaginatedTable";
import { Column } from "@/components/ui/datatablewithedit";
import { Button } from "@/components/ui/button";
import { PencilIcon } from "lucide-react";
import apiRoutes from "@/utils/api";
import { fetchWithCookie } from "@/utils/apiClient2";

// Sample User type
type User = {
  user_id: number;
  email_id: string;
  name: string;
  active: boolean;
};

// Real API fetch function with pagination and search
const fetchUsers = async (page: number, search?: string) => {
  const limit = 20;
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    user_id: localStorage.getItem('user_id') || '', // Ensure user_id is not null
  });
  if (search) {
    queryParams.append('search', search);
  }

  const { data, error } = await fetchWithCookie(
    apiRoutes.USERS_PORTAL,
    "GET"
  );

  if (error || !data) {
    throw new Error(error || 'Failed to fetch users');
  }
  return data;
};

// Table columns
const columns: Column<User>[] = [
  {
    key: "name",
    label: "Name",
    className: "bg-[#3ea6da] text-white font-medium",
  },
  {
    key: "email_id",
    label: "username",
    className: "bg-[#3ea6da] text-white font-medium",
  },
  {
    key: "active",
    label: "Active",
    className: "bg-[#3ea6da] text-white",
    render: (val) => (val === 1 ? "Yes" : "No"),
  },
  {
    key: "actions",
    label: "Actions",
    className: "bg-[#3ea6da] text-white",
    render: (_val, row) => (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          const UserId = row.user_id;
          window.location.href = `/dashboardadmin/userManagement/createUser?userId=${UserId}`;
        }}
      >
        <PencilIcon className="h-4 w-4" />
      </Button>
    ),
  },
];

export default function UserTenantAdmin() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#0C3C60]">User Management Portal</h1>
            <Button
            className="bg-[#95C11F] hover:bg-[#85ad1b] text-white"
            onClick={() => {
              window.location.href = "/dashboardadmin/userManagement/createUser";
            }}
            >
            + Create User
            </Button>
        </div>

        <SearchablePaginatedTable columns={columns} fetchFn={fetchUsers} />
      </div>
    </div>
  );
}
