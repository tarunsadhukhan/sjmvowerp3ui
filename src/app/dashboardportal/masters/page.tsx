"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"


export default function DashboardPage() {
  const router = useRouter()


  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Masters</h1>
      </div>

    </div>
  )
}