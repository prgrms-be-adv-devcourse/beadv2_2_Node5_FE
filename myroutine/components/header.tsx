"use client"
import type React from "react"

import { ShoppingCart, User, LogOut, Search, Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api-client"
import { authApi } from "@/lib/api/auth"
import { requireClientLogin } from "@/lib/auth-guard"
import { useTheme } from "next-themes"
import { autocompleteApi } from "@/lib/api/product"

export default function Header() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const { resolvedTheme, setTheme } = useTheme()
  const [isThemeReady, setIsThemeReady] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [activeSearchField, setActiveSearchField] = useState<
    "desktop" | "mobile" | null
  >(null)
  const [isAutocompleteLoading, setIsAutocompleteLoading] = useState(false)

  useEffect(() => {
    setIsThemeReady(true)

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
    apiClient.clearAccessToken()
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    localStorage.removeItem("memberId")
    window.dispatchEvent(new Event("auth-changed"))
    setIsLoggedIn(false)
    router.push("/")
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const keyword = searchQuery.trim()
    if (keyword.length === 0) return
    router.push(`/?q=${encodeURIComponent(keyword)}`)
  }

  useEffect(() => {
    const keyword = searchQuery.trim()
    if (!keyword) {
      setSuggestions([])
      setIsAutocompleteLoading(false)
      return
    }

    let isActive = true
    setIsAutocompleteLoading(true)
    const timer = window.setTimeout(async () => {
      try {
        const data = await autocompleteApi.autocomplete({ keyword })
        if (!isActive) return
        setSuggestions(Array.isArray(data) ? data : [])
      } catch (error: any) {
        if (!isActive) return
        console.error("Autocomplete error:", error)
        setSuggestions([])
      } finally {
        if (isActive) {
          setIsAutocompleteLoading(false)
        }
      }
    }, 300)

    return () => {
      isActive = false
      window.clearTimeout(timer)
    }
  }, [searchQuery])

  const handleSuggestionSelect = (keyword: string) => {
    setSearchQuery(keyword)
    setActiveSearchField(null)
    router.push(`/?q=${encodeURIComponent(keyword)}`)
  }

  const handleSearchBlur = () => {
    window.setTimeout(() => {
      setActiveSearchField(null)
    }, 150)
  }

  const renderAutocomplete = (field: "desktop" | "mobile") => {
    if (
      activeSearchField !== field ||
      (!isAutocompleteLoading && suggestions.length === 0)
    ) {
      return null
    }

    return (
      <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border border-input bg-background shadow-lg">
        {isAutocompleteLoading ? (
          <div className="px-3 py-2 text-sm text-muted-foreground">
            검색 중...
          </div>
        ) : (
          <ul className="max-h-60 overflow-auto py-1 text-sm">
            {suggestions.map((suggestion) => (
              <li key={suggestion}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left hover:bg-muted"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => handleSuggestionSelect(suggestion)}
                >
                  {suggestion}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card pt-[env(safe-area-inset-top,0px)]">
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
                onFocus={() => setActiveSearchField("desktop")}
                onBlur={handleSearchBlur}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
              >
                <Search className="w-4 h-4" />
              </button>
              {renderAutocomplete("desktop")}
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="text-foreground hover:text-primary"
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
              aria-label="다크 모드 전환"
            >
              {isThemeReady && resolvedTheme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-foreground hover:text-primary"
              onClick={() => {
                if (requireClientLogin(router)) {
                  router.push("/cart")
                }
              }}
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
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="상품 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setActiveSearchField("mobile")}
                onBlur={handleSearchBlur}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {renderAutocomplete("mobile")}
            </div>
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
