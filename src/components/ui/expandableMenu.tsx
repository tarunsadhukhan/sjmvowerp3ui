"use client";
import React, { useState } from "react";

type MenuItem = {
  con_menu_id: number;
  con_menu_name: string;
  con_menu_parent_id: number | null;
  con_role_id: number | null; // Added field
};

type Props = {
  menuData: MenuItem[];
};

const MenuTable: React.FC<Props> = ({ menuData }) => {
  const [expandedParents, setExpandedParents] = useState<number[]>([]);

  const toggleExpand = (parentId: number) => {
    setExpandedParents((prev) =>
      prev.includes(parentId) ? prev.filter((id) => id !== parentId) : [...prev, parentId]
    );
  };

  // Ensure menuData is an array before filtering
  const validMenuData = Array.isArray(menuData) ? menuData : [];
  const parentMenus = validMenuData.filter((item) => item.con_menu_parent_id === null);
  const childMenus = validMenuData.filter((item) => item.con_menu_parent_id !== null);

  return (
    <table className="min-w-full border border-gray-300 text-sm">
      <thead className="bg-gray-100">
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
              <td className="px-4 py-2"></td>
            </tr>

            {expandedParents.includes(parent.con_menu_id) &&
              childMenus
                .filter((child) => child.con_menu_parent_id === parent.con_menu_id)
                .map((child) => (
                  <tr key={child.con_menu_id} className="bg-gray-50 border-t">
                    <td className="px-8 py-2 text-gray-700">— {child.con_menu_name}</td>
                    <td className="px-4 py-2 text-sm">
                      {/* Checkbox is checked if con_role_id is not null */}
                      <input type="checkbox" defaultChecked={child.con_role_id !== null} />
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
