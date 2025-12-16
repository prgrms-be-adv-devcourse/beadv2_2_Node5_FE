"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  orderApi,
  type OrderDetailInfo,
  OrderStatus,
  OrderType,
} from "@/lib/api/order"
import { getImageUrl } from "@/lib/image"

const formatDate = (value: string) => {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toISOString().slice(0, 10)
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

  const orderedItems = order?.orderedItems || []

  const canCancel = order?.status === OrderStatus.PAID
  const canRefund =
    order?.status === OrderStatus.DELIVERY_ING ||
    order?.status === OrderStatus.DELIVERY_COMPLETED

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
              {order?.status || "UNKNOWN"}
            </p>
          </div>
        </div>

        <div className="border-t border-border pt-4 space-y-3">
          {orderedItems.map((item) => (
            <div key={item.productId} className="flex items-center gap-4">
              <img
                src={getImageUrl(item.imgUrl) || "/placeholder.svg"}
                alt={item.productName}
                className="w-16 h-16 rounded-md object-cover"
              />
              <div className="flex-1">
                <p className="font-semibold text-foreground">
                  {item.productName}
                </p>
                <p className="text-sm text-muted-foreground">
                  수량 {item.quantity}개 • ₩{item.unitPrice.toLocaleString()}
                </p>
              </div>
              <p className="font-bold text-foreground">
                ₩{item.totalPrice.toLocaleString()}
              </p>
            </div>
          ))}
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
