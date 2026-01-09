import { apiClient, type PageResponse } from "../api-client"

export interface ProductInfoResponse {
  id?: string | number
  shopId?: string | number
  name: string
  description?: string
  price: number | string
  stock?: number | string
  status?: ProductStatus | string
  category: string
  thumbnailKey?: string
  createdAt?: string
  modifiedAt?: string
}

export interface ProductRegisterRequest {
  name: string
  description: string
  price: number
  stock: number
  status: ProductStatus
  category: string
  thumbnailKey: string
}

export interface ProductModifyRequest {
  name: string
  description: string
  price: number
  stock: number
  category: string // Todo: enum 으로 변경 고려
  thumbnailKey: string
}

export enum ProductStatus {
  ON_SALE = "ON_SALE",
  HIDDEN = "HIDDEN",
  DISCONTINUED = "DISCONTINUED",
}

export interface StatusRequest {
  status: ProductStatus
}

export interface ProductPresignedRequest {
  contentType: string
}

export interface ProductPresignedResponse {
  url: string
  key: string
}

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
}

export const sellerProductApi = {
  getMyShopProducts: (
    shopId: string,
    params?: { page?: number; size?: number; sort?: string }
  ) =>
    apiClient.get<PageResponse<ProductInfoResponse>>(
      `/catalog-service/api/v1/seller/shops/${shopId}/products`,
      { params }
    ),
  createProduct: (shopId: string, data: ProductRegisterRequest) =>
    apiClient.post(
      `/catalog-service/api/v1/seller/shops/${shopId}/products`,
      data
    ),
  updateProduct: (productId: string, data: ProductModifyRequest) =>
    apiClient.put(`/catalog-service/api/v1/seller/products/${productId}`, data),
  updateProductStatus: (productId: string, status: StatusRequest) =>
    apiClient.patch(
      `/catalog-service/api/v1/seller/products/${productId}/status`,
      status
    ),
  deleteProduct: (productId: string) =>
    apiClient.delete(`/catalog-service/api/v1/seller/products/${productId}`),
  getPresignedUrl: (data: ProductPresignedRequest) =>
    apiClient.post<ProductPresignedResponse>(
      `/catalog-service/api/v1/seller/products/images/presigned-urls`,
      data
    ),
}

export interface ProductSearchResponse {
  productId: string | number
  shopId?: string | number
  name: string
  category?: string
  price: number | string
  thumbnailKey?: string
  status?: string
  createdAt?: string
  createAt?: string
}

export enum ProductSearchSort {
  LATEST = "LATEST",
  LOW_PRICE = "LOW_PRICE",
  HIGH_PRICE = "HIGH_PRICE",
}

export const searchApi = {
  searchProducts: (params: {
    keyword?: string
    category?: string
    minPrice?: number
    maxPrice?: number
    shopId?: string
    searchSort?: ProductSearchSort
    page?: number
    size?: number
  }) =>
    apiClient.get<PageResponse<ProductSearchResponse>>(
      "/catalog-service/api/v1/products/search",
      { params }
    ),
}

export const autocompleteApi = {
  autocomplete: (params: { keyword: string }) =>
    apiClient.get<string[]>("/catalog-service/api/v1/products/autocomplete", {
      params,
    }),
}
