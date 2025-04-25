"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import ApprovalDropdowns, { DropdownField } from "@/components/ui/ApprovalDropdowns"
import ApprovalLevelsTable, { ApprovalLevelRow } from "./ApprovalLevelsTable";
import { approvalLevelsDataByMenu } from "./data";
import { dropdownFields } from "@/app/dashboardadmin/approvalHierarchy/dropdowndata";

export default function CreateApproval() {
  const router = useRouter()
  const [selections, setSelections] = useState<Record<string, string>>({})

  const handleSelectionChange = (newSelections: Record<string, string>) => {
    console.log("Selections updated:", newSelections);
    setSelections(newSelections);
  };

  // Only show ApprovalLevelsTable if a menu is selected
  const selectedMenu = selections.menu;
  const [approvalLevelsData, setApprovalLevelsData] = useState(
    selectedMenu && approvalLevelsDataByMenu[selectedMenu]
      ? approvalLevelsDataByMenu[selectedMenu]
      : undefined
  );

  // Fetch approval levels data when menu changes
  useEffect(() => {
    if (selectedMenu && approvalLevelsDataByMenu[selectedMenu]) {
      setApprovalLevelsData(approvalLevelsDataByMenu[selectedMenu]);
    } else {
      setApprovalLevelsData(undefined);
    }
  }, [selectedMenu]);

  // Log when approvalLevelsData changes
  useEffect(() => {
    console.log("approvalLevelsData updated:", approvalLevelsData);
  }, [approvalLevelsData]);

  // Handler to update approvalLevelsData.data from ApprovalLevelsTable
  const handleTableChange = useCallback((newRows: ApprovalLevelRow[]) => {
    setApprovalLevelsData(prev =>
      prev
        ? { ...prev, data: newRows, maxLevel: prev.maxLevel, userOptions: prev.userOptions }
        : undefined
    );
  }, []);

  // Handler for submit button
  const handleSubmit = () => {
    const filteredApprovalLevels = approvalLevelsData?.data.filter(row => row.users.length > 0) ?? [];
    const submitData = {
      branchId: selections.branch,
      menuId: selections.menu,
      data: filteredApprovalLevels
    };
    console.log("Submitted IDs:", submitData);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Create Approval Hierarchy</h1>
      </div>
      <div className="content-box p-6">
        <ApprovalDropdowns 
          fields={dropdownFields}
          onSelectionChange={handleSelectionChange} 
    />
        {/* Approval Levels Table below dropdowns */}
        {selectedMenu && approvalLevelsData && (
          <>
            <ApprovalLevelsTable
              key={selectedMenu}
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