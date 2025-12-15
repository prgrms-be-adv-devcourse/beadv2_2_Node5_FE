"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, Pause, Play, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DAY_OF_WEEK_OPTIONS,
  type DayOfWeek,
  formatDaysOfWeek,
} from "@/lib/api-client"
import { subscriptionApi, type SubscriptionInfo } from "@/lib/api/subscription"

type ActionType = "pause" | "resume" | "cancel"

const mockSubscriptions: Record<string, SubscriptionInfo> = {
  "1": {
    id: "1",
    productId: "1",
    productName: "프리미엄 샐러드 구독",
    thumbnailUrl: "/vibrant-mixed-salad.png",
    subscriptionStatus: "ACTIVE",
    pricePerItem: 8900,
    quantity: 1,
    totalPrice: 8900,
    deliveryAddress: "서울시 강남구 테헤란로 123",
    createdAt: "2024-01-01",
    modifiedAt: "2024-01-10",
    nextRunDate: "2024-01-20",
    recurrenceType: "WEEKLY",
    dayOfWeek: [1, 3, 5],
    dayOfMonth: 0,
  },
  "2": {
    id: "2",
    productId: "2",
    productName: "유기농 요거트 세트",
    thumbnailUrl: "/creamy-yogurt-bowl.png",
    subscriptionStatus: "PAUSED",
    pricePerItem: 12900,
    quantity: 1,
    totalPrice: 12900,
    deliveryAddress: "서울시 성동구 왕십리로 45",
    createdAt: "2024-01-05",
    modifiedAt: "2024-01-11",
    nextRunDate: "2024-02-01",
    recurrenceType: "MONTHLY",
    dayOfWeek: [],
    dayOfMonth: 1,
  },
}

const statusMeta = {
  ACTIVE: { label: "활성", className: "bg-green-100 text-green-800" },
  PAUSED: { label: "일시정지", className: "bg-yellow-100 text-yellow-800" },
  CANCELLED: { label: "해지", className: "bg-red-100 text-red-800" },
  FAILED: { label: "실패", className: "bg-red-100 text-red-800" },
  UNAVAILABLE: { label: "불가", className: "bg-gray-100 text-gray-800" },
}

export default function SubscriptionDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const id = params?.id || ""

  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(
    null
  )
  const [isLoading, setIsLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<ActionType | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [address, setAddress] = useState("")
  const [recurrenceType, setRecurrenceType] = useState<"WEEKLY" | "MONTHLY">(
    "WEEKLY"
  )
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([])
  const [selectedDayOfMonth, setSelectedDayOfMonth] = useState<number>(1)
  const [initialDayCount, setInitialDayCount] = useState(0)

  useEffect(() => {
    if (!id) return

    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await subscriptionApi.getSubscription(id)
        setSubscription(data)
        setQuantity(data.quantity || 1)
        setAddress(data.deliveryAddress || "")
        setRecurrenceType(data.recurrenceType)
        setSelectedDays(data.dayOfWeek || [])
        setSelectedDayOfMonth(data.dayOfMonth || 1)
        setInitialDayCount((data.dayOfWeek || []).length)
      } catch (err: any) {
        console.error("Failed to fetch subscription, fallback to mock.", err)
        const mock = mockSubscriptions[id]
        if (mock) {
          setSubscription(mock)
          setQuantity(mock.quantity || 1)
          setAddress(mock.deliveryAddress || "")
          setRecurrenceType(mock.recurrenceType)
          setSelectedDays(mock.dayOfWeek || [])
          setSelectedDayOfMonth(mock.dayOfMonth || 1)
          setInitialDayCount((mock.dayOfWeek || []).length)
        } else {
          setError("구독 정보를 불러올 수 없습니다.")
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [id])

  const handleAction = async (type: ActionType) => {
    if (!subscription) return
    if (type === "cancel" && !confirm("정말 구독을 해지하시겠습니까?")) return

    try {
      setActionLoading(type)
      let updated: SubscriptionInfo | null = null

      if (type === "pause") {
        updated = await subscriptionApi.pauseSubscription(subscription.id)
      } else if (type === "resume") {
        updated = await subscriptionApi.resumeSubscription(subscription.id)
      } else {
        updated = await subscriptionApi.cancelSubscription(subscription.id)
      }

      if (updated) {
        setSubscription(updated)
        setQuantity(updated.quantity || 1)
        setAddress(updated.deliveryAddress || "")
        setRecurrenceType(updated.recurrenceType)
        setSelectedDays(updated.dayOfWeek || [])
        setSelectedDayOfMonth(updated.dayOfMonth || 1)
        setInitialDayCount((updated.dayOfWeek || []).length)
      }
    } catch (err: any) {
      alert(err?.message || "처리 중 오류가 발생했습니다.")
    } finally {
      setActionLoading(null)
    }
  }

  const handleToggleDay = (day: DayOfWeek) => {
    if (!selectedDays.includes(day)) {
      const limit = initialDayCount > 0 ? initialDayCount : undefined
      if (limit && selectedDays.length >= limit) {
        alert(
          `선택 가능한 요일 개수는 ${limit}개입니다. 다른 요일을 해제 후 선택하세요.`
        )
        return
      }
      setSelectedDays((prev) => [...prev, day])
      return
    }

    setSelectedDays((prev) => prev.filter((d) => d !== day))
  }

  const handleUpdate = async () => {
    if (!subscription) return
    if (!address.trim()) {
      alert("배송지를 입력해주세요.")
      return
    }

    if (recurrenceType === "WEEKLY") {
      if (selectedDays.length === 0) {
        alert("배송 요일을 선택해주세요.")
        return
      }
      if (initialDayCount > 0 && selectedDays.length !== initialDayCount) {
        alert(
          `배송 요일은 처음 설정된 ${initialDayCount}개로 유지되어야 합니다.`
        )
        return
      }
    }

    try {
      setIsUpdating(true)
      const payload =
        recurrenceType === "WEEKLY"
          ? {
              deliveryAddress: address.trim(),
              dayOfWeek: selectedDays,
            }
          : {
              deliveryAddress: address.trim(),
              dayOfMonth: selectedDayOfMonth,
            }

      const updated = await subscriptionApi.updateSubscription(
        subscription.id,
        payload
      )
      setSubscription(updated)
      setQuantity(updated.quantity || 1)
      setAddress(updated.deliveryAddress || "")
      setRecurrenceType(updated.recurrenceType)
      setSelectedDays(updated.dayOfWeek || [])
      setSelectedDayOfMonth(updated.dayOfMonth || 1)
      alert("구독 정보가 수정되었습니다.")
    } catch (err: any) {
      alert(err?.message || "수정 중 오류가 발생했습니다.")
    } finally {
      setIsUpdating(false)
    }
  }

  const status = subscription?.subscriptionStatus || "ACTIVE"
  const statusInfo = statusMeta[status as keyof typeof statusMeta]

  const displayDays = useMemo(() => {
    if (!subscription) return ""
    if (subscription.recurrenceType === "WEEKLY") {
      return formatDaysOfWeek(
        subscription.dayOfWeek || DAY_OF_WEEK_OPTIONS.map((d) => d.id)
      )
    }
    return `${subscription.dayOfMonth}일`
  }, [subscription])

  const priceText = (
    subscription?.totalPrice ??
    (subscription?.pricePerItem || 0) * (subscription?.quantity || 1)
  ).toLocaleString()

  if (isLoading) {
    return (
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <p className="text-muted-foreground">구독 정보를 불러오는 중...</p>
        </div>
      </main>
    )
  }

  if (error || !subscription) {
    return (
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 space-y-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            돌아가기
          </Button>
          <p className="text-destructive font-semibold">
            {error || "구독 정보를 찾을 수 없습니다."}
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="flex-1">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            돌아가기
          </Button>
          <h1 className="text-3xl font-bold text-foreground">구독 상세</h1>
        </div>

        <Card className="p-6 md:p-8 space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-shrink-0">
              <img
                src={subscription.thumbnailUrl || "/placeholder.svg"}
                alt={subscription.productName}
                className="w-32 h-32 md:w-40 md:h-40 object-cover rounded-lg"
              />
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">
                    {subscription.productName}
                  </h2>
                  <Badge
                    className={
                      statusInfo?.className || "bg-gray-100 text-gray-800"
                    }
                  >
                    {statusInfo?.label || status}
                  </Badge>
                </div>
                <div className="text-right">
                  <p className="text-lg text-muted-foreground">
                    수량 {subscription.quantity}개
                  </p>
                  <p className="text-3xl font-bold text-primary">
                    ₩{priceText}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <p className="font-bold text-foreground">배송 주기</p>
                  <p>
                    {subscription.recurrenceType === "WEEKLY" ? "주간" : "월간"}{" "}
                    ({displayDays})
                  </p>
                </div>
                <div>
                  <p className="font-bold text-foreground">다음 배송</p>
                  <p>{subscription.nextRunDate || "미정"}</p>
                </div>
                <div>
                  <p className="font-bold text-foreground">배송지</p>
                  <p>{subscription.deliveryAddress || "미입력"}</p>
                </div>
                <div>
                  <p className="font-bold text-foreground">생성일</p>
                  <p>{subscription.createdAt}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex gap-3 flex-wrap">
              {status !== "CANCELLED" &&
                status !== "FAILED" &&
                status !== "UNAVAILABLE" && (
                  <>
                    {status === "ACTIVE" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => handleAction("pause")}
                        disabled={actionLoading !== null}
                      >
                        <Pause className="w-4 h-4" />
                        {actionLoading === "pause"
                          ? "일시정지 중..."
                          : "일시정지"}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => handleAction("resume")}
                        disabled={actionLoading !== null}
                      >
                        <Play className="w-4 h-4" />
                        {actionLoading === "resume" ? "재개 중..." : "재개"}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-destructive hover:text-destructive"
                      onClick={() => handleAction("cancel")}
                      disabled={actionLoading !== null}
                    >
                      <Trash2 className="w-4 h-4" />
                      {actionLoading === "cancel" ? "해지 중..." : "해지"}
                    </Button>
                  </>
                )}
              {(status === "CANCELLED" ||
                status === "FAILED" ||
                status === "UNAVAILABLE") && (
                <p className="text-muted-foreground">
                  더 이상 조치할 수 없는 구독입니다.
                </p>
              )}
            </div>
            {!isEditing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="ml-auto"
              >
                구독 정보 수정
              </Button>
            )}
          </div>

          {isEditing && (
            <div className="border-t border-border pt-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-foreground">
                  구독 정보 수정
                </h2>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setIsEditing(false)}>
                    취소
                  </Button>
                  <Button
                    onClick={handleUpdate}
                    disabled={isUpdating}
                    className="w-full md:w-auto"
                  >
                    {isUpdating ? "수정 중..." : "변경사항 저장"}
                  </Button>
                </div>
              </div>

              {recurrenceType === "WEEKLY" ? (
                <div className="space-y-2">
                  <p className="font-bold text-foreground">배송 요일</p>
                  <div className="grid grid-cols-7 gap-2">
                    {DAY_OF_WEEK_OPTIONS.map((day) => (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => handleToggleDay(day.id)}
                        className={`py-2 px-3 rounded-md font-bold text-sm transition-colors ${
                          selectedDays.includes(day.id)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground hover:bg-muted/80"
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="font-bold text-foreground">배송 날짜</p>
                  <Select
                    value={selectedDayOfMonth.toString()}
                    onValueChange={(v) =>
                      isEditing && setSelectedDayOfMonth(Number(v))
                    }
                    disabled={!isEditing}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="날짜 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 28 }, (_, i) => i + 1).map(
                        (day) => (
                          <SelectItem key={day} value={day.toString()}>
                            {day}일
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <p className="font-bold text-foreground">배송지</p>
                <Input
                  value={address}
                  onChange={(e) => isEditing && setAddress(e.target.value)}
                  placeholder="배송지를 입력하세요"
                  disabled={!isEditing}
                />
              </div>
            </div>
          )}
        </Card>
      </div>
    </main>
  )
}
