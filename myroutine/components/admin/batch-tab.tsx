"use client"

import { useEffect, useState } from "react"
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
import {
  batchServiceAdminApi,
  type BatchExecutionRow,
  type BatchExecutionWithSteps,
} from "@/lib/api/admin"

const formatBatchStatus = (value?: string | null) => {
  if (!value) return "-"
  return value
}

const formatDateTime = (value?: string) => {
  if (!value) return "-"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return `${parsed.toISOString().slice(0, 10)} ${parsed
    .toISOString()
    .slice(11, 16)}`
}

export default function BatchAdminTab() {
  const [jobNames, setJobNames] = useState<string[]>([])
  const [jobNamesLoading, setJobNamesLoading] = useState(false)
  const [jobNamesError, setJobNamesError] = useState<string | null>(null)
  const [jobNamesRefreshKey, setJobNamesRefreshKey] = useState(0)
  const [selectedJobName, setSelectedJobName] = useState<string>("")
  const [reviewExecutions, setReviewExecutions] = useState<BatchExecutionRow[]>(
    []
  )
  const [reviewTotalPages, setReviewTotalPages] = useState(1)
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [reviewRefreshKey, setReviewRefreshKey] = useState(0)
  const [reviewPage, setReviewPage] = useState(0)
  const [selectedExecutionId, setSelectedExecutionId] = useState<number | null>(
    null
  )
  const [isExecutionModalOpen, setIsExecutionModalOpen] = useState(false)
  const [executionDetail, setExecutionDetail] =
    useState<BatchExecutionWithSteps | null>(null)
  const [executionDetailLoading, setExecutionDetailLoading] = useState(false)
  const [executionDetailError, setExecutionDetailError] = useState<
    string | null
  >(null)
  const [executionDetailRefreshKey, setExecutionDetailRefreshKey] = useState(0)

  useEffect(() => {
    const fetchJobNames = async () => {
      setJobNamesLoading(true)
      setJobNamesError(null)
      try {
        const res = await batchServiceAdminApi.getJobNames()
        const nextNames = Array.isArray(res) ? res : []
        setJobNames(nextNames)
        if (selectedJobName && !nextNames.includes(selectedJobName)) {
          setSelectedJobName("")
          setReviewExecutions([])
          setReviewTotalPages(1)
        }
      } catch (err: any) {
        setJobNamesError(
          err?.message || "잡 이름 목록을 불러오지 못했습니다."
        )
        setJobNames([])
      } finally {
        setJobNamesLoading(false)
      }
    }

    fetchJobNames()
  }, [jobNamesRefreshKey])

  useEffect(() => {
    const fetchExecutions = async () => {
      if (!selectedJobName) {
        setReviewExecutions([])
        setReviewTotalPages(1)
        return
      }
      setReviewLoading(true)
      setReviewError(null)
      try {
        const res = await batchServiceAdminApi.getExecutions(
          selectedJobName,
          reviewPage,
          10
        )
        setReviewExecutions(res?.content ?? [])
        setReviewTotalPages(res?.totalPages ?? 1)
      } catch (err: any) {
        setReviewError(
          err?.message || "배치 실행 목록을 불러오지 못했습니다."
        )
        setReviewExecutions([])
        setReviewTotalPages(1)
      } finally {
        setReviewLoading(false)
      }
    }

    fetchExecutions()
  }, [reviewPage, reviewRefreshKey, selectedJobName])

  useEffect(() => {
    if (!selectedExecutionId) {
      setExecutionDetail(null)
      setExecutionDetailError(null)
      return
    }
    const fetchExecutionDetail = async () => {
      setExecutionDetailLoading(true)
      setExecutionDetailError(null)
      try {
        const res = await batchServiceAdminApi.getExecutionInfo(
          selectedExecutionId
        )
        setExecutionDetail(res)
      } catch (err: any) {
        setExecutionDetailError(
          err?.message || "배치 실행 상세를 불러오지 못했습니다."
        )
        setExecutionDetail(null)
      } finally {
        setExecutionDetailLoading(false)
      }
    }

    fetchExecutionDetail()
  }, [selectedExecutionId, executionDetailRefreshKey])

  return (
    <>
      <Card>
        <CardHeader className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <CardTitle className="text-xl font-bold text-foreground">
              배치 관리
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              배치 실행 상태를 확인할 수 있습니다.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setReviewRefreshKey((prev) => prev + 1)
              setJobNamesRefreshKey((prev) => prev + 1)
            }}
            disabled={reviewLoading || jobNamesLoading}
          >
            새로고침
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">잡 이름</p>
              {jobNamesError && (
                <p className="text-xs text-destructive">{jobNamesError}</p>
              )}
            </div>
            <Select
              value={selectedJobName}
              onValueChange={(value) => {
                setSelectedJobName(value)
                setReviewPage(0)
                setSelectedExecutionId(null)
                setIsExecutionModalOpen(false)
              }}
              disabled={jobNamesLoading || jobNames.length === 0}
            >
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue
                  placeholder={
                    jobNamesLoading ? "불러오는 중..." : "잡을 선택하세요"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {jobNames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {reviewError && (
            <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <span>{reviewError}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setReviewRefreshKey((prev) => prev + 1)}
              >
                다시 시도
              </Button>
            </div>
          )}

          {!selectedJobName && !reviewLoading && (
            <div className="rounded-lg border border-dashed border-border/70 bg-muted/40 px-6 py-6 text-center text-sm text-muted-foreground">
              잡 이름을 선택하면 실행 내역이 표시됩니다.
            </div>
          )}

          {reviewLoading && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={`review-skeleton-${idx}`}
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

          {!reviewLoading &&
            selectedJobName &&
            reviewExecutions.length === 0 && (
            <div className="rounded-lg border border-dashed border-border/70 bg-muted/40 px-6 py-8 text-center text-sm text-muted-foreground">
              실행 내역이 없습니다.
            </div>
          )}

          {!reviewLoading && reviewExecutions.length > 0 && (
            <div className="space-y-3">
              {reviewExecutions.map((execution) => (
                <div
                  key={execution.executionId}
                  className="rounded-lg border border-border bg-card px-4 py-3"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        실행 ID #{execution.executionId}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        작업명 {execution.jobName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        시작 {formatDateTime(execution.startTime)} · 종료{" "}
                        {formatDateTime(execution.endTime)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">
                        {formatBatchStatus(execution.status)}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedExecutionId(execution.executionId)
                        setIsExecutionModalOpen(true)
                      }}
                    >
                      상세 보기
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
        {reviewExecutions && reviewExecutions.length > 0 && (
          <CardContent className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={reviewPage === 0}
              onClick={() => setReviewPage((prev) => Math.max(prev - 1, 0))}
            >
              이전
            </Button>
            <span className="text-sm text-muted-foreground">
              {reviewPage + 1} / {reviewTotalPages} 페이지
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={reviewPage >= reviewTotalPages - 1}
              onClick={() =>
                setReviewPage((prev) => Math.min(reviewTotalPages - 1, prev + 1))
              }
            >
              다음
            </Button>
          </CardContent>
        )}
      </Card>

      {isExecutionModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6"
          onClick={() => setIsExecutionModalOpen(false)}
        >
          <div
            className="w-full max-w-3xl rounded-xl border border-border bg-background shadow-lg"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  배치 실행 상세
                </p>
                <p className="text-lg font-semibold text-foreground">
                  실행 ID {selectedExecutionId ?? "-"}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExecutionModalOpen(false)}
              >
                닫기
              </Button>
            </div>
            <div className="space-y-4 px-6 py-5">
              {executionDetailError && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {executionDetailError}
                </div>
              )}
              {executionDetailLoading && (
                <div className="space-y-3">
                  <div className="h-5 w-40 rounded bg-muted animate-pulse" />
                  <div className="h-24 w-full rounded bg-muted animate-pulse" />
                  <div className="h-24 w-full rounded bg-muted animate-pulse" />
                </div>
              )}
              {!executionDetailLoading && !executionDetail && (
                <div className="rounded-lg border border-dashed border-border/70 bg-muted/40 px-6 py-8 text-center text-sm text-muted-foreground">
                  선택된 실행 내역이 없습니다.
                </div>
              )}
              {!executionDetailLoading && executionDetail && (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">
                      {formatBatchStatus(executionDetail.status)}
                    </Badge>
                    <Badge variant="outline">
                      종료 코드 {executionDetail.exitCode}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    시작 {formatDateTime(executionDetail.startTime)} · 종료{" "}
                    {formatDateTime(executionDetail.endTime)}
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">
                      단계별 실행 내역
                    </p>
                    {executionDetail.steps?.length ? (
                      <div className="space-y-3">
                        {executionDetail.steps.map((step) => (
                          <div
                            key={step.stepName}
                            className="rounded-lg border border-border bg-muted/20 px-4 py-3"
                          >
                            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                              <div className="space-y-1">
                                <p className="text-sm font-semibold text-foreground">
                                  {step.stepName}
                                </p>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge variant="secondary">
                                    {formatBatchStatus(step.status)}
                                  </Badge>
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                읽기 {step.readCount} · 쓰기 {step.writeCount} ·
                                필터 {step.filterCount} · 커밋{" "}
                                {step.commitCount} · 롤백 {step.rollbackCount}
                              </div>
                            </div>
                            {step.exitMessage && (
                              <p className="mt-2 text-xs text-muted-foreground">
                                {step.exitMessage}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        단계 정보가 없습니다.
                      </p>
                    )}
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
