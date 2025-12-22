"use client"

import Link from "next/link"

export default function AdminHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold">M</span>
              </div>
              <span className="font-bold text-lg text-foreground hidden sm:inline">
                MyRoutine
              </span>
            </Link>
          </div>
          <span className="text-sm text-muted-foreground">관리자</span>
        </div>
      </div>
    </header>
  )
}
