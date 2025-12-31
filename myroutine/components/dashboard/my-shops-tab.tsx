"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import AddressSearchInput from "@/components/address-search-input"
import { Plus } from "lucide-react"
import { type PageResponse } from "@/lib/api-client"
import {
  shopApi,
  type ShopListResponse,
  type ShopRegisterRequest,
} from "@/lib/api/shop"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { walletApi } from "@/lib/api/wallet"
import { WalletConsentModal } from "./wallet-consent-modal"

interface Shop {
  id: string
  name: string
}

export default function MyShopsTab() {
  const router = useRouter()
  const [shops, setShops] = useState<Shop[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCheckingWallet, setIsCheckingWallet] = useState(false)
  const [isCreatingWallet, setIsCreatingWallet] = useState(false)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showWalletConsent, setShowWalletConsent] = useState(false)
  const [formData, setFormData] = useState<ShopRegisterRequest>({
    shopName: "",
    shopEmail: "",
    shopPhoneNumber: "",
    shopAddress: "",
    shopRegistrationNumber: "",
  })
  const [shopAddressDetail, setShopAddressDetail] = useState("")

  const fetchShops = async (pageToLoad = 0) => {
    setIsLoading(true)
    setError(null)
    try {
      const data: PageResponse<ShopListResponse> = await shopApi.getMyShops(
        pageToLoad,
        6,
        "createdAt,desc"
      )
      const list = Array.isArray(data?.content) ? data.content : []
      setShops(
        list.map((item, idx) => ({
          id: item.shopId || String(idx),
          name: item.shopName || "이름 없음",
        }))
      )
      setPage(typeof data?.number === "number" ? data.number : pageToLoad)
      setTotalPages(data?.totalPages && data.totalPages > 0 ? data.totalPages : 1)
    } catch (err: any) {
      if (err?.status === 403) {
        setShops([])
        setPage(0)
        setTotalPages(1)
        return
      }
      setError(err?.message || "상점 목록을 불러오지 못했습니다.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchShops(0)
  }, [])

  const handleOpenForm = async () => {
    setError(null)
    setIsCheckingWallet(true)
    try {
      await walletApi.getWallet()
      setShowForm(true)
    } catch (err: any) {
      const isWalletMissing =
        err?.code === "WALLET_001" || err?.status === 404 || err?.code === "NOT_FOUND"
      if (isWalletMissing) {
        setShowWalletConsent(true)
      } else {
        setError(err?.message || "지갑 정보를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.")
      }
    } finally {
      setIsCheckingWallet(false)
    }
  }

  const handleAddShop = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    try {
      const fullAddress = shopAddressDetail.trim()
        ? `${formData.shopAddress} ${shopAddressDetail.trim()}`
        : formData.shopAddress
      await shopApi.createShop({
        ...formData,
        shopAddress: fullAddress,
      })

      await fetchShops(0)
      setFormData({
        shopName: "",
        shopEmail: "",
        shopPhoneNumber: "",
        shopAddress: "",
        shopRegistrationNumber: "",
      })
      setShopAddressDetail("")
      setShowForm(false)
      alert("상점이 등록되었습니다!")
    } catch (err: any) {
      setError(err?.message || "상점 등록에 실패했습니다.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConsentConfirm = async () => {
    setIsCreatingWallet(true)
    setError(null)
    try {
      await walletApi.createWallet()
      setShowWalletConsent(false)
      setShowForm(true)
    } catch (err: any) {
      setError(err?.message || "지갑을 생성하지 못했습니다. 잠시 후 다시 시도해주세요.")
    } finally {
      setIsCreatingWallet(false)
    }
  }

  const handleConsentCancel = () => {
    setShowWalletConsent(false)
  }

  return (
    <>
      <div className="space-y-6">
      {/* Add Shop Button */}
      <Button
        onClick={handleOpenForm}
        className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2"
        disabled={isCheckingWallet || isCreatingWallet}
      >
        <Plus className="w-5 h-5" />
        {isCheckingWallet || isCreatingWallet
          ? "지갑 확인 중..."
          : "새 상점 등록"}
      </Button>

      {/* Add Shop Form */}
      {showForm && (
        <Card className="p-6 md:p-8 border-primary/20 bg-primary/5">
          <h3 className="text-xl font-bold text-foreground mb-6">
            새 상점 등록
          </h3>
          <form onSubmit={handleAddShop} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">
                상점명 *
              </label>
              <Input
                value={formData.shopName}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, shopName: e.target.value }))
                }
                placeholder="상점명을 입력하세요"
                className="h-10"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground mb-2">
                상점 이메일 *
              </label>
              <Input
                type="email"
                value={formData.shopEmail}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    shopEmail: e.target.value,
                  }))
                }
                placeholder="shop@example.com"
                className="h-10"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground mb-2">
                연락처 *
              </label>
              <Input
                type="tel"
                value={formData.shopPhoneNumber}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    shopPhoneNumber: e.target.value,
                  }))
                }
                placeholder="02-1234-5678"
                className="h-10"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground mb-2">
                상점 주소 *
              </label>
              <AddressSearchInput
                id="shopAddress"
                value={formData.shopAddress}
                onChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    shopAddress: value,
                  }))
                }
                placeholder="상점 주소를 입력하세요"
                required
                readOnly
              />
              <Input
                id="shopAddressDetail"
                value={shopAddressDetail}
                onChange={(e) => setShopAddressDetail(e.target.value)}
                placeholder="상세 주소를 입력하세요"
                className="h-10 mt-2"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground mb-2">
                사업자등록번호 *
              </label>
              <Input
                value={formData.shopRegistrationNumber}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    shopRegistrationNumber: e.target.value,
                  }))
                }
                placeholder="123-45-67890"
                className="h-10"
                required
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                onClick={() => setShowForm(false)}
                variant="outline"
                className="flex-1"
              >
                취소
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary/90"
                disabled={isSubmitting}
              >
                {isSubmitting ? "등록 중..." : "등록하기"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* Shops List */}
      {isLoading ? (
        <Card className="p-6 text-center text-muted-foreground">
          상점 정보를 불러오는 중...
        </Card>
      ) : shops.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          등록된 상점이 없습니다.
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {shops.map((shop) => (
              <Link key={shop.id} href={`/shops/${shop.id}`} className="block">
                <Card className="p-6 md:p-8 border-border/70 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                      {shop.name?.[0] ?? "S"}
                    </div>
                    <div className="flex-1 flex items-center justify-between gap-3">
                      <h3 className="text-lg md:text-xl font-bold text-foreground">
                        {shop.name || "이름 없음"}
                      </h3>
                      <span className="text-sm text-muted-foreground">
                        상세보기
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
          <div className="flex items-center justify-between pt-4">
            <span className="text-sm text-muted-foreground">
              페이지 {page + 1} / {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => fetchShops(Math.max(0, page - 1))}
                disabled={page === 0 || isLoading}
              >
                이전
              </Button>
              <Button
                variant="outline"
                onClick={() => fetchShops(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1 || isLoading}
              >
                다음
              </Button>
            </div>
          </div>
        </>
      )}
    </div>

      <WalletConsentModal
        open={showWalletConsent}
        loading={isCreatingWallet}
        onConfirm={handleConsentConfirm}
        onCancel={handleConsentCancel}
      />
    </>
  )
}
