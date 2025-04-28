"use client"

// import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
// import { isAuthenticated } from "@/utils/auth"

export default function DashboardPage() {
  const router = useRouter()

  // useEffect(() => {
  //   if (!isAuthenticated()) {
  //     router.replace("/")
  //   }
  // }, [router])

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create Company</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-2">Companies</h3>
          <p className="text-2xl font-bold">1</p>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold mb-2">No. of Users</h3>
          <p className="text-2xl font-bold">1</p>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold mb-2">Active Users</h3>
          <p className="text-2xl font-bold">1</p>
        </Card>
      </div>
    </div>
  )
}