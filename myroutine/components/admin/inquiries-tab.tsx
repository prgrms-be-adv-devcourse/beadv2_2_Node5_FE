"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { memberServiceAdminApi } from "@/lib/api/admin"
import {
  InquiryCategory,
  type InquiryInfoResponse,
  type InquiryListResponse,
  InquiryStatus,
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

const inquiryStatusLabels: Record<InquiryStatus, string> = {
  [InquiryStatus.RECEIVED]: "접수",
  [InquiryStatus.IN_PROGRESS]: "처리 중",
  [InquiryStatus.ANSWERED]: "답변 완료",
}

const formatDateTime = (value?: string) => {
  if (!value) return "-"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return `${parsed.toISOString().slice(0, 10)} ${parsed
    .toISOString()
    .slice(11, 16)}`
}

export default function InquiriesAdminTab() {
  const [inquiriesData, setInquiriesData] =
    useState<PageResponse<InquiryListResponse> | null>(null)
  const [inquiriesLoading, setInquiriesLoading] = useState(false)
  const [inquiriesError, setInquiriesError] = useState<string | null>(null)
  const [inquiriesRefreshKey, setInquiriesRefreshKey] = useState(0)
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState<InquiryStatus>(
    InquiryStatus.RECEIVED
  )
  const [inquiryPage, setInquiryPage] = useState(0)
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(
    null
  )
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false)
  const [inquiryDetail, setInquiryDetail] =
    useState<InquiryInfoResponse | null>(null)
  const [inquiryDetailLoading, setInquiryDetailLoading] = useState(false)
  const [inquiryDetailError, setInquiryDetailError] = useState<string | null>(
    null
  )
  const [inquiryDetailRefreshKey, setInquiryDetailRefreshKey] = useState(0)
  const [answerDraft, setAnswerDraft] = useState("")
  const [answerSaving, setAnswerSaving] = useState(false)
  const [answerDeleting, setAnswerDeleting] = useState(false)

  const inquiryTotalPages = useMemo(
    () => inquiriesData?.totalPages ?? 0,
    [inquiriesData?.totalPages]
  )

  useEffect(() => {
    const fetchInquiries = async () => {
      setInquiriesLoading(true)
      setInquiriesError(null)
      try {
        const res = await memberServiceAdminApi.getInquiryListForAdmin({
          status: inquiryStatusFilter,
          page: inquiryPage,
          size: 12,
          sort: "createdAt,desc",
        })
        setInquiriesData(res)
      } catch (err: any) {
        setInquiriesError(err?.message || "문의 목록을 불러오지 못했습니다.")
        setInquiriesData(null)
      } finally {
        setInquiriesLoading(false)
      }
    }

    fetchInquiries()
  }, [inquiryStatusFilter, inquiriesRefreshKey, inquiryPage])

  useEffect(() => {
    if (!inquiriesData?.content?.length) {
      setSelectedInquiryId(null)
      return
    }
    setSelectedInquiryId(inquiriesData.content[0].id)
  }, [inquiriesData])

  useEffect(() => {
    if (!selectedInquiryId) {
      setInquiryDetail(null)
      setInquiryDetailError(null)
      return
    }
    const fetchInquiryDetail = async () => {
      setInquiryDetailLoading(true)
      setInquiryDetailError(null)
      try {
        const res = await memberServiceAdminApi.getInquiryInfoForAdmin(
          selectedInquiryId
        )
        setInquiryDetail(res)
        setAnswerDraft(res.inquiryAnswer?.message ?? "")
      } catch (err: any) {
        setInquiryDetailError(
          err?.message || "문의 상세를 불러오지 못했습니다."
        )
        setInquiryDetail(null)
      } finally {
        setInquiryDetailLoading(false)
      }
    }

    fetchInquiryDetail()
  }, [selectedInquiryId, inquiryDetailRefreshKey])

  const handleSaveInquiryAnswer = async () => {
    if (!selectedInquiryId) return
    const message = answerDraft.trim()
    if (!message) return
    setAnswerSaving(true)
    setInquiryDetailError(null)
    try {
      if (inquiryDetail?.inquiryAnswer) {
        await memberServiceAdminApi.modifyInquiryAnswer(selectedInquiryId, {
          message,
        })
      } else {
        await memberServiceAdminApi.createInquiryAnswer(selectedInquiryId, {
          message,
        })
      }
      setInquiryDetailRefreshKey((prev) => prev + 1)
      setInquiriesRefreshKey((prev) => prev + 1)
    } catch (err: any) {
      setInquiryDetailError(err?.message || "답변을 저장하지 못했습니다.")
    } finally {
      setAnswerSaving(false)
    }
  }

  const handleDeleteInquiryAnswer = async () => {
    if (!selectedInquiryId || !inquiryDetail?.inquiryAnswer) return
    if (!confirm("답변을 삭제하시겠습니까?")) return
    setAnswerDeleting(true)
    setInquiryDetailError(null)
    try {
      await memberServiceAdminApi.deleteInquiryAnswer(selectedInquiryId)
      setInquiryDetailRefreshKey((prev) => prev + 1)
      setInquiriesRefreshKey((prev) => prev + 1)
    } catch (err: any) {
      setInquiryDetailError(err?.message || "답변을 삭제하지 못했습니다.")
    } finally {
      setAnswerDeleting(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <CardTitle className="text-xl font-bold text-foreground">
              문의 관리
            </CardTitle>
            <p className="text-sm text-muted-foreground whitespace-nowrap">
              문의 목록 확인 및 답변 등록
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setInquiriesRefreshKey((prev) => prev + 1)}
            disabled={inquiriesLoading}
          >
            새로고침
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {inquiriesError && (
            <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <span>{inquiriesError}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setInquiriesRefreshKey((prev) => prev + 1)}
              >
                다시 시도
              </Button>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  상태 필터
                </p>
                <Select
                  value={inquiryStatusFilter}
                  onValueChange={(value) =>
                    setInquiryStatusFilter(value as InquiryStatus)
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="상태 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(InquiryStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {inquiryStatusLabels[status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {inquiriesLoading && (
              <div className="grid gap-3 md:grid-cols-2">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={`inquiry-skeleton-${idx}`}
                    className="h-24 rounded-lg border border-border/60 bg-muted animate-pulse"
                  />
                ))}
              </div>
            )}
            {!inquiriesLoading && inquiriesData?.content?.length === 0 && (
              <div className="rounded-lg border border-dashed border-border/70 bg-muted/40 px-4 py-6 text-center text-sm text-muted-foreground">
                등록된 문의가 없습니다.
              </div>
            )}
            {!inquiriesLoading && !!inquiriesData?.content?.length && (
              <div className="grid gap-3">
                {inquiriesData.content.map((inquiry) => (
                  <button
                    key={inquiry.id}
                    type="button"
                    onClick={() => {
                      setSelectedInquiryId(inquiry.id)
                      setIsInquiryModalOpen(true)
                    }}
                    className="group rounded-lg border border-border bg-card px-4 py-3 text-left transition hover:border-primary/60 hover:shadow-md"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary">
                          {categoryLabels[inquiry.inquiryCategory]}
                        </Badge>
                        <Badge variant="outline">
                          {inquiryStatusLabels[inquiry.status]}
                        </Badge>
                      </div>
                      <p className="text-base font-semibold text-foreground group-hover:text-primary">
                        {inquiry.title}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
        {inquiriesData && inquiryTotalPages > 1 && (
          <CardContent className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={inquiryPage === 0}
              onClick={() => setInquiryPage((prev) => Math.max(prev - 1, 0))}
            >
              이전
            </Button>
            <span className="text-sm text-muted-foreground">
              {inquiryPage + 1} / {inquiryTotalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={inquiryPage + 1 >= inquiryTotalPages}
              onClick={() =>
                setInquiryPage((prev) =>
                  prev + 1 < inquiryTotalPages ? prev + 1 : prev
                )
              }
            >
              다음
            </Button>
          </CardContent>
        )}
      </Card>

      {isInquiryModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
          onClick={() => setIsInquiryModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-xl border border-border bg-background shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">문의 상세</p>
                <p className="text-lg font-semibold text-foreground">
                  {inquiryDetail?.title || "상세 보기"}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsInquiryModalOpen(false)}
              >
                닫기
              </Button>
            </div>
            <div className="space-y-4 px-6 py-5">
              {inquiryDetailError && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {inquiryDetailError}
                </div>
              )}
              {inquiryDetailLoading && (
                <div className="space-y-3">
                  <div className="h-5 w-40 rounded bg-muted animate-pulse" />
                  <div className="h-24 w-full rounded bg-muted animate-pulse" />
                  <div className="h-24 w-full rounded bg-muted animate-pulse" />
                </div>
              )}
              {!inquiryDetailLoading && !inquiryDetail && (
                <div className="rounded-lg border border-dashed border-border/70 bg-muted/40 px-6 py-8 text-center text-sm text-muted-foreground">
                  선택된 문의가 없습니다.
                </div>
              )}
              {!inquiryDetailLoading && inquiryDetail && (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">
                      {categoryLabels[inquiryDetail.inquiryCategory]}
                    </Badge>
                    <Badge variant="outline">
                      {inquiryStatusLabels[inquiryDetail.status]}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      작성자: {inquiryDetail.memberId}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      등록 {formatDateTime(inquiryDetail.createdAt)} · 수정{" "}
                      {formatDateTime(inquiryDetail.modifiedAt)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">
                      문의 내용
                    </p>
                    <p className="whitespace-pre-line rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-foreground">
                      {inquiryDetail.message || "내용이 없습니다."}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">
                      답변 작성
                    </p>
                    <textarea
                      value={answerDraft}
                      onChange={(e) => setAnswerDraft(e.target.value)}
                      placeholder="답변 내용을 입력하세요."
                      className="min-h-32 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      disabled={answerSaving || answerDeleting}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        onClick={handleSaveInquiryAnswer}
                        disabled={
                          answerSaving || answerDeleting || !answerDraft.trim()
                        }
                      >
                        {inquiryDetail.inquiryAnswer
                          ? "답변 수정"
                          : "답변 등록"}
                      </Button>
                      {inquiryDetail.inquiryAnswer && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={handleDeleteInquiryAnswer}
                          disabled={answerSaving || answerDeleting}
                        >
                          답변 삭제
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
