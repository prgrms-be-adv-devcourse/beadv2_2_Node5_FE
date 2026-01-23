"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import AddressSearchInput from "@/components/address-search-input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { DAY_OF_WEEK_OPTIONS, type DayOfWeek } from "@/lib/api-client"
import { subscriptionApi, type RecurrenceType } from "@/lib/api/subscription"
import type { ProductInfoResponse } from "@/lib/api/product"
import type React from "react"

interface SubscriptionFormProps {
  product: ProductInfoResponse
  onClose: () => void
}

const daysOfMonth = Array.from({ length: 28 }, (_, i) => i + 1)

export default function SubscriptionForm({
  product,
  onClose,
}: SubscriptionFormProps) {
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>("WEEKLY")
  const [selectedDaysOfWeek, setSelectedDaysOfWeek] = useState<DayOfWeek[]>([
    1, 3,
  ])
  const [selectedDayOfMonth, setSelectedDayOfMonth] = useState("1")
  const [quantity, setQuantity] = useState(1)
  const [address, setAddress] = useState("")
  const [addressDetail, setAddressDetail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const price =
    typeof product.price === "string"
      ? Number(product.price)
      : product.price || 0
  const weeklyMultiplier = selectedDaysOfWeek.length || 0
  const estimatedTotal =
    recurrenceType === "WEEKLY"
      ? price * quantity * weeklyMultiplier
      : price * quantity

  const handleDayOfWeekToggle = (day: DayOfWeek) => {
    setSelectedDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!address.trim()) {
      alert("배송지를 입력해주세요.")
      return
    }

    if (recurrenceType === "WEEKLY" && selectedDaysOfWeek.length === 0) {
      alert("배송 요일을 선택해주세요.")
      return
    }

    const productId = product.id?.toString()
    if (!productId) {
      alert("상품 정보를 불러올 수 없습니다.")
      return
    }

    const fullAddress = addressDetail.trim()
      ? `${address} ${addressDetail.trim()}`
      : address

    const subscriptionData = {
      productId,
      quantity,
      recurrenceType,
      deliveryAddress: fullAddress,
      dayOfWeek: recurrenceType === "WEEKLY" ? selectedDaysOfWeek : undefined,
      dayOfMonth:
        recurrenceType === "MONTHLY"
          ? Number.parseInt(selectedDayOfMonth)
          : undefined,
    }

    try {
      setIsSubmitting(true)
      await subscriptionApi.createSubscription(subscriptionData)
      alert("구독 신청이 완료되었습니다!")
      onClose()
    } catch (err: any) {
      alert(err?.message || "구독 신청에 실패했습니다.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Header */}
          <div className="bg-card border-b border-border p-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">구독 신청</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-6 overflow-y-auto">
            {/* Product Info */}
            <div className="pb-6 border-b border-border">
              <p className="text-sm text-muted-foreground">상품</p>
              <p className="text-lg font-bold text-foreground">
                {product.name}
              </p>
              <p className="text-xl font-bold text-primary mt-2">
                ₩{Number.isFinite(price) ? price.toLocaleString() : 0}
              </p>
            </div>

            {/* Recurrence Type */}
            <div>
              <Label className="text-foreground font-bold mb-3 block">
                배송 주기
              </Label>
              <RadioGroup
                value={recurrenceType}
                onValueChange={(v) => setRecurrenceType(v as RecurrenceType)}
              >
                <div className="flex items-center space-x-2 mb-3">
                  <RadioGroupItem value="WEEKLY" id="weekly" />
                  <Label
                    htmlFor="weekly"
                    className="cursor-pointer text-foreground"
                  >
                    매주
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="MONTHLY" id="monthly" />
                  <Label
                    htmlFor="monthly"
                    className="cursor-pointer text-foreground"
                  >
                    매월
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Days Selection */}
            {recurrenceType === "WEEKLY" ? (
              <div>
                <Label className="text-foreground font-bold mb-3 block">
                  배송 요일
                </Label>
                <div className="grid grid-cols-7 gap-2">
                  {DAY_OF_WEEK_OPTIONS.map((day) => (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => handleDayOfWeekToggle(day.id)}
                      className={`py-2 px-3 rounded-md font-bold text-sm transition-colors ${
                        selectedDaysOfWeek.includes(day.id)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground hover:bg-muted/80"
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <Label
                  htmlFor="day-of-month"
                  className="text-foreground font-bold mb-3 block"
                >
                  배송 날짜
                </Label>
                <Select
                  value={selectedDayOfMonth}
                  onValueChange={setSelectedDayOfMonth}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {daysOfMonth.map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        {day}일
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Quantity */}
            <div>
              <Label
                htmlFor="quantity"
                className="text-foreground font-bold mb-3 block"
              >
                수량
              </Label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-md border border-border hover:bg-muted"
                >
                  −
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(
                      Math.max(1, Number.parseInt(e.target.value) || 1)
                    )
                  }
                  className="flex-1 h-10 text-center border border-border rounded-md"
                />
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-md border border-border hover:bg-muted"
                >
                  +
                </button>
              </div>
            </div>

            {/* Delivery Address */}
            <div>
              <Label
                htmlFor="address"
                className="text-foreground font-bold mb-3 block"
              >
                배송지
              </Label>
              <AddressSearchInput
                id="address"
                value={address}
                onChange={setAddress}
                placeholder="배송받을 주소를 입력하세요"
                required
                readOnly
              />
              <Input
                id="addressDetail"
                value={addressDetail}
                onChange={(e) => setAddressDetail(e.target.value)}
                placeholder="상세 주소를 입력하세요"
                className="h-10 mt-2"
              />
            </div>

            {/* Total Price */}
            <div className="bg-primary/10 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-foreground font-bold">예상 총 비용</span>
                <span className="text-2xl font-bold text-primary">
                  ₩
                  {Number.isFinite(estimatedTotal)
                    ? estimatedTotal.toLocaleString()
                    : 0}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {recurrenceType === "WEEKLY"
                  ? `주간 기준 (선택 요일 ${weeklyMultiplier}회)`
                  : "월간 기준"}
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold disabled:opacity-70"
              disabled={isSubmitting}
            >
              {isSubmitting ? "신청 중..." : "구독 신청하기"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
