"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import ApprovalDropdowns, { DropdownField } from "@/components/ui/ApprovalDropdowns"
import ApprovalLevelsTable, { ApprovalLevelRow } from "./ApprovalLevelsTable";
// Import commented out but kept for reference
// import { approvalLevelsDataByMenu } from "./data";
import { fetchWithCookie } from "@/utils/apiClient2";
import { apiRoutes } from "@/utils/api";

export default function CreateApproval() {
  const router = useRouter()
  const [selections, setSelections] = useState<Record<string, string>>({})
  const [dropdownFields, setDropdownFields] = useState<DropdownField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [approvalLevelsLoading, setApprovalLevelsLoading] = useState(false);
  const [approvalLevelsData, setApprovalLevelsData] = useState<{
    maxLevel: number;
    userOptions: { id: string; name: string }[];
    data: ApprovalLevelRow[];
  } | undefined>(undefined);

  // Fetch dropdown data from API
  useEffect(() => {
    const fetchDropdownData = async () => {
      setIsLoading(true);
      try {
        const result = await fetchWithCookie(apiRoutes.PORTAL_CO_BRANCH_SUBMENU, "GET");
        
        if (result.data && !result.error) {
          // If the API returns an array of dropdown fields directly
          if (Array.isArray(result.data)) {
            console.log("API returned array of dropdown fields:", result.data);
            // Use the API response directly as it already matches our expected format
            setDropdownFields(result.data);
          } else {
            // Handle the old expected format with separate properties
            console.log("API returned object format:", result.data);
            const apiDropdownFields: DropdownField[] = [
              {
                id: "company",
                label: "Company",
                items: result.data.companies || []
              },
              {
                id: "branch",
                label: "Branch",
                dependsOn: "company",
                items: result.data.branchesByCompany || {}
              },
              {
                id: "menu",
                label: "Menu",
                dependsOn: "branch",
                items: result.data.menusByBranch || {}
              }
            ];
            
            setDropdownFields(apiDropdownFields);
          }
        } else {
          console.error("Failed to fetch dropdown data:", result.error);
          
          // Fallback to empty structure if API fails
          setDropdownFields([
            { id: "company", label: "Company", items: [] },
            { id: "branch", label: "Branch", dependsOn: "company", items: {} },
            { id: "menu", label: "Menu", dependsOn: "branch", items: {} }
          ]);
        }
      } catch (error) {
        console.error("Error fetching dropdown data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDropdownData();
  }, []);

  const handleSelectionChange = (newSelections: Record<string, string>) => {
    console.log("Selections updated:", newSelections);
    setSelections(newSelections);
    
    // Reset approval levels data when selections change
    setApprovalLevelsData(undefined);
  };

  // Fetch approval levels data when menu and branch are selected
  useEffect(() => {
    const fetchApprovalLevelsData = async () => {
      const { menu: menuId, branch: branchId } = selections;
      
      if (!menuId || !branchId) {
        return; // Exit if we don't have both menuId and branchId
      }
      
      setApprovalLevelsLoading(true);
      
      const requestData = {
        menuId,
        branchId
      };
      
      console.log("Fetching approval levels data with:", requestData);
      
      try {
        const result = await fetchWithCookie(
          apiRoutes.PORTAL_APPROVAL_LEVELS_DATA,
          "POST",
          requestData
        );
        
        if (result.data && !result.error) {
          console.log("Approval levels data from API:", result.data);
          
          // Check if the response has a menu ID as the top-level key
          const menuData = result.data[menuId];
          
          if (menuData) {
            console.log(`Found data for menu ${menuId}:`, menuData);
            
            // Use the data structure directly from the API
            const formattedData = {
              maxLevel: menuData.maxLevel || 0,
              userOptions: menuData.userOptions || [],
              data: menuData.data || [] // API returns "data" not "approvalLevels"
            };
            
            setApprovalLevelsData(formattedData);
          } else {
            console.warn(`No data found for menu ${menuId} in API response:`, result.data);
            
            // Try to see if the data is directly in the response (fallback)
            if (result.data.maxLevel && Array.isArray(result.data.data || result.data.approvalLevels)) {
              const formattedData = {
                maxLevel: result.data.maxLevel || 0,
                userOptions: result.data.userOptions || [],
                data: result.data.data || result.data.approvalLevels || []
              };
              
              setApprovalLevelsData(formattedData);
              console.log("Using fallback data structure:", formattedData);
            } else {
              // Create an empty structure if no valid data found
              setApprovalLevelsData({
                maxLevel: 0,
                userOptions: [],
                data: []
              });
              console.log("Created empty approval levels structure");
            }
          }
        } else {
          console.error("Failed to fetch approval levels data:", result.error);
          setApprovalLevelsData(undefined);
        }
      } catch (error) {
        console.error("Error fetching approval levels data:", error);
        setApprovalLevelsData(undefined);
      } finally {
        setApprovalLevelsLoading(false);
      }
    };
    
    fetchApprovalLevelsData();
  }, [selections.menu, selections.branch]);

  // Log when approvalLevelsData changes
  useEffect(() => {
    console.log("approvalLevelsData updated:", approvalLevelsData);
  }, [approvalLevelsData]);

  // Handler to update approvalLevelsData.data from ApprovalLevelsTable
  const handleTableChange = useCallback((newRows: ApprovalLevelRow[]) => {
    setApprovalLevelsData(prev =>
      prev
        ? { ...prev, data: newRows }
        : undefined
    );
  }, []);

  // Handler for submit button
  const handleSubmit = async () => {
    const filteredApprovalLevels = approvalLevelsData?.data.filter(row => row.users.length > 0) ?? [];
    const submitData = {
      branchId: selections.branch,
      menuId: selections.menu,
      data: filteredApprovalLevels
    };
    console.log("Submitted IDs:", submitData);
    
    // Call the API to submit approval levels data
    try {
      const result = await fetchWithCookie(
        apiRoutes.PORTAL_APPROVAL_LEVELS_DATA_SUBMIT,
        "POST",
        submitData
      );
      
      if (result.data && !result.error) {
        console.log("Approval levels data submitted successfully:", result.data);
        // You can add success notification or redirect here
      } else {
        console.error("Failed to submit approval levels data:", result.error);
        // You can add error notification here
      }
    } catch (error) {
      console.error("Error submitting approval levels data:", error);
      // You can add error notification here
    }
  };

  // Get the selected menu ID
  const selectedMenu = selections.menu;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Create Approval Hierarchy</h1>
      </div>
      <div className="content-box p-6">
        {isLoading ? (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
            <span className="ml-2">Loading dropdown data...</span>
          </div>
        ) : (
          <ApprovalDropdowns 
            fields={dropdownFields}
            onSelectionChange={handleSelectionChange} 
          />
        )}
        
        {/* Show loading state when fetching approval levels data */}
        {approvalLevelsLoading && (
          <div className="mt-6 flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
            <span className="ml-2">Loading approval levels data...</span>
          </div>
        )}
        
        {/* Approval Levels Table below dropdowns */}
        {selectedMenu && approvalLevelsData && !approvalLevelsLoading && (
          <>
            <ApprovalLevelsTable
              key={`${selections.branch}-${selectedMenu}`}
              maxLevel={approvalLevelsData.maxLevel}
              userOptions={approvalLevelsData.userOptions}
              data={approvalLevelsData.data}
              onChange={handleTableChange}
            />
            <button
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={handleSubmit}
            >
              Submit
            </button>
          </>
        )}
      </div>
    </div>
  )
}