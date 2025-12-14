import { apiClient, type PageResponse } from "../api-client"

export interface PaymentInfo {
  walletId: string
  paymentKey: string
  orderId: string
  amount: number
  method: string
  status: PaymentStatus
  requestedAt: string
  approvedAt?: string
  failReason?: string
}

export enum PaymentStatus {
  READY = "READY",
  CONFIRMED = "CONFIRMED",
  FAILED = "FAILED",
  CANCELED = "CANCELED",
}

export interface PaymentRequest {
  amount: number
}

export interface PaymentConfirmRequest {
  paymentKey: string
  orderId: string
  amount: number
}

export interface PaymentCancelRequest {
  paymentKey: string
  orderId: string
  amount: string
}

export interface PaymentFailureInfo {
  id: string
  orderId: string
  paymentKey: string
  errorCode: string
  errorMessage: string
  amount: number
  createdAt: string
}

export interface PaymentFailureRequest {
  orderId: string
  paymentKey?: string
  code: string
  message: string
  amount?: number
  rawPayload?: string
}

export const paymentApi = {
  getPayments: (page = 0, size = 10, sort = "createdAt,desc") =>
    apiClient.get<PageResponse<PaymentInfo>>(
      "/billing-service/api/v1/payments",
      {
        params: { page, size, sort },
      }
    ),
  requestPayment: (data: PaymentRequest) =>
    apiClient.post<PaymentInfo>(
      "/billing-service/api/v1/payments/request",
      data
    ),
  confirmPayment: (data: PaymentConfirmRequest) =>
    apiClient.post<PaymentInfo>(
      "/billing-service/api/v1/payments/confirm",
      data
    ),
  cancelPayment: (data: PaymentCancelRequest) =>
    apiClient.put<PaymentInfo>("/billing-service/api/v1/payments/cancel", data),
  failurePayment: (data: PaymentFailureRequest) =>
    apiClient.post<PaymentFailureInfo>(
      "/billing-service/api/v1/payments/failure",
      data
    ),
}
