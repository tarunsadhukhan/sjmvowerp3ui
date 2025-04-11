"use client";

import { useState, useEffect, useCallback } from "react";
import apiRoutes from "@/utils/api";
import { apiClient } from "@/utils/apiClient";

interface MenuItem {
  title: string;
  path?: string;
  icon: string;
  submenu?: MenuItem[];
}

export function useCompanyConsoleMenu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const subdomain = typeof window !== "undefined" ? window.location.hostname.split(".")[0] : null;
  
  const fetchMenusConsole = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams({}).toString();
      const response = await apiClient({
        url: `${apiRoutes.MENU_CONSOLE}?${queryParams}`,
        method: "GET",
        withCredentials: true,
      });
      if (response.isError) {
        console.error(response.error);
        setMenuItems([]);
        return;
      }
      
      setMenuItems(response.data.data || []);
    } catch (error) {
      console.error("Error fetching menus:", error);
      setMenuItems([]);
    }
  }, [subdomain]);

  useEffect(() => {
    setLoading(true);
    fetchMenusConsole().finally(() => setLoading(false));
  }, [fetchMenusConsole]);

  return {
    menuItems,
    loading,
  };
}

