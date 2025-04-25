"use client";

import React, { useState } from "react";
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
  data: ApprovalLevelRow[];
  onChange?: (rows: ApprovalLevelRow[]) => void;
}

export default function ApprovalLevelsTable({ maxLevel, userOptions, data, onChange }: ApprovalLevelsTableProps) {
  const [userDropdownOpen, setUserDropdownOpen] = useState<number | null>(null);

  // Helper to ensure rows: always at least one, fill up to maxLevel, and always an extra row for new input
  const normalizeRows = (rows: ApprovalLevelRow[], maxLevel: number) => {
    let normalized = [...rows];
    // Remove any undefined/empty objects
    normalized = normalized.filter(row => row && typeof row.level === "number");
    // If no rows, start with one
    if (normalized.length === 0) {
      normalized = [{ level: 1, users: [], maxSingle: "", maxDay: "", maxMonth: "" }];
    }
    // Fill up to maxLevel if needed
    for (let i = normalized.length + 1; i <= maxLevel; i++) {
      normalized.push({ level: i, users: [], maxSingle: "", maxDay: "", maxMonth: "" });
    }
    // Always ensure an extra row for new input
    const lastRow = normalized[normalized.length - 1];
    const isLastRowBlank =
      lastRow &&
      lastRow.users.length === 0 &&
      lastRow.maxSingle === "" &&
      lastRow.maxDay === "" &&
      lastRow.maxMonth === "";
    if (lastRow && (lastRow.users.length > 0 || isLastRowBlank)) {
      normalized.push({ level: lastRow.level + 1, users: [], maxSingle: "", maxDay: "", maxMonth: "" });
    }
    return normalized;
  };

  // Use normalized rows for rendering and updates
  const rows = normalizeRows(data, maxLevel);

  const handleUserToggle = (rowIdx: number, userId: string) => {
    const updated = rows.map((row, idx) => {
      if (idx !== rowIdx) return row;
      const users = row.users.includes(userId)
        ? row.users.filter(u => u !== userId)
        : row.users.length < 3
          ? [...row.users, userId]
          : row.users;
      return { ...row, users };
    });
    onChange?.(updated);
  };

  const handleInputChange = (rowIdx: number, field: keyof Omit<ApprovalLevelRow, "level" | "users">, value: string) => {
    const updated = rows.map((row, idx) =>
      idx === rowIdx ? { ...row, [field]: value } : row
    );
    onChange?.(updated);
  };

  // Add a new row if the last row's dropdown is closed and it has users
  const handleDone = (rowIdx: number) => {
    setUserDropdownOpen(null);
    if (
      rowIdx === rows.length - 1 &&
      rows[rowIdx].users.length > 0
    ) {
      const nextLevel = rows[rowIdx].level + 1;
      // Prevent duplicate empty row
      if (!rows[rows.length] || rows[rows.length - 1].level !== nextLevel) {
        const newRows = [
          ...rows,
          { level: nextLevel, users: [], maxSingle: "", maxDay: "", maxMonth: "" }
        ];
        onChange?.(newRows);
      }
    }
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
                      <Button size="sm" className="w-full mt-1" onClick={() => handleDone(rowIdx)}>Done</Button>
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
