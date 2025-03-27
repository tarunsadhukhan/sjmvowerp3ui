"use client";

import { useState, useEffect, useCallback } from "react";
import apiRoutes from "@/utils/api";

interface MenuItem {
  title: string;
  path?: string;
  icon: string;
  submenu?: MenuItem[];
}

export function useCompanyConsole() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);

  const subdomain = localStorage.getItem("subdomain");
  console.log('subdomain from use company cookie console', document.cookie);
  console.log('subdomain from use company console', subdomain);

  // Extract access_token from cookies for validation/debugging
  // const access_token = document.cookie
  //   .split("; ")
  //   .find((row) => row.startsWith("access_token="))
  //   ?.split("=")[1];

  const fetchMenusConsole = useCallback(async () => {
    const storedUser = JSON.parse(localStorage.getItem("user_id") || '{}');
    console.log('get userid in use-org-ctrldesk', storedUser);
    // get cookie called access token 


    // Check if access_token cookie exists
    // if (!access_token) {
    //   console.error('Access token cookie not found');
    //   setMenuItems([]);
    //   return;
    // }

    console.log('User showing in get user after token:', storedUser);
    const user = storedUser;
    console.log('User showing in get user:', user);

    if (!user) {
      console.log('No user found, aborting fetch');
      setMenuItems([]);
      return;
    }

    console.log('User showing in get user after if user:', user);

    try {
      // Prepare query parameters
      const queryParams = new URLSearchParams({
        user_id: user,
        subdomain: subdomain || '', // Ensure subdomain is not null
      }).toString();
      console.log("Calling API:", `${apiRoutes.MENU_CTRLDESK}?${queryParams}`);
      // Fetch request with credentials to include cookies
      const response = await fetch(`${apiRoutes.MENU_CTRLDESK}?${queryParams}`, {
        method: "GET",
        credentials: 'include', // Ensures the access_token cookie is sent by the browser
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to fetch menus");
      }

      const data = await response.json();
      setMenuItems(data.data || []); // Set menu items, default to empty array if data.data is undefined
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