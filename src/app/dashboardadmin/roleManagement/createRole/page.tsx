'use client';

import apiRoutes from "@/utils/api";
import { fetchWithCookie } from '@/utils/apiClient2';
import React, { useEffect, useState } from 'react';
import MenuTable from '@/components/ui/expandableMenu';
import { useSearchParams, useRouter } from 'next/navigation';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'; // Adjust the path based on your project structure
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input'; // Ensure this path matches your project structure
import { Card } from '@/components/ui/card'; // Adjust the path based on your project structure
import { Button } from '@/components/ui/button'; // Ensure this path matches your project structure

type MenuItem = {
    menu_id: number;
    menu_name: string;
    menu_parent_id: number | null;
    role_id: number | null; // Added field
};

// Define the field mapping for portal menu structure
const PORTAL_FIELD_MAPPING = {
  idField: "menu_id",
  nameField: "menu_name",
  parentIdField: "menu_parent_id",
  roleIdField: "role_id" // Update this if the role ID field name is different
};

const fetchMenu = async (roleId: string | null): Promise<{ data: MenuItem[]; roleName?: string }> => {
    const apiUrl = roleId ? `${apiRoutes.GET_PORTAL_MENU_BY_ROLEID}${roleId}` : apiRoutes.PORTAL_MENU_FULL;

    const { data, error } = await fetchWithCookie(apiUrl);

    if (error || !data) throw new Error(error || "Failed to fetch menu");

    return data as { data: MenuItem[]; roleName?: string };
};

export default function CreateRolePortal() {
    const [menuData, setMenuData] = useState<MenuItem[]>([]);
    const [roleName, setRoleName] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [selectedMenuIds, setSelectedMenuIds] = useState<number[]>([]);
    const searchParams = useSearchParams();
    const router = useRouter();
    const roleId = searchParams.get('roleId');

    useEffect(() => {
        const fetchMenuData = async () => {
            setLoading(true);
            setFetchError(null);
            try {
                const response = await fetchMenu(roleId);
                setMenuData(Array.isArray(response.data) ? response.data : []);
                setRoleName(response.roleName ?? (roleId ? "" : ""));
            } catch (err) {
                setFetchError(err instanceof Error ? err.message : "An unknown error occurred");
                setMenuData([]);
                setRoleName("");
            } finally {
                setLoading(false);
            }
        };

        fetchMenuData();
    }, [roleId]);

    const form = useForm({
        defaultValues: {
            name: '',
        },
        values: {
            name: roleName
        }
    });

    const onSubmit = async () => {
        console.log("selected Menus", { name: roleName });
        console.log("role ID:", roleId);
        console.log("role Name", roleName);
        console.log("Selected menu IDs for submission:", selectedMenuIds);
        
        try {
            setLoading(true);
            let apiUrl, payload;
            
            if (roleId) {
                // Update existing role
                apiUrl = apiRoutes.EDIT_ROLE_TENANT_MENU;
            } else {
                // Create new role
                apiUrl = apiRoutes.CREATE_ROLE_TENANT_ADMIN;
                console.log("Creating new role with API:", apiUrl);
            }
            
            // Using PUT method for both create and update
            if (roleId) {
                // Updating an existing role – send the roleId (backend already knows the name)
                payload = {
                    roleId: Number(roleId),
                    selectedMenuIds
                };
            } else {
                // Creating a new role – send the roleName
                payload = {
                    roleName: roleName.trim(),
                    selectedMenuIds
                };
            }

            console.log("Payload:", payload);
            
            const { data, error } = await fetchWithCookie(apiUrl, 'PUT', payload);
            
            if (error) {
                console.error("API error:", error);
                throw new Error(error);
            }
            
            console.log("API response:", data);
            router.push("/dashboardadmin/roleManagementAdmin");
        } catch (err) {
            console.error("Error submitting role:", err);
            // Add error handling here, e.g. toast notification
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="p-6">
            <h1 className="text-xl font-bold mb-4">
                {roleId ? 'Edit Role' : 'Create Role'}
            </h1>
            <div className="mb-4">
                <Card className="p-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Role Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter role name" {...field} value={roleName} onChange={(e) => setRoleName(e.target.value)} readOnly={!!roleId} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex justify-end space-x-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.push("/dashboardadmin/roleManagementAdmin")}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-[#9BC837] hover:bg-[#8BB72E] text-white"
                                    disabled={loading}
                                >
                                    {loading ? (roleId ? "Updating..." : "Creating...") : (roleId ? "Update Role" : "Create Role")}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </Card>
            </div>
            {loading && <p>Loading menu...</p>}
            {fetchError && <p className="text-red-500">Error loading menu: {fetchError}</p>}
            {!loading && !fetchError && (
                <MenuTable
                    menuData={menuData}
                    onSelectionChange={(selectedIds) => {
                        console.log("Selected menu IDs:", selectedIds);
                        setSelectedMenuIds(selectedIds);
                    }}
                    fieldMapping={PORTAL_FIELD_MAPPING} // Pass the field mapping for this specific menu format
                />
            )}
        </main>
    );
}
