"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import Header from "@/components/header"
import Footer from "@/components/footer"
import AdminShell from "@/components/admin-shell"

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith("/admin")

  if (isAdmin) {
    return <AdminShell>{children}</AdminShell>
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      {children}
      <Footer />
    </div>
  )
}
