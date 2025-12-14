"use client"

import { useState, useEffect } from "react"
import ProductCard from "@/components/product-card"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { type PageResponse } from "@/lib/api-client"
import {
  productApi,
  type ProductInfoResponse,
  type ProductSearchResponse,
  searchApi,
} from "@/lib/api/product"
import { CATEGORY_OPTIONS, getCategoryLabel } from "@/lib/categories"

interface ProductGridProps {
  searchQuery: string
  category?: string | null
  priceRange?: [number, number]
}

type ProductCardItem = {
  id: string
  name: string
  category: string
  price: number
  image: string
  status: string
}

// Mock data - TODO: Replace with actual API calls
const mockProducts: ProductCardItem[] = [
  {
    id: "1",
    name: "프리미엄 샐러드 구독",
    category: "FOOD_BEVERAGE",
    price: 8900,
    image: "/salad-subscription.jpg",
    status: "ON_SALE",
  },
  {
    id: "2",
    name: "유기농 요거트 세트",
    category: "FOOD_BEVERAGE",
    price: 12900,
    image: "/organic-yogurt.jpg",
    status: "ON_SALE",
  },
  {
    id: "3",
    name: "프리미엄 커피 원두",
    category: "FOOD_BEVERAGE",
    price: 15000,
    image: "/premium-coffee-beans.jpg",
    status: "ON_SALE",
  },
  {
    id: "4",
    name: "스포츠 티셔츠 월간",
    category: "FASHION_BEAUTY",
    price: 25000,
    image: "/sports-t-shirt.png",
    status: "ON_SALE",
  },
  {
    id: "5",
    name: "비타민 구독 패키지",
    category: "HEALTH_FITNESS",
    price: 29900,
    image: "/vitamin-package.jpg",
    status: "ON_SALE",
  },
  {
    id: "6",
    name: "홈 스킨케어 세트",
    category: "FASHION_BEAUTY",
    price: 35000,
    image: "/skincare-set.png",
    status: "ON_SALE",
  },
  {
    id: "7",
    name: "프리미엄 침구류",
    category: "LIVING_APPLIANCE",
    price: 45000,
    image: "/premium-bedding.jpg",
    status: "ON_SALE",
  },
  {
    id: "8",
    name: "친환경 세제 구독",
    category: "LIVING_APPLIANCE",
    price: 18900,
    image: "/eco-detergent.jpg",
    status: "ON_SALE",
  },
]

type ProductListResult =
  | PageResponse<ProductInfoResponse | ProductSearchResponse>
  | (ProductInfoResponse | ProductSearchResponse)[]

const extractProducts = (
  data: ProductListResult | null
): (ProductInfoResponse | ProductSearchResponse)[] => {
  if (!data) return []
  if (Array.isArray(data)) return data
  if ("content" in data && Array.isArray(data.content)) return data.content
  return []
}

export default function ProductGrid({
  searchQuery,
  category,
  priceRange,
}: ProductGridProps) {
  const [products, setProducts] = useState<ProductCardItem[]>(
    mockProducts.map((item) => ({
      ...item,
      category: getCategoryLabel(item.category),
    }))
  )
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [debouncedFilters, setDebouncedFilters] = useState<{
    searchQuery: string
    category?: string | null
    priceRange?: [number, number]
  }>({ searchQuery, category, priceRange })

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilters({ searchQuery, category, priceRange })
      setPage(0)
    }, 300)
    return () => clearTimeout(handler)
  }, [searchQuery, category, priceRange])

  useEffect(() => {
    const fetchProducts = async () => {
      const defaultRange: [number, number] = [0, 100000]
      const currentRange = debouncedFilters.priceRange ?? defaultRange
      const isRangeChanged =
        currentRange[0] !== defaultRange[0] || currentRange[1] !== defaultRange[1]
      const hasFilter = !!debouncedFilters.searchQuery || !!debouncedFilters.category || isRangeChanged

      setIsLoading(true)
      try {
        let data: ProductListResult | null = null
        if (hasFilter) {
          const isDefaultRange =
            currentRange[0] === defaultRange[0] &&
            currentRange[1] === defaultRange[1]
          const minPrice = isDefaultRange ? undefined : currentRange[0]
          const maxPrice = isDefaultRange ? undefined : currentRange[1]

          data = await searchApi.searchProducts({
            keyword: debouncedFilters.searchQuery || undefined,
            category: debouncedFilters.category || undefined,
            minPrice,
            maxPrice,
            sort: "createdAt,desc",
            page,
            size: 12,
          })
        } else {
          data = await productApi.getProductList({
            sort: "createdAt,desc",
            page,
            size: 12,
          })
        }

        const list = extractProducts(data)
        const normalized = list.map((item, idx) => {
          const id = "id" in item ? item.id : item.productId
          return {
            id: id?.toString() || String(idx),
            name: item.name || "이름 없음",
            category: getCategoryLabel(item.category),
            price: item.price ?? 0,
            image: item.thumbnailUrl || "/placeholder.svg",
            status: item.status || "ON_SALE",
          }
        })
        const fallback = mockProducts.map((item) => ({
          ...item,
          category: getCategoryLabel(item.category),
        }))
        const nextProducts = normalized.length > 0 ? normalized : fallback
        setProducts(nextProducts)
        setTotalPages(
          data && !Array.isArray(data) && typeof data.totalPages === "number" && data.totalPages > 0
            ? data.totalPages
            : 1
        )
      } catch (err) {
        setProducts(mockProducts)
        setTotalPages(1)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()
  }, [debouncedFilters, page])

  if (products.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">
          {isLoading ? "상품을 불러오는 중입니다..." : "검색 결과가 없습니다."}
        </p>
      </Card>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      <div className="flex items-center justify-between pt-6">
        <span className="text-sm text-muted-foreground">
          페이지 {page + 1} / {totalPages}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((prev) => Math.max(0, prev - 1))}
            disabled={page === 0 || isLoading}
          >
            이전
          </Button>
          <Button
            variant="outline"
            onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
            disabled={page >= totalPages - 1 || isLoading}
          >
            다음
          </Button>
        </div>
      </div>
    </>
  )
}
