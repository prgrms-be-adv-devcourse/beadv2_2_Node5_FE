"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import {
  orderApi,
  type OrderListDetailInfo,
  OrderStatus,
} from "@/lib/api/order"

type OrderCard = {
  id: string
  productName: string
  productImage: string
  totalPrice: number
  amount: number
  date: string
  orderNumber: string
  status?: string
}

const PAGE_SIZE = 5
const MOCK_MEMBER_ID = "mock-member-id"
const MOCK_ORDER: OrderCard = {
  id: "mock-order-1",
  productName: "프리미엄 샐러드 구독",
  productImage: "/vibrant-mixed-salad.png",
  totalPrice: 18900,
  amount: 2,
  date: "2024-01-15",
  orderNumber: "MOCK0001",
  status: "PAID",
}

const toOrderCard = (
  order: OrderListDetailInfo,
  fallbackIndex: number
): OrderCard => {
  const firstItem = order.orderedItems?.[0]
  const totalQuantity =
    order.orderedItems?.reduce((acc, item) => acc + (item.quantity ?? 0), 0) ||
    0

  return {
    id: order.orderId || order.orderNum || String(fallbackIndex),
    productName: firstItem?.productName || "상품명 없음",
    productImage: firstItem?.imgUrl || "/placeholder.svg",
    totalPrice:
      typeof order.totalAmount === "number"
        ? order.totalAmount
        : firstItem?.totalPrice || 0,
    amount: totalQuantity || 1,
    date: order.orderDate || "",
    orderNumber: order.orderNum || order.orderId || String(fallbackIndex),
    status: order.status || "",
  }
}

const formatDate = (value: string) => {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toISOString().slice(0, 10)
}

export default function OrdersTab() {
  const router = useRouter()
  const [orders, setOrders] = useState<OrderCard[]>([])
  const [memberId, setMemberId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isMemberLoading, setIsMemberLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    setIsMemberLoading(true)
    setError(null)
    const storedId =
      typeof window !== "undefined" ? localStorage.getItem("memberId") : null
    if (storedId) {
      setMemberId(storedId)
    } else {
      setMemberId(MOCK_MEMBER_ID)
    }
    setIsMemberLoading(false)
  }, [])

  useEffect(() => {
    if (!memberId) return

    const fetchOrders = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await orderApi.getOrderList(memberId, page, PAGE_SIZE, "3")
        const normalized =
          data?.orderList?.map((order, idx) => toOrderCard(order, idx)) || []
        const nextOrders = normalized.length > 0 ? normalized : [MOCK_ORDER]
        setOrders(nextOrders)
        setTotalPages(
          normalized.length > 0
            ? Math.max(data?.pageInfo?.totalPages || 1, 1)
            : 1
        )
      } catch (err: any) {
        setError(err?.message || "주문 목록을 불러오지 못했습니다.")
        setOrders([MOCK_ORDER])
        setTotalPages(1)
      } finally {
        setIsLoading(false)
      }
    }

    fetchOrders()
  }, [memberId, page])

  const isEmpty = !isLoading && orders.length === 0
  const handleDetail = (orderId: string) => {
    router.push(`/orders/${orderId}`)
  }

  if (isMemberLoading) {
    return (
      <Card className="p-6 text-muted-foreground">
        회원 정보를 불러오는 중입니다...
      </Card>
    )
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
                  <img
                    src={order.productImage || "/placeholder.svg"}
                    alt={order.productName}
                    className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-lg"
                  />
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground mb-1">
                        {formatDate(order.date)}
                        {order.status ? ` • ${order.status}` : ""}
                      </div>
                      <h3 className="text-xl font-bold text-foreground">
                        {order.productName}
                      </h3>
                    </div>
                    <p className="text-2xl font-bold text-primary">
                      ₩{order.totalPrice.toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <span className="font-medium text-foreground">수량:</span>{" "}
                      {order.amount}개
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
