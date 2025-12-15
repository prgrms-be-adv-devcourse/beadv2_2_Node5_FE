"use client"

import { useEffect, useState } from "react"
import { ShoppingCart, Heart, ChevronLeft, Minus, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import SubscriptionForm from "@/components/subscription-form"
import Link from "next/link"
import { useParams } from "next/navigation"
import { orderApi, OrderType } from "@/lib/api/order"
import { type ProductInfoResponse, productApi } from "@/lib/api/product"
import { getCategoryLabel } from "@/lib/categories"
import { Input } from "@/components/ui/input"
// import { cartApi } from "@/lib/api-client"

const mockProduct: ProductInfoResponse = {
  id: "1",
  shopId: "1",
  name: "프리미엄 샐러드 구독",
  description:
    "매일 아침 신선하게 배달되는 샐러드입니다. 신선한 야채와 드레싱을 다양하게 제공합니다.",
  price: 8900,
  stock: 0,
  status: "ON_SALE",
  category: "FOOD_BEVERAGE",
  thumbnailUrl: "/placeholder.svg?key=gqzfh",
  createdAt: new Date().toISOString(),
  modifiedAt: new Date().toISOString(),
}

const CART_STORAGE_KEY = "mockCart"

export default function ProductDetailPage() {
  const routeParams = useParams<{ id: string }>()
  const id = (routeParams?.id as string) || ""
  const [product, setProduct] = useState<ProductInfoResponse>(mockProduct)
  const [quantity, setQuantity] = useState(1)
  const [showSubscriptionForm, setShowSubscriptionForm] = useState(false)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [isOrdering, setIsOrdering] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [orderError, setOrderError] = useState<string | null>(null)
  const [recipientName, setRecipientName] = useState("")
  const [recipientAddress, setRecipientAddress] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleAddToCart = () => {
    // TODO: 실제 장바구니 API 연결 시 아래 코드 사용
    // cartApi
    //   .addToCart({ productId: product.id?.toString() || id, quantity })
    //   .then(() => toast.success("장바구니에 담았어요!"))
    //   .catch(() => toast.error("장바구니 담기 실패"))

    const cartItem = {
      productId: product.id?.toString() || id,
      name: product.name,
      price: productPrice,
      quantity,
      thumbnailUrl: product.thumbnailUrl,
    }
    if (typeof window !== "undefined") {
      const prev = localStorage.getItem(CART_STORAGE_KEY)
      let parsed: any[] = []
      if (prev) {
        try {
          parsed = JSON.parse(prev)
        } catch {
          parsed = []
        }
      }
      const existingIndex = parsed.findIndex(
        (item) => item.productId === cartItem.productId
      )
      if (existingIndex >= 0) {
        parsed[existingIndex].quantity =
          (parsed[existingIndex].quantity || 0) + quantity
      } else {
        parsed.push(cartItem)
      }
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(parsed))
      alert("장바구니에 담았어요! (목업)")
    }
  }

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return
      setIsLoading(true)
      setError(null)
      try {
        const data = await productApi.getProductDetail(id)
        setProduct({
          ...mockProduct,
          ...data,
          id: data.id ?? id ?? mockProduct.id,
          price: data.price ?? mockProduct.price,
          thumbnailUrl: data.thumbnailUrl ?? mockProduct.thumbnailUrl,
        })
      } catch (err: any) {
        setError(
          err?.message ||
            "상품 정보를 불러오지 못했습니다. 더미 데이터를 표시합니다."
        )
        setProduct(mockProduct)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  const toNumber = (value: number | string | undefined) => {
    const num = typeof value === "string" ? Number(value) : value ?? 0
    return Number.isFinite(num) ? num : 0
  }

  const productPrice = toNumber(product.price)
  const displayPrice = (price: number) => `₩${price.toLocaleString()}`
  const handleOrder = async () => {
    if (!recipientName.trim() || !recipientAddress.trim()) {
      setOrderError("수령인 이름과 주소를 입력해주세요.")
      return
    }

    setIsOrdering(true)
    setOrderError(null)
    try {
      const res = await orderApi.createOrder({
        orderType: OrderType.NORMAL,
        recipientName: recipientName.trim(),
        recipientAddress: recipientAddress.trim(),
        items: [
          {
            productId: product.id?.toString() || id,
            name: product.name,
            imgUrl: product.thumbnailUrl,
            unitPrice: productPrice,
            quantity,
            totalPrice: productPrice * quantity,
          },
        ],
      })
      if (res?.orderId) {
        setShowOrderModal(false)
        window.location.href = `/orders/${res.orderId}`
      } else {
        setOrderError("주문이 완료되었는지 확인할 수 없습니다.")
      }
    } catch (err: any) {
      setOrderError(err?.message || "주문 처리 중 오류가 발생했습니다.")
    } finally {
      setIsOrdering(false)
    }
  }

  return (
    <main className="flex-1">
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/"
          className="flex items-center gap-2 text-primary hover:underline mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          뒤로가기
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="flex items-center justify-center bg-muted rounded-lg h-80 lg:h-[480px] lg:sticky lg:top-24">
            <img
              src={product.thumbnailUrl || "/placeholder.svg"}
              alt={product.name}
              className="w-full h-full object-cover rounded-lg"
            />
          </div>

          <div className="flex flex-col gap-4">
            <span className="text-sm font-semibold text-primary uppercase">
              {getCategoryLabel(product.category)}
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground text-balance">
              {product.name}
            </h1>

            <div className="mb-2">
              <p className="text-4xl font-bold text-primary">
                {displayPrice(productPrice)}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-foreground">
                수량
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-10 text-center font-semibold">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity((q) => q + 1)}
                  aria-label="increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {product.status === "ON_SALE" ? (
              <div className="flex gap-3 flex-wrap items-center">
                <div className="flex flex-1 gap-3 min-w-[280px]">
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1 h-12 bg-transparent"
                    onClick={() => setShowOrderModal(true)}
                  >
                    일반 구매
                  </Button>
                  <Button
                    size="lg"
                    className="flex-1 h-12 bg-primary hover:bg-primary/90"
                    onClick={() => setShowSubscriptionForm(true)}
                  >
                    구독 신청
                  </Button>
                </div>
                <div className="flex gap-2 ml-auto">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 bg-transparent"
                    onClick={handleAddToCart}
                    aria-label="장바구니 담기"
                  >
                    <ShoppingCart className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 bg-transparent"
                    aria-label="찜하기"
                  >
                    <Heart className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ) : (
              <Card className="p-6 bg-destructive/10 border-destructive/30 text-destructive text-base font-semibold">
                현재 판매 중이 아닙니다.
              </Card>
            )}

            {showSubscriptionForm && (
              <SubscriptionForm
                product={product}
                onClose={() => setShowSubscriptionForm(false)}
              />
            )}
          </div>
        </div>
        <div className="mt-12">
          <Card className="p-6 md:p-8">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              상세 정보
            </h3>
            <p className="text-foreground leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
            {isLoading && (
              <p className="text-sm text-muted-foreground mt-2">
                불러오는 중...
              </p>
            )}
            {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
          </Card>
        </div>
      </div>

      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <Card className="w-full max-w-lg p-6 space-y-4 relative">
            <button
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
              onClick={() => setShowOrderModal(false)}
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-2xl font-bold text-foreground">주문 확인</h3>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                상품: <span className="text-foreground">{product.name}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                수량: <span className="text-foreground">{quantity}개</span>
              </p>
              <p className="text-sm text-muted-foreground">
                결제 예정 금액:{" "}
                <span className="text-foreground font-semibold">
                  {displayPrice(product.price * quantity)}
                </span>
              </p>
              <div className="pt-2 space-y-3">
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
            </div>
            {orderError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                {orderError}
              </p>
            )}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowOrderModal(false)}
                disabled={isOrdering}
              >
                닫기
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={handleOrder}
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
