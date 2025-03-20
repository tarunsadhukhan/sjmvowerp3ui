"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import SidebarConsole from "@/components/dashboard/sidebarConsole"
//import Header from "@/components/dashboard/header"

export const dynamic = "force-dynamic";
export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const pathname = usePathname()
console.log(pathname)
  return (
    <div className="flex h-screen bg-gray-100">
      <SidebarConsole
        isCollapsed={isSidebarCollapsed} 
        onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
      />
      <div className="flex-1 flex flex-col overflow-hidden">
      
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-white">
          {children}
        </main>
      </div>
    </div>
  )
}