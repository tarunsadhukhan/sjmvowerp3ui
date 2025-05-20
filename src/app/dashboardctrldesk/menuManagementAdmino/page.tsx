"use client";

import { SearchablePaginatedTable } from "@/components/ui/searchablePaginatedTable";
import { Column } from "@/components/ui/datatablewithedit";
import { Button } from "@/components/ui/button";
import { PencilIcon } from "lucide-react";
import { apiRoutes, apiRoutesconsole } from "@/utils/api";
import { fetchWithCookie } from "@/utils/apiClient2";
import Tooltip from "@/components/ui/tooltip"; // Corrected import path

// Sample Role type

type Menu = {
  menu_id: number;
  menu_name: string;
  parent_id: number;
  parent_name: string;
  active: number;
  module_id: number;
  module_name: string;
};

// Real API fetch function with pagination and search
const fetchPortalMenus = async (page: number, search?: string) => {
  const limit = 20;
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  if (search) {
    queryParams.append('search', search);
  }

  const { data, error } = await fetchWithCookie(
    `${apiRoutesconsole.GET_PORTAL_MENU_CTRLDSK_ADMIN}?${queryParams}`,
    "GET"
  );

  if (error || !data) {
    throw new Error(error || 'Failed to fetch roles');
  }
  return data;
};

// Helper function to create URL with all menu data as parameters
const createEditUrl = (menu: Menu) => {
  const params = new URLSearchParams({
    menuId: menu.menu_id.toString(),
    menuName: encodeURIComponent(menu.menu_name),
    parentId: menu.parent_id.toString(),
    parentName: encodeURIComponent(menu.parent_name),
    active: menu.active.toString(),
    moduleId: menu.module_id.toString(),
    moduleName: encodeURIComponent(menu.module_name),
  });

  console.log("Creating edit URL with params:", Object.fromEntries(params.entries()));
  return `/dashboardctrldesk/menuManagementAdmin/createMenuAdmin?${params.toString()}`;
};

// Table columns
const columns: Column<Menu>[] = [
  {
    key: "menu_name",
    label: "Menu Name",
    className: "bg-[#3ea6da] text-white font-medium",
  },
  {
    key: "parent_name",
    label: "Parent Name",
    className: "bg-[#3ea6da] text-white font-medium",
  },
  {
    key: "active",
    label: "Active",
    className: "bg-[#3ea6da] text-white",
    render: (val) => (val === 1 ? "Yes" : "No"),
  },
  {
    key: "module_name",
    label: "Module Name",
    className: "bg-[#3ea6da] text-white font-medium",
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
          window.location.href = createEditUrl(row);
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
          <h1 className="text-2xl font-bold text-[#0C3C60]">User Management Admin</h1>
            <Button
            className="bg-[#95C11F] hover:bg-[#85ad1b] text-white"
            onClick={() => {
              window.location.href = "/dashboardctrldesk/menuManagementAdmin/createMenuAdmin";
            }}
            >
            + Create Menu
            </Button>
        </div>

        <SearchablePaginatedTable columns={columns} fetchFn={fetchPortalMenus} />
      </div>
    </div>
  );
}
