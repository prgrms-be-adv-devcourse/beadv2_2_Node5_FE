"use client"

import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  memberServiceAdminApi,
  type EndPointInfoResponse,
  type EndPointRequest,
  MemberRole,
} from "@/lib/api/admin"
import { type PageResponse } from "@/lib/api-client"

const roleLabels: Record<MemberRole, string> = {
  [MemberRole.ADMIN]: "관리자",
  [MemberRole.USER]: "일반",
  [MemberRole.SELLER]: "판매자",
}

const methodOptions = ["GET", "POST", "PUT", "PATCH", "DELETE"]

export default function EndpointAdminTab() {
  const [endpointsData, setEndpointsData] =
    useState<PageResponse<EndPointInfoResponse> | null>(null)
  const [endpointsLoading, setEndpointsLoading] = useState(false)
  const [endpointsError, setEndpointsError] = useState<string | null>(null)
  const [endpointPage, setEndpointPage] = useState(0)
  const [endpointsRefreshKey, setEndpointsRefreshKey] = useState(0)
  const [editingEndpointId, setEditingEndpointId] = useState<string | null>(
    null
  )
  const [roleOptions] = useState<MemberRole[]>(Object.values(MemberRole))
  const [endpointRole, setEndpointRole] = useState<MemberRole>(MemberRole.ADMIN)
  const [endpointHttpMethod, setEndpointHttpMethod] = useState(methodOptions[0])
  const [endpointPathPattern, setEndpointPathPattern] = useState("")
  const [endpointActionLoading, setEndpointActionLoading] = useState(false)

  const endpointTotalPages = useMemo(
    () => endpointsData?.totalPages ?? 0,
    [endpointsData?.totalPages]
  )

  useEffect(() => {
    const fetchEndpoints = async () => {
      setEndpointsLoading(true)
      setEndpointsError(null)
      try {
        const res = await memberServiceAdminApi.getEndPoints({
          page: endpointPage,
          size: 10,
          sort: "createdAt,desc",
        })
        setEndpointsData(res)
      } catch (err: any) {
        setEndpointsError(err?.message || "URL 목록을 불러오지 못했습니다.")
        setEndpointsData(null)
      } finally {
        setEndpointsLoading(false)
      }
    }

    fetchEndpoints()
  }, [endpointPage, endpointsRefreshKey])

  const resetEndpointForm = () => {
    setEditingEndpointId(null)
    setEndpointRole(MemberRole.ADMIN)
    setEndpointHttpMethod(methodOptions[0])
    setEndpointPathPattern("")
  }

  const handleSubmitEndpoint = async () => {
    if (!endpointPathPattern.trim()) return
    const payload: EndPointRequest = {
      role: endpointRole,
      httpMethod: endpointHttpMethod,
      pathPattern: endpointPathPattern.trim(),
    }
    setEndpointActionLoading(true)
    setEndpointsError(null)
    try {
      if (editingEndpointId) {
        await memberServiceAdminApi.modifyEndPoint(editingEndpointId, payload)
      } else {
        await memberServiceAdminApi.createEndPoint(payload)
      }
      resetEndpointForm()
      setEndpointsRefreshKey((prev) => prev + 1)
    } catch (err: any) {
      setEndpointsError(err?.message || "권한 URL을 저장하지 못했습니다.")
    } finally {
      setEndpointActionLoading(false)
    }
  }

  const handleEditEndpoint = (endpoint: EndPointInfoResponse) => {
    setEditingEndpointId(endpoint.id)
    setEndpointRole(endpoint.role)
    setEndpointHttpMethod(endpoint.httpMethod)
    setEndpointPathPattern(endpoint.pathPattern)
  }

  const handleDeleteEndpoint = async (endpointId: string) => {
    if (!confirm("해당 URL 권한을 삭제하시겠습니까?")) return
    setEndpointActionLoading(true)
    setEndpointsError(null)
    try {
      await memberServiceAdminApi.deleteEndPoint(endpointId)
      setEndpointsRefreshKey((prev) => prev + 1)
    } catch (err: any) {
      setEndpointsError(err?.message || "권한 URL을 삭제하지 못했습니다.")
    } finally {
      setEndpointActionLoading(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="space-y-2">
          <CardTitle className="text-xl font-bold text-foreground">
            권한별 URL 관리
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            권한별로 접근 가능한 URL 패턴을 등록하고 수정합니다.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">권한</p>
              <Select
                value={endpointRole}
                onValueChange={(value) =>
                  setEndpointRole(value as MemberRole)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="권한 선택" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((role) => (
                    <SelectItem key={role} value={role}>
                      {roleLabels[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">메서드</p>
              <Select
                value={endpointHttpMethod}
                onValueChange={(value) => setEndpointHttpMethod(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="메서드 선택" />
                </SelectTrigger>
                <SelectContent>
                  {methodOptions.map((method) => (
                    <SelectItem key={method} value={method}>
                      {method}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">
                경로 패턴
              </p>
              <Input
                value={endpointPathPattern}
                onChange={(e) => setEndpointPathPattern(e.target.value)}
                placeholder="/member-service/api/v1/..."
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={handleSubmitEndpoint}
              disabled={endpointActionLoading || !endpointPathPattern.trim()}
            >
              등록
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <CardTitle className="text-lg font-bold text-foreground">
              등록된 URL 목록
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              권한별 접근 가능한 URL을 확인하고 수정할 수 있습니다.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEndpointsRefreshKey((prev) => prev + 1)}
            disabled={endpointsLoading}
          >
            새로고침
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {endpointsError && (
            <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <span>{endpointsError}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEndpointsRefreshKey((prev) => prev + 1)}
              >
                다시 시도
              </Button>
            </div>
          )}

          {endpointsLoading && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={`endpoint-skeleton-${idx}`}
                  className="animate-pulse rounded-lg border border-border/60 bg-card px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-32 rounded bg-muted" />
                    <div className="h-4 w-20 rounded bg-muted" />
                  </div>
                  <div className="mt-3 h-3 w-64 rounded bg-muted" />
                </div>
              ))}
            </div>
          )}

          {!endpointsLoading && endpointsData?.content?.length === 0 && (
            <div className="rounded-lg border border-dashed border-border/70 bg-muted/40 px-6 py-8 text-center text-sm text-muted-foreground">
              등록된 URL이 없습니다.
            </div>
          )}

          {!endpointsLoading && !!endpointsData?.content?.length && (
            <div className="space-y-3">
              {endpointsData.content.map((endpoint) => {
                const isEditing = editingEndpointId === endpoint.id
                return (
                  <div
                    key={endpoint.id}
                    className="rounded-lg border border-border bg-card px-4 py-3"
                  >
                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="grid gap-3 md:grid-cols-3">
                          <Select
                            value={endpointRole}
                            onValueChange={(value) =>
                              setEndpointRole(value as MemberRole)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="권한 선택" />
                            </SelectTrigger>
                            <SelectContent>
                              {roleOptions.map((role) => (
                                <SelectItem key={role} value={role}>
                                  {roleLabels[role]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={endpointHttpMethod}
                            onValueChange={(value) =>
                              setEndpointHttpMethod(value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="메서드 선택" />
                            </SelectTrigger>
                            <SelectContent>
                              {methodOptions.map((method) => (
                                <SelectItem key={method} value={method}>
                                  {method}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            value={endpointPathPattern}
                            onChange={(e) =>
                              setEndpointPathPattern(e.target.value)
                            }
                            placeholder="/member-service/api/v1/..."
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={handleSubmitEndpoint}
                            disabled={
                              endpointActionLoading ||
                              !endpointPathPattern.trim()
                            }
                          >
                            저장
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={resetEndpointForm}
                            disabled={endpointActionLoading}
                          >
                            취소
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">
                              {roleLabels[endpoint.role]}
                            </Badge>
                            <Badge>{endpoint.httpMethod}</Badge>
                          </div>
                          <p className="text-sm text-foreground">
                            {endpoint.pathPattern}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditEndpoint(endpoint)}
                            disabled={
                              endpointActionLoading ||
                              editingEndpointId !== null
                            }
                          >
                            수정
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteEndpoint(endpoint.id)}
                            disabled={
                              endpointActionLoading ||
                              editingEndpointId !== null
                            }
                          >
                            삭제
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
        {endpointsData && endpointTotalPages > 1 && (
          <CardContent className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={endpointPage === 0}
              onClick={() =>
                setEndpointPage((prev) => Math.max(prev - 1, 0))
              }
            >
              이전
            </Button>
            <span className="text-sm text-muted-foreground">
              {endpointPage + 1} / {endpointTotalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={endpointPage + 1 >= endpointTotalPages}
              onClick={() =>
                setEndpointPage((prev) =>
                  prev + 1 < endpointTotalPages ? prev + 1 : prev
                )
              }
            >
              다음
            </Button>
          </CardContent>
        )}
      </Card>
    </>
  )
}
