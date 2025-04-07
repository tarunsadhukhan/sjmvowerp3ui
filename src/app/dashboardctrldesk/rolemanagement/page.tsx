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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PencilIcon, UserCircle, Share, HelpCircle, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Role {
  id: number;
  name: string;
  type: string;
  has_hrms_access: boolean;
}

interface ApiResponse {
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
  const [page, setPage] = useState(1);
  const loadMoreRef = useRef(null);

  const fetchRoles = async (pageNumber: number, search?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams({
        page: pageNumber.toString(),
        limit: '10',
        ...(search && { search })
      });
      
      const response = await fetch(`${API_URL}/api/companyRoutes/roles?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch roles');
      
      const data: ApiResponse = await response.json();
      
      if (pageNumber === 1) {
        setDisplayedRoles(data.data);
      } else {
        setDisplayedRoles(prev => [...prev, ...data.data]);
      }
      setTotalRoles(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles(1);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchRoles(1, searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && !isLoading && displayedRoles.length < totalRoles && !searchQuery) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchRoles(nextPage);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [isLoading, displayedRoles.length, totalRoles, searchQuery, page]);

  const handleCreateRole = async () => {
    if (!newRole.name || !newRole.type) return;

    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/companyroles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRole),
      });

      if (!response.ok) {
        throw new Error('Failed to create role');
      }

      const createdRole = await response.json();
      setDisplayedRoles(prev => [createdRole, ...prev]);
      setNewRole({ type: "", name: "", has_hrms_access: false });
      setIsCreateDialogOpen(false);
      fetchRoles(1); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create role');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setNewRole({
      name: role.name,
      type: role.type,
      has_hrms_access: role.has_hrms_access
    });
    setIsCreateDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingRole || !newRole.name || !newRole.type) return;

    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/roles/${editingRole.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRole),
      });

      if (!response.ok) {
        throw new Error('Failed to update role');
      }

      const updatedRole = await response.json();
      setDisplayedRoles(prev =>
        prev.map(role => role.id === editingRole.id ? updatedRole : role)
      );
      setEditingRole(null);
      setNewRole({ type: "", name: "", has_hrms_access: false });
      setIsCreateDialogOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#0C3C60]">Role Management</h1>
          <div className="flex gap-3">
            <Button 
              className="bg-[#95C11F] hover:bg-[#85ad1b] text-white"
              onClick={() => {
                setEditingRole(null);
                setNewRole({ type: "", name: "", has_hrms_access: false });
                setIsCreateDialogOpen(true);
              }}
            >
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button variant="outline" className="gap-2">
            <Share className="h-4 w-4" />
            Export
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-md">
            {error}
          </div>
        )}

        <div className="rounded-lg border bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="bg-[#3ea6da] text-white">Role Name</TableHead>
                <TableHead className="bg-[#3ea6da] text-white">Role Type</TableHead>
                <TableHead className="bg-[#3ea6da] text-white">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedRoles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell>{role.type}</TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleEditRole(role)}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div 
            ref={loadMoreRef} 
            className="py-4 text-center text-sm text-gray-500"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </div>
            ) : displayedRoles.length < totalRoles && !searchQuery ? (
              "Scroll for more"
            ) : (
              "No more roles to load"
            )}
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

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-[#0C3C60]">
              {editingRole ? 'Edit Role' : 'Role Creation'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Role Type</Label>
                <Select
                  value={newRole.type}
                  onValueChange={(value) => setNewRole(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Portal">Portal</SelectItem>
                    <SelectItem value="App">App</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Role Name <span className="text-red-500">*</span></Label>
                <Input 
                  placeholder="Enter Role Name..."
                  value={newRole.name}
                  onChange={(e) => setNewRole(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Access Permissions</Label>
              <div className="pt-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="hrms"
                    checked={newRole.has_hrms_access}
                    onCheckedChange={(checked) => 
                      setNewRole(prev => ({ ...prev, has_hrms_access: checked as boolean }))
                    }
                  />
                  <label 
                    htmlFor="hrms" 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    HRMS Access
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setEditingRole(null);
                  setNewRole({ type: "", name: "", has_hrms_access: false });
                }}
              >
                Cancel
              </Button>
              <Button 
                className="bg-[#95C11F] hover:bg-[#85ad1b] text-white"
                onClick={editingRole ? handleSaveEdit : handleCreateRole}
                disabled={!newRole.name || !newRole.type || isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {editingRole ? 'Saving...' : 'Creating...'}
                  </div>
                ) : (
                  editingRole ? 'Save Changes' : 'Save'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}