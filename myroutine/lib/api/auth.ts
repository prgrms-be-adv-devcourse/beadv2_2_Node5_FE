import { apiClient } from "../api-client"

export interface MemberInfo {
  id: string
  name: string
  status: string
  roles: MemberRole[]
}

export enum MemberRole {
  USER = "USER",
  SELLER = "SELLER",
  ADMIN = "ADMIN",
}

export interface LoginInfoResponse {
  memberInfo?: MemberInfo
  accessToken?: string
  refreshToken?: string
  temporaryToken?: string
}

export interface OAuthRegisterRequest {
  temporaryToken: string
  email: string
  name: string
  phoneNumber: string
  address: string
}

export const persistAuthPayload = (
  payload: {
    accessToken?: string
    refreshToken?: string
    memberInfo?: MemberInfo
    memberId?: string
    roles?: MemberRole[]
  },
  options: { emitEvent?: boolean } = {}
) => {
  if (typeof window === "undefined") return

  const { accessToken, refreshToken, memberInfo, memberId, roles } = payload

  if (accessToken) {
    apiClient.setAccessToken(accessToken)
    localStorage.setItem("accessToken", accessToken)
  }
  if (refreshToken) {
    localStorage.setItem("refreshToken", refreshToken)
  }
  const resolvedMemberId = memberInfo?.id || memberId
  if (resolvedMemberId) {
    localStorage.setItem("memberId", resolvedMemberId)
  }
  const resolvedRoles = memberInfo?.roles || roles
  if (resolvedRoles) {
    localStorage.setItem("memberRoles", JSON.stringify(resolvedRoles))
  }

  if (options.emitEvent !== false) {
    window.dispatchEvent(new Event("auth-changed"))
  }
}

export const authApi = {
  oauthLogin: (provider: string, providerCode: string, redirectUrl: string) =>
    apiClient.post<LoginInfoResponse>(
      "/member-service/api/v1/auth/oauth/login",
      {
        provider,
        providerCode,
        redirectUrl,
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
