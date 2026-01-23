"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  orderApi,
  type OrderDetailInfo,
  OrderStatus,
  OrderType,
} from "@/lib/api/order"
import { getImageUrl } from "@/lib/image"
import { reviewApi } from "@/lib/api/review"

const formatDate = (value: string) => {
  if (!value) return value
  if (/^\d{4}\.\d{2}\.\d{2}$/.test(value)) {
    return value.replace(/\./g, "-")
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, "0")
  const day = String(parsed.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = useMemo(
    () =>
      Array.isArray(params?.orderId) ? params.orderId[0] : params?.orderId,
    [params?.orderId]
  )
  const [order, setOrder] = useState<OrderDetailInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [reviewForms, setReviewForms] = useState<
    Record<
      string,
      {
        rating: number
        body: string
        isSubmitting: boolean
        error: string | null
        success: boolean
      }
    >
  >({})
  const [reviewStatusByProduct, setReviewStatusByProduct] = useState<
    Record<string, boolean | null>
  >({})

  useEffect(() => {
    if (!orderId) return
    const fetchDetail = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await orderApi.getOrderDetail(orderId)
        setOrder(data)
      } catch (err: any) {
        setError(err?.message || "주문 상세를 불러오지 못했습니다.")
        setOrder(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDetail()
  }, [orderId])

  const orderedItems = order?.orderedItems || []
  const reviewableItems = orderedItems || []

  useEffect(() => {
    if (!order || reviewableItems.length === 0) {
      setReviewStatusByProduct({})
      return
    }
    const productIds = Array.from(
      new Set(reviewableItems.map((item) => item.productId).filter(Boolean))
    )
    if (productIds.length === 0) {
      setReviewStatusByProduct({})
      return
    }
    let isActive = true
    const fetchReviewStatus = async () => {
      const entries = await Promise.all(
        productIds.map(async (productId) => {
          try {
            const res = await reviewApi.hasMemberReviewedProduct(productId, {
              orderId: order.orderId,
              productId,
            })
            return [productId, res.reviewed] as [string, boolean]
          } catch {
            return [productId, null] as [string, null]
          }
        })
      )
      if (!isActive) return
      setReviewStatusByProduct((prev) => {
        const next = { ...prev }
        entries.forEach(([productId, reviewed]) => {
          next[productId] = reviewed
        })
        return next
      })
    }

    fetchReviewStatus()

    return () => {
      isActive = false
    }
  }, [order, reviewableItems.length])

  if (!orderId) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="p-6 text-muted-foreground">주문 ID가 없습니다.</Card>
      </div>
    )
  }

  if (isLoading && !order) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="p-6 text-muted-foreground">
          주문 정보를 불러오는 중입니다...
        </Card>
      </div>
    )
  }

  if (!isLoading && !order) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="p-6 text-muted-foreground">
          주문 정보를 불러오지 못했습니다.
        </Card>
      </div>
    )
  }

  const canCancel = order?.status === OrderStatus.PAID
  const canRefund = order?.status === OrderStatus.SETTLEMENT_REQUESTED

  const orderStatusLabel =
    order?.status === OrderStatus.SETTLEMENT_REQUESTED
      ? "COMPLETE"
      : order?.status || "UNKNOWN"

  const getReviewForm = (productId: string) =>
    reviewForms[productId] ?? {
      rating: 0,
      body: "",
      isSubmitting: false,
      error: null,
      success: false,
    }

  const updateReviewForm = (
    productId: string,
    updates: Partial<{
      rating: number
      body: string
      isSubmitting: boolean
      error: string | null
      success: boolean
    }>
  ) => {
    setReviewForms((prev) => ({
      ...prev,
      [productId]: { ...getReviewForm(productId), ...updates },
    }))
  }

  const handleSubmitReview = async (productId: string) => {
    if (!order?.orderId) return
    const form = getReviewForm(productId)
    if (form.rating < 1 || form.rating > 5) {
      updateReviewForm(productId, { error: "별점을 선택해주세요." })
      return
    }
    if (!form.body.trim()) {
      updateReviewForm(productId, { error: "리뷰 내용을 입력해주세요." })
      return
    }

    updateReviewForm(productId, { isSubmitting: true, error: null })
    try {
      await reviewApi.createReview({
        productId,
        orderId: order.orderId,
        rating: form.rating,
        body: form.body.trim(),
      })
      updateReviewForm(productId, {
        isSubmitting: false,
        success: true,
      })
    } catch (err: any) {
      updateReviewForm(productId, {
        isSubmitting: false,
        error: err?.message || "리뷰 등록에 실패했습니다.",
      })
    }
  }

  const canShowReviewForm = (
    productId: string,
    itemStatus?: string
  ) => reviewStatusByProduct[productId] === false

  const handleCancel = async () => {
    if (!order?.orderId) return
    setIsActionLoading(true)
    setError(null)
    try {
      const res = await orderApi.cancelOrder(order.orderId)
      setOrder((prev) =>
        prev
          ? {
              ...prev,
              status: res?.status ?? prev.status,
            }
          : prev
      )
    } catch (err: any) {
      setError(err?.message || "주문을 취소하지 못했습니다.")
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleRefund = async () => {
    if (!order?.orderId) return
    setIsActionLoading(true)
    setError(null)
    try {
      const res = await orderApi.refundOrder(order.orderId)
      setOrder((prev) =>
        prev
          ? {
              ...prev,
              status: res?.status ?? prev.status,
            }
          : prev
      )
    } catch (err: any) {
      setError(err?.message || "환불을 처리하지 못했습니다.")
    } finally {
      setIsActionLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">주문 상세</h1>
          <p className="text-muted-foreground mt-1">
            주문번호: {order?.orderNum || orderId}
          </p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          뒤로가기
        </Button>
      </div>

      {error && (
        <Card className="p-4 border-destructive/30 bg-destructive/5 text-sm text-destructive">
          {error}
        </Card>
      )}

      <Card className="p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              주문일 {formatDate(order?.orderDate || "")}
            </p>
            <h2 className="text-xl font-bold text-foreground">
              {orderedItems[0]?.productName || "상품명 없음"}
            </h2>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">상태</p>
            <p className="text-lg font-semibold text-primary">
              {orderStatusLabel}
            </p>
          </div>
        </div>

        <div className="border-t border-border pt-4 space-y-3">
          {orderedItems.map((item) => {
            const form = getReviewForm(item.productId)
            const shouldShowStatus =
              item.status === "CANCELED" || item.status === "PAYMENT_FAILED"
            return (
              <div key={item.productId} className="space-y-4">
                <div className="flex items-center gap-4">
                  <img
                    src={getImageUrl(item.imgUrl) || "/placeholder.svg"}
                    alt={item.productName}
                    className="w-16 h-16 rounded-md object-contain bg-white"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">
                      {item.productName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      수량 {item.quantity}개 • ₩{item.unitPrice.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {shouldShowStatus && (
                      <Badge variant="secondary">{item.status}</Badge>
                    )}
                    <p className="font-bold text-foreground">
                      ₩{item.totalPrice.toLocaleString()}
                    </p>
                  </div>
                </div>

                {canShowReviewForm(item.productId, item.status) && (
                  <div className="rounded-lg border border-border/60 p-4 space-y-3 bg-muted/20">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-foreground">
                        별점
                      </span>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }, (_, index) => {
                          const ratingValue = index + 1
                          const isActive = ratingValue <= form.rating
                          return (
                            <button
                              key={`rating-${item.productId}-${ratingValue}`}
                              type="button"
                              className={`cursor-pointer text-lg ${
                                isActive
                                  ? "text-yellow-500"
                                  : "text-muted-foreground/40"
                              }`}
                              onClick={() =>
                                updateReviewForm(item.productId, {
                                  rating: ratingValue,
                                })
                              }
                              disabled={form.isSubmitting || form.success}
                              aria-label={`별점 ${ratingValue}점`}
                            >
                              ★
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    <textarea
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      rows={3}
                      placeholder="리뷰 내용을 입력해주세요."
                      value={form.body}
                      onChange={(event) =>
                        updateReviewForm(item.productId, {
                          body: event.target.value,
                        })
                      }
                      disabled={form.isSubmitting || form.success}
                    />
                    {form.error && (
                      <p className="text-sm text-destructive">{form.error}</p>
                    )}
                    {form.success && (
                      <p className="text-sm text-emerald-600">
                        리뷰가 등록되었습니다.
                      </p>
                    )}
                    <div className="flex justify-end">
                      <Button
                        onClick={() => handleSubmitReview(item.productId)}
                        disabled={form.isSubmitting || form.success}
                      >
                        {form.isSubmitting ? "등록 중..." : "리뷰 등록"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="grid md:grid-cols-2 gap-4 border-t border-border pt-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">배송 정보</h3>
            <p className="text-sm text-muted-foreground">
              받는 분: {order?.deliveryInfo?.recipientName || "미정"}
            </p>
            <p className="text-sm text-muted-foreground">
              주소: {order?.deliveryInfo?.recipientAddress || "미정"}
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">결제 정보</h3>
            <p className="text-sm text-muted-foreground">
              결제일: {formatDate(order?.paymentInfo?.transactionDate || "")}
            </p>
            <p className="text-sm text-muted-foreground">
              결제금액: ₩
              {(order?.paymentInfo?.paidAmount || 0).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="border-t border-border pt-4 flex items-center justify-between">
          <span className="text-lg font-bold text-primary">
            총 결제 금액 ₩{(order?.totalAmount || 0).toLocaleString()}
          </span>
          <div className="flex gap-2">
            {canCancel && (
              <Button
                variant="destructive"
                onClick={handleCancel}
                disabled={isActionLoading}
              >
                주문 취소
              </Button>
            )}
            {canRefund && (
              <Button
                variant="outline"
                onClick={handleRefund}
                disabled={isActionLoading}
              >
                환불 요청
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}
