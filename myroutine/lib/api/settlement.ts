import { apiClient, PageInfoDto } from "../api-client"

export interface SettlementListInfo {
  pageInfo: PageInfoDto
  settlementList: SettlementListDetailInfo[]
}

export interface SettlementListDetailInfo {
  settlementId: string
  targetYm: string // yyyy.MM
  status: string
  salesAmount: number
  feeRate: number
  feeAmount: number
  payoutAmount: number
  payoutDate: string // yyyy.MM.dd HH:mm:ss
}

export const settlementApi = {
  getSettlementHistory: (
    shopId: string,
    startDate: string,
    endDate: string,
    page = 0
  ) =>
    apiClient.get<SettlementListInfo>(
      `/settlement-service/api/v1/settlements/history`,
      {
        params: { shopId, startDate, endDate, page },
      }
    ),
}
