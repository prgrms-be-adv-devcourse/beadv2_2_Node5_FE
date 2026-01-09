import { apiClient, type PageResponse } from "../api-client"

export interface WalletInfo {
  id: string
  memberId: string
  balance: number
}

export interface WalletLogInfo {
  type: WalletTransactionLogType
  amount: number
  balanceAfter: number
  status: WalletTransactionLogStatus
  createdAt: string
}

export enum WalletTransactionLogType {
  ORDER = "ORDER",
  ORDER_REFUND = "ORDER_REFUND",
  SETTLEMENT = "SETTLEMENT",
  TRANSFER = "TRANSFER",
  CHARGE = "CHARGE",
  CHARGE_CANCEL = "CHARGE_CANCEL",
}

export enum WalletTransactionLogStatus {
  COMPLETED = "COMPLETED",
  REFUNDED = "REFUNDED",
  CANCELED = "CANCELED",
}

export interface WalletTransferRequest {
  toAccountNo: string
  transferAmount: string
}

export interface WalletTransferInfo {
  ammount: number
  transactionId: string
  message: string
  requestedAt: string
  approvedAt: string
}

export const walletApi = {
  createWallet: () =>
    apiClient.post<WalletInfo>(`/billing-service/api/v1/wallets`),
  getWallet: () => apiClient.get<WalletInfo>(`/billing-service/api/v1/wallets`),
  getTransactionLogs: (page = 0, size = 10, sort = "createdAt,desc") =>
    apiClient.get<PageResponse<WalletLogInfo>>(
      `/billing-service/api/v1/wallets/transactions/all`,
      {
        params: { page, size, sort },
      }
    ),
  getDepositLogs: (page = 0, size = 10, sort = "createdAt,desc") =>
    apiClient.get<PageResponse<WalletLogInfo>>(
      `/billing-service/api/v1/wallets/transactions/deposits`,
      {
        params: { page, size, sort },
      }
    ),
  getWithdraws: (page = 0, size = 10, sort = "createdAt,desc") =>
    apiClient.get<PageResponse<WalletLogInfo>>(
      `/billing-service/api/v1/wallets/transactions/withdraws`,
      {
        params: { page, size, sort },
      }
    ),
  transferWallet: (data: WalletTransferRequest) =>
    apiClient.post<WalletTransferInfo>(
      `/billing-service/api/v1/wallets/transfer`,
      data
    ),
}
