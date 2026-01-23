"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { orderApi, type OrderListDetailInfo } from "@/lib/api/order"
import { getImageUrl } from "@/lib/image"

type OrderCard = {
  id: string
  productName: string
  productImage: string
  productImages: string[]
  totalPrice: number
  amount: number
  itemCount: number
  date: string
  orderNumber: string
  status?: string
}

const PAGE_SIZE = 5

const toOrderCard = (
  order: OrderListDetailInfo,
  fallbackIndex: number
): OrderCard => {
  const firstItem = order.orderedItems?.[0]
  const totalQuantity =
    order.orderedItems?.reduce((acc, item) => acc + (item.quantity ?? 0), 0) ||
    0
  const itemCount = order.orderedItems?.length || 0
  const productImages =
    order.orderedItems
      ?.map((item) => getImageUrl(item.imgUrl) || "/placeholder.svg")
      .filter(Boolean) || []

  return {
    id: order.orderId || order.orderNum || String(fallbackIndex),
    productName: firstItem?.productName || "상품명 없음",
    productImage: getImageUrl(firstItem?.imgUrl) || "/placeholder.svg",
    productImages: productImages.slice(0, 4),
    totalPrice:
      typeof order.totalAmount === "number"
        ? order.totalAmount
        : firstItem?.totalPrice || 0,
    amount: totalQuantity || 1,
    itemCount: itemCount || 1,
    date: order.orderDate || "",
    orderNumber: order.orderNum || order.orderId || String(fallbackIndex),
    status: order.status || "",
  }
}

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

const buildMosaicSlots = (images: string[]) => {
  const slots = Array<string | null>(4).fill(null)
  if (images.length >= 4) return images.slice(0, 4)
  if (images.length === 3) {
    const layout = [1, 2, 3]
    layout.forEach((idx, i) => {
      slots[idx] = images[i]
    })
    return slots
  }
  if (images.length === 2) {
    const layout = [1, 2]
    layout.forEach((idx, i) => {
      slots[idx] = images[i]
    })
    return slots
  }
  if (images.length === 1) return [images[0], null, null, null]
  return slots
}

const renderMosaic = (images: string[], alt: string, orderId: string) => {
  const count = images.length

  // Single image
  if (count <= 1) {
    return (
      <img
        src={images[0] || "/placeholder.svg"}
        alt={alt}
        className="w-24 h-24 md:w-32 md:h-32 object-contain rounded-lg bg-white"
      />
    )
  }

  // 2-way diagonal split
  if (count === 2) {
    const shapes = [
      "polygon(0 0, 100% 0, 0 100%)", // slash: top + right side
      "polygon(100% 0, 100% 100%, 0 100%)", // slash: left + bottom side
    ]
    return (
      <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden bg-white border border-border/60">
        {[0, 1].map((idx) => (
          <img
            key={`${orderId}-diag-${idx}`}
            src={images[idx] || "/placeholder.svg"}
            alt={`${alt} 이미지 ${idx + 1}`}
            className="absolute inset-0 w-full h-full object-contain"
            style={{ clipPath: shapes[idx] }}
          />
        ))}
      </div>
    )
  }

  // 3-way diagonal bands (// 느낌)
  if (count === 3) {
    const shapes = [
      "polygon(0 0, 100% 0, 0 65%)", // 상단 띠
      "polygon(0 45%, 100% 0, 100% 55%, 0 100%)", // 중앙 대각 띠
      "polygon(0 100%, 100% 45%, 100% 100%)", // 하단 띠
    ]
    return (
      <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden bg-white border border-border/60">
        {shapes.map((shape, idx) => (
          <img
            key={`${orderId}-diag3-${idx}`}
            src={images[idx] || "/placeholder.svg"}
            alt={`${alt} 이미지 ${idx + 1}`}
            className="absolute inset-0 w-full h-full object-contain"
            style={{ clipPath: shape }}
          />
        ))}
      </div>
    )
  }

  // 4개 이상: 2x2 모자이크
  return (
    <div className="grid grid-cols-2 grid-rows-2 gap-1 w-24 h-24 md:w-32 md:h-32 rounded-lg overflow-hidden bg-white border border-border/60">
      {buildMosaicSlots(images).map((img, slot) => (
        <div key={`${orderId}-img-${slot}`} className="w-full h-full bg-white">
          {img ? (
            <img
              src={img}
              alt={`${alt} 이미지 ${slot + 1}`}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full bg-white" />
          )}
        </div>
      ))}
    </div>
  )
}

export default function OrdersTab() {
  const router = useRouter()
  const [orders, setOrders] = useState<OrderCard[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await orderApi.getOrderList(page, PAGE_SIZE, "3")
        const normalized =
          data?.orderList?.map((order, idx) => toOrderCard(order, idx)) || []
        setOrders(normalized)
        setTotalPages(
          normalized.length > 0
            ? Math.max(data?.pageInfo?.totalPages || 1, 1)
            : 1
        )
      } catch (err: any) {
        setError(err?.message || "주문 목록을 불러오지 못했습니다.")
        setOrders([])
        setTotalPages(1)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [page])

  const isEmpty = !isLoading && orders.length === 0
  const handleDetail = (orderId: string) => {
    router.push(`/orders/${orderId}`)
  }

  return (
    <div className="space-y-6">
      {error && (
        <Card className="p-4 border-destructive/30 bg-destructive/5 text-sm text-destructive">
          {error}
        </Card>
      )}

      {isLoading && !orders.length ? (
        <Card className="p-6 md:p-8 text-center text-muted-foreground">
          주문 내역을 불러오는 중입니다...
        </Card>
      ) : isEmpty ? (
        <Card className="p-6 md:p-8 text-center text-muted-foreground">
          아직 주문 내역이 없어요.
        </Card>
      ) : (
        <>
          {orders.map((order) => (
            <Card
              key={order.id}
              className="p-6 md:p-8 cursor-pointer hover:border-primary/60 hover:shadow-sm transition"
              onClick={() => handleDetail(order.id)}
            >
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0">
                  {renderMosaic(
                    order.productImages,
                    order.productName,
                    order.id
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground mb-1">
                        {formatDate(order.date)}
                        {order.status === "CANCELED" ||
                        order.status === "PAYMENT_FAILED"
                          ? ` • ${order.status}`
                          : ""}
                      </div>
                      <h3 className="text-xl font-bold text-foreground">
                        {order.productName}
                        {order.itemCount > 1
                          ? ` 외 ${order.itemCount - 1}개 상품`
                          : ""}
                      </h3>
                    </div>
                    <p className="text-2xl font-bold text-primary">
                      ₩{order.totalPrice.toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-foreground">
                        종류/수량:
                      </span>{" "}
                      {order.itemCount}종 / 총 {order.amount}개
                    </div>
                    <div className="h-3 w-px bg-border" />
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-foreground">
                        주문번호:
                      </span>{" "}
                      {order.orderNumber.padStart(8, "0")}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-muted-foreground">
              페이지 {page + 1} / {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                disabled={page === 0 || isLoading}
              >
                이전
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPage((prev) => Math.min(totalPages - 1, prev + 1))
                }
                disabled={page >= totalPages - 1 || isLoading}
              >
                다음
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
