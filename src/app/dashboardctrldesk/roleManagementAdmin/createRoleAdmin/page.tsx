'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSearchParams, useRouter } from 'next/navigation';
import { fetchWithCookie } from '@/utils/apiClient2';
import apiRoutes from '@/utils/api';
import FormFieldWrapper from '@/components/ui/FormFieldWrapper';

// Loading component for Suspense fallback
function LoadingFallback() {
    return <div className="p-6">Loading role data...</div>;
}

// Component with useSearchParams hook
function CreateRoleAdminContent() {
    const searchParams = useSearchParams();
    const roleId = searchParams.get('roleId');
    const router = useRouter();
    
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [roleName, setRoleName] = useState<string>('');
    
    // Initialize form with the role name
    const form = useForm({
        defaultValues: {
            roleName: "",
        },
    });
    
    // Watch for changes in the roleName field
    const watchedRoleName = form.watch("roleName");
    
    // Update the roleName state when the form value changes
    useEffect(() => {
        setRoleName(watchedRoleName);
    }, [watchedRoleName]);

    // Fetch role data if editing
    useEffect(() => {
        if (roleId) {
            const fetchRoleData = async () => {
                setLoading(true);
                try {
                    const response = await fetchWithCookie(`${apiRoutes.ADMIN_TENANT_MENU_BY_ROLEID}${roleId}`, 'GET');
                    if (response.error) {
                        throw new Error(response.error);
                    }
                    
                    const roleData = response.data;
                    setRoleName(roleData.role_name || '');
                    form.setValue('roleName', roleData.role_name || '');
                } catch (err) {
                    setError(err instanceof Error ? err.message : 'Failed to fetch role data');
                } finally {
                    setLoading(false);
                }
            };

            fetchRoleData();
        }
    }, [roleId, form]);

    const onSubmit = async (data: any) => {
        setLoading(true);
        setError(null);
        
        try {
            // Prepare payload based on create or update
            const payload = {
                role_name: data.roleName
            };
            
            let response;
            if (roleId) {
                // Update existing role
                response = await fetchWithCookie(`${apiRoutes.EDIT_ROLE_TENANT_MENU}${roleId}`, 'PUT', payload);
            } else {
                // Create new role
                response = await fetchWithCookie(apiRoutes.CREATE_ROLE_TENANT_ADMIN, 'POST', payload);
            }
            
            if (response.error) {
                throw new Error(response.error);
            }
            
            // Redirect back to role management page on success
            router.push('/dashboardadmin/roleManagementAdmin');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-xl font-bold mb-4">
                {roleId ? 'Edit Role' : 'Create Role'}
            </h1>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <Card className="p-6 max-w-md">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormFieldWrapper
                            control={form.control}
                            name="roleName"
                            label="Role Name"
                            placeholder="Enter Role Name"
                            type="text"
                            required={true}
                        />
                        
                        <div className="flex justify-end space-x-4">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => router.push('/dashboardadmin/roleManagementAdmin')}
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                className="bg-[#9BC837] hover:bg-[#8BB72E] text-white"
                                disabled={loading}
                            >
                                {loading ? 'Processing...' : roleId ? 'Update Role' : 'Create Role'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </Card>
        </div>
    );
}

// Main export that wraps the content with Suspense
export default function CreateRoleAdminPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <CreateRoleAdminContent />
        </Suspense>
    );
}
