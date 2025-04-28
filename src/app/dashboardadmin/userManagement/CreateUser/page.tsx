'use client';

import apiRoutes from "@/utils/api";
import { fetchWithCookie } from '@/utils/apiClient2';
import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import FormFieldWrapper from "@/components/ui/FormFieldWrapper";
import ControlledFormFieldWrapper from "./ControlledFormFieldWrapper";
import Menu from "@/components/ui/expandableMenuTable/ExpandableMenu";
import { transformDataIds, IdTransformConfig, extractOriginalId } from "@/utils/idmanager";

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
        name?: string;
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
    // Create array to hold individual branch role assignments
    const formattedSelection: any[] = [];
    
    // Process each selected branch
    selectedBranchIds.forEach(branchId => {
        // Find the branch in hierarchical data
        const branch = hierarchicalData.find(item => 
            item.company_id === branchId && item.parent_id !== null
        );
        
        if (branch) {
            const companyId = branch.parent_id;
            const roleId = branchRoleAssignments[branchId] || "0";
            
            // Ensure IDs are strings before passing to extractOriginalId
            const originalCompanyId = typeof companyId === 'string' ? extractOriginalId(companyId) : companyId;
            const originalBranchId = typeof branchId === 'string' ? extractOriginalId(branchId) : branchId;
            const originalRoleId = roleId;
            
            // Create separate entry for each branch role assignment
            formattedSelection.push({
                company_id: originalCompanyId,
                branch_id: originalBranchId,
                role_id: originalRoleId
            });
        }
    });
    
    return formattedSelection;
};

// Configure which IDs to transform and how to handle relationships
const idTransformConfig: IdTransformConfig = {
    // Only transform company_id and branch_id, leave role_id as is
    fieldsToTransform: ['company_id', 'branch_id'],
    // Define parent-child relationships for nested entities
    relationships: [
        {
            parent: 'company',
            parentIdField: 'company_id',
            child: 'branch',
            childArrayField: 'branches',
            childIdField: 'branch_id'
        }
    ]
};

// Transform API data to ensure unique, descriptive IDs for companies and branches
// const transformApiData = (data: UserSetupData): UserSetupData => {
//     if (!data) return data;
    
//     // Create a deep copy of the data with transformed IDs
//     const transformedData = transformDataIds(data, idTransformConfig);
    
//     return transformedData;
// };

// Add this function before the CreateUser function
const mapDataForMenu = (data: any[], fieldMapping: any) => {
    return data.map(item => {
        const { idField, nameField, parentIdField, roleIdField } = fieldMapping;
        
        return {
            ...item,
            id: item[idField]?.toString(), // Convert to string for safety
            name: item[nameField],
            parentId: item[parentIdField],
            roleId: item[roleIdField],
        };
    });
};

// Helper function to prepare menu items from companies and branches
const prepareMenuItems = (companies: Company[]) => {
    if (!companies || !Array.isArray(companies)) return [];
    
    return companies.map(company => {
        // Transform company_id to a unique string format
        const companyId = `company_id_${company.company_id}`;
        
        // Map branches to menu item children
        const children = company.branches?.map(branch => {
            // Transform branch_id to a unique string format that includes parent context
            const branchId = `company_branch_id_${branch.branch_id}`;
            
            return {
                id: branchId,
                label: branch.branch_name,
                assignment: branch.role_id
            };
        }) || [];
        
        return {
            id: companyId,
            label: company.company_name,
            children
        };
    });
};

// Helper function to prepare assignment options from roles
const prepareAssignmentOptions = (roles: { role_id: string; role_name: string }[]) => {
    if (!roles || !Array.isArray(roles)) return [];
    
    // Add "Not Assigned" as the first option
    return [
        { label: "Not Assigned", value: null },
        ...roles.map(role => ({
            label: role.role_name,
            value: role.role_id
        }))
    ];
};

// Wrapper component that uses searchParams
function CreateUserContent() {
    const [userName, setUserName] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [isActive, setIsActive] = useState<boolean>(true);
    const [loading, setLoading] = useState<boolean>(true);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [selectedBranchIds, setSelectedBranchIds] = useState<number[]>([]);
    const [branchRoleAssignments, setBranchRoleAssignments] = useState<Record<number, string>>({});
    const [roleOptions, setRoleOptions] = useState<{ value: string; label: string }[]>([]);
    const [hierarchicalData, setHierarchicalData] = useState<any[]>([]);
    const [menuItems, setMenuItems] = useState<any[]>([]);
    const [assignmentOptions, setAssignmentOptions] = useState<any[]>([]);
    const [name, setName] = useState<string>(''); // Add state for name field
    
    const searchParams = useSearchParams();
    const router = useRouter();
    const userId = searchParams.get('userId');
    const isEditMode = !!userId;
    
    // Initialize form with default values - updating field names to match FormFieldWrapper
    const form = useForm<{ username: string; password: string; name: string }>({
        defaultValues: {
            username: userName || '',
            password: '',
            name: name || '',
        }
    });

    // Use effect to update form values when userName changes (for edit mode)
    useEffect(() => {
        if (userName) {
            form.setValue('username', userName);
        }
    }, [userName, form]);

    useEffect(() => {
        const fetchUserSetupData = async () => {
            setLoading(true);
            setFetchError(null);
            
            try {
                console.log("Fetching user setup data. isEditMode:", isEditMode, "userId:", userId);
                
                // Fetch the basic setup data (companies, roles) first
                const setupResponse = await fetchWithCookie(apiRoutes.PORTAL_USER_CREATE_FULL);
                
                if (setupResponse.error) {
                    throw new Error(setupResponse.error);
                }
                
                if (!setupResponse.data) {
                    throw new Error("No setup data received from API");
                }
                
                const setupData = setupResponse.data as UserSetupData;
                console.log("Setup data processed:", setupData);
                
                // Process roles data
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
                    
                    // Prepare assignment options for the Menu component
                    setAssignmentOptions(prepareAssignmentOptions(setupData.roles));
                } else {
                    // Set default role option if roles are not available
                    setRoleOptions([{ value: "0", label: "Not Assigned" }]);
                    console.warn("No roles data available from API");
                }
                
                // Transform companies and branches for the hierarchical dropdown
                const transformedData = prepareHierarchicalData(setupData.companies);
                setHierarchicalData(transformedData);
                
                // Prepare menu items for the expandable menu
                const menuItemsData = prepareMenuItems(setupData.companies);
                setMenuItems(menuItemsData);
                
                // If in edit mode, fetch user data separately using PORTAL_USER_EDIT_BY_USERID
                if (isEditMode && userId) {
                    console.log("Fetching user data for edit mode with userId:", userId);
                    
                    // Use the user-specific API endpoint with just userId at the end
                    const userApiUrl = `${apiRoutes.PORTAL_USER_EDIT_BY_USERID}/${userId}`;
                    console.log("User data API URL:", userApiUrl);
                    
                    const userResponse = await fetchWithCookie(userApiUrl);
                    console.log("User API response received:", userResponse);
                    
                    if (userResponse.error) {
                        throw new Error(userResponse.error);
                    }
                    
                    if (!userResponse.data) {
                        throw new Error("No user data received from API");
                    }
                    
                    const userData = userResponse.data;
                    console.log("User data processed:", userData);
                    
                    // Set user info from the user-specific API response
                    if (userData.user) {
                        console.log("Setting user info from API response:", userData.user);
                        setUserName(userData.user.user_name);
                        setIsActive(userData.user.is_active);
                        
                        // Set name if available
                        if (userData.user.name) {
                            setName(userData.user.name);
                            form.setValue('name', userData.user.name);
                        }
                        
                        // Set form values for username
                        console.log("Setting username:", userData.user.user_name);
                        setUserName(userData.user.user_name);
                        form.setValue('username', userData.user.user_name);
                    } else {
                        console.warn("No user data in API response");
                    }
                    
                    // Process companies and branches to set role assignments
                    if (userData.companies && Array.isArray(userData.companies)) {
                        console.log("Processing companies from API response:", userData.companies);
                        
                        const branchRoles: Record<number, string> = {};
                        const selectedIds: number[] = [];
                        
                        // Extract branch role assignments from the companies data
                        userData.companies.forEach((company: Company) => {
                            if (company.branches && Array.isArray(company.branches)) {
                                company.branches.forEach((branch: Branch) => {
                                    if (branch.role_id) {
                                        branchRoles[branch.branch_id] = branch.role_id;
                                        selectedIds.push(branch.branch_id);
                                    }
                                });
                            }
                        });
                        
                        console.log("Setting branch role assignments:", branchRoles);
                        console.log("Setting selected branch IDs:", selectedIds);
                        
                        setBranchRoleAssignments(branchRoles);
                        setSelectedBranchIds(selectedIds);
                        
                        // Update menu items with the role assignments
                        const updatedMenuItems = prepareMenuItems(userData.companies);
                        setMenuItems(updatedMenuItems);
                        
                        // Transform companies and branches for the hierarchical dropdown
                        const transformedData = prepareHierarchicalData(userData.companies);
                        setHierarchicalData(transformedData);
                    }
                    
                    // Set role options from the API response
                    if (userData.roles && Array.isArray(userData.roles)) {
                        console.log("Setting role options from API response:", userData.roles);
                        
                        // Interfaces for stronger typing
                        interface ApiRole {
                            role_id: string;
                            role_name: string;
                        }

                        interface RoleOption {
                            value: string;
                            label: string;
                        }

                        const formattedRoles: RoleOption[] = (userData.roles as ApiRole[]).map(
                            (role: ApiRole): RoleOption => ({
                                value: role.role_id,
                                label: role.role_name,
                            }),
                        );
                        
                        // Add "Not Assigned" option as the first option
                        const rolesList: { value: string; label: string }[] = [
                            { value: "0", label: "Not Assigned" },
                            ...formattedRoles
                        ];
                        
                        setRoleOptions(rolesList);
                        
                        // Prepare assignment options for the Menu component
                        setAssignmentOptions(prepareAssignmentOptions(userData.roles));
                    }
                }
            } catch (error) {
                console.error("Failed to fetch data:", error);
                setFetchError(error instanceof Error ? error.message : "An unknown error occurred");
            } finally {
                setLoading(false);
            }
        };
        
        fetchUserSetupData();
    }, [isEditMode, userId, form]);

    // Handler for assignment change in the Menu component
    const handleAssignmentChange = (itemId: string, value: string | null) => {
        console.log(`Assignment changed for ${itemId}:`, value);
        
        // Extract the branch ID from the transformed ID
        const matches = itemId.match(/company_branch_id_(\d+)$/);
        if (matches && matches[1]) {
            const branchId = parseInt(matches[1]);
            
            // Update branch role assignments
            setBranchRoleAssignments(prev => ({
                ...prev,
                [branchId]: value || "0"
            }));
            
            // Make sure the branch is selected
            if (!selectedBranchIds.includes(branchId)) {
                setSelectedBranchIds(prev => [...prev, branchId]);
            }
        }
    };

    const onSubmit = async (formData: any) => {
        try {
            setLoading(true);
            setFetchError(null);
            
            // Format branch role selections for API submission
            const formattedBranchRoles = formatSelectionByCompany(
                selectedBranchIds,
                branchRoleAssignments,
                hierarchicalData
            );
            
            // Prepare different data formats for create vs edit operations
            let submitData;
            
            if (isEditMode) {
                // For edit mode, only send the user_id and branch_roles
                submitData = {
                    user_id: userId,
                    is_active: isActive,
                    branch_roles: formattedBranchRoles
                };
            } else {
                // For create mode, include all user information
                submitData = {
                    user_name: formData.username || userName,
                    password: formData.password || password,
                    name: name,
                    is_active: isActive,
                    branch_roles: formattedBranchRoles
                };
            }
            
            console.log("Submitting data:", submitData);
            
            // API URL based on mode (create or edit)
            const apiUrl = isEditMode
                ? `${apiRoutes.EDIT_PORTAL_USER}?userId=${userId}`
                : apiRoutes.CREATE_PORTAL_USER;
            
            // Submit the form
            const response = await fetchWithCookie(
                apiUrl,
                'POST',
                submitData
            );
            
            if (response.error) {
                throw new Error(response.error);
            }
            
            // Redirect on success
            console.log(`User ${isEditMode ? 'updated' : 'created'} successfully:`);
            router.push("/dashboardadmin/userManagement");
        } catch (error) {
            console.error(`Failed to ${isEditMode ? 'update' : 'create'} user:`, error);
            setFetchError(error instanceof Error ? error.message : "An unknown error occurred");
        } finally {
            setLoading(false);
        }
    };

    // In the component, right before returning JSX, add this line
    const menuFormattedData = mapDataForMenu(hierarchicalData, COMPANY_BRANCH_FIELD_MAPPING);

    return (
        <main className="p-6">
            <h1 className="text-xl font-bold mb-4">
                {isEditMode ? 'Edit User' : 'Create User'}
            </h1>
            <div className="mb-4">
                <Card className="p-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <ControlledFormFieldWrapper
                            name="name"
                            control={form.control}
                            label="Name"
                            placeholder="Enter Name"
                            disabled={false} // Updated to false to allow editing the name in edit mode
                            required={true}
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                form.setValue('name', e.target.value);
                            }}
                        />
                        <ControlledFormFieldWrapper
                            name="username"
                            control={form.control}
                            label="User Name"
                            placeholder="Enter Email ID"
                            disabled={isEditMode}
                            required={true}
                            value={userName}
                            onChange={(e) => {
                                setUserName(e.target.value);
                                form.setValue('username', e.target.value);
                            }}
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
            {!loading && !fetchError && menuItems.length > 0 && (
                <div className="mt-8">
                    <h2 className="text-lg font-semibold mb-4">Assign User to Branches</h2>
                    <Card className="p-6">
                        <Menu 
                            items={menuItems}
                            assignmentOptions={assignmentOptions}
                            onAssignmentChange={handleAssignmentChange}
                            title="Branch Role Assignments"
                            description="Assign roles to user for each branch"
                        />
                    </Card>
                </div>
            )}
        </main>
    );
}

// Loading fallback component
function LoadingFallback() {
    return <div className="p-6">Loading user data...</div>;
}

// Main component that wraps the content with Suspense
export default function CreateUser() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <CreateUserContent />
        </Suspense>
    );
}
