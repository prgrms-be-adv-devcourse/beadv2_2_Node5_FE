"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { productSponsorAdminApi } from "@/lib/api/admin"
import {
  ProductSearchSort,
  type ProductSearchResponse,
  searchApi,
} from "@/lib/api/product"
import { type PageResponse } from "@/lib/api-client"

const formatPrice = (value: number | string | undefined) => {
  if (value === undefined || value === null) return "-"
  const parsed = typeof value === "string" ? Number(value) : value
  if (!Number.isFinite(parsed)) return "-"
  return `₩${parsed.toLocaleString()}`
}

export default function SponsoredProductAdminTab() {
  const [manualProductId, setManualProductId] = useState("")
  const [manualActionLoading, setManualActionLoading] = useState(false)
  const [keywordInput, setKeywordInput] = useState("")
  const [searchKeyword, setSearchKeyword] = useState("")
  const [productsData, setProductsData] =
    useState<PageResponse<ProductSearchResponse> | null>(null)
  const [productsLoading, setProductsLoading] = useState(false)
  const [productsError, setProductsError] = useState<string | null>(null)
  const [productPage, setProductPage] = useState(0)
  const [productsRefreshKey, setProductsRefreshKey] = useState(0)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)

  const totalPages = useMemo(
    () => productsData?.totalPages ?? 0,
    [productsData?.totalPages]
  )

  useEffect(() => {
    const fetchProducts = async () => {
      setProductsLoading(true)
      setProductsError(null)
      try {
        const res = await searchApi.searchProducts({
          keyword: searchKeyword.trim() || undefined,
          page: productPage,
          size: 10,
          searchSort: ProductSearchSort.LATEST,
        })
        setProductsData(res)
      } catch (err: any) {
        setProductsError(err?.message || "상품 목록을 불러오지 못했습니다.")
        setProductsData(null)
      } finally {
        setProductsLoading(false)
      }
    }

    fetchProducts()
  }, [productPage, productsRefreshKey, searchKeyword])

  const handleSearch = () => {
    setProductPage(0)
    setSearchKeyword(keywordInput.trim())
    setProductsRefreshKey((prev) => prev + 1)
  }

  const handleManualAction = async (action: "mark" | "unmark") => {
    const targetId = manualProductId.trim()
    if (!targetId) return
    setManualActionLoading(true)
    setProductsError(null)
    try {
      if (action === "mark") {
        await productSponsorAdminApi.markAsSponsored(targetId)
      } else {
        await productSponsorAdminApi.unmarkAsSponsored(targetId)
      }
      setProductsRefreshKey((prev) => prev + 1)
    } catch (err: any) {
      setProductsError(err?.message || "스폰서 설정에 실패했습니다.")
    } finally {
      setManualActionLoading(false)
    }
  }

  const handleToggleSponsored = async (product: ProductSearchResponse) => {
    const id = String(product.productId ?? "")
    if (!id) return
    setActionLoadingId(id)
    setProductsError(null)
    try {
      if (product.isSponsored) {
        await productSponsorAdminApi.unmarkAsSponsored(id)
      } else {
        await productSponsorAdminApi.markAsSponsored(id)
      }
      setProductsRefreshKey((prev) => prev + 1)
    } catch (err: any) {
      setProductsError(err?.message || "스폰서 설정에 실패했습니다.")
    } finally {
      setActionLoadingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl font-bold text-foreground">
            스폰서 상품 관리
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            상품을 스폰서로 지정하거나 해제합니다.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">상품 ID</p>
              <Input
                value={manualProductId}
                onChange={(e) => setManualProductId(e.target.value)}
                placeholder="상품 ID 입력"
              />
            </div>
            <Button
              onClick={() => handleManualAction("mark")}
              disabled={manualActionLoading || !manualProductId.trim()}
            >
              스폰서 지정
            </Button>
            <Button
              variant="outline"
              onClick={() => handleManualAction("unmark")}
              disabled={manualActionLoading || !manualProductId.trim()}
            >
              스폰서 해제
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <CardTitle className="text-lg font-bold text-foreground">
              상품 목록
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              키워드로 검색 후 스폰서 상태를 변경합니다.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setProductsRefreshKey((prev) => prev + 1)}
            disabled={productsLoading}
          >
            새로고침
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <Input
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              placeholder="상품명 키워드 입력"
            />
            <Button
              onClick={handleSearch}
              disabled={productsLoading}
              className="md:w-28"
            >
              검색
            </Button>
          </div>

          {productsError && (
            <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <span>{productsError}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setProductsRefreshKey((prev) => prev + 1)}
              >
                다시 시도
              </Button>
            </div>
          )}

          {productsLoading && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={`sponsor-product-skeleton-${idx}`}
                  className="animate-pulse rounded-lg border border-border/60 bg-card px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-32 rounded bg-muted" />
                    <div className="h-4 w-20 rounded bg-muted" />
                  </div>
                  <div className="mt-3 h-3 w-48 rounded bg-muted" />
                </div>
              ))}
            </div>
          )}

          {!productsLoading && productsData?.content?.length === 0 && (
            <div className="rounded-lg border border-dashed border-border/70 bg-muted/40 px-6 py-8 text-center text-sm text-muted-foreground">
              검색 결과가 없습니다.
            </div>
          )}

          {!productsLoading && !!productsData?.content?.length && (
            <div className="space-y-3">
              {productsData.content.map((product) => {
                const productId = String(product.productId ?? "")
                const isSponsored = Boolean(product.isSponsored)
                return (
                  <div
                    key={productId}
                    className="rounded-lg border border-border bg-card px-4 py-3"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold text-foreground">
                          {product.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ID: {productId}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {product.category || "-"} · {formatPrice(product.price)}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={isSponsored ? "default" : "secondary"}>
                          {isSponsored ? "스폰서" : "일반"}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleToggleSponsored(product)}
                        disabled={actionLoadingId === productId}
                      >
                        {isSponsored ? "스폰서 해제" : "스폰서 지정"}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
        {productsData && productsData.totalPages > 0 && (
          <CardContent className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={productPage === 0}
              onClick={() => setProductPage((prev) => Math.max(prev - 1, 0))}
            >
              이전
            </Button>
            <span className="text-sm text-muted-foreground">
              {productPage + 1} / {totalPages} 페이지
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={productPage >= totalPages - 1}
              onClick={() =>
                setProductPage((prev) => Math.min(totalPages - 1, prev + 1))
              }
            >
              다음
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
