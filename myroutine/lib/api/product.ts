import { apiClient, type PageResponse } from "../api-client"

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
