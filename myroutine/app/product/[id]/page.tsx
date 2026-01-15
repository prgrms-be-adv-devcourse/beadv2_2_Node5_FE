"use client"

import { useEffect, useState } from "react"
import { ShoppingCart, Heart, ChevronLeft, Minus, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import SubscriptionForm from "@/components/subscription-form"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { orderApi, OrderType } from "@/lib/api/order"
import { type ProductInfoResponse, productApi } from "@/lib/api/product"
import { getCategoryLabel } from "@/lib/categories"
import { Input } from "@/components/ui/input"
import AddressSearchInput from "@/components/address-search-input"
import { cartApi } from "@/lib/api/cart"
import { getImageUrl } from "@/lib/image"
import { requireClientLogin } from "@/lib/auth-guard"
import {
  reviewApi,
  type ReviewDetailInfo,
  type ReviewStatisticInfo,
} from "@/lib/api/review"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ProductDetailPage() {
  const router = useRouter()
  const routeParams = useParams<{ id: string }>()
  const id = (routeParams?.id as string) || ""
  const [product, setProduct] = useState<ProductInfoResponse | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [showSubscriptionForm, setShowSubscriptionForm] = useState(false)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [isOrdering, setIsOrdering] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [orderError, setOrderError] = useState<string | null>(null)
  const [recipientName, setRecipientName] = useState("")
  const [recipientAddress, setRecipientAddress] = useState("")
  const [recipientAddressDetail, setRecipientAddressDetail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [reviewStat, setReviewStat] = useState<ReviewStatisticInfo | null>(null)
  const [reviews, setReviews] = useState<ReviewDetailInfo[]>([])
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)
  const [reviewSummary, setReviewSummary] = useState<string | null>(null)
  const [likingReviewIds, setLikingReviewIds] = useState<
    Record<string, boolean>
  >({})
  const [reviewOrderBy, setReviewOrderBy] = useState<"latest" | "recommended">(
    "latest"
  )

  const handleAddToCart = () => {
    if (!product?.id && !id) return
    if (!requireClientLogin(router)) return
    setError(null)
    cartApi
      .addCartItem({ productId: (product?.id ?? id).toString(), quantity })
      .then(() => alert("장바구니에 담았어요!"))
      .catch((err: any) =>
        setError(err?.message || "장바구니 담기에 실패했습니다.")
      )
  }

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return
      setIsLoading(true)
      setError(null)
      try {
        const data = await productApi.getProductDetail(id)
        setProduct({
          ...data,
          id: data.id ?? id,
          price: data.price ?? 0,
          thumbnailKey: data.thumbnailKey ?? "",
        })
      } catch (err: any) {
        setError(err?.message || "상품 정보를 불러오지 못했습니다.")
        setProduct(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  useEffect(() => {
    if (!id) return
    const fetchReviewMeta = async () => {
      setReviewError(null)
      try {
        const summaryData = await reviewApi.getReviewSummary(id)
        setReviewSummary(summaryData?.summary ?? null)
      } catch (summaryErr) {
        setReviewSummary(null)
      }
      try {
        const statData = await reviewApi.getReviewStatistic(id)
        setReviewStat(statData)
      } catch (statErr: any) {
        if (statErr?.status !== 404) {
          setReviewError(statErr?.message || "리뷰 통계를 불러오지 못했습니다.")
        }
        setReviewStat(null)
      }
    }

    fetchReviewMeta()
  }, [id])

  useEffect(() => {
    if (!id) return
    const fetchReviews = async () => {
      setReviewLoading(true)
      setReviewError(null)
      try {
        const orderBy =
          reviewOrderBy === "recommended" ? "recommended" : "latest"
        const detailData = await reviewApi.getReviewsDetail(id, orderBy)
        setReviews(detailData?.content ?? [])
      } catch (err: any) {
        setReviewError(err?.message || "리뷰 정보를 불러오지 못했습니다.")
        setReviews([])
      } finally {
        setReviewLoading(false)
      }
    }

    fetchReviews()
  }, [id, reviewOrderBy])

  const toNumber = (value?: number | string) => {
    const num = typeof value === "string" ? Number(value) : value ?? 0
    return Number.isFinite(num) ? num : 0
  }

  const productPrice = toNumber(product?.price)
  const displayPrice = (price: number) => `₩${price.toLocaleString()}`
  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, index) => (
      <span
        key={`star-${index}`}
        className={
          index < rating ? "text-yellow-500" : "text-muted-foreground/40"
        }
      >
        ★
      </span>
    ))
  const formatDate = (value: string) => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleDateString("ko-KR")
  }
  const totalReviewCount = reviewStat?.reviewCount ?? 0
  const handleLikeReview = async (reviewId: string) => {
    if (likingReviewIds[reviewId]) return
    setLikingReviewIds((prev) => ({ ...prev, [reviewId]: true }))
    try {
      await reviewApi.likeReview(reviewId)
      setReviews((prev) =>
        prev.map((review) =>
          review.reviewId === reviewId
            ? { ...review, likeCount: review.likeCount + 1 }
            : review
        )
      )
    } catch (err) {
      console.error(err)
    } finally {
      setLikingReviewIds((prev) => ({ ...prev, [reviewId]: false }))
    }
  }
  const handleOrder = async () => {
    if (!product?.id) {
      setOrderError("상품 정보를 불러올 수 없습니다.")
      return
    }
    if (!recipientName.trim() || !recipientAddress.trim()) {
      setOrderError("수령인 이름과 주소를 입력해주세요.")
      return
    }

    setIsOrdering(true)
    setOrderError(null)
    try {
      const fullAddress = recipientAddressDetail.trim()
        ? `${recipientAddress.trim()} ${recipientAddressDetail.trim()}`
        : recipientAddress.trim()
      const res = await orderApi.createOrder({
        orderType: OrderType.NORMAL,
        recipientName: recipientName.trim(),
        recipientAddress: fullAddress,
        items: [
          {
            productId: product.id?.toString() || id,
            name: product.name,
            imgUrl: getImageUrl(product.thumbnailKey) || "/placeholder.svg",
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

  if (isLoading && !product) {
    return (
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <Card className="p-8 text-center text-muted-foreground">
            상품 정보를 불러오는 중입니다...
          </Card>
        </div>
      </main>
    )
  }

  if (!product) {
    return (
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <Card className="p-8 text-center text-muted-foreground">
            {error || "상품 정보를 불러올 수 없습니다."}
          </Card>
        </div>
      </main>
    )
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
          <div className="flex items-center justify-center bg-white rounded-lg h-80 lg:h-[480px] lg:sticky lg:top-24 border border-border/60">
            <img
              src={getImageUrl(product.thumbnailKey) || "/placeholder.svg"}
              alt={product.name}
              className="w-full h-full object-contain rounded-lg"
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
                    onClick={() => {
                      if (requireClientLogin(router)) {
                        setShowOrderModal(true)
                      }
                    }}
                  >
                    일반 구매
                  </Button>
                  <Button
                    size="lg"
                    className="flex-1 h-12 bg-primary hover:bg-primary/90"
                    onClick={() => {
                      if (requireClientLogin(router)) {
                        setShowSubscriptionForm(true)
                      }
                    }}
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
        {reviewSummary && (
          <div className="mt-8">
            <Card className="p-6 md:p-8">
              <h3 className="text-2xl font-bold text-foreground mb-4">
                리뷰 요약
              </h3>
              <p className="text-foreground leading-relaxed whitespace-pre-line">
                {reviewSummary}
              </p>
            </Card>
          </div>
        )}
        <div className="mt-8">
          <Card className="p-6 md:p-8 space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex flex-col gap-2">
                <h3 className="text-2xl font-bold text-foreground">리뷰</h3>
                {reviewStat ? (
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2 text-foreground">
                      <span className="text-3xl font-bold text-primary">
                        {reviewStat.averageRating.toFixed(1)}
                      </span>
                      <span className="text-sm">/ 5</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {renderStars(Math.round(reviewStat.averageRating))}
                    </div>
                    <span>총 {totalReviewCount}건</span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    아직 리뷰 통계가 없습니다.
                  </p>
                )}
              </div>
              <Tabs
                value={reviewOrderBy}
                onValueChange={(value) =>
                  setReviewOrderBy(value as "latest" | "recommended")
                }
                className="w-full md:w-auto"
              >
                <TabsList className="grid w-full grid-cols-2 md:w-auto">
                  <TabsTrigger value="latest">최신순</TabsTrigger>
                  <TabsTrigger value="recommended">추천순</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {reviewLoading && (
              <p className="text-sm text-muted-foreground">
                리뷰를 불러오는 중입니다...
              </p>
            )}
            {reviewError && (
              <p className="text-sm text-red-600">{reviewError}</p>
            )}
            {!reviewLoading && !reviewError && reviews.length === 0 && (
              <p className="text-sm text-muted-foreground">
                등록된 리뷰가 없습니다.
              </p>
            )}
            {!reviewLoading && reviews.length > 0 && (
              <div className="space-y-4">
                {reviews.map((review, index) => (
                  <Card
                    key={
                      review.reviewId
                        ? `review-${review.reviewId}`
                        : `review-${index}`
                    }
                    className="p-4 border border-border/60"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground">
                            {review.nickname || "익명"}
                          </p>
                          <div className="flex items-center gap-0.5 text-sm">
                            {renderStars(review.rating)}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatDate(review.createdAt)}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLikeReview(review.reviewId)}
                        disabled={likingReviewIds[review.reviewId]}
                      >
                        좋아요 {review.likeCount}
                      </Button>
                    </div>
                    <p className="text-sm text-foreground mt-3 leading-relaxed whitespace-pre-line">
                      {review.body}
                    </p>
                  </Card>
                ))}
              </div>
            )}
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
                  {displayPrice(productPrice * quantity)}
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
                  <AddressSearchInput
                    value={recipientAddress}
                    onChange={setRecipientAddress}
                    placeholder="주소를 입력하세요"
                    required
                    readOnly
                  />
                  <Input
                    value={recipientAddressDetail}
                    onChange={(e) => setRecipientAddressDetail(e.target.value)}
                    placeholder="상세 주소를 입력하세요"
                    className="mt-2"
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
