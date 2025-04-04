"use client"

// import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Pencil } from 'lucide-react';
import { useState } from 'react';
// import { isAuthenticated } from "@/utils/auth"

const roles = [
  { name: 'SuperAdmin', type: 'Portal' },
  { name: 'Jute User', type: 'Portal' },
  { name: 'Commercial Manager', type: 'Portal' },
  { name: 'AppSuperAdmin', type: 'App' },
  { name: 'EDP', type: 'Portal' },
];

export default function DashboardPage() {
  const router = useRouter()

  

  // useEffect(() => {
  //   if (!isAuthenticated()) {
  //     router.replace("/")
  //   }
  // }, [router])

  const [search, setSearch] = useState('');

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Role Management</h1>
        <div className="flex items-center gap-3">
          <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
            + Create Role
          </button>
          <button className="bg-blue-100 text-blue-700 px-4 py-2 rounded border border-blue-300">
            Billing Details
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <input
          type="text"
          placeholder="Search"
          className="border px-3 py-2 rounded w-64 shadow-sm focus:outline-none focus:ring"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="flex items-center gap-1 bg-blue-100 text-blue-700 px-4 py-2 rounded border border-blue-300">
          ⬇ Export
        </button>
      </div>

      <div className="overflow-x-auto border rounded">
        <table className="w-full text-left border-collapse">
          <thead className="bg-blue-800 text-white">
            <tr>
              <th className="px-4 py-3">Role Name</th>
              <th className="px-4 py-3">Role Type</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRoles.map((role, index) => (
              <tr
                key={index}
                className={index % 2 === 0 ? 'bg-white' : 'bg-blue-50'}
              >
                <td className="px-4 py-3">{role.name}</td>
                <td className="px-4 py-3">{role.type}</td>
                <td className="px-4 py-3">
                  <button className="text-blue-600 hover:text-blue-800">
                    <Pencil size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center gap-2">
        {['10', '30', '50', 'All'].map((item, idx) => (
          <button
            key={idx}
            className="bg-blue-100 text-gray-700 px-2 py-1 text-sm rounded hover:bg-blue-200"
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
        <span className="px-2 py-1 bg-blue-100 rounded">1</span>
        {[2, 3, 4, 5].map((page) => (
          <button
            key={page}
            className="px-2 py-1 hover:underline"
          >
            {page}
          </button>
        ))}
        <span className="ml-2 text-gray-500">Next &gt;</span>
      </div>
    </div>
  );
}