"use client";

import { useState, useEffect, useCallback } from "react";
import { getUser, getCompany, setCompany as saveCompany, type Company,urlcheck } from "@/utils/auth";


const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface MenuItem {
  title: string;
  path?: string;
  icon: string;
  submenu?: MenuItem[];
}

interface FyYearTypes {
  id: string;
  code: string;
}

export function useCompany() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [fyYears, setFyYears] = useState<FyYearTypes[]>([]); // Store FY Years
  const { compshow, currentHost } = urlcheck();
  
  // Set up the initial company state
  useEffect(() => {
    setMounted(true);
    const savedCompany = getCompany();
    console.log('company')
    if (savedCompany) {
      setSelectedCompany(savedCompany);
    }
  }, []);

  const fetchMenus = useCallback(async (companyId: string, currentHost: string) => {
    console.log('mehhhs menu to be fetch')
    const user = getUser();
    console.log(user)
    if (!user?.id) return;
    console.log('mehhhs-------')
    try {
      // const responses = await fetch(
      //   `${API_URL}/api/masterRoutes/fyyear?company_id=${companyId}&user_id=${user.id}`,
      //   {
      //     headers: {
      //       "Content-Type": "application/json",
      //       Authorization: `Bearer ${user.id}`,
      //     },
      //   }
      // );

      // Extract access_token from cookies
      const accessToken = document.cookie
        .split("; ")
        .find((row) => row.startsWith("access_token="))
        ?.split("=")[1];

      const responses = await fetch(
        `${API_URL}/api/masterRoutes/fyyear?company_id=${companyId}&user_id=${user.id}&subdomain=${currentHost}`,
        {
          headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      console.log('menu ffff')
      const datas = await responses.json();
      
      if (!responses.ok) throw new Error(datas.error || "Login failed");

      console.log("API Response:", datas, datas.year);

      // Store FY Year data in localStorage
      localStorage.setItem("fyyear", datas[0].year);
      localStorage.setItem("fystartdate", datas[0].from_date);
      localStorage.setItem("fyenddate", datas[0].to_date);
      localStorage.setItem("fydisplabel", datas[0].display_label);
      console.log("FY Year Set:", datas[0].year);

      const response = await fetch(
        `${API_URL}/api/menuRoutes/menu_items?company_id=${companyId}&user_id=${user.id}&currentHost=${currentHost}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.id}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch menus");
      }

      const data = await response.json();
      setMenuItems(data);
    } catch (error) {
      console.error("Error fetching menus:", error);
      setMenuItems([]);
    }
  }, []);

  // ✅ Wrapped `fetchFYYears` inside `useCallback`
  const fetchFYYears = useCallback(async (companyId: string) => {
    try {
      const response = await fetch(`/api/fy-year?companyId=${companyId}`);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      console.log("FY Data:", data);

      // Only set FY Years if data is valid
      if (data.years && Array.isArray(data.years) && data.years.length > 0) {
        setFyYears(data.years);
      } else {
        setFyYears([]); // Reset if no data
      }
    } catch (error) {
      console.error("Failed to fetch FY Years:", error);
      setFyYears([]); // Reset on error
    }
  }, []);

  

  // ✅ Use `useCallback` to prevent infinite re-renders
  const handleCompanyChange = useCallback(
    (company: Company) => {
      setSelectedCompany(company);
      saveCompany(company);
  
      console.log("Fetched menu for company:", company);
      
      if (company.id) {
        fetchMenus(company.id,currentHost);
        fetchFYYears(company.id);
      }
    },
    [fetchMenus, fetchFYYears, currentHost] // ✅ Include missing dependencies
  );
  
  const handleCompanyLoad = useCallback(
    (companyId: string) => {
      console.log("Fetching menu for company:", companyId);
    
      if (compshow === 1) {
        companyId = "0";
        fetchMenus(companyId,currentHost);
    
      } else {
        if (companyId) {
          fetchMenus(companyId,currentHost);
          fetchFYYears(companyId);
        }
      }
    
     
    },
    [fetchMenus, fetchFYYears, compshow, currentHost] // ✅ Include missing dependencies
  );
    
  /* useEffect(() => {
    console.log('compshow', compshow);
  
    if (compshow === 1 && menuItems.length === 0) {  // ✅ Run only if menuItems is empty
      const companyId = "0";
      fetchMenus(companyId, currentHost);
    }
  }, [compshow, menuItems, currentHost, fetchMenus]);

   */
  // Fetch companies after the component is mounted
  useEffect(() => {
    const fetchCompanies = async (userId: string) => {
      if (loading) return;
      setLoading(true);
      try {
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
  
        if (!selectedCompany && data.length > 0) {
          handleCompanyChange(data[0]);
        }
      } catch (error) {
        console.error("Error fetching companies:", error);
        setCompanies([]);
      } finally {
        setLoading(false);
      }
    };
  
    if (!mounted) return;
    const user = getUser();
    if (user?.id) {
      fetchCompanies(user.id);
    }
  }, [mounted, handleCompanyChange, loading, selectedCompany]); // ✅ Include missing dependencies
   // ✅ Removed `handleCompanyChange` from dependencies

  // ✅ Wrapped `fetchMenus` inside `useCallback`
  
  // ✅ Handle Company Load
  
  return {
    companies,
    selectedCompany,
    menuItems,
    loading,
    handleCompanyChange,
    handleCompanyLoad,
    fyYears, // Make FY Years available
  };
}
