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
  thumbnailUrl?: string
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
  thumbnailUrl: string
}

export interface ProductModifyRequest {
  name: string
  description: string
  price: number
  stock: number
  category: string // Todo: enum 으로 변경 고려
  thumbnailUrl: string
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
  fileName: string
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
  getProductListByShop: (
    shopId: string,
    params?: { page?: number; size?: number; sort?: string }
  ) =>
    apiClient.get<PageResponse<ProductInfoResponse>>(
      `/catalog-service/api/v1/shops/${shopId}/products`,
      { params }
    ),
  createProduct: (shopId: string, data: ProductRegisterRequest) =>
    apiClient.post(`/catalog-service/api/v1/shops/${shopId}/products`, data),
  updateProduct: (productId: string, data: ProductModifyRequest) =>
    apiClient.patch(
      `/catalog-service/api/v1/shops/products/${productId}`,
      data
    ),
  updateProductStatus: (productId: string, status: StatusRequest) =>
    apiClient.patch(
      `/catalog-service/api/v1/shops/products/${productId}/status`,
      status
    ),
  deleteProduct: (productId: string) =>
    apiClient.delete(`/catalog-service/api/v1/shops/products/${productId}`),
  getPresignedUrl: (data: ProductPresignedRequest) =>
    apiClient.post<ProductPresignedResponse>(
      `/catalog-service/api/v1/shops/products/images/presigned-url`,
      data
    ),
}

export interface ProductSearchResponse {
  productId: string | number
  shopId?: string | number
  name: string
  category?: string
  price: number | string
  thumbnailUrl?: string
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
    sort?: ProductSearchSort
    page?: number
    size?: number
  }) =>
    apiClient.get<PageResponse<ProductSearchResponse>>(
      "/catalog-service/api/v1/search/products",
      { params }
    ),
}
