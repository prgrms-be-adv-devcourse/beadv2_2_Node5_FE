"use client"

import { useEffect, useMemo, useState } from "react"
import { Minus, Plus, Trash2, X } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { orderApi, OrderType } from "@/lib/api-client"
// import {
//   cartApi,
//   productApi,
//   type CartItemInfo,
//   type ProductInfoResponse,
// } from "@/lib/api-client"

type CartItem = {
  productId: string
  name: string
  price: number
  quantity: number
  thumbnailUrl?: string
}

const CART_STORAGE_KEY = "mockCart"

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isInitialized, setIsInitialized] = useState(false)
  const [isOrdering, setIsOrdering] = useState(false)
  const [orderError, setOrderError] = useState<string | null>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [recipientName, setRecipientName] = useState("")
  const [recipientAddress, setRecipientAddress] = useState("")
  // const [products, setProducts] = useState<Record<string, ProductInfoResponse>>({})
  // const [isLoading, setIsLoading] = useState(true)
  // const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // API 버전 참고용
    // const fetchCart = async () => {
    //   setIsLoading(true)
    //   setError(null)
    //   try {
    //     const cart = await cartApi.getCart()
    //     const list = Array.isArray(cart?.content) ? cart.content : []
    //     setItems(
    //       list.map((item) => ({
    //         productId: item.productId,
    //         name: "",
    //         price: 0,
    //         quantity: item.quantity,
    //       }))
    //     )
    //     const productIds = Array.from(new Set(list.map((i) => i.productId)))
    //     const fetched = await Promise.all(
    //       productIds.map(async (pid) => {
    //         try {
    //           const product = await productApi.getProductDetail(pid)
    //           return [pid, product] as const
    //         } catch {
    //           return null
    //         }
    //       })
    //     )
    //     const map = fetched.reduce<Record<string, ProductInfoResponse>>((acc, cur) => {
    //       if (cur) acc[cur[0]] = cur[1]
    //       return acc
    //     }, {})
    //     setProducts(map)
    //   } catch (err: any) {
    //     setError(err?.message || "장바구니를 불러오지 못했습니다.")
    //   } finally {
    //     setIsLoading(false)
    //   }
    // }
    // fetchCart()

    if (typeof window === "undefined") return
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY)
      if (!stored) return
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) {
        const normalized = parsed
          .map((item: any) => ({
            productId:
              (item && (item.productId || item.id || item.product?.id)) ?? "",
            name: item?.name ?? item?.product?.name ?? "",
            price: item?.price ?? item?.product?.price ?? 0,
            quantity: item?.quantity ?? 1,
            thumbnailUrl:
              item?.thumbnailUrl || item?.product?.thumbnailUrl || undefined,
          }))
          .filter((item) => !!item.productId)
        setItems(normalized)
      }
    } catch {
      setItems([])
    } finally {
      setIsInitialized(true)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined" || !isInitialized) return
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  }, [items, isInitialized])

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === items.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(items.map((item) => item.productId))
    }
  }

  const updateQuantity = async (id: string, delta: number) => {
    const target = items.find((item) => item.productId === id)
    if (!target) return
    const nextQty = Math.max(1, target.quantity + delta)
    if (nextQty === target.quantity) return
    setItems((prev) => {
      const updated = prev.map((item) =>
        item.productId === id ? { ...item, quantity: nextQty } : item
      )
      if (typeof window !== "undefined") {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updated))
      }
      return updated
    })
  }

  const removeSelected = async () => {
    if (selectedIds.length === 0) return
    setItems((prev) => {
      const updated = prev.filter(
        (item) => !selectedIds.includes(item.productId)
      )
      if (typeof window !== "undefined") {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updated))
      }
      return updated
    })
    setSelectedIds([])
  }

  const clearAll = async () => {
    setItems([])
    setSelectedIds([])
    if (typeof window !== "undefined") {
      localStorage.removeItem(CART_STORAGE_KEY)
    }
  }

  const handleManualSync = () => {
    if (typeof window === "undefined") return
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
  }

  const allSelected = items.length > 0 && selectedIds.length === items.length

  const total = useMemo(() => {
    return items.reduce(
      (sum, item) => sum + (item.price ?? 0) * item.quantity,
      0
    )
  }, [items])

  const getMemberId = () =>
    (typeof window !== "undefined" && localStorage.getItem("memberId")) ||
    "mock-member-id"

  const handleCheckout = async () => {
    if (!recipientName.trim() || !recipientAddress.trim()) {
      setOrderError("수령인 이름과 주소를 입력해주세요.")
      return
    }

    const targetItems =
      selectedIds.length > 0
        ? items.filter((i) => selectedIds.includes(i.productId))
        : items

    if (targetItems.length === 0) {
      setOrderError("주문할 상품을 선택해주세요.")
      return
    }

    setIsOrdering(true)
    setOrderError(null)
    try {
      const res = await orderApi.createOrder({
        memberId: getMemberId(),
        orderType: OrderType.NORMAL,
        recipientName: recipientName.trim(),
        recipientAddress: recipientAddress.trim() as any,
        items: targetItems.map((item) => ({
          productId: item.productId,
          name: item.name,
          imgUrl: item.thumbnailUrl,
          unitPrice: item.price,
          quantity: item.quantity,
          totalPrice: item.price * item.quantity,
        })),
      })

      if (res?.orderId) {
        setShowOrderModal(false)
        window.location.href = `/orders/${res.orderId}`
      } else {
        setOrderError("주문 생성 결과를 확인할 수 없습니다.")
      }
    } catch (err: any) {
      setOrderError(err?.message || "주문 생성에 실패했습니다.")
    } finally {
      setIsOrdering(false)
    }
  }

  return (
    <main className="flex-1">
      <div className="container mx-auto px-4 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">장바구니</h1>
          <Link href="/" className="text-primary hover:underline text-sm">
            쇼핑 계속하기
          </Link>
        </div>

        {items.length === 0 ? (
          <Card className="p-10 text-center">
            <p className="text-muted-foreground mb-4">
              장바구니가 비어 있어요. 마음에 드는 상품을 추가해보세요!
            </p>
            <Link href="/">
              <Button variant="outline">상품 둘러보기</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 divide-y divide-border">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all"
                    checked={allSelected}
                    onCheckedChange={toggleSelectAll}
                  />
                  <label htmlFor="select-all" className="text-sm text-foreground cursor-pointer">
                    전체 선택 ({selectedIds.length}/{items.length})
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={removeSelected}
                    disabled={selectedIds.length === 0}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    선택 삭제
                  </Button>
                  <Button variant="ghost" size="sm" onClick={clearAll}>
                    전체 삭제
                  </Button>
                </div>
              </div>
              {items.map((item) => {
                const productName = item.name || `상품 #${item.productId}`
                const unitPrice = item.price ?? 0

                return (
                  <div
                    key={item.productId}
                    className="flex items-center gap-4 p-4"
                  >
                    <Checkbox
                      checked={selectedIds.includes(item.productId)}
                      onCheckedChange={() => toggleSelect(item.productId)}
                      aria-label={`${productName} 선택`}
                    />
                    <div className="w-20 h-20 bg-muted rounded-lg overflow-hidden">
                      <img
                        src={item.thumbnailUrl || "/placeholder.svg"}
                        alt={productName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground line-clamp-2">
                        {productName}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.productId, -1)}
                          aria-label="수량 감소"
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-10 text-center font-semibold">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.productId, 1)}
                          aria-label="수량 증가"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">
                        ₩{(unitPrice * item.quantity).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        (개당 ₩{unitPrice.toLocaleString()})
                      </p>
                    </div>
                  </div>
                )
              })}
            </Card>

            <Card className="p-6 space-y-4">
              <h2 className="text-xl font-bold text-foreground">주문 요약</h2>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">상품 금액</span>
                <span className="font-semibold text-foreground">₩{total.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">배송비</span>
                <span className="font-semibold text-foreground">₩0</span>
              </div>
              <div className="border-t border-border pt-4 flex items-center justify-between text-lg font-bold">
                <span className="text-foreground">총 결제금액</span>
                <span className="text-primary">₩{total.toLocaleString()}</span>
              </div>
              <Button
                className="w-full h-12"
                onClick={() => {
                  setOrderError(null)
                  setShowOrderModal(true)
                }}
                disabled={isOrdering || items.length === 0}
              >
                결제하기
              </Button>
            </Card>
          </div>
        )}
      </div>

      {showOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
          <Card className="w-full max-w-lg p-6 space-y-4 relative">
            <button
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
              onClick={() => setShowOrderModal(false)}
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-2xl font-bold text-foreground">배송 정보</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">
                  받는 사람
                </label>
                <Input
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="이름을 입력하세요"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground mb-1 block">
                  배송지 주소
                </label>
                <Input
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="주소를 입력하세요"
                />
              </div>
            </div>
            {orderError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                {orderError}
              </p>
            )}
            <div className="flex items-center justify-between pt-2 text-sm text-muted-foreground">
              <span>선택 상품 {selectedIds.length || items.length}개</span>
              <span className="text-foreground font-semibold">
                총 금액 ₩{total.toLocaleString()}
              </span>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowOrderModal(false)}
                disabled={isOrdering}
              >
                취소
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={handleCheckout}
                disabled={isOrdering}
              >
                {isOrdering ? "주문 중..." : "주문하기"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </main>
  )
}
