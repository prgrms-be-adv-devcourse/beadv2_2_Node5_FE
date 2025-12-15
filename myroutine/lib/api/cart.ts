import { apiClient, type PageResponse } from "../api-client"

export interface CartItemInfo {
  id: string
  productId: string
  thumbnailUrl: string // 상품 이미지
  name: string // 상품 이름
  price: string // 상품 가격
  quantity: number
  createdAt: string
  modifiedAt: string
}

export interface CartItemRequest {
  productId: string
  quantity: number
}

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
