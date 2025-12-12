"use client"
import type React from "react"

import { ShoppingCart, User, LogOut, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { authApi } from "@/lib/api-client"

export default function Header() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const syncAuthState = () => {
      const token = localStorage.getItem("accessToken")
      setIsLoggedIn(!!token)
      setIsLoading(false)
    }

    syncAuthState()

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "accessToken") {
        syncAuthState()
      }
    }

    const handleAuthChanged = () => {
      syncAuthState()
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("auth-changed", handleAuthChanged)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("auth-changed", handleAuthChanged)
    }
  }, [])

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch (error: any) {
      console.error("Logout error:", error)
    }
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    window.dispatchEvent(new Event("auth-changed"))
    setIsLoggedIn(false)
    router.push("/login")
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const keyword = searchQuery.trim()
    if (keyword.length === 0) return
    router.push(`/?q=${encodeURIComponent(keyword)}`)
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold">M</span>
            </div>
            <span className="font-bold text-lg text-foreground hidden sm:inline">
              MyRoutine
            </span>
          </Link>

          {/* Right Actions */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex items-center flex-1 max-w-md mx-4"
          >
            <div className="relative w-full">
              <input
                type="text"
                placeholder="상품 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-foreground hover:text-primary"
              onClick={() => router.push("/cart")}
            >
              <ShoppingCart className="w-5 h-5" />
            </Button>

            {!isLoading && isLoggedIn ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.push("/dashboard")}
                  className="text-foreground hover:text-primary"
                  title="마이페이지"
                >
                  <User className="w-5 h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-foreground hover:text-primary"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  로그아웃
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/login")}
                  className="text-foreground hover:text-primary"
                >
                  로그인
                </Button>
              </div>
            )}
          </div>
        </div>
        {/* Mobile Search */}
        <div className="md:hidden pb-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              placeholder="상품 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              className="p-2 text-muted-foreground hover:text-primary"
            >
              <Search className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
