'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import UserAdmin from "./userAdmin";
import apiRoutes from "@/utils/api";
import { fetchWithCookie } from "@/utils/apiClient2";

export default function CreateUserAdminPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const userId = searchParams.get('userId');
    const [userData, setUserData] = useState<{
        userId: string | null;
        roleId: string | null;
        userName: string | null;
        userEmail: string | null;
        roleName: string | null;
        active: string | null;
    }>({
        userId: null,
        roleId: null,
        userName: null,
        userEmail: null,
        roleName: null,
        active: null
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // If userId is provided, fetch user data for editing
        const fetchUserData = async () => {
            if (userId) {
                setLoading(true);
                try {
                    const response = await fetchWithCookie(`${apiRoutes.EDIT_USER_TENANT_MENU}/${userId}`, "GET");
                    if (response.error) {
                        throw new Error(response.error);
                    }
                    
                    const user = response.data;
                    if (user) {
                        setUserData({
                            userId: userId,
                            roleId: user.con_role_id?.toString() || null,
                            userName: user.con_user_name || null,
                            userEmail: user.con_user_login_email_id || null,
                            roleName: user.con_role_name || null,
                            active: user.active?.toString() || null
                        });
                    }
                } catch (err) {
                    console.error("Error fetching user data:", err);
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchUserData();
    }, [userId]);

    if (loading) {
        return <div className="p-6">Loading...</div>;
    }

    return (
        <main className="p-6">
            <h1 className="text-xl font-bold mb-4">
                {userId ? 'Edit User' : 'Create User'}
            </h1>
            <UserAdmin 
                userId={userData.userId || userId}
                roleId={userData.roleId}
                userName={userData.userName}
                userEmail={userData.userEmail}
                roleName={userData.roleName}
                active={userData.active}
            />
        </main>
    );
}
