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
  ProductSearchSort,
  searchApi,
} from "@/lib/api/product"
import { CATEGORY_OPTIONS, getCategoryLabel } from "@/lib/categories"
import { getImageUrl } from "@/lib/image"

interface ProductGridProps {
  searchQuery: string
  category?: string | null
  priceRange?: [number, number]
  sort?: ProductSearchSort
}

type ProductCardItem = {
  id: string
  name: string
  category: string
  price: number
  image: string
  status: string
}

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
  sort,
}: ProductGridProps) {
  const [products, setProducts] = useState<ProductCardItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [debouncedFilters, setDebouncedFilters] = useState<{
    searchQuery: string
    category?: string | null
    priceRange?: [number, number]
    sort?: ProductSearchSort
  }>({ searchQuery, category, priceRange, sort })

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilters({ searchQuery, category, priceRange, sort })
      setPage(0)
    }, 300)
    return () => clearTimeout(handler)
  }, [searchQuery, category, priceRange, sort])

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
            sort: debouncedFilters.sort || ProductSearchSort.LATEST,
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
          const id =
            ("id" in item && item.id) ||
            ("productId" in item && item.productId) ||
            undefined
          const rawPrice = item.price
          const price =
            typeof rawPrice === "string"
              ? Number(rawPrice)
              : Number.isFinite(rawPrice)
                ? (rawPrice as number)
                : 0

          return {
            id: id?.toString() || String(idx),
            name: item.name || "이름 없음",
            category: getCategoryLabel(item.category || ""),
            price: Number.isFinite(price) ? price : 0,
            image:
              getImageUrl(item.thumbnailUrl) ||
              getImageUrl((item as any)?.productImage) ||
              "/placeholder.svg",
            status: item.status || "ON_SALE",
          }
        })
        setProducts(normalized)
        setTotalPages(
          data && !Array.isArray(data) && typeof data.totalPages === "number" && data.totalPages > 0
            ? data.totalPages
            : 1
        )
      } catch (err) {
        setProducts([])
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
