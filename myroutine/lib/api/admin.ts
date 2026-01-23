import { apiClient, type PageResponse } from "../api-client"
import {
  InquiryListResponse,
  InquiryInfoResponse,
  InquiryStatus,
} from "./inquiry"

export interface RoleResponse {
  roles: MemberRole[]
}

export enum MemberRole {
  ADMIN = "ADMIN",
  USER = "USER",
  SELLER = "SELLER",
}

export enum MemberStatus {
  ACTIVE = "ACTIVE",
  BANNED = "BANNED",
  DELETED = "DELETED",
}

export interface MemberInfoAdminResponse {
  id: string
  name: string
  nickname: string
  email: string
  phoneNumber: string
  address: string
  roles: MemberRole[]
  status: MemberStatus
  createdAt: string
}

export interface EndPointInfoResponse {
  id: string
  role: MemberRole
  httpMethod: string
  pathPattern: string
}

export interface EndPointRequest {
  role: MemberRole
  httpMethod: string
  pathPattern: string
}

export interface MemberStatusResponse {
  statuses: MemberStatus[]
}

export interface InquiryAnswerRequest {
  message: string
}

export const memberServiceAdminApi = {
  getMemberRoles: () =>
    apiClient.get<RoleResponse>("/member-service/api/v1/admin/members/roles"),
  getMembers: (params?: { page?: number; size?: number; sort?: string }) =>
    apiClient.get<PageResponse<MemberInfoAdminResponse>>(
      "/member-service/api/v1/admin/members",
      { params }
    ),
  getMembersStatuses: () =>
    apiClient.get<MemberStatusResponse>(
      "/member-service/api/v1/admin/members/statuses"
    ),
  modifyMemberStatus: (id: string, status: MemberStatus) =>
    apiClient.patch<void>(`/member-service/api/v1/admin/members/${id}/status`, {
      status,
    }),
  getEndPoints: (params?: { page?: number; size?: number; sort?: string }) =>
    apiClient.get<PageResponse<EndPointInfoResponse>>(
      "/member-service/api/v1/admin/endpoints",
      { params }
    ),
  createEndPoint: (data: EndPointRequest) =>
    apiClient.post<void>("/member-service/api/v1/admin/endpoints", data),
  modifyEndPoint: (id: string, data: EndPointRequest) =>
    apiClient.put<void>(`/member-service/api/v1/admin/endpoints/${id}`, data),
  deleteEndPoint: (id: string) =>
    apiClient.delete<void>(`/member-service/api/v1/admin/endpoints/${id}`),
  getInquiryListForAdmin: (params?: {
    status?: InquiryStatus
    page?: number
    size?: number
    sort?: string
  }) =>
    apiClient.get<PageResponse<InquiryListResponse>>(
      "/member-service/api/v1/admin/inquiries",
      { params }
    ),
  getInquiryInfoForAdmin: (inquiryId: string) =>
    apiClient.get<InquiryInfoResponse>(
      `/member-service/api/v1/admin/inquiries/${inquiryId}`
    ),
  createInquiryAnswer: (inquiryId: string, data: InquiryAnswerRequest) =>
    apiClient.post<void>(
      `/member-service/api/v1/admin/inquiries/${inquiryId}/answer`,
      data
    ),
  modifyInquiryAnswer: (inquiryId: string, data: InquiryAnswerRequest) =>
    apiClient.put<void>(
      `/member-service/api/v1/admin/inquiries/${inquiryId}/answer`,
      data
    ),
  deleteInquiryAnswer: (inquiryId: string) =>
    apiClient.delete<void>(
      `/member-service/api/v1/admin/inquiries/${inquiryId}/answer`
    ),
}

export interface BatchExecutionRow {
  executionId: number
  jobName: string
  status: string
  startTime: string
  endTime: string
  exitCode: string
}

export interface BatchExecutionWithSteps {
  executionId: number
  jobName: string
  status: string
  startTime: string
  endTime: string
  exitCode: string
  steps: BatchStepExecutionRow[]
}

export interface BatchStepExecutionRow {
  stepName: string
  status: string
  readCount: number
  writeCount: number
  filterCount: number
  commitCount: number
  rollbackCount: number
  exitMessage: string
}

export const batchServiceAdminApi = {
  getJobNames: () =>
    apiClient.get<string[]>(`/support-service/api/v1/admin/batch/job-names`),
  getExecutions: (jobName: string, page: number, size: number) =>
    apiClient.get<PageResponse<BatchExecutionRow>>(
      `/support-service/api/v1/admin/batch/executions`,
      { params: { jobName, page, size } }
    ),
  getExecutionInfo: (executionId: number) =>
    apiClient.get<BatchExecutionWithSteps>(
      `/support-service/api/v1/admin/batch/executions/${executionId}`
    ),
}

export const productSponsorAdminApi = {
  markAsSponsored: (productId: string) =>
    apiClient.post<void>(
      `/support-service/admin/sponsored-products/${productId}`
    ),
  unmarkAsSponsored: (productId: string) =>
    apiClient.delete<void>(
      `/support-service/admin/sponsored-products/${productId}`
    ),
}
