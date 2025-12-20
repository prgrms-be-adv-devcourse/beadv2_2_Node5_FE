import { apiClient, type PageResponse } from "../api-client"

export interface WalletInfo {
  id: string
  memberId: string
  balance: number
}

export interface WalletDepositInfo {
  id: string
  memberId: string
  settlementId: string
  amount: number
}

export interface WalletWithdrawInfo {
  id: string
  memberId: string
  orderId: string
  amount: number
  state: WalletWithdrawLogState
}

export enum WalletWithdrawLogState {
  PAID = "PAID",
  REFUNDED = "REFUNDED",
}

export const walletApi = {
  createWallet: () =>
    apiClient.post<WalletInfo>(`/billing-service/api/v1/wallets`),
  getWallet: () => apiClient.get<WalletInfo>(`/billing-service/api/v1/wallets`),
  getDeposits: (page = 0, size = 10, sort = "createdAt,desc") =>
    apiClient.get<PageResponse<WalletDepositInfo>>(
      `/billing-service/api/v1/wallets/deposits`,
      {
        params: { page, size, sort },
      }
    ),
  getWithdraws: (page = 0, size = 10, sort = "createdAt,desc") =>
    apiClient.get<PageResponse<WalletWithdrawInfo>>(
      `/billing-service/api/v1/wallets/withdraws`,
      {
        params: { page, size, sort },
      }
    ),
}
