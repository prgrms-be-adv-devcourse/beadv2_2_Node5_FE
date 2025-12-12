const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

export interface ExceptionResponse {
  code: string
  message: string
}

export interface PageResponse<T> {
  content: T[]
  pageable: any
  last: boolean
  totalPages: number
  totalElements: number
  size: number
  number: number
  sort: any
  first: boolean
  numberOfElements: number
  empty: boolean
}

class ApiClient {
  private baseUrl: string
  private accessToken: string | null = null
  private isRefreshing = false

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  setAccessToken(token: string) {
    this.accessToken = token
  }

  clearAccessToken() {
    this.accessToken = null
  }

  private getStoredToken(key: string) {
    if (typeof window === "undefined") return null
    return localStorage.getItem(key)
  }

  private setStoredToken(key: string, value: string) {
    if (typeof window === "undefined") return
    localStorage.setItem(key, value)
  }

  private async refreshAccessToken(): Promise<string | null> {
    if (this.isRefreshing) return null
    if (typeof window === "undefined") return null
    const refreshToken = this.getStoredToken("refreshToken")
    if (!refreshToken) return null

    this.isRefreshing = true
    try {
      const response = await fetch(
        `${this.baseUrl}/member-service/api/v1/auth/refresh-token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken }),
        }
      )

      const text = await response.text()
      const data = text ? JSON.parse(text) : null

      if (!response.ok || !data?.accessToken) {
        return null
      }

      this.setAccessToken(data.accessToken)
      this.setStoredToken("accessToken", data.accessToken)
      if (data.refreshToken) {
        this.setStoredToken("refreshToken", data.refreshToken)
      }

      return data.accessToken
    } catch (err) {
      return null
    } finally {
      this.isRefreshing = false
    }
  }

  private async request<T>(
    method: string,
    endpoint: string,
    options?: {
      body?: any
      params?: Record<string, any>
      headers?: Record<string, string>
    }
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`)

    // Add query parameters
    if (options?.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          url.searchParams.append(key, String(value))
        }
      })
    }

    const doRequest = async (token?: string) => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options?.headers ?? {}),
      }

      if (token && !headers.Authorization) {
        headers["Authorization"] = `Bearer ${token}`
      }

      const response = await fetch(url.toString(), {
        method,
        headers,
        body: options?.body ? JSON.stringify(options.body) : undefined,
      })

      const text = await response.text()
      const data = text ? JSON.parse(text) : null

      return { response, data }
    }

    let token =
      this.accessToken || this.getStoredToken("accessToken") || undefined
    let hasRetried = false

    while (true) {
      const { response, data } = await doRequest(token)

      if (response.ok) {
        return data as T
      }

      if (response.status === 401 && !hasRetried) {
        const newToken = await this.refreshAccessToken()
        hasRetried = true
        if (newToken) {
          token = newToken
          continue
        }
      }

      throw {
        code: data?.code || "UNKNOWN_ERROR",
        message: data?.message || "An error occurred",
      } as ExceptionResponse
    }
  }

  async get<T>(
    endpoint: string,
    options?: { params?: Record<string, any>; headers?: Record<string, string> }
  ): Promise<T> {
    return this.request<T>("GET", endpoint, options)
  }

  async post<T>(
    endpoint: string,
    body?: any,
    options?: { params?: Record<string, any>; headers?: Record<string, string> }
  ): Promise<T> {
    return this.request<T>("POST", endpoint, { body, ...options })
  }

  async put<T>(
    endpoint: string,
    body?: any,
    options?: { params?: Record<string, any>; headers?: Record<string, string> }
  ): Promise<T> {
    return this.request<T>("PUT", endpoint, { body, ...options })
  }

  async patch<T>(
    endpoint: string,
    body?: any,
    options?: { params?: Record<string, any>; headers?: Record<string, string> }
  ): Promise<T> {
    return this.request<T>("PATCH", endpoint, { body, ...options })
  }

  async delete<T>(
    endpoint: string,
    options?: { params?: Record<string, any>; headers?: Record<string, string> }
  ): Promise<T> {
    return this.request<T>("DELETE", endpoint, options)
  }
}

export const apiClient = new ApiClient(API_BASE_URL)

export interface LoginInfoResponse {
  accessToken?: string
  refreshToken?: string
  id?: string
  memberName?: string
  memberStatus?: string
  loginStatus?: string
  temporaryToken?: string
}
export interface OAuthRegisterRequest {
  temporaryToken: string
  email: string
  name: string
  phoneNumber: string
  address: string
}

// Auth API
export const authApi = {
  oauthLogin: (provider: string, providerCode: string) =>
    apiClient.post<LoginInfoResponse>(
      "/member-service/api/v1/auth/oauth/login",
      {
        provider,
        providerCode,
      }
    ),
  oauthRegister: (data: OAuthRegisterRequest) =>
    apiClient.post<LoginInfoResponse>(
      "/member-service/api/v1/auth/oauth/register",
      data
    ),
  sendEmailVerification: (email: string, temporaryToken?: string) =>
    apiClient.post<void>("/member-service/api/v1/auth/email/send", {
      email,
      ...(temporaryToken && { temporaryToken }),
    }),
  verifyEmail: (email: string, verificationCode: string) =>
    apiClient.post<void>("/member-service/api/v1/auth/email/verify", {
      email,
      verificationCode,
    }),
  logout: () => apiClient.post<void>("/member-service/api/v1/auth/logout"),
}

export interface MemberInfoResponse {
  id: string
  name: string
  email: string
  phoneNumber: string
  address: string
}

export interface MemberModifyRequest {
  name: string
  phoneNumber: string
  address: string
}

// Member API
export const memberApi = {
  getMe: () =>
    apiClient.get<MemberInfoResponse>("/member-service/api/v1/members/me"),
  updateMe: (data: MemberModifyRequest) =>
    apiClient.put<MemberInfoResponse>(
      "/member-service/api/v1/members/me",
      data
    ),
  deleteMe: () => apiClient.delete("/member-service/api/v1/members/me"),
}

export interface ProductInfoResponse {
  id: string
  shopId: string
  name: string
  description: string
  price: number
  stock: number
  status: string
  category: string
  thumbnailUrl: string
  createdAt: string
  modifiedAt: string
}

export interface ProductCreateRequest {
  shopId: string
  name: string
  description: string
  price: number
  stock: number
  status: string
  category: string
  thumbnailUrl: string
}

export interface StatusRequest {
  status: string
}

export interface ProductPresignedRequest {
  fileName: string
  contentType: string
}

export interface ProductPresignedResponse {
  url: string
  key: string
}

// Product API
export const productApi = {
  getProductList: (params?: { page?: number; size?: number; sort?: string }) =>
    apiClient.get<PageResponse<ProductInfoResponse>>(
      `/catalog-service/api/v1/products`,
      { params }
    ),
  getProductDetail: (id: string) =>
    apiClient.get<ProductInfoResponse>(
      `/catalog-service/api/v1/products/${id}`
    ),
  createProduct: (data: ProductCreateRequest) =>
    apiClient.post("/catalog-service/api/v1/products", data),
  updateProduct: (id: string, data: Partial<ProductCreateRequest>) =>
    apiClient.patch(`/catalog-service/api/v1/products/${id}`, data),
  updateProductStatus: (id: string, status: StatusRequest) =>
    apiClient.patch(`/catalog-service/api/v1/products/${id}/status`, status),
  deleteProduct: (id: string) =>
    apiClient.delete(`/catalog-service/api/v1/products/${id}`),
  getPresignedUrl: (data: ProductPresignedRequest) =>
    apiClient.post<ProductPresignedResponse>(
      `/catalog-service/api/v1/products/presigned-url`,
      data
    ),
}

export interface ProductSearchResponse {
  productId: string
  name: string
  category: string
  price: number
  thumbnailUrl: string
  status: string
  createAt: string
}

// Search API
export const searchApi = {
  searchProducts: (params: {
    keyword?: string
    category?: string
    minPrice?: number
    maxPrice?: number
    sort?: string
    page?: number
    size?: number
  }) =>
    apiClient.get<PageResponse<ProductSearchResponse>>(
      "/catalog-service/api/v1/search/products",
      { params }
    ),
}

export interface CartItemInfo {
  id: string
  memberId: string
  productId: string
  quantity: number
  createdAt: string
  modifiedAt: string
}

export interface CartItemRequest {
  productId: string
  quantity: number
}

// Cart API
export const cartApi = {
  getCart: () =>
    apiClient.get<PageResponse<CartItemInfo>>("/catalog-service/api/v1/carts"),
  addToCart: (data: CartItemRequest) =>
    apiClient.post<CartItemInfo>("/catalog-service/api/v1/carts", data),
  updateCartItem: (cartItemId: string, quantity: number) =>
    apiClient.patch<CartItemInfo>(
      `/catalog-service/api/v1/carts/${cartItemId}`,
      {
        quantity,
      }
    ),
  removeCartItem: (cartItemId: string) =>
    apiClient.delete(`/catalog-service/api/v1/carts/${cartItemId}`),
  clearCart: () => apiClient.delete("/catalog-service/api/v1/carts"),
}

export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7

export const DAY_OF_WEEK_OPTIONS: {
  id: DayOfWeek
  key: string
  label: string
}[] = [
  { id: 1, key: "MON", label: "월" },
  { id: 2, key: "TUE", label: "화" },
  { id: 3, key: "WED", label: "수" },
  { id: 4, key: "THU", label: "목" },
  { id: 5, key: "FRI", label: "금" },
  { id: 6, key: "SAT", label: "토" },
  { id: 7, key: "SUN", label: "일" },
]

export const formatDaysOfWeek = (days: DayOfWeek[]) =>
  days
    .slice()
    .sort((a, b) => a - b)
    .map(
      (day) =>
        DAY_OF_WEEK_OPTIONS.find((opt) => opt.id === day)?.label ?? String(day)
    )
    .join(", ")

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
  pricePerItem: number
  quantity: number
  deliveryAddress: string
  recurrenceType: RecurrenceType
  dayOfWeek?: DayOfWeek[]
  dayOfMonth?: number
}

// Subscription API
export const subscriptionApi = {
  getSubscription: (id: string) =>
    apiClient.get<SubscriptionInfo>(
      `/subscription-service/api/v1/subscriptions/${id}`
    ),
  getSubscriptions: (page = 0, size = 10, sort = "createdAt,desc") =>
    apiClient.get<PageResponse<SubscriptionInfo>>(
      "/subscription-service/api/v1/subscriptions",
      {
        params: { page, size, sort },
      }
    ),
  createSubscription: (data: SubscriptionCreateRequest) =>
    apiClient.post<SubscriptionInfo>(
      "/subscription-service/api/v1/subscriptions",
      data
    ),
  updateSubscription: (id: string, data: SubscriptionUpdateRequest) =>
    apiClient.put<SubscriptionInfo>(
      `/subscription-service/api/v1/subscriptions/${id}`,
      data
    ),
  pauseSubscription: (id: string) =>
    apiClient.patch<SubscriptionInfo>(
      `/subscription-service/api/v1/subscriptions/${id}/pause`
    ),
  resumeSubscription: (id: string) =>
    apiClient.put<SubscriptionInfo>(
      `/subscription-service/api/v1/subscriptions/${id}/resume`
    ),
  cancelSubscription: (id: string) =>
    apiClient.delete<SubscriptionInfo>(
      `/subscription-service/api/v1/subscriptions/${id}`
    ),
}

export interface ShopListResponse {
  shopId: string
  shopName: string
}

export interface ShopInfoResponse {
  id: string
  shopName: string
  shopEmail: string
  shopPhoneNumber: string
  shopAddress: string
}

export interface ShopRegisterResponse {
  shopId: string
  accessToken: string
}

export interface ShopRegisterRequest {
  shopEmail: string
  shopName: string
  shopPhoneNumber: string
  shopRegistrationNumber: string
  shopAddress: string
}

export interface ShopModifyRequest {
  shopEmail: string
  shopName: string
  shopPhoneNumber: string
  shopAddress: string
}

export interface ShopDeleteResponse {
  accessToken: string
}

// Shop API
export const shopApi = {
  getMyShops: (page = 0, size = 5, sort = "createdAt,desc") =>
    apiClient.get<PageResponse<ShopListResponse>>(
      "/shop-service/api/v1/shops",
      {
        params: { page, size, sort },
      }
    ),
  getMyShopDetail: (id: string) =>
    apiClient.get<ShopInfoResponse>(`/shop-service/api/v1/shops/${id}`),
  createShop: (data: ShopRegisterRequest) =>
    apiClient.post<ShopRegisterResponse>("/shop-service/api/v1/shops", data),
  modifyShop: (id: string, data: ShopModifyRequest) =>
    apiClient.put<ShopInfoResponse>(`/shop-service/api/v1/shops/${id}`, data),
  deleteShop: (id: string) =>
    apiClient.delete<ShopDeleteResponse>(`/shop-service/api/v1/shops/${id}`),
}

export interface WalletInfo {
  id: string
  memberId: string
  balance: number
}

export interface WalletDepositInfo {
  id: string
  memberId: string
  settlementId: string
  amount: number
  createdAt: string
}

export interface WalletWithdrawInfo {
  id: string
  memberId: string
  amount: number
  createdAt: string
}

// Wallet API
export const walletApi = {
  getWallet: () => apiClient.get<WalletInfo>(`/billing-service/api/v1/wallets`),
  getDeposits: (page = 0, size = 10, sort = "createdAt,desc") =>
    apiClient.get<PageResponse<WalletDepositInfo>>(
      `/billing-service/api/v1/wallets/deposits`,
      {
        params: { page, size, sort },
      }
    ),
  getWithdraws: (page = 0, size = 10, sort = "createdAt,desc") =>
    apiClient.get<PageResponse<WalletWithdrawInfo>>(
      `/billing-service/api/v1/wallets/withdraws`,
      {
        params: { page, size, sort },
      }
    ),
}

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

// Payment API
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

// Order API
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

export interface PageInfoDto {
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export enum OrderStatus {
  CREATED,
  CANCELED,
  PAID,
  PAYMENT_FAILED,
  DELIVERY_ING,
  DELIVERY_COMPLETED,
  REFUND_PENDING,
  REFUND_COMPLETED,
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
