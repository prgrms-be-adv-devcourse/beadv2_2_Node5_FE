"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"

export default function AdminPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<"members" | "paths">(
    () => (searchParams?.get("tab") === "paths" ? "paths" : "members")
  )

  useEffect(() => {
    const tab = searchParams?.get("tab")
    if (tab === "members" || tab === "paths") {
      if (tab !== activeSection) setActiveSection(tab)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const handleSectionChange = (section: "members" | "paths") => {
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
        </nav>
      </aside>

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {activeSection === "members" && (
            <Card className="p-6 md:p-8">
              <h2 className="text-xl font-bold text-foreground mb-2">
                멤버 관리
              </h2>
              <p className="text-muted-foreground">
                멤버 관리 기능은 준비 중입니다.
              </p>
            </Card>
          )}

          {activeSection === "paths" && (
            <Card className="p-6 md:p-8">
              <h2 className="text-xl font-bold text-foreground mb-2">
                권한별 URL 관리
              </h2>
              <p className="text-muted-foreground">
                권한별 URL 관리 기능은 준비 중입니다.
              </p>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
