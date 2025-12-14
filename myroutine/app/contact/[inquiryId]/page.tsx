"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Clock, Hash, Pencil, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  inquiryApi,
  type InquiryInfoResponse,
  InquiryCategory,
} from "@/lib/api/inquiry"

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

const formatDateTime = (value?: string) => {
  if (!value) return "-"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return `${parsed.toISOString().slice(0, 10)} ${parsed
    .toISOString()
    .slice(11, 16)}`
}

export default function InquiryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const inquiryId = useMemo(
    () =>
      Array.isArray(params?.inquiryId)
        ? params.inquiryId[0]
        : params?.inquiryId,
    [params?.inquiryId]
  )
  const [data, setData] = useState<InquiryInfoResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    title: "",
    category: InquiryCategory.ETC,
    message: "",
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!inquiryId) return
    const fetchDetail = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const res = await inquiryApi.getInquiryDetail(inquiryId)
        setData(res)
      } catch (err: any) {
        setError(err?.message || "문의 상세를 불러오지 못했습니다.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchDetail()
  }, [inquiryId])

  useEffect(() => {
    if (!data) return
    setEditForm({
      title: data.title,
      category: data.inquiryCategory,
      message: data.message,
    })
  }, [data])

  if (!inquiryId) {
    return (
      <div className="container mx-auto px-4 py-10">
        <Card className="p-6 text-muted-foreground">문의 ID가 없습니다.</Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">문의 내용</h1>
        <Button asChild>
          <Link href="/contact">목록으로</Link>
        </Button>
      </div>

      {error && (
        <Card className="p-4 border-destructive/30 bg-destructive/5 text-sm text-destructive">
          {error}
        </Card>
      )}

      {isLoading && (
        <Card className="p-6 space-y-4">
          <div className="h-4 w-24 rounded bg-muted animate-pulse" />
          <div className="h-6 w-3/4 rounded bg-muted animate-pulse" />
          <div className="h-32 w-full rounded bg-muted animate-pulse" />
        </Card>
      )}

      {!isLoading && data && (
        <Card className="space-y-1 overflow-hidden">
          <div className="px-6 pb-4 flex flex-wrap items-start justify-between gap-4 border-b border-border/60">
            <div className="space-y-1">
              <Badge variant="secondary">
                {getCategoryLabel(data.inquiryCategory)}
              </Badge>
              <h2 className="text-2xl font-bold text-foreground">
                {data.title}
              </h2>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  등록 {formatDateTime(data.createdAt)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  수정 {formatDateTime(data.modifiedAt)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isEditing && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="w-4 h-4" />
                    수정
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-2"
                    onClick={async () => {
                      if (isDeleting) return
                      const confirmed =
                        window.confirm("이 문의를 삭제하시겠습니까?")
                      if (!confirmed) return
                      setIsDeleting(true)
                      setError(null)
                      try {
                        await inquiryApi.deleteInquiry(inquiryId)
                        router.push("/contact")
                      } catch (err: any) {
                        setError(err?.message || "문의 삭제에 실패했습니다.")
                      } finally {
                        setIsDeleting(false)
                      }
                    }}
                  >
                    {isDeleting ? (
                      "삭제 중..."
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        삭제
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>

          <CardContent className="space-y-6">
            {isEditing ? (
              <div className="space-y-4 rounded-lg border border-border/60 bg-muted/30 p-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">
                    제목
                  </label>
                  <Input
                    value={editForm.title}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">
                    카테고리
                  </label>
                  <select
                    value={editForm.category}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        category: e.target.value as InquiryCategory,
                      }))
                    }
                    className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
                  >
                    <option value={InquiryCategory.PRODUCT}>상품 문의</option>
                    <option value={InquiryCategory.SUBSCRIPTION}>구독</option>
                    <option value={InquiryCategory.SHIPPING}>배송</option>
                    <option value={InquiryCategory.PAYMENT}>결제/환불</option>
                    <option value={InquiryCategory.ACCOUNT}>계정/로그인</option>
                    <option value={InquiryCategory.ETC}>기타</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground">
                    내용
                  </label>
                  <textarea
                    value={editForm.message}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        message: e.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground min-h-[160px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    disabled={isSaving}
                    onClick={async () => {
                      setIsSaving(true)
                      setError(null)
                      try {
                        await inquiryApi.updateInquiry(inquiryId, {
                          title: editForm.title,
                          inquiryCategory: editForm.category,
                          message: editForm.message,
                        })
                        setData((prev) =>
                          prev
                            ? {
                                ...prev,
                                title: editForm.title,
                                inquiryCategory: editForm.category,
                                message: editForm.message,
                                modifiedAt: new Date().toISOString(),
                              }
                            : prev
                        )
                        setIsEditing(false)
                      } catch (err: any) {
                        setError(err?.message || "문의 수정에 실패했습니다.")
                      } finally {
                        setIsSaving(false)
                      }
                    }}
                  >
                    {isSaving ? "저장 중..." : "저장"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false)
                      setEditForm({
                        title: data.title,
                        category: data.inquiryCategory,
                        message: data.message,
                      })
                    }}
                  >
                    취소
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <h2 className="font-semibold text-foreground">문의 내용</h2>
                <p className="whitespace-pre-line rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-foreground">
                  {data.message || "내용이 없습니다."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
