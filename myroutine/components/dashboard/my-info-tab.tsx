"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import AddressSearchInput from "@/components/address-search-input"
import { Save } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { memberApi, type MemberInfoResponse } from "@/lib/api/member"
import { useRouter } from "next/navigation"

type MemberFormState = Pick<
  MemberInfoResponse,
  "id" | "name" | "email" | "phoneNumber" | "address"
>

export default function MyInfoTab() {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<MemberFormState>({
    name: "",
    email: "",
    phoneNumber: "",
    address: "",
    id: "",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addressDetail, setAddressDetail] = useState("")

  useEffect(() => {
    const fetchMe = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const data = await memberApi.getMe()
        setFormData({
          name: data?.name || "",
          email: data?.email || "",
          phoneNumber: data?.phoneNumber || "",
          address: data?.address || "",
          id: data?.id || "",
        })
      } catch (err: any) {
        setError(err?.message || "내 정보를 불러오지 못했습니다.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchMe()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    const key = name as keyof MemberFormState
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError(null)
    try {
      const fullAddress = addressDetail.trim()
        ? `${formData.address} ${addressDetail.trim()}`
        : formData.address
      await memberApi.updateMe({
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        address: fullAddress,
      })
      setIsEditing(false)
    } catch (err: any) {
      setError(err?.message || "정보 저장 중 오류가 발생했습니다.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("정말 탈퇴하시겠습니까? 모든 데이터가 삭제됩니다.")) return
    setIsDeleting(true)
    setError(null)
    try {
      await memberApi.deleteMe()
      apiClient.clearAccessToken()
      localStorage.removeItem("accessToken")
      localStorage.removeItem("refreshToken")
      localStorage.removeItem("memberId")
      window.dispatchEvent(new Event("auth-changed"))
      router.push("/login")
    } catch (err: any) {
      setError(err?.message || "탈퇴 처리 중 오류가 발생했습니다.")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-foreground">내 정보</h2>
        <Button
          variant={isEditing ? "default" : "outline"}
          onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
          className="gap-2"
        >
          <Save className="w-4 h-4" />
          {isEditing ? "저장하기" : "수정하기"}
        </Button>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-foreground mb-2">
            이름
          </label>
          <Input
            name="name"
            value={formData.name}
            onChange={handleChange}
            disabled={!isEditing || isSaving || isLoading}
            className="h-10"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-foreground mb-2">
            이메일
          </label>
          <Input
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            disabled
            className="h-10"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-foreground mb-2">
            휴대폰 번호
          </label>
          <Input
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            disabled={!isEditing || isSaving || isLoading}
            className="h-10"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-foreground mb-2">
            배송지 주소
          </label>
          <AddressSearchInput
            id="address"
            value={formData.address}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, address: value }))
            }
            disabled={!isEditing || isSaving || isLoading}
            required
            readOnly
          />
          <Input
            id="addressDetail"
            value={addressDetail}
            onChange={(e) => setAddressDetail(e.target.value)}
            disabled={!isEditing || isSaving || isLoading}
            placeholder="상세 주소를 입력하세요"
            className="h-10 mt-2"
          />
        </div>

        {isEditing && (
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button
              onClick={() => setIsEditing(false)}
              variant="outline"
              className="flex-1"
              disabled={isSaving}
            >
              취소
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-primary hover:bg-primary/90"
              disabled={isSaving}
            >
              {isSaving ? "저장 중..." : "저장하기"}
            </Button>
          </div>
        )}

        <div className="pt-6 border-t border-border flex justify-end">
          <Button
            type="button"
            variant="outline"
            className="border-destructive text-destructive hover:bg-destructive hover:text-white"
            onClick={handleDelete}
            disabled={isDeleting || isSaving || isLoading}
          >
            {isDeleting ? "탈퇴 처리 중..." : "회원 탈퇴"}
          </Button>
        </div>
      </div>
    </Card>
  )
}
