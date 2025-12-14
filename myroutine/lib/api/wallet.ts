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
  createdAt: string
}

export interface WalletWithdrawInfo {
  id: string
  memberId: string
  amount: number
  createdAt: string
}

export const walletApi = {
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
