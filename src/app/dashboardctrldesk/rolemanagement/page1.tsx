 "use client";

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
import { PencilIcon, UserCircle, Share, HelpCircle } from "lucide-react";
import { useState } from "react";

const roles = [
  { name: "SuperAdmin", type: "Portal" },
  { name: "Jute User", type: "Portal" },
  { name: "Commercial Manager", type: "Portal" },
  { name: "AppSuperAdmin", type: "App" },
  { name: "EDP", type: "Portal" },
];

export default function RoleManagement() {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const totalPages = Math.ceil(roles.length / itemsPerPage);

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
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-gray-200"
            >
              <UserCircle className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <Input
            placeholder="Search"
            className="max-w-xs"
          />
          <Button variant="outline" className="gap-2">
            <Share className="h-4 w-4" />
            Export
          </Button>
        </div>

        <div className="rounded-lg border bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="bg-[#0C3C60] text-white">Role Name</TableHead>
                <TableHead className="bg-[#0C3C60] text-white">Role Type</TableHead>
                <TableHead className="bg-[#0C3C60] text-white">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role.name}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell>{role.type}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {[10, 30, 50, "All"].map((value) => (
              <Button
                key={value}
                variant={itemsPerPage === value ? "default" : "outline"}
                size="sm"
                onClick={() => setItemsPerPage(value === "All" ? roles.length : value)}
                className={value === itemsPerPage ? "bg-[#E6F3F9] text-black border-[#0C3C60]" : ""}
              >
                {value}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className={page === currentPage ? "bg-[#E6F3F9] text-black border-[#0C3C60]" : ""}
              >
                {page}
              </Button>
            ))}
            <Button variant="outline" size="sm">
              Next
            </Button>
          </div>
        </div>
      </div>
      
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-6 right-6 h-12 w-12 rounded-full bg-[#0C3C60] text-white hover:bg-[#0a3352]"
      >
        <HelpCircle className="h-6 w-6" />
      </Button>
    </div>
  );
}