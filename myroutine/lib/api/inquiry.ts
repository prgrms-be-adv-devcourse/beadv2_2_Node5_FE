import { apiClient, type PageResponse } from "../api-client"

export interface InquiryRegisterRequest {
  title: string
  inquiryCategory: InquiryCategory
  message: string
}

export enum InquiryCategory {
  PRODUCT = "PRODUCT",
  SUBSCRIPTION = "SUBSCRIPTION",
  SHIPPING = "SHIPPING",
  PAYMENT = "PAYMENT",
  ACCOUNT = "ACCOUNT",
  ETC = "ETC",
}

export interface InquiryListResponse {
  id: string
  title: string
  inquiryCategory: InquiryCategory
}

export interface InquiryInfoResponse {
  id: string
  memberId: string
  title: string
  inquiryCategory: InquiryCategory
  message: string
  createdAt: string
  modifiedAt: string
}

const BASE_PATH = "/member-service/api/v1/inquiries"

export const inquiryApi = {
  getMyInquiries: (page = 0, size = 10, sort = "createdAt,desc") =>
    apiClient.get<PageResponse<InquiryListResponse>>(BASE_PATH, {
      params: { page, size, sort },
    }),
  getInquiryDetail: (inquiryId: string) =>
    apiClient.get<InquiryInfoResponse>(`${BASE_PATH}/${inquiryId}`),
  createInquiry: (data: InquiryRegisterRequest) =>
    apiClient.post<void>(BASE_PATH, data),
  updateInquiry: (inquiryId: string, data: InquiryRegisterRequest) =>
    apiClient.put<void>(`${BASE_PATH}/${inquiryId}`, data),
  deleteInquiry: (inquiryId: string) =>
    apiClient.delete<void>(`${BASE_PATH}/${inquiryId}`),
}
