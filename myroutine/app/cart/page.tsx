"use client"

import { useEffect, useMemo, useState } from "react"
import { Minus, Plus, Trash2, X } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { cartApi, type CartItemInfo } from "@/lib/api/cart"
import { orderApi, OrderType } from "@/lib/api/order"
import { getImageUrl } from "@/lib/image"
// import {
//   cartApi,
//   productApi,
//   type CartItemInfo,
//   type ProductInfoResponse,
// } from "@/lib/api-client"

type CartItem = {
  id?: string
  productId: string
  name: string
  price: number
  quantity: number
  thumbnailUrl?: string
}

const normalizeCartItem = (item: Partial<CartItemInfo> | any): CartItem | null => {
  const productId = item?.productId ?? item?.id ?? item?.product?.id
  if (!productId) return null

  const rawPrice = item?.price ?? item?.product?.price ?? 0
  const price =
    typeof rawPrice === "string"
      ? Number(rawPrice)
      : Number.isFinite(rawPrice)
        ? (rawPrice as number)
        : 0

  return {
    id: item?.id,
    productId,
    name: item?.name ?? item?.product?.name ?? "",
    price: Number.isFinite(price) ? price : 0,
    quantity: item?.quantity ?? 1,
    thumbnailUrl:
      getImageUrl(item?.thumbnailUrl) ??
      getImageUrl(item?.imgUrl) ??
      getImageUrl(item?.product?.thumbnailUrl) ??
      undefined,
  }
}

export default function CartPage() {
  const [items, setItems] = useState<CartItem[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOrdering, setIsOrdering] = useState(false)
  const [cartError, setCartError] = useState<string | null>(null)
  const [orderError, setOrderError] = useState<string | null>(null)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [recipientName, setRecipientName] = useState("")
  const [recipientAddress, setRecipientAddress] = useState("")
  // const [products, setProducts] = useState<Record<string, ProductInfoResponse>>({})
  // const [isLoading, setIsLoading] = useState(true)
  // const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchCart = async () => {
      setCartError(null)
      try {
        const cart = await cartApi.getCart()
        const list = Array.isArray(cart?.content) ? cart.content : []
        const normalized = list
          .map((item) => normalizeCartItem(item))
          .filter(Boolean) as CartItem[]

        if (!cancelled) {
          setItems(normalized)
          setCartError(null)
        }
      } catch (error) {
        console.error("장바구니 불러오기 실패", error)
        if (!cancelled) {
          setItems([])
          setCartError("장바구니를 불러오지 못했습니다.")
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchCart()

    return () => {
      cancelled = true
    }
  }, [])

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
    if (!target.id) {
      setCartError("장바구니 항목 ID가 없어 수량을 수정할 수 없습니다.")
      return
    }
    setCartError(null)
    const nextQty = Math.max(1, target.quantity + delta)
    if (nextQty === target.quantity) return
    const prevQty = target.quantity
    setItems((prev) => {
      const updated = prev.map((item) =>
        item.productId === id ? { ...item, quantity: nextQty } : item
      )
      return updated
    })

    try {
      await cartApi.updateCartItem(target.id, nextQty)
    } catch (error) {
      console.error("수량 변경 실패", error)
      setItems((prev) =>
        prev.map((item) =>
          item.productId === id ? { ...item, quantity: prevQty } : item
        )
      )
      setCartError("수량 변경에 실패했어요. 잠시 후 다시 시도해주세요.")
    }
  }

  const removeSelected = async () => {
    if (selectedIds.length === 0) return
    setCartError(null)
    const previousItems = items
    const previousSelectedIds = selectedIds
    const targets = items.filter((item) => selectedIds.includes(item.productId))
    setItems((prev) => {
      const updated = prev.filter(
        (item) => !selectedIds.includes(item.productId)
      )
      return updated
    })
    setSelectedIds([])

    try {
      await Promise.all(
        targets.map((item) =>
          item.id ? cartApi.removeCartItem(item.id) : Promise.resolve()
        )
      )
    } catch (error) {
      console.error("선택 삭제 실패", error)
      setItems(previousItems)
      setSelectedIds(previousSelectedIds)
      setCartError("선택한 상품을 삭제하지 못했습니다.")
    }
  }

  const clearAll = async () => {
    setCartError(null)
    const previousItems = items
    const previousSelectedIds = selectedIds
    setItems([])
    setSelectedIds([])

    try {
      await cartApi.clearCart()
    } catch (error) {
      console.error("장바구니 비우기 실패", error)
      setItems(previousItems)
      setSelectedIds(previousSelectedIds)
      setCartError("장바구니를 비우지 못했습니다.")
    }
  }

  const allSelected = items.length > 0 && selectedIds.length === items.length

  const total = useMemo(() => {
    return items.reduce(
      (sum, item) => sum + (item.price ?? 0) * item.quantity,
      0
    )
  }, [items])

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
        orderType: OrderType.NORMAL,
        recipientName: recipientName.trim(),
        recipientAddress: recipientAddress.trim(),
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
        // 결제 완료 시 장바구니 비우기
        try {
          await cartApi.clearCart()
          setItems([])
          setSelectedIds([])
        } catch (clearErr) {
          console.error("장바구니 비우기 실패", clearErr)
        }
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

        {cartError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {cartError}
          </div>
        )}

        {isLoading ? (
          <Card className="p-10 text-center text-muted-foreground">
            장바구니를 불러오는 중입니다...
          </Card>
        ) : items.length === 0 ? (
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
                        src={getImageUrl(item.thumbnailUrl) || "/placeholder.svg"}
                        alt={productName}
                        className="w-full h-full object-contain"
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
