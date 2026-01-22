import { apiClient, type PageResponse } from "../api-client"
import { type DayOfWeek } from "../api-client"

export type RecurrenceType = "WEEKLY" | "MONTHLY"

export type SubscriptionStatus =
  | "ACTIVE"
  | "PAUSED"
  | "FAILED"
  | "CANCELLED"
  | "UNAVAILABLE"

export interface SubscriptionInfo {
  id: string
  productId: string
  productName: string
  thumbnailUrl: string
  subscriptionStatus: SubscriptionStatus
  pricePerItem: number
  quantity: number
  totalPrice: number
  deliveryAddress: string
  createdAt: string
  modifiedAt: string
  nextRunDate: string
  recurrenceType: RecurrenceType
  dayOfWeek: DayOfWeek[]
  dayOfMonth: number
}

export interface SubscriptionCreateRequest {
  productId: string
  quantity: number
  deliveryAddress: string
  recurrenceType: RecurrenceType
  dayOfWeek?: DayOfWeek[]
  dayOfMonth?: number
}

export interface SubscriptionUpdateRequest {
  deliveryAddress: string
  dayOfWeek?: DayOfWeek[]
  dayOfMonth?: number
}

export const subscriptionApi = {
  getSubscription: (id: string) =>
    apiClient.get<SubscriptionInfo>(
      `/order-service/api/v1/subscriptions/${id}`
    ),
  getSubscriptions: (page = 0, size = 10, sort = "createdAt,desc") =>
    apiClient.get<PageResponse<SubscriptionInfo>>(
      "/order-service/api/v1/subscriptions",
      {
        params: { page, size, sort },
      }
    ),
  createSubscription: (data: SubscriptionCreateRequest) =>
    apiClient.post<SubscriptionInfo>(
      "/order-service/api/v1/subscriptions",
      data
    ),
  updateSubscription: (id: string, data: SubscriptionUpdateRequest) =>
    apiClient.put<SubscriptionInfo>(
      `/order-service/api/v1/subscriptions/${id}`,
      data
    ),
  pauseSubscription: (id: string) =>
    apiClient.patch<SubscriptionInfo>(
      `/order-service/api/v1/subscriptions/${id}/pause`
    ),
  resumeSubscription: (id: string) =>
    apiClient.patch<SubscriptionInfo>(
      `/order-service/api/v1/subscriptions/${id}/resume`
    ),
  cancelSubscription: (id: string) =>
    apiClient.delete<SubscriptionInfo>(
      `/order-service/api/v1/subscriptions/${id}`
    ),
}
