"use client";

import { useSidebarContext } from "@/components/dashboard/sidebarContext";
import { useEffect, useState } from "react";
import { getUser, urlcheck } from "@/utils/auth";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export function useCompany() {
  const {
    companies, setCompanies,
    selectedCompany, setSelectedCompany,
    menuItems, setMenuItems,
    handleCompanyChange,
  } = useSidebarContext();
  const [loading, setLoading] = useState<boolean>(false);
  const { compshow, currentHost } = urlcheck();

  // Fetch companies after the component is mounted
  useEffect(() => {
  const fetchCompanies = async (userId: string) => {
      try {
    setLoading(true);
        const response = await fetch(
          `${API_URL}/api/companyRoutes/companies?userId=${userId}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${userId}`,
            },
          }
        );
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to fetch companies");
        }
        const data = await response.json();
        setCompanies(data);
        // Only set first company if none selected
        if (!selectedCompany && data.length > 0) {
          handleCompanyChange(data[0].co_id);
        }
      } catch (error) {
        setCompanies([]);
      }
      finally {
        setLoading(false);
      }
    };
    const user = getUser();
    if (user?.id) {
      fetchCompanies(user.id);
    }
  }, [setCompanies, selectedCompany, handleCompanyChange]);

  // Fetch menus for selected company
  useEffect(() => {
    const fetchMenus = async () => {
      if (!selectedCompany) return;
      const user = getUser();
      if (!user) return;
      try {
        const response = await fetch(
          `${API_URL}/api/menuRoutes/menu_items?company_id=${selectedCompany.co_id}&user_id=${user.id}&currentHost=${currentHost}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${user.id}`,
            },
          }
        );
        if (!response.ok) {
          setMenuItems([]);
          return;
        }
        const data = await response.json();
        setMenuItems(data);
      } catch {
        setMenuItems([]);
      }
    };
    fetchMenus();
  }, [selectedCompany, setMenuItems, currentHost]);

  return {
    companies,
    selectedCompany,
    menuItems,
    handleCompanyChange,
  loading,
  };
}
