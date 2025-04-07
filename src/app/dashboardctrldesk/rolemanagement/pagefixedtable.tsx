import DynamicTable from "../rolemanagement/dynamictable"; // Adjust the import path

; // Adjust the import path


import { Button } from "@/components/ui/button"; // Adjust import
import { UserIcon } from "@heroicons/react/24/outline"; // Example icon imports

export default function RoleManagement() {
  // Define headers with optional sortable property
  const headers = [
    { label: "Role Name", key: "name", sortable: true },
    { label: "Role Type", key: "type", sortable: true },
    { label: "Actions", key: "actions", sortable: false }, // Disable sorting for actions
  ];

  // Example data
  const data = [
    { name: "Admin", type: "System" },
    { name: "Editor", type: "Content" },
    { name: "Viewer", type: "Read-Only" },
    { name: "Manager", type: "System" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#0C3C60]">Role Management</h1>
          <div className="flex gap-3">
            <Button className="bg-[#95C11F] hover:bg-[#85ad1b] text-white">
              + Create Role
            </Button>
            <Button variant="outline" className="bg-[#E6F3F9] border-none">
              Billing Details
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full bg-gray-200">
              <UserIcon className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Use the DynamicTable component */}
        <DynamicTable headers={headers} data={data} />

        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-6 right-6 h-12 w-12 rounded-full bg-[#0C3C60] text-white hover:bg-[#0a3352]"
        >
                 </Button>
      </div>
    </div>
  );
}