"use client";

import { SearchablePaginatedTable } from "@/components/ui/searchablePaginatedTable";
import { Column } from "@/components/ui/datatablewithedit";
import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PencilIcon, UserCircle, Share, HelpCircle, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { apiRoutes } from "@/utils/api";


// Sample Role type
type Role = {
  role_id: number;
  role_name: string;
  active: string;
};

type ApiResponse = {
  data: Role[];
  total: number;

}

//const API_URL = 'http://localhost:3001/api';

const API_URL = 'http://localhost:8000';

export default function RoleManagement() {
  const [displayedRoles, setDisplayedRoles] = useState<Role[]>([]);
  const [totalRoles, setTotalRoles] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [newRole, setNewRole] = useState<Partial<Role>>({
    type: "",
    name: "",
    has_hrms_access: false,

  });
  
  if (search) {
    queryParams.append('search', search);
  }
  
  
  const subdomain = localStorage.getItem('subdomain');
  const response = await axios.get(`${apiRoutes.ROLES_CONSOLE}?${queryParams}`, {
    withCredentials: true,
    headers: {
      'X-Subdomain': subdomain || '',
    },
  });
  
  if (response.status < 200 || response.status >= 300) {
    throw new Error('Failed to fetch roles');
  }
  
  const data: ApiResponse = response.data;
  return data;
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
  const router = useRouter();
  const pathname = usePathname();
  const handleCreateRole = () => {
    router.push(`${pathname}/create`);
    //    router.push('/create');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#0C3C60]">Sample Role Table</h1>
          <Button
            className="bg-[#95C11F] hover:bg-[#85ad1b] text-white"
            onClick={handleCreateRole}
          >
            + Create Role
          </Button>
        </div>

        <SearchablePaginatedTable columns={columns} fetchFn={fetchRoles} />
      </div>
    </div>
  );
}
