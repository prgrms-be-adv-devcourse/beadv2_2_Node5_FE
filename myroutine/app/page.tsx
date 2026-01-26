"use client"

import { useEffect, useMemo, useState } from "react"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import ProductGrid from "@/components/product-grid"
import Sidebar from "@/components/sidebar"
import { useRouter, useSearchParams } from "next/navigation"
import { ProductSearchSort } from "@/lib/api/product"

const BASE_PRICE_BOUNDS: [number, number] = [0, 100000]

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const searchParams = useSearchParams()
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [priceRange, setPriceRange] = useState<[number, number]>(BASE_PRICE_BOUNDS)
  const [sort, setSort] = useState<ProductSearchSort>(
    ProductSearchSort.LATEST
  )

  const syncFromParams = () => {
    const q = searchParams.get("q") || ""
    const category = searchParams.get("category")
    setSearchQuery(q)
    setSelectedCategory(category)
    setSort(ProductSearchSort.LATEST)
  }

  useEffect(() => {
    if (searchParams.get("orderBy")) {
      const params = new URLSearchParams(searchParams.toString())
      params.delete("orderBy")
      const query = params.toString()
      router.replace(query ? `/?${query}` : "/")
      return
    }
    syncFromParams()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const handleCategoryChange = (next: string | null) => {
    setSelectedCategory(next)
    const params = new URLSearchParams(searchParams.toString())
    params.delete("orderBy")
    if (next) {
      params.set("category", next)
    } else {
      params.delete("category")
    }
    router.push(`/?${params.toString()}`)
  }

  const handleSortChange = (next: ProductSearchSort) => {
    setSort(next)
  }

  const searchTerm = useMemo(() => searchQuery || "", [searchQuery])

  return (
    <main className="flex-1">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 text-balance">
            매일 신선한 상품을 구독하세요
          </h1>
          <p className="text-lg text-muted-foreground mb-6 max-w-2xl">
            식품부터 의류까지, 당신이 원하는 상품을 정기적으로 배송받으세요
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <aside className={`${isSidebarOpen ? "block" : "hidden"} lg:block`}>
            <Sidebar
              selectedCategory={selectedCategory}
              onCategoryChange={handleCategoryChange}
              priceRange={priceRange}
              onPriceChange={setPriceRange}
              defaultPriceBounds={BASE_PRICE_BOUNDS}
              sort={sort}
              onSortChange={handleSortChange}
            />
          </aside>

          {/* Product Grid */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">상품 목록</h2>
              <Button
                variant="outline"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden"
              >
                {isSidebarOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </Button>
            </div>

            <ProductGrid
              searchQuery={searchTerm}
              category={selectedCategory}
              priceRange={priceRange}
              sort={sort}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
