"use client"

import { ReactNode, useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import Sidebar from "@/components/dashboard/sidebar"
import { SidebarProvider, useSidebarContext } from "@/components/dashboard/sidebarContext"
import { determinePortalAction } from "@/utils/portalPermissions"
//import Header from "@/components/dashboard/header"
// import ProtectedRoute from '@/components/auth/protected-route'

function PortalPermissionBoundary({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { hasMenuAccess, menuPermissions } = useSidebarContext();

  useEffect(() => {
    if (!pathname.startsWith('/dashboardportal')) {
      return;
    }
    if (pathname === '/dashboardportal') {
      return;
    }
    const action = determinePortalAction(pathname);
    if (!menuPermissions || Object.keys(menuPermissions).length === 0) {
      // permissions not loaded yet; wait for middleware to handle redirect if token invalid
      return;
    }
    if (!hasMenuAccess(pathname, action)) {
      router.replace('/dashboardportal');
    }
  }, [hasMenuAccess, menuPermissions, pathname, router]);

  return <>{children}</>;
}

export default function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  return (
    // <ProtectedRoute>
    <SidebarProvider>
      <PortalPermissionBoundary>
        <div className="flex h-screen bg-gray-100">
          <Sidebar 
            isCollapsed={isSidebarCollapsed} 
            onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
          />
          <div className="flex-1 flex flex-col overflow-hidden">
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-white">
              {children}
            </main>
          </div>
        </div>
      </PortalPermissionBoundary>
    </SidebarProvider>
    // </ProtectedRoute>
  )
}