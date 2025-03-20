"use client";

import { useState, useEffect, useCallback } from "react";
import { getUser, urlfixed } from "@/utils/auth";
import CONSOLE_MENU_CTRDESK from "@/utils/api";

// const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
// const CONSOLE_MENU_API =process.env.NEXT_PUBLIC_CONSOLE_MENU_API
// console.log(CONSOLE_MENU_API,API_URL)


interface MenuItem {
  title: string;
  path?: string;
  icon: string;
  submenu?: MenuItem[];
}
 

export function useCompanyConsole() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const {subdomain } = urlfixed()
  
  // Set up the initial company state

  const fetchMenusConsole = useCallback(async () => {
    const storedUser = JSON.parse(localStorage.getItem("user") || '{}');
    
    const token = storedUser.token;
    if (!token) {
      console.error('Token not found in localStorage');
      return;
    }
    console.log('tttt',token)
    const user = getUser();
    console.log(user)
    if (!user?.id) return;
    console.log('mehhhs-------')
   
    try {
       // Store FY Year data in localStorage
  
      const response = await fetch(
        `${CONSOLE_MENU_CTRDESK}?user_id=${user.id}&subdomain=${subdomain}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "X-Subdomain": subdomain
          },
        }
      );

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


  useEffect(()=> {
    setLoading(true);
    fetchMenusConsole()
    setLoading(false)
  },[fetchMenusConsole]
    );

   
  return {
    menuItems,
    loading,
  };
}
