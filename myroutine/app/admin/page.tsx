"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
  adminApi,
  type EndPointInfoResponse,
  type EndPointRequest,
  type MemberInfoAdminResponse,
  MemberRole,
  MemberStatus,
} from "@/lib/api/admin"
import {
  InquiryCategory,
  type InquiryInfoResponse,
  type InquiryListResponse,
  InquiryStatus,
} from "@/lib/api/inquiry"
import { type PageResponse } from "@/lib/api-client"

const roleLabels: Record<MemberRole, string> = {
  [MemberRole.ADMIN]: "관리자",
  [MemberRole.USER]: "일반",
  [MemberRole.SELLER]: "판매자",
}

const statusLabels: Record<MemberStatus, string> = {
  [MemberStatus.ACTIVE]: "활성",
  [MemberStatus.BANNED]: "차단",
  [MemberStatus.DELETED]: "삭제",
}

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

const methodOptions = ["GET", "POST", "PUT", "PATCH", "DELETE"]

const formatDate = (value: string) => {
  if (!value) return value
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, "0")
  const day = String(parsed.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const formatDateTime = (value?: string) => {
  if (!value) return "-"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return `${parsed.toISOString().slice(0, 10)} ${parsed
    .toISOString()
    .slice(11, 16)}`
}

export default function AdminPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<
    "members" | "paths" | "inquiries"
  >(() => {
    const tab = searchParams?.get("tab")
    if (tab === "paths" || tab === "inquiries") return tab
    return "members"
  })
  const [membersData, setMembersData] =
    useState<PageResponse<MemberInfoAdminResponse> | null>(null)
  const [membersLoading, setMembersLoading] = useState(false)
  const [membersError, setMembersError] = useState<string | null>(null)
  const [membersRefreshKey, setMembersRefreshKey] = useState(0)
  const [memberPage, setMemberPage] = useState(0)
  const [memberStatusOptions, setMemberStatusOptions] = useState<
    MemberStatus[] | null
  >(null)
  const [memberStatusDrafts, setMemberStatusDrafts] = useState<
    Record<string, MemberStatus>
  >({})
  const [memberActionLoadingId, setMemberActionLoadingId] = useState<
    string | null
  >(null)
  const [endpointsData, setEndpointsData] =
    useState<PageResponse<EndPointInfoResponse> | null>(null)
  const [endpointsLoading, setEndpointsLoading] = useState(false)
  const [endpointsError, setEndpointsError] = useState<string | null>(null)
  const [endpointPage, setEndpointPage] = useState(0)
  const [endpointsRefreshKey, setEndpointsRefreshKey] = useState(0)
  const [editingEndpointId, setEditingEndpointId] = useState<string | null>(
    null
  )
  const [roleOptions, setRoleOptions] = useState<MemberRole[]>(
    Object.values(MemberRole)
  )
  const [endpointRole, setEndpointRole] = useState<MemberRole>(MemberRole.ADMIN)
  const [endpointHttpMethod, setEndpointHttpMethod] = useState(
    methodOptions[0]
  )
  const [endpointPathPattern, setEndpointPathPattern] = useState("")
  const [endpointActionLoading, setEndpointActionLoading] = useState(false)
  const [inquiriesData, setInquiriesData] =
    useState<PageResponse<InquiryListResponse> | null>(null)
  const [inquiriesLoading, setInquiriesLoading] = useState(false)
  const [inquiriesError, setInquiriesError] = useState<string | null>(null)
  const [inquiriesRefreshKey, setInquiriesRefreshKey] = useState(0)
  const [inquiryStatusFilter, setInquiryStatusFilter] =
    useState<InquiryStatus>(InquiryStatus.RECEIVED)
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

  const endpointTotalPages = useMemo(
    () => endpointsData?.totalPages ?? 0,
    [endpointsData?.totalPages]
  )
  const memberTotalPages = useMemo(
    () => membersData?.totalPages ?? 0,
    [membersData?.totalPages]
  )
  const inquiryTotalPages = useMemo(
    () => inquiriesData?.totalPages ?? 0,
    [inquiriesData?.totalPages]
  )

  useEffect(() => {
    const tab = searchParams?.get("tab")
    if (tab === "members" || tab === "paths" || tab === "inquiries") {
      if (tab !== activeSection) setActiveSection(tab)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  useEffect(() => {
    if (activeSection !== "members") return
    const fetchMembers = async () => {
      setMembersLoading(true)
      setMembersError(null)
      try {
        const res = await adminApi.getMembers({
          page: memberPage,
          size: 10,
          sort: "createdAt,desc",
        })
        setMembersData(res)
      } catch (err: any) {
        setMembersError(err?.message || "멤버 목록을 불러오지 못했습니다.")
        setMembersData(null)
      } finally {
        setMembersLoading(false)
      }
    }

    fetchMembers()
  }, [activeSection, membersRefreshKey, memberPage])

  useEffect(() => {
    if (activeSection !== "members") return
    const fetchMemberStatuses = async () => {
      try {
        const res = await adminApi.getMembersStatuses()
        if (res?.statuses?.length) {
          setMemberStatusOptions(res.statuses)
        } else {
          setMemberStatusOptions(null)
        }
      } catch {
        setMemberStatusOptions(null)
        // fallback to default enum list when status fetch fails
      }
    }

    fetchMemberStatuses()
  }, [activeSection])

  useEffect(() => {
    if (!membersData?.content) return
    const nextDrafts: Record<string, MemberStatus> = {}
    membersData.content.forEach((member) => {
      nextDrafts[member.id] = member.status
    })
    setMemberStatusDrafts(nextDrafts)
  }, [membersData])

  useEffect(() => {
    if (activeSection !== "paths") return
    const fetchRoles = async () => {
      try {
        const res = await adminApi.getMemberRoles()
        if (res?.roles?.length) {
          setRoleOptions(res.roles)
          setEndpointRole((prev) =>
            res.roles.includes(prev) ? prev : res.roles[0]
          )
        }
      } catch {
        // fallback to default enum list when role fetch fails
      }
    }

    fetchRoles()
  }, [activeSection])

  useEffect(() => {
    if (activeSection !== "paths") return
    const fetchEndpoints = async () => {
      setEndpointsLoading(true)
      setEndpointsError(null)
      try {
        const res = await adminApi.getEndPoints({
          page: endpointPage,
          size: 10,
          sort: "pathPattern,httpMethod,asc",
        })
        setEndpointsData(res)
      } catch (err: any) {
        setEndpointsError(
          err?.message || "권한 URL 목록을 불러오지 못했습니다."
        )
        setEndpointsData(null)
      } finally {
        setEndpointsLoading(false)
      }
    }

    fetchEndpoints()
  }, [activeSection, endpointPage, endpointsRefreshKey])

  useEffect(() => {
    if (activeSection !== "inquiries") return
    const fetchInquiries = async () => {
      setInquiriesLoading(true)
      setInquiriesError(null)
      try {
        const res = await adminApi.getInquiryListForAdmin({
          status: inquiryStatusFilter,
          page: inquiryPage,
          size: 10,
          sort: "createdAt,desc",
        })
        setInquiriesData(res)
      } catch (err: any) {
        setInquiriesError(
          err?.message || "문의 목록을 불러오지 못했습니다."
        )
        setInquiriesData(null)
      } finally {
        setInquiriesLoading(false)
      }
    }

    fetchInquiries()
  }, [activeSection, inquiriesRefreshKey, inquiryStatusFilter, inquiryPage])

  useEffect(() => {
    setInquiryPage(0)
  }, [inquiryStatusFilter])

  useEffect(() => {
    if (activeSection !== "inquiries") return
    if (!inquiriesData?.content?.length) {
      setSelectedInquiryId(null)
      return
    }
    if (
      selectedInquiryId &&
      inquiriesData.content.some((item) => item.id === selectedInquiryId)
    ) {
      return
    }
    setSelectedInquiryId(inquiriesData.content[0].id)
  }, [activeSection, inquiriesData, selectedInquiryId])

  useEffect(() => {
    if (activeSection !== "inquiries" || !selectedInquiryId) {
      setInquiryDetail(null)
      setInquiryDetailError(null)
      return
    }
    const fetchInquiryDetail = async () => {
      setInquiryDetailLoading(true)
      setInquiryDetailError(null)
      try {
        const res = await adminApi.getInquiryInfoForAdmin(selectedInquiryId)
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
  }, [activeSection, selectedInquiryId, inquiryDetailRefreshKey])

  const handleSectionChange = (section: "members" | "paths" | "inquiries") => {
    setActiveSection(section)
    router.replace(`/admin?tab=${section}`, { scroll: false })
  }

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
        await adminApi.modifyEndPoint(editingEndpointId, payload)
      } else {
        await adminApi.createEndPoint(payload)
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
      await adminApi.deleteEndPoint(endpointId)
      setEndpointsRefreshKey((prev) => prev + 1)
    } catch (err: any) {
      setEndpointsError(err?.message || "권한 URL을 삭제하지 못했습니다.")
    } finally {
      setEndpointActionLoading(false)
    }
  }

  const handleMemberStatusChange = async (memberId: string) => {
    const nextStatus = memberStatusDrafts[memberId]
    const currentStatus = membersData?.content?.find(
      (member) => member.id === memberId
    )?.status
    if (!nextStatus || !currentStatus || nextStatus === currentStatus) return
    setMemberActionLoadingId(memberId)
    setMembersError(null)
    try {
      await adminApi.modifyMemberStatus(memberId, nextStatus)
      setMembersRefreshKey((prev) => prev + 1)
    } catch (err: any) {
      setMembersError(err?.message || "멤버 상태를 변경하지 못했습니다.")
    } finally {
      setMemberActionLoadingId(null)
    }
  }

  const handleSaveInquiryAnswer = async () => {
    if (!selectedInquiryId) return
    const message = answerDraft.trim()
    if (!message) return
    setAnswerSaving(true)
    setInquiryDetailError(null)
    try {
      if (inquiryDetail?.inquiryAnswer) {
        await adminApi.modifyInquiryAnswer(selectedInquiryId, { message })
      } else {
        await adminApi.createInquiryAnswer(selectedInquiryId, { message })
      }
      setInquiryDetailRefreshKey((prev) => prev + 1)
      setInquiriesRefreshKey((prev) => prev + 1)
    } catch (err: any) {
      setInquiryDetailError(
        err?.message || "답변을 저장하지 못했습니다."
      )
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
      await adminApi.deleteInquiryAnswer(selectedInquiryId)
      setInquiryDetailRefreshKey((prev) => prev + 1)
      setInquiriesRefreshKey((prev) => prev + 1)
    } catch (err: any) {
      setInquiryDetailError(
        err?.message || "답변을 삭제하지 못했습니다."
      )
    } finally {
      setAnswerDeleting(false)
    }
  }

  return (
    <div className="flex flex-col md:flex-row">
      <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border bg-card">
        <nav className="p-4 space-y-2">
          <button
            type="button"
            onClick={() => handleSectionChange("members")}
            className={`w-full text-left rounded-md px-3 py-2 text-sm font-semibold ${
              activeSection === "members"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            멤버 관리
          </button>
          <button
            type="button"
            onClick={() => handleSectionChange("paths")}
            className={`w-full text-left rounded-md px-3 py-2 text-sm font-semibold ${
              activeSection === "paths"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            권한별 URL 관리
          </button>
          <button
            type="button"
            onClick={() => handleSectionChange("inquiries")}
            className={`w-full text-left rounded-md px-3 py-2 text-sm font-semibold ${
              activeSection === "inquiries"
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            문의 관리
          </button>
        </nav>
      </aside>

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 space-y-6">
          {activeSection === "members" && (
            <Card>
              <CardHeader className="flex items-start justify-between gap-4">
                <div className="space-y-2">
                  <CardTitle className="text-xl font-bold text-foreground">
                    멤버 관리
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    전체 멤버의 상태와 권한을 확인할 수 있습니다.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMembersRefreshKey((prev) => prev + 1)}
                  disabled={membersLoading}
                >
                  새로고침
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {membersError && (
                  <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    <span>{membersError}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setMembersRefreshKey((prev) => prev + 1)}
                    >
                      다시 시도
                    </Button>
                  </div>
                )}

                {membersLoading && (
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, idx) => (
                      <div
                        key={`member-skeleton-${idx}`}
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

                {!membersLoading && membersData?.content?.length === 0 && (
                  <div className="rounded-lg border border-dashed border-border/70 bg-muted/40 px-6 py-8 text-center text-sm text-muted-foreground">
                    등록된 멤버가 없습니다.
                  </div>
                )}

                {!membersLoading && !!membersData?.content?.length && (
                  <div className="space-y-3">
                    {membersData.content.map((member) => (
                      <div
                        key={member.id}
                        className="rounded-lg border border-border bg-card px-4 py-3"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="font-semibold text-foreground">
                              {member.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              닉네임: {member.nickname || "-"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {member.email}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              가입일: {formatDate(member.createdAt)}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">
                              {statusLabels[member.status]}
                            </Badge>
                            {member.roles.map((role) => (
                              <Badge key={`${member.id}-${role}`}>
                                {roleLabels[role]}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center">
                          <div className="w-full md:w-48">
                            <Select
                              value={
                                memberStatusDrafts[member.id] ?? member.status
                              }
                              onValueChange={(value) =>
                                setMemberStatusDrafts((prev) => ({
                                  ...prev,
                                  [member.id]: value as MemberStatus,
                                }))
                              }
                              disabled={
                                memberActionLoadingId === member.id ||
                                !memberStatusOptions?.length ||
                                member.status === MemberStatus.DELETED
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="상태 선택" />
                              </SelectTrigger>
                              <SelectContent>
                                {(memberStatusOptions ?? []).map((status) => (
                                  <SelectItem key={status} value={status}>
                                    {statusLabels[status]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleMemberStatusChange(member.id)}
                            disabled={
                              memberActionLoadingId === member.id ||
                              !memberStatusOptions?.length ||
                              member.status === MemberStatus.DELETED ||
                              (memberStatusDrafts[member.id] ?? member.status) ===
                                member.status
                            }
                          >
                            상태 변경
                          </Button>
                          {!memberStatusOptions?.length && (
                            <span className="text-xs text-muted-foreground">
                              상태 목록을 불러오지 못했습니다.
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
              {membersData && memberTotalPages > 1 && (
                <CardContent className="flex items-center justify-between pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={memberPage === 0}
                    onClick={() =>
                      setMemberPage((prev) => Math.max(prev - 1, 0))
                    }
                  >
                    이전
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {memberPage + 1} / {memberTotalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={memberPage + 1 >= memberTotalPages}
                    onClick={() =>
                      setMemberPage((prev) =>
                        prev + 1 < memberTotalPages ? prev + 1 : prev
                      )
                    }
                  >
                    다음
                  </Button>
                </CardContent>
              )}
            </Card>
          )}

          {activeSection === "paths" && (
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
                      <p className="text-sm font-semibold text-foreground">
                        권한
                      </p>
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
                      <p className="text-sm font-semibold text-foreground">
                        메서드
                      </p>
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
                      disabled={
                        endpointActionLoading || !endpointPathPattern.trim()
                      }
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
                        onClick={() =>
                          setEndpointsRefreshKey((prev) => prev + 1)
                        }
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

                  {!endpointsLoading &&
                    endpointsData?.content?.length === 0 && (
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
                                    <Badge>
                                      {endpoint.httpMethod}
                                    </Badge>
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
                                    onClick={() =>
                                      handleDeleteEndpoint(endpoint.id)
                                    }
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
          )}

          {activeSection === "inquiries" && (
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
                    onClick={() =>
                      setInquiryPage((prev) => Math.max(prev - 1, 0))
                    }
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
          )}
        </div>
      </main>

      {activeSection === "inquiries" && isInquiryModalOpen && (
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
    </div>
  )
}
