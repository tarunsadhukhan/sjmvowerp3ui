import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import apiRoutes from "@/utils/api";
import { fetchWithCookie } from "@/utils/apiClient2";
import FormFieldWrapper from "@/components/ui/FormFieldWrapper";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface UserAdminProps {
    userId: string | null;
    roleId: string | null;
    userName: string | null;
    userEmail: string | null;
    roleName: string | null;
    active: string | null;
}

interface Role {
    con_role_id: number;
    con_role_name: string;
}

const UserAdmin = ({
    userId,
    roleId,
    userName,
    userEmail,
    roleName,
    active
}: UserAdminProps) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [roles, setRoles] = useState<Role[]>([]);
    const [selectedRoleId, setSelectedRoleId] = useState<number | null>(roleId ? parseInt(roleId) : null);
    const [isActive, setIsActive] = useState(active === "1" || active === null || active === undefined);
    const router = useRouter();
    
    const form = useForm({
        defaultValues: {
            name: userName || "",
            email: userEmail || "",
            password: "",
            roleId: roleId || "",
            active: isActive
        },
    });
    
    // Fetch available roles on component mount
    useEffect(() => {
        const fetchAvailableRoles = async () => {
            try {
                // Use the ROLES_DROPDOWN endpoint to get available roles
                const response = await fetchWithCookie(apiRoutes.ROLES_DROPDOWN, "GET");
                if (response.error) {
                    throw new Error(response.error);
                }
                
                // Save the fetched roles
                const fetchedRoles = response.data || [];
                setRoles(fetchedRoles);
                
                // If editing and roleId is provided, set the selected role
                if (roleId) {
                    setSelectedRoleId(parseInt(roleId));
                } 
                // For new user creation, select the first role as default if available
                else if (fetchedRoles.length > 0) {
                    const firstRoleId = fetchedRoles[0].con_role_id;
                    setSelectedRoleId(firstRoleId);
                    form.setValue("roleId", firstRoleId.toString());
                }
            } catch (err) {
                console.error("Error fetching roles:", err);
                setError("Failed to fetch roles. Please try again.");
            }
        };

        fetchAvailableRoles();
    }, [roleId, form]);
    
    const onSubmit = async (data: any) => {
        setLoading(true);
        setError(null);
    
        try {
            // For editing users, we only include the role ID and active status
            // as those are the only fields that should be editable
            const payload: {
                roleId: number | null;
                active: number;
                name?: string;
                email?: string;
                password?: string;
            } = {
                roleId: selectedRoleId,
                active: isActive ? 1 : 0
            };

            // Only include other fields when creating a new user
            if (!userId) {
                payload.name = data.name;
                payload.email = data.email;
                
                if (data.password) {
                    payload.password = data.password;
                }
                
                // Log the data being submitted for create operations
                console.log("Creating new user with data:", payload);
                
                // Save to localStorage as JSON (for development purposes)
                try {
                    const existingData = localStorage.getItem('createdUsers') || '[]';
                    const parsedData = JSON.parse(existingData);
                    
                    // Add timestamp for tracking
                    const userWithTimestamp = {
                        ...payload,
                        timestamp: new Date().toISOString()
                    };
                    
                    // Add to existing data
                    parsedData.push(userWithTimestamp);
                    
                    // Save back to localStorage
                    localStorage.setItem('createdUsers', JSON.stringify(parsedData));
                    
                    console.log("User data saved to localStorage");
                } catch (storageError) {
                    console.error("Error saving user data to localStorage:", storageError);
                }
            }

            // Choose API endpoint based on whether we're creating or editing
            const apiUrl = userId
                ? `${apiRoutes.EDIT_USER_TENANT_MENU}/${userId}`
                : apiRoutes.CREATE_USER_TENANT_ADMIN;
            
            const method = userId ? "PUT" : "POST";
            
            const response = await fetchWithCookie(apiUrl, method, payload);
            if (response.error) {
                throw new Error(response.error);
            }
            router.push("/dashboardadmin/userManagementAdmin");
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred");
        } finally {
            setLoading(false);
        }
    };

    // Handler for role selection change
    const handleRoleChange = (selectedValue: string) => {
        // Convert selected value to number
        const parsedRoleId = parseInt(selectedValue);
        setSelectedRoleId(parsedRoleId);
        
        // Update form value
        form.setValue("roleId", selectedValue);
    };

    return (
        <Card className="p-6 max-w-md mx-auto mt-10">
            <h2 className="text-lg font-semibold mb-4">{userId ? "Edit User" : "Create User"}</h2>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    {/* Always disable name and email fields for editing, enable for creation */}
                    <FormFieldWrapper
                        name="name"
                        control={form.control}
                        label="Name"
                        placeholder="Enter Name"
                        disabled={userId !== null}
                        required={!userId}
                    />
                    
                    <FormFieldWrapper
                        name="email"
                        control={form.control}
                        label="Username"
                        placeholder="Enter Email ID"
                        type="email"
                        disabled={userId !== null}
                        required={!userId}
                    />

                    {/* Only show password field when creating a new user */}
                    {!userId && (
                        <FormFieldWrapper
                            name="password"
                            control={form.control}
                            label="Password"
                            placeholder="Enter password"
                            type="password"
                            required
                        />
                    )}
                    
                    {/* Role dropdown is always editable */}
                    <FormFieldWrapper
                        name="roleId"
                        control={form.control}
                        label="Role"
                        placeholder="Select Role"
                        type="select"
                        options={roles.map(role => ({
                            value: role.con_role_id.toString(),
                            label: role.con_role_name
                        }))}
                        required
                    />
                    
                    {/* Active checkbox is always editable */}
                    <div className="flex items-center space-x-2">
                        <Checkbox 
                            id="active" 
                            checked={isActive} 
                            onCheckedChange={(checked) => setIsActive(checked === true)}
                        />
                        <Label htmlFor="active">Active</Label>
                    </div>
                    
                    <div className="flex justify-end space-x-4 pt-4">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => router.push("/dashboardadmin/userManagementAdmin")}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            className="bg-[#9BC837] hover:bg-[#8BB72E] text-white"
                            disabled={loading || !selectedRoleId}
                        >
                            {loading ? "Processing..." : userId ? "Update User" : "Create User"}
                        </Button>
                    </div>
                </form>
            </Form>
        </Card>
    );
}

export default UserAdmin;



