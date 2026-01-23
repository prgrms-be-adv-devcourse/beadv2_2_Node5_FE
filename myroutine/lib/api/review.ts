import { apiClient, type PageResponse } from "../api-client"

export interface ReviewCreateRequest {
  productId: string
  orderId: string
  rating: number
  body: string
}

export interface ReviewIdInfo {
  id: string
}

export interface ReviewStatisticInfo {
  id: string
  productId: string
  averageRating: number
  reviewCount: number
  ratingCount1: number
  ratingCount2: number
  ratingCount3: number
  ratingCount4: number
  ratingCount5: number
}

export interface ReviewDetailInfo {
  reviewId: string
  productId: string
  nickname: string
  rating: number
  body: string
  likeCount: number
  createdAt: string
}

export interface ReviewModifyRequest {
  rating: number
  body: string
}

export interface ReviewSummaryInfoResponse {
  summerizedAt: string
  summary: string
}

export interface ReviewStatusInfo {
  reviewed: boolean
}

export interface ReviewStatusRequest {
  orderId: string
  productId: string
}

export const reviewApi = {
  createReview: (data: ReviewCreateRequest) =>
    apiClient.post<ReviewIdInfo>("/support-service/api/v1/reviews", data),
  getReviewStatistic: (productId: string) =>
    apiClient.get<ReviewStatisticInfo>(
      `/support-service/api/v1/reviews/static/${productId}`
    ),
  getReviewsDetail: (
    productId: string,
    orderBy: string,
    page?: number,
    size?: number
  ) =>
    apiClient.get<PageResponse<ReviewDetailInfo>>(
      `/support-service/api/v1/reviews/detail/${productId}`,
      { params: { page, size, orderBy } }
    ),
  modifyReview: (reviewId: string, data: ReviewModifyRequest) =>
    apiClient.put<ReviewIdInfo>(
      `/support-service/api/v1/reviews/${reviewId}`,
      data
    ),
  deleteReview: (reviewId: string) =>
    apiClient.delete<void>(`/support-service/api/v1/reviews/${reviewId}`),
  getMyReviews: () =>
    apiClient.get<PageResponse<ReviewDetailInfo>>(
      `/support-service/api/v1/reviews/my`
    ),
  getReviewSummary: (productId: string) =>
    apiClient.get<ReviewSummaryInfoResponse>(
      "/support-service/api/v1/review-summaries",
      { params: { productId } }
    ),
  likeReview: (reviewId: string) =>
    apiClient.post<void>(`/support-service/api/v1/reviews/${reviewId}/like`),
  checkReviewableProduct: (data: ReviewStatusRequest) =>
    apiClient.get<ReviewStatusInfo>(
      `/support-service/api/v1/reviews/reviewable`,
      { params: data }
    ),
}
