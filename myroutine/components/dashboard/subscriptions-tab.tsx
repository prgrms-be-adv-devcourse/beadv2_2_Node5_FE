"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  formatDaysOfWeek,
} from "@/lib/api-client"
import { subscriptionApi, type SubscriptionInfo } from "@/lib/api/subscription"
import Link from "next/link"

type SubscriptionItem = Partial<
  Pick<
    SubscriptionInfo,
    | "productName"
    | "thumbnailUrl"
    | "subscriptionStatus"
    | "pricePerItem"
    | "totalPrice"
    | "nextRunDate"
    | "recurrenceType"
    | "dayOfWeek"
    | "dayOfMonth"
  >
> & {
  id: string
  productName: string
  productImage?: string
  price?: number
  status?: "ACTIVE" | "PAUSED" | "CANCELLED"
}

const mockSubscriptions: SubscriptionItem[] = [
  {
    id: "1",
    productName: "프리미엄 샐러드 구독",
    productImage: "/vibrant-mixed-salad.png",
    price: 8900,
    status: "ACTIVE",
    nextRunDate: "2024-01-20",
    recurrenceType: "WEEKLY",
    dayOfWeek: [1, 3, 5],
  },
  {
    id: "2",
    productName: "유기농 요거트 세트",
    productImage: "/creamy-yogurt-bowl.png",
    price: 12900,
    status: "PAUSED",
    nextRunDate: "2024-02-01",
    recurrenceType: "MONTHLY",
    dayOfMonth: 1,
  },
  {
    id: "3",
    productName: "프리미엄 커피 원두",
    productImage: "/steaming-coffee-cup.png",
    price: 15000,
    status: "ACTIVE",
    nextRunDate: "2024-01-25",
    recurrenceType: "WEEKLY",
    dayOfWeek: [2, 4],
  },
]

export default function SubscriptionsTab() {
  const [subscriptions, setSubscriptions] =
    useState<SubscriptionItem[]>(mockSubscriptions)

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const data = await subscriptionApi.getSubscriptions()
        if (data?.content) {
          setSubscriptions(
            data.content.map((item) => ({
              ...item,
            }))
          )
        }
      } catch (err) {
        console.error("Failed to fetch subscriptions, using mock data.", err)
      }
    }

    fetchSubscriptions()
  }, [])

  const getStatusColor = (status?: string) => {
    switch (status || "ACTIVE") {
      case "ACTIVE":
        return "bg-green-100 text-green-800"
      case "PAUSED":
        return "bg-yellow-100 text-yellow-800"
      case "CANCELLED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusLabel = (status?: string) => {
    switch (status || "ACTIVE") {
      case "ACTIVE":
        return "활성"
      case "PAUSED":
        return "일시정지"
      case "CANCELLED":
        return "해지"
      default:
        return status
    }
  }

  return (
    <div className="space-y-6">
      {subscriptions.map((sub) => (
        <Link
          key={sub.id}
          href={`/dashboard/subscriptions/${sub.id}`}
          className="block"
        >
          <Card className="p-6 md:p-8 hover:border-primary/60 hover:shadow-sm transition">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Product Image */}
              <div className="flex-shrink-0">
                <img
                  src={sub.thumbnailUrl || sub.productImage || "/placeholder.svg"}
                  alt={sub.productName}
                  className="w-24 h-24 md:w-32 md:h-32 object-cover rounded-lg"
                />
              </div>

              {/* Product Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{sub.productName}</h3>
                    <Badge className={getStatusColor(sub.subscriptionStatus || sub.status)}>
                      {getStatusLabel(sub.subscriptionStatus || sub.status)}
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold text-primary">
                    ₩{(sub.totalPrice ?? sub.pricePerItem ?? sub.price ?? 0).toLocaleString()}
                  </p>
                </div>

                {/* Subscription Details */}
                <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <p className="font-bold text-foreground">배송 주기</p>
                    <p>
                      {sub.recurrenceType === "WEEKLY" ? "주간" : "월간"}
                      {sub.recurrenceType === "WEEKLY" &&
                        ` (${sub.dayOfWeek ? formatDaysOfWeek(sub.dayOfWeek) : ""})`}
                      {sub.recurrenceType === "MONTHLY" && ` (${sub.dayOfMonth}일)`}
                    </p>
                  </div>
                  <div>
                    <p className="font-bold text-foreground">다음 배송</p>
                    <p>{sub.nextRunDate || "미정"}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}
