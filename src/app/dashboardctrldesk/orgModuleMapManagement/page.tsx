"use client";

import { SearchablePaginatedTable } from "@/components/ui/searchablePaginatedTable";
import { Column } from "@/components/ui/datatablewithedit";
import { Button } from "@/components/ui/button";
import { PencilIcon } from "lucide-react";
import { apiRoutes,apiRoutesconsole } from "@/utils/api";
import { fetchWithCookie } from "@/utils/apiClient2";

// Sample Role type
type Role = {
  org_id: number;
  org_name: string;
  selected_modules: string;
};

// Real API fetch function with pagination and search
const fetchRoles = async (page: number, search?: string, sortKey?: string | null, sortOrder?: "asc" | "desc") => {
  const limit = 20;
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    user_id: localStorage.getItem('user_id') || '', // Ensure user_id is not null
  });
  if (search) {
    queryParams.append('search', search);
  }
  
  // Add sorting parameters if provided
  if (sortKey) {
    queryParams.append('sort_key', sortKey);
    queryParams.append('sort_order', sortOrder || 'asc');
  }

  const url = `${apiRoutesconsole.ORG_MODULE_MAP}?${queryParams}`;
  console.log("Fetching roles with URL:", url);

  const { data, error } = await fetchWithCookie(url, "GET");

  if (error || !data) {
    console.error("Error fetching roles:", error);
    throw new Error(error || 'Failed to fetch roles');
  }

  console.log("API response structure:", JSON.stringify(data, null, 2));

  // Check the actual structure of your API response and adjust accordingly
  if (data.data && typeof data.total === 'number') {
    // If API already returns the expected format
    console.log("Using data.data format, returned items:", data.data.length, "total:", data.total);
    return { data: data.data, total: data.total };
  } else if (Array.isArray(data)) {
    // If API returns just an array of roles
    console.log("Using array format, returned items:", data.length);
    return { data, total: data.length };
  } else if (data.roles && typeof data.count === 'number') {
    // If API returns a different format like { roles: [...], count: 100 }
    console.log("Using roles/count format, returned items:", data.roles.length, "total:", data.count);
    return { data: data.roles, total: data.count };
  } else {
    // Try to determine the actual structure
    console.error("Unexpected API response format:", data);
    
    // Look for array properties in the response
    const arrayProps = Object.entries(data).find(([_, value]) => Array.isArray(value));
    if (arrayProps) {
      const [propName, arrayValue] = arrayProps;
      console.log(`Found array property "${propName}" with ${(arrayValue as any[]).length} items`);
      
      // Look for a count/total property
      const countProps = Object.entries(data).find(([key, value]) => 
        typeof value === 'number' && 
        (key.includes('total') || key.includes('count') || key === 'length')
      );
      
      if (countProps) {
        console.log(`Using discovered format: items from "${propName}", count from "${countProps[0]}"`);
        return { 
          data: arrayValue as any[], 
          total: countProps[1] as number 
        };
      }
      
      // If we found an array but no count, use the array length
      console.log(`Using discovered array "${propName}" with length as total`);
      return { 
        data: arrayValue as any[], 
        total: (arrayValue as any[]).length 
      };
    }
    
    // Default fallback
    console.error("Could not determine response structure, returning empty result");
    return { data: [], total: 0 };
  }
};

const createEditUrl = (role: Role): string => {
  // Debug log to inspect the role object
  console.log("Role object passed to createEditUrl:", role);

  // Safely handle undefined/null properties
  const roleId = role?.org_id !== undefined && role?.org_id !== null ? role.org_id.toString() : '';
  const roleName = role?.org_name ?? '';
  const modules = role?.selected_modules ?? '';

  const params = new URLSearchParams({
    roleId,
    roleName,
    modules
  });

  // Update the path to match your app’s routing if necessary
  return `/dashboardctrldesk/orgModuleMapManagement/editOrgModuleMapAdmin?${params.toString()}`;
}

// Table columns
const columns: Column<Role>[] = [
  {
    key: "org_name",
    label: "Organization",
    className: "bg-[#3ea6da] text-white font-medium",
  },
  {
    key: "module_selected",
    label: "Module Selectd",
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
          // Alert to inspect the row object
      //    alert(`Row data: ${JSON.stringify(row)}`);

          const roleId = row.org_id;
          window.location.href = createEditUrl(row);
        }}
      >
        <PencilIcon className="h-4 w-4" />
      </Button>
    ),
  },
];.0

export default function SampleRoleTablePage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#0C3C60]">ORG Module Mapping Management</h1>
            <Button
            className="bg-[#95C11F] hover:bg-[#85ad1b] text-white"
            onClick={() => {
              window.location.href = "/dashboardctrldesk/roleManagementAdmin/createRoleAdmin";
            }}
            disabled
            >
            + Create Org Module Mapping
            </Button>
        </div>

        <SearchablePaginatedTable columns={columns} fetchFn={fetchRoles} />
      </div>
    </div>
  );
}
