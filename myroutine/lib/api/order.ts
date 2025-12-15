import { apiClient, PageInfoDto } from "../api-client"

export interface OrderCreateRequest {
  memberId: string
  orderType: OrderType
  subscriptionId?: string
  recipientName?: string
  recipientAddress?: number
  items: OrderItemRequest[]
}

export interface OrderItemRequest {
  productId: string
  name?: string
  imgUrl?: string
  unitPrice?: number
  quantity?: number
  totalPrice?: number
}

export enum OrderType {
  NORMAL = "NORMAL",
  SUBSCRIPTION = "SUBSCRIPTION",
}

export interface OrderCreateInfo {
  orderId: string
}

export enum OrderStatus {
  CREATED = "CREATED",
  CANCELED = "CANCELED",
  PAID = "PAID",
  PAYMENT_FAILED = "PAYMENT_FAILED",
  DELIVERY_ING = "DELIVERY_ING",
  DELIVERY_COMPLETED = "DELIVERY_COMPLETED",
  REFUND_PENDING = "REFUND_PENDING",
  REFUND_COMPLETED = "REFUND_COMPLETED",
}

export interface OrderListDetailInfo {
  orderId: string
  orderNum: string
  orderDate: string
  status: OrderStatus
  orderType: OrderType
  subscriptionId: string
  totalAmount: number
  orderedItems: OrderItemInfo[]
}

export interface OrderItemInfo {
  productId: string
  productName: string
  imgUrl: string
  unitPrice: number
  quantity: number
  totalPrice: number
}

export interface OrderListInfo {
  pageInfo: PageInfoDto
  orderList: OrderListDetailInfo[]
}

export interface OrderDetailInfo {
  orderId: string
  orderNum: string
  orderDate: string
  status: OrderStatus
  orderType: OrderType
  totalAmount: number
  orderedItems: OrderItemInfo[]
  deliveryInfo: DeliveryInfo
  paymentInfo: Payment
}

export interface DeliveryInfo {
  recipientName: string
  recipientAddress: string
}

export interface Payment {
  paidAmount: number
  transactionDate: string
}

export interface OrderStatusInfo {
  orderId: string
  status: OrderStatus
}

export const orderApi = {
  createOrder: (data: OrderCreateRequest) =>
    apiClient.post<OrderCreateInfo>("/order-service/api/v1/orders", data),
  getOrderList: (
    memberId: string,
    page = 0,
    size = 5,
    period: "3" | "6" | "12" = "3"
  ) =>
    apiClient.get<OrderListInfo>("/order-service/api/v1/orders", {
      params: { memberId, page, size, period },
    }),
  getOrderDetail: (orderId: string) =>
    apiClient.get<OrderDetailInfo>(`/order-service/api/v1/orders/${orderId}`),
  cancelOrder: (orderId: string, memberId: string) =>
    apiClient.patch<OrderStatusInfo>(
      `/order-service/api/v1/orders/${orderId}/cancel`,
      undefined,
      { params: { memberId } }
    ),
  refundOrder: (orderId: string, memberId: string) =>
    apiClient.patch<OrderStatusInfo>(
      `/order-service/api/v1/orders/${orderId}/refund`,
      undefined,
      { params: { memberId } }
    ),
}
