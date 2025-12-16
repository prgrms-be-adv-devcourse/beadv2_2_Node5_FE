"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { shopApi, type ShopInfoResponse, type ShopDeleteResponse } from "@/lib/api/shop"
import {
  productApi,
  type ProductInfoResponse,
  ProductStatus,
} from "@/lib/api/product"
import { persistAuthPayload } from "@/lib/api/auth"
import { settlementApi, type SettlementListDetailInfo } from "@/lib/api/settlement"
import { Mail, Phone, MapPin, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { CATEGORY_OPTIONS } from "@/lib/categories"
import { getImageUrl } from "@/lib/image"

const PRODUCT_STATUS_OPTIONS = [
  { value: ProductStatus.ON_SALE, label: "판매중" },
  { value: ProductStatus.HIDDEN, label: "숨김" },
  { value: ProductStatus.DISCONTINUED, label: "판매중단" },
]

export default function ShopDetailPage() {
  const routeParams = useParams<{ id: string }>()
  const id = (routeParams?.id as string) || ""
  const router = useRouter()
  const [shop, setShop] = useState<ShopInfoResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isCreatingProduct, setIsCreatingProduct] = useState(false)
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [productError, setProductError] = useState<string | null>(null)
  const [createForm, setCreateForm] = useState({
    name: "",
    price: "",
    stock: "0",
    category: CATEGORY_OPTIONS[0]?.id || "",
    description: "",
  })
  const [thumbnailPreview, setThumbnailPreview] = useState("")
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [formData, setFormData] = useState({
    shopName: "",
    shopEmail: "",
    shopPhoneNumber: "",
    shopAddress: "",
  })
  const [showSettlementModal, setShowSettlementModal] = useState(false)
  const [settlementStart, setSettlementStart] = useState("")
  const [settlementEnd, setSettlementEnd] = useState("")
  const [settlementPage, setSettlementPage] = useState(0)
  const [settlements, setSettlements] = useState<SettlementListDetailInfo[]>([])
  const [isLoadingSettlement, setIsLoadingSettlement] = useState(false)
  const [settlementError, setSettlementError] = useState<string | null>(null)
  const [settlementTotalPages, setSettlementTotalPages] = useState(1)
  const [shopProducts, setShopProducts] = useState<ProductInfoResponse[]>([])
  const [selectedProduct, setSelectedProduct] = useState<ProductInfoResponse | null>(null)
  const [showProductModal, setShowProductModal] = useState(false)
  const [productModalError, setProductModalError] = useState<string | null>(null)
  const [isSavingProduct, setIsSavingProduct] = useState(false)
  const [isDeletingProduct, setIsDeletingProduct] = useState(false)
  const [productForm, setProductForm] = useState({
    name: "",
    price: "",
    stock: "",
    category: CATEGORY_OPTIONS[0]?.id || "",
    description: "",
    thumbnailUrl: "",
    status: ProductStatus.ON_SALE as ProductStatus,
  })
  const loadShopProducts = useCallback(async () => {
    if (!id) return
    setIsLoadingProducts(true)
    setProductError(null)
    try {
      const res = await productApi.getProductListByShop(id, {
        page: 0,
        size: 12,
        sort: "createdAt,desc",
      })
      setShopProducts(res?.content || [])
    } catch (err: any) {
      setShopProducts([])
      setProductError(err?.message || "상품을 불러오지 못했습니다.")
    } finally {
      setIsLoadingProducts(false)
    }
  }, [id])

  useEffect(() => {
    const fetchShop = async () => {
      if (!id) return
      setIsLoading(true)
      setError(null)
      try {
        const data = await shopApi.getMyShopDetail(id)
        setShop(data)
        setFormData({
          shopName: data?.shopName || "",
          shopEmail: data?.shopEmail || "",
          shopPhoneNumber: data?.shopPhoneNumber || "",
          shopAddress: data?.shopAddress || "",
        })
      } catch (err: any) {
        setError(err?.message || "상점 정보를 불러오지 못했습니다.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchShop()
  }, [id])

  useEffect(() => {
    loadShopProducts()
  }, [loadShopProducts])

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (!shop) return
    setIsSaving(true)
    setError(null)
    try {
      await shopApi.modifyShop(id, {
        shopName: formData.shopName,
        shopEmail: formData.shopEmail,
        shopPhoneNumber: formData.shopPhoneNumber,
        shopAddress: formData.shopAddress,
      })
      const updated = {
        id: shop.id,
        shopName: formData.shopName,
        shopEmail: formData.shopEmail,
        shopPhoneNumber: formData.shopPhoneNumber,
        shopAddress: formData.shopAddress,
      }
      setShop(updated)
      setIsEditing(false)
    } catch (err: any) {
      setError(err?.message || "상점 정보를 수정하지 못했습니다.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("정말 상점을 삭제하시겠습니까?")) return
    setIsDeleting(true)
    setError(null)
    try {
      const res: ShopDeleteResponse = await shopApi.deleteShop(id)

      // 삭제 시 seller 권한 제거된 토큰이 내려오면 교체
      if (res?.accessToken) {
        persistAuthPayload({
          accessToken: res.accessToken,
          roles: res.memberRoles,
        })
      }

      alert("상점이 삭제되었습니다.")
      router.push("/dashboard?tab=shops")
    } catch (err: any) {
      setError(err?.message || "상점 삭제에 실패했습니다.")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCreateProduct = async () => {
    if (!shop) return
    if (!createForm.name.trim()) {
      setCreateError("상품명을 입력해주세요.")
      return
    }
    if (!createForm.price || Number.isNaN(Number(createForm.price))) {
      setCreateError("가격을 숫자로 입력해주세요.")
      return
    }
    if (!thumbnailFile) {
      setCreateError("대표 이미지를 선택해주세요.")
      return
    }
    setIsCreatingProduct(true)
    setCreateError(null)
    try {
      const presigned = await productApi.getPresignedUrl({
        contentType: thumbnailFile.type || "image/*",
      })

      if (!presigned?.url) {
        throw new Error("업로드 URL을 받지 못했습니다.")
      }

      const uploadResponse = await fetch(presigned.url, {
        method: "PUT",
        headers: {
          "Content-Type": thumbnailFile.type || "application/octet-stream",
        },
        body: thumbnailFile,
      })

      if (!uploadResponse.ok) {
        console.error("상품 이미지 업로드 실패", {
          status: uploadResponse.status,
          statusText: uploadResponse.statusText,
        })
        throw new Error("이미지 업로드에 실패했습니다.")
      }

      const imageUrl = presigned.key || presigned.url.split("?")[0] || ""

      await productApi.createProduct(shop.id, {
        name: createForm.name.trim(),
        description: createForm.description.trim() || " ",
        price: Number(createForm.price),
        stock: Number(createForm.stock) || 0,
        status: ProductStatus.ON_SALE,
        category: createForm.category,
        thumbnailUrl: imageUrl || "/placeholder.svg",
      })
      alert("상품이 등록되었습니다.")
      setShowCreateModal(false)
      setCreateForm({
        name: "",
        price: "",
        stock: "0",
        category: CATEGORY_OPTIONS[0]?.id || "",
        description: "",
      })
      setThumbnailPreview("")
      setThumbnailFile(null)
      loadShopProducts()
    } catch (err: any) {
      // S3 CORS 등으로 서버에 요청이 닿지 않는 경우도 콘솔에 남겨 추적
      console.error("상품 등록 실패", err)
      setCreateError(err?.message || "상품 등록에 실패했습니다.")
    } finally {
      setIsCreatingProduct(false)
    }
  }

  useEffect(() => {
    return () => {
      if (thumbnailPreview) {
        URL.revokeObjectURL(thumbnailPreview)
      }
    }
  }, [thumbnailPreview])

  const displayValue = (value: string) =>
    value?.trim() ? value : "등록된 정보가 없습니다."

  const formatPrice = (price: number | string | undefined) => {
    const num = typeof price === "string" ? Number(price) : price ?? 0
    const safe = Number.isFinite(num) ? (num as number) : 0
    return `₩${safe.toLocaleString()}`
  }

  const formatMonth = (date: Date) => {
    const y = date.getFullYear()
    const m = `${date.getMonth() + 1}`.padStart(2, "0")
    return `${y}-${m}`
  }

  const fetchSettlementHistory = async (
    startDate: string,
    endDate: string,
    page = 0
  ) => {
    if (!id) return
    if (!startDate || !endDate) {
      setSettlementError("조회할 기간을 선택해주세요.")
      return
    }
    setIsLoadingSettlement(true)
    setSettlementError(null)
    try {
      const res = await settlementApi.getSettlementHistory(
        id,
        startDate,
        endDate,
        page
      )
      setSettlements(res?.settlementList || [])
      setSettlementPage(page)
      const totalPages =
        res && (res as any).pageInfo && Number((res as any).pageInfo.totalPages)
      setSettlementTotalPages(
        Number.isFinite(totalPages) && totalPages > 0 ? totalPages : 1
      )
    } catch (err: any) {
      setSettlements([])
      setSettlementError(
        err?.message || "정산 내역을 불러오지 못했습니다. 잠시 후 다시 시도해주세요."
      )
    } finally {
      setIsLoadingSettlement(false)
    }
  }

  const openSettlementModal = () => {
    const now = new Date()
    const start = new Date(now)
    start.setMonth(start.getMonth() - 2)
    const defaultStart = formatMonth(start)
    const defaultEnd = formatMonth(now)
    setSettlementStart(defaultStart)
    setSettlementEnd(defaultEnd)
    setSettlementPage(0)
    setSettlementError(null)
    setSettlements([])
    setShowSettlementModal(true)
    fetchSettlementHistory(defaultStart, defaultEnd, 0)
  }

  const openProductModal = (product: ProductInfoResponse) => {
    setSelectedProduct(product)
    setProductModalError(null)
    setProductForm({
      name: product.name || "",
      price:
        typeof product.price === "number"
          ? product.price.toString()
          : product.price || "",
      stock:
        typeof product.stock === "number"
          ? product.stock.toString()
          : product.stock?.toString() || "",
      category: product.category || CATEGORY_OPTIONS[0]?.id || "",
      description: product.description || "",
      thumbnailUrl: product.thumbnailUrl || "",
      status: (product.status as ProductStatus) || ProductStatus.ON_SALE,
    })
    setShowProductModal(true)
  }

  const handleProductSave = async () => {
    if (!selectedProduct?.id) return
    if (!productForm.name.trim()) {
      setProductModalError("상품명을 입력해주세요.")
      return
    }
    if (!productForm.price || Number.isNaN(Number(productForm.price))) {
      setProductModalError("가격을 숫자로 입력해주세요.")
      return
    }
    setIsSavingProduct(true)
    setProductModalError(null)
    try {
      const prevStatus =
        (selectedProduct.status as ProductStatus) || ProductStatus.ON_SALE
      const nextStatus = productForm.status || ProductStatus.ON_SALE

      const hasStatusChanged = prevStatus !== nextStatus
      const hasInfoChanged =
        productForm.name.trim() !== (selectedProduct.name || "") ||
        Number(productForm.price) !== Number(selectedProduct.price) ||
        (productForm.stock || "") !==
          (typeof selectedProduct.stock === "number"
            ? selectedProduct.stock.toString()
            : selectedProduct.stock || "") ||
        productForm.category !== (selectedProduct.category || "") ||
        (productForm.description?.trim() || "") !==
          (selectedProduct.description || "") ||
        (productForm.thumbnailUrl || "") !==
          (selectedProduct.thumbnailUrl || "")

      // 상태만 바뀐 경우: 상태 API만 호출
      if (!hasInfoChanged && hasStatusChanged) {
        await productApi.updateProductStatus(selectedProduct.id.toString(), {
          status: nextStatus,
        })
        setShowProductModal(false)
        await loadShopProducts()
        return
      }

      // 정보 변경이 있는 경우: 기본 정보 저장 후 상태 변경이 있으면 추가 호출
      if (hasInfoChanged) {
        await productApi.updateProduct(selectedProduct.id.toString(), {
          name: productForm.name.trim(),
          description: productForm.description.trim() || " ",
          price: Number(productForm.price),
          stock: Number(productForm.stock) || 0,
          category: productForm.category,
          thumbnailUrl: productForm.thumbnailUrl || "/placeholder.svg",
        })
      }

      if (hasStatusChanged) {
        await productApi.updateProductStatus(selectedProduct.id.toString(), {
          status: nextStatus,
        })
      }

      setShowProductModal(false)
      await loadShopProducts()
    } catch (err: any) {
      setProductModalError(err?.message || "상품을 수정하지 못했습니다.")
    } finally {
      setIsSavingProduct(false)
    }
  }

  const handleProductDelete = async () => {
    if (!selectedProduct?.id) return
    if (!confirm("이 상품을 삭제하시겠습니까?")) return
    setIsDeletingProduct(true)
    setProductModalError(null)
    try {
      await productApi.deleteProduct(selectedProduct.id.toString())
      setShowProductModal(false)
      await loadShopProducts()
    } catch (err: any) {
      setProductModalError(err?.message || "상품을 삭제하지 못했습니다.")
    } finally {
      setIsDeletingProduct(false)
    }
  }

  return (
    <main className="flex-1">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              상점 상세
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              내 상점 정보를 확인하세요
            </p>
          </div>
          <Link href="/dashboard?tab=shops">
            <Button variant="outline">상점 목록으로</Button>
          </Link>
        </div>

        <div className="space-y-6">
          <Card className="p-6 md:p-8 space-y-6">
            {isLoading ? (
              <p className="text-muted-foreground">불러오는 중...</p>
            ) : error ? (
              <p className="text-red-600">{error}</p>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                      {shop?.shopName?.[0] ?? "S"}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">상점명</p>
                      <h2 className="text-xl md:text-2xl font-bold text-foreground">
                        {displayValue(shop?.shopName || "")}
                      </h2>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {isEditing ? (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsEditing(false)
                            if (shop) {
                              setFormData({
                                shopName: shop.shopName,
                                shopEmail: shop.shopEmail,
                                shopPhoneNumber: shop.shopPhoneNumber,
                                shopAddress: shop.shopAddress,
                              })
                            }
                          }}
                          className="gap-2"
                          disabled={isSaving}
                        >
                          취소
                        </Button>
                        <Button
                          onClick={handleSave}
                          className="gap-2"
                          disabled={isSaving}
                        >
                          {isSaving ? "저장 중..." : "저장"}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          onClick={openSettlementModal}
                          className="gap-2"
                        >
                          정산 내역 보기
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleEdit}
                          className="gap-2"
                        >
                          정보 수정
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleDelete}
                          className="gap-2 text-destructive hover:text-destructive"
                          disabled={isDeleting}
                        >
                          {isDeleting ? "삭제 중..." : "삭제"}
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-1">
                        상점명
                      </p>
                      <Input
                        value={formData.shopName}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            shopName: e.target.value,
                          }))
                        }
                        placeholder="상점명을 입력하세요"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-semibold text-foreground mb-1">
                          이메일
                        </p>
                        <Input
                          value={formData.shopEmail}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              shopEmail: e.target.value,
                            }))
                          }
                          placeholder="shop@example.com"
                          type="email"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground mb-1">
                          연락처
                        </p>
                        <Input
                          value={formData.shopPhoneNumber}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              shopPhoneNumber: e.target.value,
                            }))
                          }
                          placeholder="02-1234-5678"
                        />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-1">
                        주소
                      </p>
                      <Input
                        value={formData.shopAddress}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            shopAddress: e.target.value,
                          }))
                        }
                        placeholder="상점 주소를 입력하세요"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-4 bg-muted/40 border-border/60">
                      <div className="flex items-center gap-2 mb-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">이메일</p>
                      </div>
                      <p className="font-semibold text-foreground">
                        {displayValue(shop?.shopEmail || "")}
                      </p>
                    </Card>
                    <Card className="p-4 bg-muted/40 border-border/60">
                      <div className="flex items-center gap-2 mb-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">연락처</p>
                      </div>
                      <p className="font-semibold text-foreground">
                        {displayValue(shop?.shopPhoneNumber || "")}
                      </p>
                    </Card>
                    <Card className="p-4 bg-muted/40 border-border/60">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">주소</p>
                      </div>
                      <p className="font-semibold text-foreground">
                        {displayValue(shop?.shopAddress || "")}
                      </p>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card className="p-6 md:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-foreground">상점 상품</h3>
                <p className="text-sm text-muted-foreground">
                  이 상점에 등록된 상품 목록입니다.
                </p>
              </div>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="gap-2"
              >
                상품 등록
              </Button>
            </div>

            {productError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                {productError}
              </p>
            )}

            {isLoadingProducts ? (
              <p className="text-sm text-muted-foreground">불러오는 중...</p>
            ) : (
              <div className="space-y-2">
                {shopProducts.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    등록된 상품이 없어요.
                  </p>
                )}
                <div className="border rounded-md divide-y divide-border overflow-hidden">
                  {shopProducts.map((product) => (
                    <div
                      key={product.id?.toString()}
                      className="grid grid-cols-[80px_1fr] gap-3 p-4 items-center hover:bg-muted/60 cursor-pointer"
                      onClick={() => openProductModal(product)}
                    >
                    <div className="w-20 h-16 rounded-md bg-muted overflow-hidden">
                      <img
                        src={getImageUrl(product.thumbnailUrl) || "/placeholder.svg"}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-foreground line-clamp-2">
                          {product.name}
                        </p>
                        <p className="text-sm text-primary font-bold">
                          {formatPrice(product.price)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          상태: {product.status || "ON_SALE"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {showProductModal && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
          <Card className="w-full max-w-2xl p-6 space-y-4 relative">
            <button
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
              onClick={() => setShowProductModal(false)}
              aria-label="닫기"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-2xl font-bold text-foreground">상품 상세/수정</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 flex items-center gap-3">
                <div className="w-24 h-20 rounded-md bg-muted overflow-hidden">
                  <img
                    src={getImageUrl(productForm.thumbnailUrl) || "/placeholder.svg"}
                    alt={productForm.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  대표 이미지는 아래 URL을 수정해 변경할 수 있어요.
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">상품명</p>
                <Input
                  value={productForm.name}
                  onChange={(e) =>
                    setProductForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="상품명을 입력하세요"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">가격</p>
                <Input
                  type="number"
                  value={productForm.price}
                  onChange={(e) =>
                    setProductForm((prev) => ({ ...prev, price: e.target.value }))
                  }
                  placeholder="0"
                  min={0}
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">재고</p>
                <Input
                  type="number"
                  value={productForm.stock}
                  onChange={(e) =>
                    setProductForm((prev) => ({ ...prev, stock: e.target.value }))
                  }
                  placeholder="0"
                  min={0}
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">카테고리</p>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                  value={productForm.category}
                  onChange={(e) =>
                    setProductForm((prev) => ({ ...prev, category: e.target.value }))
                  }
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">상태</p>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                  value={productForm.status}
                  onChange={(e) =>
                    setProductForm((prev) => ({
                      ...prev,
                      status: e.target.value as ProductStatus,
                    }))
                  }
                >
                  {PRODUCT_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm font-semibold text-foreground mb-1">
                  대표 이미지 URL
                </p>
                <Input
                  value={productForm.thumbnailUrl}
                  onChange={(e) =>
                    setProductForm((prev) => ({
                      ...prev,
                      thumbnailUrl: e.target.value,
                    }))
                  }
                  placeholder="/placeholder.svg"
                />
              </div>
              <div className="md:col-span-2">
                <p className="text-sm font-semibold text-foreground mb-1">설명</p>
                <textarea
                  className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  value={productForm.description}
                  onChange={(e) =>
                    setProductForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="상품 설명을 입력하세요"
                />
              </div>
            </div>

            {productModalError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                {productModalError}
              </p>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowProductModal(false)}
                disabled={isSavingProduct || isDeletingProduct}
              >
                취소
              </Button>
              <Button
                variant="outline"
                className="flex-1 text-destructive border-destructive"
                onClick={handleProductDelete}
                disabled={isSavingProduct || isDeletingProduct}
              >
                {isDeletingProduct ? "삭제 중..." : "삭제"}
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={handleProductSave}
                disabled={isSavingProduct || isDeletingProduct}
              >
                {isSavingProduct ? "저장 중..." : "저장"}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {showSettlementModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
          <Card className="w-full max-w-3xl p-6 space-y-4">
            <div className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-2xl font-bold text-foreground pt-1">
                  정산 내역
                </h3>
                <button
                  className="text-muted-foreground hover:text-foreground"
                  onClick={() => setShowSettlementModal(false)}
                  aria-label="닫기"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="text-sm text-muted-foreground">시작월</label>
                  <Input
                    type="month"
                    value={settlementStart}
                    onChange={(e) => setSettlementStart(e.target.value)}
                    className="w-36"
                  />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="text-sm text-muted-foreground">종료월</label>
                  <Input
                    type="month"
                    value={settlementEnd}
                    onChange={(e) => setSettlementEnd(e.target.value)}
                    className="w-36"
                  />
                </div>
                <Button
                  onClick={() =>
                    fetchSettlementHistory(settlementStart, settlementEnd, 0)
                  }
                  disabled={isLoadingSettlement}
                >
                  조회
                </Button>
              </div>

              {settlementError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                  {settlementError}
                </p>
              )}

              <div className="border rounded-md divide-y divide-border bg-muted/30">
                {isLoadingSettlement ? (
                  <p className="p-4 text-sm text-muted-foreground">
                    불러오는 중...
                  </p>
                ) : settlements.length === 0 ? (
                  <p className="p-4 text-sm text-muted-foreground">
                    정산 내역이 없습니다.
                  </p>
                ) : (
                  settlements.map((item) => (
                    <div
                      key={item.settlementId}
                      className="grid grid-cols-2 md:grid-cols-4 gap-2 p-4 text-sm"
                    >
                      <div>
                        <p className="text-muted-foreground">정산월</p>
                        <p className="font-semibold">{item.targetYm}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">정산금액</p>
                        <p className="font-semibold">
                          ₩{item.payoutAmount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">상태</p>
                        <p className="font-semibold">{item.status}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">지급일</p>
                        <p className="font-semibold">{item.payoutDate}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  페이지 {settlementPage + 1} / {settlementTotalPages}
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      fetchSettlementHistory(
                        settlementStart,
                        settlementEnd,
                        Math.max(0, settlementPage - 1)
                      )
                    }
                    disabled={settlementPage === 0 || isLoadingSettlement}
                  >
                    이전
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      fetchSettlementHistory(
                        settlementStart,
                        settlementEnd,
                        Math.min(settlementTotalPages - 1, settlementPage + 1)
                      )
                    }
                    disabled={
                      settlementPage >= settlementTotalPages - 1 ||
                      isLoadingSettlement
                    }
                  >
                    다음
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
          <Card className="w-full max-w-2xl p-6 space-y-4 relative">
            <button
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
              onClick={() => setShowCreateModal(false)}
              aria-label="닫기"
            >
              ✕
            </button>
            <h3 className="text-2xl font-bold text-foreground">상품 등록</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">
                  상품명
                </p>
                <Input
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="상품명을 입력하세요"
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">
                  가격
                </p>
                <Input
                  type="number"
                  value={createForm.price}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      price: e.target.value,
                    }))
                  }
                  placeholder="0"
                  min={0}
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">
                  재고
                </p>
                <Input
                  type="number"
                  value={createForm.stock}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      stock: e.target.value,
                    }))
                  }
                  placeholder="0"
                  min={0}
                />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">
                  카테고리
                </p>
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                  value={createForm.category}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2 space-y-2">
                <p className="text-sm font-semibold text-foreground">
                  대표 이미지 업로드
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const url = URL.createObjectURL(file)
                    if (thumbnailPreview) {
                      URL.revokeObjectURL(thumbnailPreview)
                    }
                    setThumbnailPreview(url)
                    setThumbnailFile(file)
                  }}
                  className="text-sm"
                />
                {thumbnailPreview && (
                  <div className="border rounded-md p-2 bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-2">
                      미리보기
                    </p>
                    <img
                      src={thumbnailPreview}
                      alt="미리보기"
                      className="w-full max-h-48 object-cover rounded"
                    />
                  </div>
                )}
              </div>
              <div className="md:col-span-2">
                <p className="text-sm font-semibold text-foreground mb-1">
                  상품 설명
                </p>
                <textarea
                  className="w-full min-h-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="상품 설명을 입력하세요"
                />
              </div>
            </div>
            {createError && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                {createError}
              </p>
            )}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCreateModal(false)}
                disabled={isCreatingProduct}
              >
                취소
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={handleCreateProduct}
                disabled={isCreatingProduct}
              >
                {isCreatingProduct ? "등록 중..." : "상품 등록"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </main>
  )
}
