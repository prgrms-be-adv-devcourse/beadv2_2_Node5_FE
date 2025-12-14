import { apiClient } from "../api-client"

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
