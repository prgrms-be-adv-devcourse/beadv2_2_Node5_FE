"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import EndpointAdminTab from "@/components/admin/endpoint-tab"
import InquiriesAdminTab from "@/components/admin/inquiries-tab"
import MemberAdminTab from "@/components/admin/member-tab"
import ReviewSummaryAdminTab from "@/components/admin/review-summary-tab"

type AdminSection = "members" | "paths" | "inquiries" | "review-summary"

export default function AdminPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<AdminSection>(() => {
    const tab = searchParams?.get("tab")
    if (
      tab === "paths" ||
      tab === "inquiries" ||
      tab === "review-summary"
    ) {
      return tab
    }
    return "members"
  })

  useEffect(() => {
    const tab = searchParams?.get("tab")
    if (
      tab === "members" ||
      tab === "paths" ||
      tab === "inquiries" ||
      tab === "review-summary"
    ) {
      if (tab !== activeSection) setActiveSection(tab)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const handleSectionChange = (section: AdminSection) => {
    setActiveSection(section)
    router.replace(`/admin?tab=${section}`, { scroll: false })
  }

  return (
    <div className="flex flex-col md:flex-row">
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border bg-card">
        <nav className="p-4 space-y-2">
          <button
            type="button"
            onClick={() => handleSectionChange("members")}
            className={`w-full text-left rounded-md px-3 py-2 text-sm font-semibold ${
              activeSection === "members"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            멤버 관리
          </button>
          <button
            type="button"
            onClick={() => handleSectionChange("paths")}
            className={`w-full text-left rounded-md px-3 py-2 text-sm font-semibold ${
              activeSection === "paths"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            권한별 URL 관리
          </button>
          <button
            type="button"
            onClick={() => handleSectionChange("inquiries")}
            className={`w-full text-left rounded-md px-3 py-2 text-sm font-semibold ${
              activeSection === "inquiries"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            문의 관리
          </button>
          <button
            type="button"
            onClick={() => handleSectionChange("review-summary")}
            className={`w-full text-left rounded-md px-3 py-2 text-sm font-semibold ${
              activeSection === "review-summary"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            리뷰 요약 배치
          </button>
        </nav>
      </aside>

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 space-y-6">
          {activeSection === "members" && <MemberAdminTab />}
          {activeSection === "paths" && <EndpointAdminTab />}
          {activeSection === "inquiries" && <InquiriesAdminTab />}
          {activeSection === "review-summary" && <ReviewSummaryAdminTab />}
        </div>
      </main>
    </div>
  )
}
