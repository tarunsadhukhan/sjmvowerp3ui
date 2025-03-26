"use client";

import { useState, useEffect, useCallback } from "react";
//import { getUser, urlfixed } from "@/utils/auth";
import apiRoutes from "@/utils/api";

// const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface MenuItem {
  title: string;
  path?: string;
  icon: string;
  submenu?: MenuItem[];
}

export function useCompanyConsole() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  // const { subdomain } = urlfixed();


  const subdomain = localStorage.getItem("subdomain");
  console.log('subdomain from use company cookie console',document.cookie)
  console.log('subdomain from use company console',subdomain)

  const fetchMenusConsole = useCallback(async () => {
    const storedUser = JSON.parse(localStorage.getItem("user_id") || '{}');
    const access_token = localStorage.getItem("access_token") || '';
    console.log('localstorage content -',localStorage.getItem("access_token"), access_token,storedUser);
    if (!access_token) {
      console.error('Token not found in localStorage');
      return;
    }
    console.log('User showing in get user after token:', storedUser);
    const user = storedUser;
    console.log('User showing in get user:', user);
    if (!user) return;
    console.log('User showing in get user after if user :', user);
    try {
      const requestBody = {
        user_id: user,
        subdomain: subdomain,
      };

      console.log("Calling API:", apiRoutes.MENU_CTRLDESK);
      console.log("Request Body:", requestBody);

      // const response = await fetch(apiRoutes.MENU_CTRLDESK, {
      //   method: "GET",
      //   headers: {
      //     Authorization: `Bearer ${access_token}`,
      //   },
      // });

      const queryParams = new URLSearchParams(requestBody as Record<string, string>).toString();
      const response = await fetch(`${apiRoutes.MENU_CTRLDESK}?${queryParams}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch menus");
      }

      const data = await response.json();
      setMenuItems(data.data);
    } catch (error) {
      console.error("Error fetching menus:", error);
      setMenuItems([]);
    }
  }, [subdomain]);

  useEffect(() => {
    setLoading(true);
    fetchMenusConsole();
    setLoading(false);
  }, [fetchMenusConsole]);

  return {
    menuItems,
    loading,
  };
}
