"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface UserOption {
  id: string;
  name: string;
}

interface ApprovalLevelRow {
  level: number;
  users: string[]; // user ids
  maxSingle: string;
  maxDay: string;
  maxMonth: string;
}

interface ApprovalLevelsTableProps {
  maxLevel: number;
  userOptions: UserOption[];
  data: Omit<ApprovalLevelRow, "level">[]; // data for levels 1..maxLevel
  onChange?: (rows: ApprovalLevelRow[]) => void;
}

export default function ApprovalLevelsTable({ maxLevel, userOptions, data, onChange }: ApprovalLevelsTableProps) {
  const [rows, setRows] = useState<ApprovalLevelRow[]>(() =>
    Array.from({ length: maxLevel + 1 }, (_, i) => {
      const d = data[i] || { users: [], maxSingle: "", maxDay: "", maxMonth: "" };
      return { level: i + 1, ...d };
    })
  );

  // Update rows when maxLevel or data changes
  useEffect(() => {
    setRows(
      Array.from({ length: maxLevel + 1 }, (_, i) => {
        const d = data[i] || { users: [], maxSingle: "", maxDay: "", maxMonth: "" };
        return { level: i + 1, ...d };
      })
    );
  }, [maxLevel, data]);

  const [userDropdownOpen, setUserDropdownOpen] = useState<number | null>(null);

  // Helper to add a new row if the last row has users
  const ensureExtraRow = (updatedRows: ApprovalLevelRow[]) => {
    const lastRow = updatedRows[updatedRows.length - 1];
    if (lastRow && lastRow.users.length > 0) {
      // Only add if not already present (empty row)
      return [
        ...updatedRows,
        { level: lastRow.level + 1, users: [], maxSingle: "", maxDay: "", maxMonth: "" }
      ];
    }
    // Remove extra empty rows if user unselected
    let trimmed = [...updatedRows];
    while (
      trimmed.length > 1 &&
      trimmed[trimmed.length - 1].users.length === 0 &&
      trimmed[trimmed.length - 2].users.length === 0
    ) {
      trimmed.pop();
    }
    return trimmed;
  };

  const handleUserToggle = (rowIdx: number, userId: string) => {
    setRows(prev => {
      const updated = [...prev];
      const users = updated[rowIdx].users.includes(userId)
        ? updated[rowIdx].users.filter(u => u !== userId)
        : updated[rowIdx].users.length < 3
          ? [...updated[rowIdx].users, userId]
          : updated[rowIdx].users;
      updated[rowIdx] = { ...updated[rowIdx], users };
      const withExtra = ensureExtraRow(updated);
      onChange?.(withExtra);
      return withExtra;
    });
  };

  const handleInputChange = (rowIdx: number, field: keyof Omit<ApprovalLevelRow, "level" | "users">, value: string) => {
    setRows(prev => {
      const updated = [...prev];
      updated[rowIdx] = { ...updated[rowIdx], [field]: value };
      const withExtra = ensureExtraRow(updated);
      onChange?.(withExtra);
      return withExtra;
    });
  };

  return (
    <div className="mt-8">
      <table className="min-w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2 py-1">Approval Level</th>
            <th className="border px-2 py-1">User</th>
            <th className="border px-2 py-1">Max Single Entry Value</th>
            <th className="border px-2 py-1">Max Day Entry Value</th>
            <th className="border px-2 py-1">Max Month Entry Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr key={row.level}>
              <td className="border px-2 py-1 text-center">{row.level}</td>
              <td className="border px-2 py-1">
                <div className="relative">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => setUserDropdownOpen(userDropdownOpen === rowIdx ? null : rowIdx)}
                  >
                    {row.users.length > 0
                      ? row.users.map(uid => userOptions.find(u => u.id === uid)?.name).filter(Boolean).join(", ")
                      : "Select up to 3 users"}
                    <span className="ml-2">▼</span>
                  </Button>
                  {userDropdownOpen === rowIdx && (
                    <div className="absolute z-10 bg-white border rounded shadow w-full mt-1 max-h-40 overflow-auto">
                      {userOptions.map(u => (
                        <label key={u.id} className="flex items-center px-2 py-1 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={row.users.includes(u.id)}
                            disabled={!row.users.includes(u.id) && row.users.length >= 3}
                            onChange={() => handleUserToggle(rowIdx, u.id)}
                            className="mr-2"
                          />
                          {u.name}
                        </label>
                      ))}
                      <div className="text-xs text-gray-400 px-2 py-1">Max 3 users</div>
                      <Button size="sm" className="w-full mt-1" onClick={() => setUserDropdownOpen(null)}>Done</Button>
                    </div>
                  )}
                </div>
              </td>
              <td className="border px-2 py-1">
                <input
                  type="text"
                  className="w-full border rounded px-1 py-0.5"
                  value={row.maxSingle}
                  onChange={e => handleInputChange(rowIdx, "maxSingle", e.target.value)}
                  placeholder="Enter value"
                />
              </td>
              <td className="border px-2 py-1">
                <input
                  type="text"
                  className="w-full border rounded px-1 py-0.5"
                  value={row.maxDay}
                  onChange={e => handleInputChange(rowIdx, "maxDay", e.target.value)}
                  placeholder="Enter value"
                />
              </td>
              <td className="border px-2 py-1">
                <input
                  type="text"
                  className="w-full border rounded px-1 py-0.5"
                  value={row.maxMonth}
                  onChange={e => handleInputChange(rowIdx, "maxMonth", e.target.value)}
                  placeholder="Enter value"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export type { ApprovalLevelRow };
