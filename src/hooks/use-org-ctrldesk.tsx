"use client";

import { useState, useEffect, useCallback } from "react";
import { apiRoutes } from "@/utils/api";
import axios from "axios";

interface MenuItem {
  title: string;
  path?: string;
  icon: string;
  submenu?: MenuItem[];
}

export function useCompanyConsole() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);

  const subdomain = typeof window !== "undefined" ? localStorage.getItem("subdomain") : null;
  const cookieData = typeof window !== "undefined" ? document.cookie : null;
  console.log("subdomain from use company cookie console", cookieData);
  console.log("subdomain from use company console", subdomain);

  const fetchMenusConsole = useCallback(async () => {
    // const cookies = typeof window !== "undefined" ? document.cookie.split("; ") : [];
    const userId = typeof window !== "undefined" ? localStorage.getItem("user_id") : null;

    if (!userId) {
      console.log("user id from local storage not found, aborting fetch");
      setMenuItems([]);
      return;
    }

    console.log("User ID from cookies:", userId);

    try {
      const queryParams = new URLSearchParams({
        user_id: userId,
        subdomain: subdomain || "", // Ensure subdomain is not null
      }).toString();

      console.log("Calling API:", `${apiRoutes.MENU_CTRLDESK}?${queryParams}`);

      const response = await axios.get(`${apiRoutes.MENU_CTRLDESK}?${queryParams}`, {
        withCredentials: true, // Ensures cookies are sent by the browser
      });

      if (response.status !== 200) {
        throw new Error(response.data.detail || "Failed to fetch menus");
      }

      setMenuItems(response.data.data || []); // Set menu items, default to empty array if data.data is undefined
    } catch (error) {
      console.error("Error fetching menus:", error);
      setMenuItems([]);
    }
  }, [subdomain]);

  useEffect(() => {
    setLoading(true);
    fetchMenusConsole().finally(() => setLoading(false)); // Ensure loading state is reset even on error
  }, [fetchMenusConsole]);

  return {
    menuItems,
    loading,
  };
}

