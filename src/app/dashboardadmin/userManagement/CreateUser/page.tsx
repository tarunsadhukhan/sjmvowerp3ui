'use client';

import apiRoutes from "@/utils/api";
import { fetchWithCookie } from '@/utils/apiClient2';
import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import ExpandableTableWithDropdown from "@/components/ui/expandableTableWithDropdown";
import FormFieldWrapper from "@/components/ui/FormFieldWrapper";

// Define company and branch structure
type Company = {
    company_id: number;
    company_name: string;
    branches?: Branch[];
};

type Branch = {
    branch_id: number;
    branch_name: string;
    company_id: number;
    role_id?: string | null;
};

// Define field mapping for the hierarchical structure
const COMPANY_BRANCH_FIELD_MAPPING = {
    idField: "company_id",
    nameField: "company_name",
    parentIdField: "parent_id", // Will be null for parent items
    roleIdField: "role_id"
};

// Type for API response
interface UserSetupData {
    companies: Company[];
    roles: {
        role_id: string;
        role_name: string;
    }[];
    user?: {
        user_id: string;
        user_name: string;
        is_active: boolean;
        branch_roles: {
            branch_id: number;
            role_id: string;
        }[];
    };
}

// Function to transform data into the format expected by ExpandableTableWithDropdown
const prepareHierarchicalData = (companies: Company[]): any[] => {
    // Return empty array if companies is undefined
    if (!companies || !Array.isArray(companies)) {
        console.warn("No company data available");
        return [];
    }
    
    const result: any[] = [];
    
    // Add companies as parents
    companies.forEach(company => {
        result.push({
            company_id: company.company_id,
            company_name: company.company_name,
            parent_id: null // Parent items have null parent_id
        });
        
        // Add branches as children
        if (company.branches && Array.isArray(company.branches)) {
            company.branches.forEach(branch => {
                result.push({
                    company_id: branch.branch_id,
                    company_name: branch.branch_name,
                    parent_id: company.company_id, // Link to parent company
                    role_id: branch.role_id || "0" // Convert null role_id to "0" (Not Assigned)
                });
            });
        }
    });
    
    return result;
};

// Function to format the selection data by company
const formatSelectionByCompany = (
    selectedBranchIds: number[], 
    branchRoleAssignments: Record<number, string>,
    hierarchicalData: any[]
) => {
    // Group branches by company
    const branchesByCompany: Record<number, { branchId: number, roleId: string }[]> = {};
    
    // Get all companies from the hierarchical data
    const companies = hierarchicalData.filter(item => item.parent_id === null);
    
    // Process each selected branch
    selectedBranchIds.forEach(branchId => {
        // Find the branch in hierarchical data
        const branch = hierarchicalData.find(item => 
            item.company_id === branchId && item.parent_id !== null
        );
        
        if (branch) {
            const companyId = branch.parent_id;
            const roleId = branchRoleAssignments[branchId] || "0";
            
            // Initialize company entry if it doesn't exist
            if (!branchesByCompany[companyId]) {
                branchesByCompany[companyId] = [];
            }
            
            // Add branch and role to the company
            branchesByCompany[companyId].push({
                branchId,
                roleId
            });
        }
    });
    
    // Format the final output
    const formattedSelection: any[] = [];
    
    Object.entries(branchesByCompany).forEach(([companyId, branches]) => {
        const companyEntry: any = {
            company_id: Number(companyId)
        };
        
        // Add branches and their roles
        branches.forEach(({ branchId, roleId }) => {
            companyEntry[`branch_${branchId}`] = roleId;
        });
        
        formattedSelection.push(companyEntry);
    });
    
    return formattedSelection;
};

export default function CreateUser() {
    const [userName, setUserName] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [isActive, setIsActive] = useState<boolean>(true);
    const [loading, setLoading] = useState<boolean>(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [selectedBranchIds, setSelectedBranchIds] = useState<number[]>([]);
    const [branchRoleAssignments, setBranchRoleAssignments] = useState<Record<number, string>>({});
    const [roleOptions, setRoleOptions] = useState<{ value: string; label: string }[]>([]);
    const [hierarchicalData, setHierarchicalData] = useState<any[]>([]);
    
    const searchParams = useSearchParams();
    const router = useRouter();
    const userId = searchParams.get('userId');
    const isEditMode = !!userId;
    
    const form = useForm<{ name: string; password: string }>({
        defaultValues: {
            name: '',
            password: '',
        }
    });

    useEffect(() => {
        const fetchUserSetupData = async () => {
            setLoading(true);
            setFetchError(null);
            
            try {
                // Prepare URL - add userId if in edit mode
                const apiUrl = isEditMode 
                    ? `${apiRoutes.PORTAL_USER_CREATE_FULL}?userId=${userId}` 
                    : apiRoutes.PORTAL_USER_CREATE_FULL;
                
                // Fetch data from the API
                const { data, error } = await fetchWithCookie(apiUrl);
                
                if (error) {
                    throw new Error(error);
                }
                
                if (!data) {
                    throw new Error("No data received from API");
                }
                
                const setupData = data as UserSetupData;
                
                // Map roles from API format to component format with proper type checking
                if (setupData.roles && Array.isArray(setupData.roles)) {
                    // Create properly typed roles array
                    const formattedRoles: { value: string; label: string }[] = setupData.roles.map(role => {
                        // Use type assertion with a type guard to safely access properties
                        const apiRole = role as { role_id?: string; role_name?: string; value?: string; label?: string };
                        return {
                            value: apiRole.role_id || apiRole.value || '0',
                            label: apiRole.role_name || apiRole.label || 'Unknown'
                        };
                    });
                    
                    // Add "Not Assigned" option as the first option
                    const rolesList: { value: string; label: string }[] = [
                        { value: "0", label: "Not Assigned" },
                        ...formattedRoles
                    ];
                    
                    setRoleOptions(rolesList);
                } else {
                    // Set default role option if roles are not available
                    setRoleOptions([{ value: "0", label: "Not Assigned" }]);
                    console.warn("No roles data available from API");
                }
                
                // Transform companies and branches for the hierarchical dropdown
                const transformedData = prepareHierarchicalData(setupData.companies);
                setHierarchicalData(transformedData);
                
                // If in edit mode, populate the form with user data
                if (isEditMode && setupData.user) {
                    // Set basic user info
                    setUserName(setupData.user.user_name);
                    setIsActive(setupData.user.is_active);
                    
                    // Extract branch assignments and roles
                    const branchIds = setupData.user.branch_roles.map(br => br.branch_id);
                    const roleAssignments: Record<number, string> = {};
                    
                    setupData.user.branch_roles.forEach(br => {
                        roleAssignments[br.branch_id] = br.role_id;
                    });
                    
                    setSelectedBranchIds(branchIds);
                    setBranchRoleAssignments(roleAssignments);
                }
            } catch (err) {
                console.error("Error fetching user setup data:", err);
                setFetchError(err instanceof Error ? err.message : "An unknown error occurred");
            } finally {
                setLoading(false);
            }
        };
        
        fetchUserSetupData();
    }, [isEditMode, userId]);

    const onSubmit = async () => {
        if (!userName.trim()) {
            alert("Username is required");
            return;
        }
        
        if (!isEditMode && !password.trim()) {
            alert("Password is required");
            return;
        }
        
        setLoading(true);
        
        try {
            // Ensure selectedBranchIds is an array before mapping
            const branchAssignments = Array.isArray(selectedBranchIds) 
                ? selectedBranchIds.map(branchId => ({
                    branchId,
                    roleId: branchRoleAssignments[branchId] || "3" // Default to "User" role
                }))
                : [];
                
            // Prepare payload based on whether we're creating or editing a user
            const payload = isEditMode 
                ? {
                    userId: Number(userId),
                    userName,
                    isActive,
                    branchAssignments
                } 
                : {
                    userName,
                    password,
                    branchAssignments
                };
            
            console.log("Submitting user data:", payload);
            
            // Determine the API endpoint based on edit mode
            const apiEndpoint = isEditMode 
                ? `${apiRoutes.EDIT_PORTAL_ROLE}${userId}` 
                : apiRoutes.CREATE_PORTAL_USER;
            
            // Call the actual API endpoint
            const response = await fetchWithCookie(
                apiEndpoint,
                isEditMode ? "PUT" : "POST",
                payload
            );
            
            if (response.error) {
                throw new Error(response.error);
            }
            
            console.log(`User ${isEditMode ? 'updated' : 'created'} successfully:`, response.data);
            router.push("/dashboardadmin/userManagement");
        } catch (error) {
            console.error(`Failed to ${isEditMode ? 'update' : 'create'} user:`, error);
            setFetchError(error instanceof Error ? error.message : "An unknown error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="p-6">
            <h1 className="text-xl font-bold mb-4">
                {isEditMode ? 'Edit User' : 'Create User'}
            </h1>
            <div className="mb-4">
                <Card className="p-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormFieldWrapper
                            name="username"
                            control={form.control}
                            label="User Name"
                            placeholder="Enter Email ID"
                            disabled={isEditMode}
                            required={true}
                        />

                            {!isEditMode && (
                        <FormFieldWrapper
                                    name="password"
                                    control={form.control}
                                    label="Password"
                                    placeholder="Enter password"
                                    type="password"
                                    required={true}
                        />
                            )}

                            {isEditMode && (
                                <div className="flex items-center space-x-2">
                                    <Checkbox 
                                        id="active" 
                                        checked={isActive}
                                        onCheckedChange={(checked) => setIsActive(checked as boolean)} 
                                    />
                                    <label
                                        htmlFor="active"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        Active
                                    </label>
                                </div>
                            )}
                            
                            <div className="flex justify-end space-x-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.push("/dashboardadmin/userManagement")}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-[#9BC837] hover:bg-[#8BB72E] text-white"
                                    disabled={loading}
                                >
                                    {loading ? (isEditMode ? "Updating..." : "Creating...") : (isEditMode ? "Update User" : "Create User")}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </Card>
            </div>
            {loading && <p>Loading company and branch data...</p>}
            {fetchError && <p className="text-red-500">Error: {fetchError}</p>}
            {!loading && !fetchError && hierarchicalData.length > 0 && (
                <div className="mt-8">
                    <h2 className="text-lg font-semibold mb-4">Assign User to Branches</h2>
                    <Card className="p-6">
                        <ExpandableTableWithDropdown
                            data={hierarchicalData}
                            onSelectionChange={(selectedIds, accessLevels) => {
                                console.log("Selected branch IDs:", selectedIds);
                                console.log("Branch role assignments:", accessLevels);
                                
                                // Format the selection data by company
                                if (accessLevels) {
                                    const formattedSelection = formatSelectionByCompany(
                                        selectedIds, 
                                        accessLevels, 
                                        hierarchicalData
                                    );
                                    console.log("Formatted selection by company:", formattedSelection);
                                }
                                
                                setSelectedBranchIds(selectedIds);
                                if (accessLevels) {
                                    setBranchRoleAssignments(accessLevels);
                                }
                            }}
                            fieldMapping={COMPANY_BRANCH_FIELD_MAPPING}
                            dropdownOptions={roleOptions}
                            parentLabel="Company"
                            childLabel="Branch"
                            selectionLabel="Role"
                            initialSelectedIds={selectedBranchIds}          // ← added
                            initialAccessLevels={branchRoleAssignments}     // ← added
                        />
                    </Card>
                </div>
            )}
        </main>
    );
}
