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
import {
  memberServiceAdminApi,
  type MemberInfoAdminResponse,
  MemberRole,
  MemberStatus,
} from "@/lib/api/admin"
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

const formatDate = (value: string) => {
  if (!value) return value
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, "0")
  const day = String(parsed.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export default function MemberAdminTab() {
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

  const memberTotalPages = useMemo(
    () => membersData?.totalPages ?? 0,
    [membersData?.totalPages]
  )

  useEffect(() => {
    const fetchMembers = async () => {
      setMembersLoading(true)
      setMembersError(null)
      try {
        const res = await memberServiceAdminApi.getMembers({
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
  }, [membersRefreshKey, memberPage])

  useEffect(() => {
    const fetchMemberStatuses = async () => {
      try {
        const res = await memberServiceAdminApi.getMembersStatuses()
        if (res?.statuses?.length) {
          setMemberStatusOptions(res.statuses)
        } else {
          setMemberStatusOptions(null)
        }
      } catch {
        setMemberStatusOptions(null)
      }
    }

    fetchMemberStatuses()
  }, [])

  const handleMemberStatusChange = async (memberId: string) => {
    const nextStatus = memberStatusDrafts[memberId]
    const currentStatus = membersData?.content?.find(
      (member) => member.id === memberId
    )?.status
    if (!nextStatus || !currentStatus || nextStatus === currentStatus) return
    setMemberActionLoadingId(memberId)
    setMembersError(null)
    try {
      await memberServiceAdminApi.modifyMemberStatus(memberId, nextStatus)
      setMembersRefreshKey((prev) => prev + 1)
    } catch (err: any) {
      setMembersError(err?.message || "멤버 상태를 변경하지 못했습니다.")
    } finally {
      setMemberActionLoadingId(null)
    }
  }

  return (
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
                      value={memberStatusDrafts[member.id] ?? member.status}
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
            onClick={() => setMemberPage((prev) => Math.max(prev - 1, 0))}
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
  )
}
