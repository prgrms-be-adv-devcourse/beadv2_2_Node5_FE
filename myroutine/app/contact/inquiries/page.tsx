"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { MessageCircle, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  inquiryApi,
  type InquiryListResponse,
  InquiryCategory,
} from "@/lib/api/inquiry"
import { type PageResponse } from "@/lib/api-client"

const categoryLabels: Record<InquiryCategory, string> = {
  [InquiryCategory.PRODUCT]: "상품 문의",
  [InquiryCategory.SUBSCRIPTION]: "구독",
  [InquiryCategory.SHIPPING]: "배송",
  [InquiryCategory.PAYMENT]: "결제/환불",
  [InquiryCategory.ACCOUNT]: "계정/로그인",
  [InquiryCategory.ETC]: "기타",
}

const getCategoryLabel = (category: InquiryCategory | string) =>
  categoryLabels[category as InquiryCategory] ||
  categoryLabels[InquiryCategory.ETC]

export default function InquiryListPage() {
  const [page, setPage] = useState(0)
  const [data, setData] = useState<PageResponse<InquiryListResponse> | null>(
    null
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const totalPages = useMemo(() => data?.totalPages ?? 0, [data?.totalPages])

  useEffect(() => {
    const fetchList = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await inquiryApi.getMyInquiries(page)
        setData(res)
      } catch (err: any) {
        setError(err?.message || "문의 목록을 불러오지 못했습니다.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchList()
  }, [page, refreshKey])

  const handleRetry = () => {
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="container mx-auto px-4 py-10 space-y-6">
      <Card>
        <CardHeader className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold text-foreground">
              내 문의 목록
            </CardTitle>
            <CardDescription>
              접수한 문의 현황을 확인하세요. 제목을 눌러 상세 내용을 확인할 수
              있습니다.
            </CardDescription>
          </div>
          <CardAction>
            <Button asChild>
              <Link href="/contact/new">문의하기</Link>
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <span>{error}</span>
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={handleRetry}
              >
                <RefreshCw className="w-4 h-4" />
                다시 시도
              </Button>
            </div>
          )}

          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={`skeleton-${idx}`}
                  className="animate-pulse rounded-lg border border-border/60 bg-card px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-28 rounded bg-muted" />
                    <div className="h-4 w-20 rounded bg-muted" />
                  </div>
                  <div className="mt-3 h-3 w-48 rounded bg-muted" />
                </div>
              ))}
            </div>
          )}

          {!isLoading && data?.content?.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border/70 bg-muted/40 px-6 py-10 text-center">
              <MessageCircle className="w-8 h-8 text-muted-foreground" />
              <div className="space-y-1">
                <p className="text-foreground font-semibold">문의가 없습니다</p>
                <p className="text-muted-foreground text-sm">
                  첫 문의를 남기면 여기에서 진행 상태를 확인할 수 있어요.
                </p>
              </div>
              <Button asChild>
                <Link href="/contact/new">문의하기</Link>
              </Button>
            </div>
          )}

          {!isLoading && !!data?.content?.length && (
            <div className="space-y-3">
              {data.content.map((item) => (
                <Link
                  key={item.id}
                  href={`/contact/${item.id}`}
                  className="block"
                >
                  <article className="group rounded-lg border border-border bg-card px-4 py-3 transition hover:border-primary/60 hover:shadow-md">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <Badge variant="secondary">
                          {getCategoryLabel(item.inquiryCategory)}
                        </Badge>
                        <h3 className="text-base font-semibold text-foreground group-hover:text-primary">
                          {item.title}
                        </h3>
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        <span>ID: {item.id}</span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
        {data && data.totalPages > 1 && (
          <CardContent className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
            >
              이전
            </Button>
            <span className="text-sm text-muted-foreground">
              {page + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page + 1 >= totalPages}
              onClick={() =>
                setPage((prev) =>
                  prev + 1 < totalPages ? prev + 1 : prev
                )
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
