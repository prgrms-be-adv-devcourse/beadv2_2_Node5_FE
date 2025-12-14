import { apiClient, type PageResponse } from "../api-client"
import type { MemberRole } from "./auth"

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
  accessToken: string
  memberRoles: MemberRole[]
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
  memberRoles: MemberRole[]
}

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
