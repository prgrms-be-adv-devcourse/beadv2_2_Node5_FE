"use client"

import type React from "react"
import AdminHeader from "@/components/admin-header"

export default function AdminShell({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <div className="min-h-[calc(100vh-4rem)]">{children}</div>
    </div>
  )
}
