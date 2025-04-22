"use client";
import React, { useState, useEffect } from "react";

type MenuItem = {
  con_menu_id: number;
  con_menu_name: string;
  con_menu_parent_id: number | null;
  con_role_id: number | null;
};

type Props = {
  menuData: MenuItem[];
  onSelectionChange: (selectedIds: number[]) => void;
};

const MenuTable: React.FC<Props> = ({ menuData, onSelectionChange }) => {
  const [expandedParents, setExpandedParents] = useState<number[]>([]);
  const [selectedMenuIds, setSelectedMenuIds] = useState<number[]>([]);

  useEffect(() => {
    const initialSelectedIds = menuData
      .filter(item => item.con_role_id !== null)
      .map(item => item.con_menu_id);
    setSelectedMenuIds(initialSelectedIds);
    onSelectionChange(initialSelectedIds);
  }, [menuData]);

  const toggleExpand = (parentId: number) => {
    setExpandedParents((prev) =>
      prev.includes(parentId) ? prev.filter((id) => id !== parentId) : [...prev, parentId]
    );
  };

  // Get all child menu IDs for a given parent
  const getChildMenuIds = (parentId: number): number[] => {
    return validMenuData
      .filter((item) => item.con_menu_parent_id === parentId)
      .map((item) => item.con_menu_id);
  };

  // Check if all children of a parent are selected
  const areAllChildrenSelected = (parentId: number): boolean => {
    const childIds = getChildMenuIds(parentId);
    return childIds.length > 0 && childIds.every(id => selectedMenuIds.includes(id));
  };

  // Check if any child of a parent is selected
  const isAnyChildSelected = (parentId: number): boolean => {
    const childIds = getChildMenuIds(parentId);
    return childIds.some(id => selectedMenuIds.includes(id));
  };

  const handleParentCheckboxChange = (parentId: number, isChecked: boolean) => {
    const childIds = getChildMenuIds(parentId);
    let newSelectedIds;

    if (isChecked) {
      // Add parent and all children to selection (avoid duplicates)
      newSelectedIds = [...new Set([...selectedMenuIds, parentId, ...childIds])];
    } else {
      // Remove parent and all children from selection
      newSelectedIds = selectedMenuIds.filter(id => id !== parentId && !childIds.includes(id));
    }

    setSelectedMenuIds(newSelectedIds);
    onSelectionChange(newSelectedIds);
  };

  const handleChildCheckboxChange = (menuId: number, isChecked: boolean, parentId: number) => {
    let newSelectedIds: number[];
    
    if (isChecked) {
      // Add the child to selection
      newSelectedIds = [...selectedMenuIds, menuId];
      
      // Get all children of this parent
      const childIds = getChildMenuIds(parentId);
      
      // Check if all children are now selected
      const allChildrenSelected = childIds.every(id => menuId === id || selectedMenuIds.includes(id));
      
      // If all children are selected, include the parent
      if (allChildrenSelected && !newSelectedIds.includes(parentId)) {
        newSelectedIds.push(parentId);
      } 
      // If any children are selected, include the parent (indeterminate state)
      else if (!newSelectedIds.includes(parentId)) {
        newSelectedIds.push(parentId);
      }
    } else {
      // Remove the child from selection
      newSelectedIds = selectedMenuIds.filter(id => id !== menuId);
      
      // Get all children of this parent
      const childIds = getChildMenuIds(parentId);
      
      // Check if any other children are still selected
      const anyChildSelected = childIds.some(id => id !== menuId && newSelectedIds.includes(id));
      
      // Only remove parent if no children are selected anymore
      if (!anyChildSelected && newSelectedIds.includes(parentId)) {
        newSelectedIds = newSelectedIds.filter(id => id !== parentId);
      }
    }

    setSelectedMenuIds(newSelectedIds);
    onSelectionChange(newSelectedIds);
  };

  const validMenuData = Array.isArray(menuData) ? menuData : [];
  const parentMenus = validMenuData.filter((item) => item.con_menu_parent_id === null);
  const childMenus = validMenuData.filter((item) => item.con_menu_parent_id !== null);

  return (
    <table className="min-w-full border-blue text-sm">
      <thead className="border-blue">
        <tr>
          <th className="px-4 py-2 text-left">Menu Name</th>
          <th className="px-4 py-2 text-left">Accessible</th>
        </tr>
      </thead>
      <tbody>
        {parentMenus.map((parent) => (
          <React.Fragment key={parent.con_menu_id}>
            <tr className="bg-white border-t">
              <td className="px-4 py-2 font-medium">
                <button onClick={() => toggleExpand(parent.con_menu_id)}>
                  {expandedParents.includes(parent.con_menu_id) ? "▼" : "►"} {parent.con_menu_name}
                </button>
              </td>
              <td className="px-4 py-2">
                <input
                  type="checkbox"
                  checked={areAllChildrenSelected(parent.con_menu_id)}
                  onChange={(e) => handleParentCheckboxChange(parent.con_menu_id, e.target.checked)}
                  // Make the checkbox appear in an indeterminate state when some but not all children are selected
                  ref={el => {
                    if (el) {
                      el.indeterminate = !areAllChildrenSelected(parent.con_menu_id) && isAnyChildSelected(parent.con_menu_id);
                    }
                  }}
                />
              </td>
            </tr>

            {expandedParents.includes(parent.con_menu_id) &&
              childMenus
                .filter((child) => child.con_menu_parent_id === parent.con_menu_id)
                .map((child) => (
                  <tr key={child.con_menu_id} className="bg-gray-50 border-t">
                    <td className="px-8 py-2 text-gray-700">— {child.con_menu_name}</td>
                    <td className="px-4 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedMenuIds.includes(child.con_menu_id)}
                        onChange={(e) => handleChildCheckboxChange(child.con_menu_id, e.target.checked, parent.con_menu_id)}
                      />
                    </td>
                  </tr>
                ))}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  );
};

export default MenuTable;
