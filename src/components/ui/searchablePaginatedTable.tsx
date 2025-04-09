import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Share } from "lucide-react";
import { Column, DataTable } from "./datatablewithedit";
import { usePaginatedSearch } from "./paginatedSearch";
import { useState } from "react";
import { exportToCSV } from "@/utils/exportToCSV"; // Adjust import path as necessary

export type SearchableTableProps<T> = {
  columns: Column<T>[];
  fetchFn: (page: number, search?: string) => Promise<{ data: T[]; total: number; }>;
};

export function SearchablePaginatedTable<T>({ columns, fetchFn }: SearchableTableProps<T>) {
  const { data, total , isLoading, searchQuery, setSearchQuery, loadMoreRef } = usePaginatedSearch(fetchFn);

  const [visibleCols, setVisibleCols] = useState(
    columns.reduce((acc, col) => {
      acc[col.key as string] = col.visible !== false;
      return acc;
    }, {} as Record<string, boolean>)
  );

  const toggleCol = (key: string) => {
    setVisibleCols(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <Input
          placeholder="Search"
          className="max-w-xs"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Button variant="outline" className="gap-2" onClick={() => exportToCSV(data)}>
          <Share className="h-4 w-4" />
          Export
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-4 items-center">
        <span className="text-sm font-medium text-gray-700">Toggle Columns:</span>
        {columns.map((col) => (
          <label key={col.key as string} className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={visibleCols[col.key as string]}
              onChange={() => toggleCol(col.key as string)}
            />
            <span>{col.label}</span>
          </label>
        ))}
      </div>

      <DataTable
        columns={columns.filter(col => visibleCols[col.key as string])}
        data={data}
        totalCount={total}
        isLoading={isLoading}
        loadMoreRef={loadMoreRef}
      />
    </>
  );
}
