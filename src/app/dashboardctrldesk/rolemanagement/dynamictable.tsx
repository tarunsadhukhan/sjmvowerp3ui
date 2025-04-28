'use client';
//import { useEffect } from "react"
import { useState } from "react";
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input' 
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"; // Adjust imports
import { PencilIcon, ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/24/outline"; // Example icon imports

interface Header {
  key: string;
  label: string;
  sortable?: boolean;
}

interface DynamicTableProps {
  headers: Header[];
  data: Record<string, any>[];
}

const DynamicTable: React.FC<DynamicTableProps> = ({ headers, data }) => {
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // State for search
  const [searchTerm, setSearchTerm] = useState("");

  // State for sorting
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: string }>({ key: null, direction: "asc" });

  // Filter and sort data
  const filteredData = data.filter((row) =>
    headers.some((header) =>
      String(row[header.key]).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortConfig.direction === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
  });

  // Pagination logic
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle sorting
  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((header) => (
                <TableHead
                  key={header.key}
                  className=" text-white cursor-pointer"
                  onClick={() => header.sortable !== false && handleSort(header.key)}
                >
                  <div className="flex items-center gap-1">
                    {header.label}
                    {header.sortable !== false && sortConfig.key === header.key && (
                      sortConfig.direction === "asc" ? (
                        <ChevronUpIcon className="h-4 w-4" />
                      ) : (
                        <ChevronDownIcon className="h-4 w-4" />
                      )
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                {headers.map((header) => (
                  <TableCell key={header.key} className={header.key === "name" ? "font-medium" : ""}>
                    {header.key === "actions" ? (
                      <Button variant="ghost" size="icon">
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                    ) : (
                      row[header.key]
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {[10, 30, 50, "All"].map((value) => (
            <Button
              key={value}
              variant={itemsPerPage === (value === "All" ? data.length : value) ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setItemsPerPage(typeof value === "string" ? data.length : value);
                setCurrentPage(1); // Reset to first page when changing items per page
              }}
              className={itemsPerPage === (value === "All" ? data.length : value) ? "bg-[#E6F3F9] text-black border-[#0C3C60]" : ""}
            >
              {value}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentPage(page)}
              className={currentPage === page ? "bg-[#E6F3F9] text-black border-[#0C3C60]" : ""}
            >
              {page}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DynamicTable;