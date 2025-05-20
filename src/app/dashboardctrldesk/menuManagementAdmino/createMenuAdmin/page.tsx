'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiRoutesconsole } from "@/utils/api";
import MenuAdmin from "./menuAdmin";

import { fetchWithCookie } from "@/utils/apiClient2";

// Loading component for Suspense fallback
function LoadingFallback() {
    return <div className="p-6">Loading menu data...</div>;
}

type Menu = {
    menu_id: number;
    menu_name: string;
    parent_id: number;
    parent_name: string;
    active: number;
    module_id: number;
    module_name: string;
    menu_type_id: number;
    menu_type_name: string;
    order_by: number;
    tooltip: {
        menu_path: string;
        menu_icon: string | null;
    };
};

function CreateMenuAdminContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const menuId = searchParams.get('menuId');
    const [menuData, setMenuData] = useState<Menu | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchMenuData = async () => {
            setLoading(true);
            try {
                if (menuId) {
                    const response = await fetchWithCookie(`${apiRoutesconsole.EDIT_MENU_CTRLDSK_MENU}/${menuId}`, "GET");
                    if (response.error) {
                        throw new Error(response.error);
                    }

                    const menu = response.data;
                    setMenuData({
                        menu_id: menu.menu_id,
                        menu_name: menu.menu_name,
                        parent_id: menu.parent_id,
                        parent_name: menu.parent_name,
                        active: menu.active,
                        module_id: menu.module_id,
                        module_name: menu.module_name,
                        menu_type_id: menu.menu_type_id,
                        menu_type_name: menu.menu_type_name,
                        order_by: menu.order_by,
                        tooltip: {
                            menu_path: menu.tooltip?.menu_path || "",
                            menu_icon: menu.tooltip?.menu_icon || null,
                        },
                    });
                }
            } catch (err) {
                console.error("Error fetching menu data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchMenuData();
    }, [menuId]);

    if (loading) {
        return <div className="p-6">Loading...</div>;
    }

    return (
        <main className="p-6">
            <h1 className="text-xl font-bold mb-4">
                {menuId ? 'Edit Menu' : 'Create Menu'}
            </h1>
            <MenuAdmin 
                menuId={menuData?.menu_id ?? null}
                menuName={menuData?.menu_name}
                parentId={menuData?.parent_id}
                parentName={menuData?.parent_name}
                active={menuData?.active !== undefined ? String(menuData.active) : null}
                moduleId={menuData?.module_id}
                moduleName={menuData?.module_name}
                menuPath={menuData?.tooltip.menu_path}
                menuIcon={menuData?.tooltip.menu_icon}
            />
        </main>
    );
}

export default function CreateMenuAdminPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <CreateMenuAdminContent />
        </Suspense>
    );
}
