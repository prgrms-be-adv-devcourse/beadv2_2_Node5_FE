"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowDown, ArrowUp, Plus } from "lucide-react"
import {
} from "@/lib/api-client"
import { paymentApi, type PaymentInfo } from "@/lib/api/payment"
import {
  walletApi,
  type WalletDepositInfo,
  type WalletWithdrawInfo,
} from "@/lib/api/wallet"

interface Transaction {
  id: string
  type: "deposit" | "withdraw"
  amount: number
  description: string
  date: string
  status?: string
}

type TransactionFilter = "all" | "use" | "charge"

const PAGE_SIZE = 10
const PAYMENT_PAGE_SIZE = 10

const MOCK_BALANCE = 50000
const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "1",
    type: "deposit",
    amount: 50000,
    description: "충전",
    date: "2024-01-15",
  },
  {
    id: "2",
    type: "withdraw",
    amount: 8900,
    description: "상품 결제",
    date: "2024-01-14",
  },
  {
    id: "3",
    type: "withdraw",
    amount: 12900,
    description: "상품 결제",
    date: "2024-01-13",
  },
  {
    id: "4",
    type: "deposit",
    amount: 30000,
    description: "환불",
    date: "2024-01-10",
  },
]

export default function WalletTab() {
  const [balance, setBalance] = useState(MOCK_BALANCE)
  const [transactions, setTransactions] =
    useState<Transaction[]>(MOCK_TRANSACTIONS)
  const [isLoading, setIsLoading] = useState(false)
  const [isWalletLoading, setIsWalletLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [walletError, setWalletError] = useState<string | null>(null)
  const [filter, setFilter] = useState<TransactionFilter>("all")
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(MOCK_TRANSACTIONS.length)
  const [showChargeHistory, setShowChargeHistory] = useState(false)
  const [payments, setPayments] = useState<PaymentInfo[]>([])
  const [paymentPage, setPaymentPage] = useState(0)
  const [paymentTotal, setPaymentTotal] = useState(0)
  const [isPaymentLoading, setIsPaymentLoading] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  const mergeTransactions = (
    deposits: WalletDepositInfo[],
    withdraws: WalletWithdrawInfo[]
  ): Transaction[] => {
    const depositTransactions: Transaction[] = deposits.map((item) => ({
      id: `deposit-${item.id}`,
      type: "deposit",
      amount: item.amount,
      description: item.settlementId ? `정산 ${item.settlementId}` : "입금",
      date: item.createdAt || new Date().toISOString(),
    }))

    const withdrawTransactions: Transaction[] = withdraws.map((item) => ({
      id: `withdraw-${item.id}`,
      type: "withdraw",
      amount: item.amount,
      description: "출금/결제",
      date: item.createdAt || new Date().toISOString(),
    }))

    return [...depositTransactions, ...withdrawTransactions].sort((a, b) => {
      const dateA = new Date(a.date).getTime()
      const dateB = new Date(b.date).getTime()
      return dateB - dateA
    })
  }

  const formatDate = (date: string) => {
    const parsed = new Date(date)
    if (Number.isNaN(parsed.getTime())) return date
    return parsed.toISOString().slice(0, 10)
  }

  const getMockByFilter = (selectedFilter: TransactionFilter) => {
    if (selectedFilter === "charge")
      return MOCK_TRANSACTIONS.filter((tx) => tx.type === "deposit")
    if (selectedFilter === "use")
      return MOCK_TRANSACTIONS.filter((tx) => tx.type === "withdraw")
    return MOCK_TRANSACTIONS
  }

  const getPaymentStatusBadge = (status?: string) => {
    const normalized = status?.toLowerCase() || ""
    if (normalized.includes("confirm") || normalized.includes("success"))
      return "bg-green-100 text-green-700 border-green-200"
    if (normalized.includes("cancel"))
      return "bg-amber-100 text-amber-700 border-amber-200"
    if (normalized.includes("fail"))
      return "bg-red-100 text-red-700 border-red-200"
    if (normalized.includes("ready") || normalized.includes("pending"))
      return "bg-blue-100 text-blue-700 border-blue-200"
    return "bg-slate-100 text-slate-700 border-slate-200"
  }

  useEffect(() => {
    const fetchWallet = async () => {
      setIsWalletLoading(true)
      setWalletError(null)
      try {
        const wallet = await walletApi.getWallet()
        if (typeof wallet?.balance === "number") {
          setBalance(wallet.balance)
        } else {
          setBalance(MOCK_BALANCE)
        }
      } catch (err: any) {
        setWalletError(err?.message || "잔액을 불러오지 못했어요.")
        setBalance(MOCK_BALANCE)
      } finally {
        setIsWalletLoading(false)
      }
    }

    fetchWallet()
  }, [])

  useEffect(() => {
    const fetchTransactions = async (selectedFilter: TransactionFilter) => {
      setIsLoading(true)
      setError(null)
      try {
        const start = page * PAGE_SIZE
        const end = start + PAGE_SIZE
        let mergedTransactions: Transaction[] = []

        if (selectedFilter === "all") {
          const [deposits, withdraws] = await Promise.all([
            walletApi.getDeposits(0, PAGE_SIZE * (page + 1), "createdAt,desc"),
            walletApi.getWithdraws(0, PAGE_SIZE * (page + 1), "createdAt,desc"),
          ])

          mergedTransactions = mergeTransactions(
            deposits?.content || [],
            withdraws?.content || []
          )
          setTotalCount(
            (deposits?.totalElements || 0) + (withdraws?.totalElements || 0)
          )
        } else if (selectedFilter === "charge") {
          const deposits = await walletApi.getDeposits(
            page,
            PAGE_SIZE,
            "createdAt,desc"
          )
          mergedTransactions = mergeTransactions(deposits?.content || [], [])
          setTotalCount(deposits?.totalElements || mergedTransactions.length)
        } else {
          const withdraws = await walletApi.getWithdraws(
            page,
            PAGE_SIZE,
            "createdAt,desc"
          )
          mergedTransactions = mergeTransactions([], withdraws?.content || [])
          setTotalCount(withdraws?.totalElements || mergedTransactions.length)
        }

        if (mergedTransactions.length === 0) {
          setError("거래 내역을 불러오지 못했어요.")
          setTransactions(getMockByFilter(selectedFilter))
          setTotalCount(getMockByFilter(selectedFilter).length)
        } else {
          if (selectedFilter === "all") {
            if (mergedTransactions.length <= start && start > 0) {
              setPage(0)
              return
            }
            setTransactions(mergedTransactions.slice(start, end))
          } else {
            setTransactions(mergedTransactions)
          }
        }
      } catch (err: any) {
        setError(err?.message || "거래 내역을 불러오지 못했어요.")
        const mock = getMockByFilter(selectedFilter)
        setTransactions(
          mock.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)
        )
        setTotalCount(mock.length)
        if (page > 0 && mock.length <= page * PAGE_SIZE) {
          setPage(0)
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchTransactions(filter)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, page])

  const hasNext = (page + 1) * PAGE_SIZE < totalCount
  const hasPrev = page > 0
  const hasPaymentNext = (paymentPage + 1) * PAYMENT_PAGE_SIZE < paymentTotal
  const hasPaymentPrev = paymentPage > 0

  useEffect(() => {
    if (!showChargeHistory) return
    const fetchPayments = async () => {
      setIsPaymentLoading(true)
      setPaymentError(null)
      try {
        const res = await paymentApi.getPayments(
          paymentPage,
          PAYMENT_PAGE_SIZE,
          "createdAt,desc"
        )
        const items = res?.content || []
        setPayments(items)
        setPaymentTotal(res?.totalElements || items.length)
      } catch (err: any) {
        setPaymentError(err?.message || "충전 내역을 불러오지 못했어요.")
        setPayments([])
        setPaymentTotal(0)
      } finally {
        setIsPaymentLoading(false)
      }
    }
    fetchPayments()
  }, [showChargeHistory, paymentPage])

  return (
    <div className="space-y-8">
      {/* Balance Card */}
      <Card className="p-8 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
        <p className="text-muted-foreground mb-2">현재 잔액</p>
        <p className="text-5xl font-bold text-primary mb-6">
          ₩{balance.toLocaleString()}
        </p>
        {error && (
          <p className="text-sm text-red-600 mb-2">
            {error} (목업 데이터 표시 중)
          </p>
        )}
        {walletError && (
          <p className="text-sm text-red-600 mb-2">
            {walletError} (잔액 목업 표시 중)
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-2">
          <Link href="/wallet/charge" className="flex-1">
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2"
              disabled={isWalletLoading}
            >
              <Plus className="w-5 h-5" />
              충전하기
            </Button>
          </Link>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              setPaymentPage(0)
              setShowChargeHistory(true)
            }}
          >
            충전 내역 보기
          </Button>
        </div>
      </Card>

      {/* Transaction History */}
      <Card className="p-6 md:p-8">
        <h3 className="text-2xl font-bold text-foreground mb-6">거래 내역</h3>
        <div className="flex gap-2 mb-4">
          <Button
            size="sm"
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => {
              setFilter("all")
              setPage(0)
            }}
          >
            전체
          </Button>
          <Button
            size="sm"
            variant={filter === "use" ? "default" : "outline"}
            onClick={() => {
              setFilter("use")
              setPage(0)
            }}
          >
            사용
          </Button>
          <Button
            size="sm"
            variant={filter === "charge" ? "default" : "outline"}
            onClick={() => {
              setFilter("charge")
              setPage(0)
            }}
          >
            충전
          </Button>
        </div>
        {isLoading && (
          <p className="text-sm text-muted-foreground mb-4">
            거래 내역을 불러오는 중입니다...
          </p>
        )}
        {transactions.length === 0 && !isLoading ? (
          <p className="text-sm text-muted-foreground">
            표시할 거래 내역이 없습니다.
          </p>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-2 rounded-full ${
                      tx.type === "deposit"
                        ? "bg-green-100 text-green-600"
                        : "bg-red-100 text-red-600"
                    }`}
                  >
                    {tx.type === "deposit" ? (
                      <ArrowDown className="w-5 h-5" />
                    ) : (
                      <ArrowUp className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-foreground">
                      {tx.description}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(tx.date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {tx.status && (
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold border ${getPaymentStatusBadge(
                        tx.status
                      )}`}
                    >
                      {tx.status}
                    </span>
                  )}
                  <p
                    className={`font-bold text-lg ${
                      tx.type === "deposit" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {tx.type === "deposit" ? "+" : "-"}₩
                    {tx.amount.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-center gap-4 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
                disabled={!hasPrev || isLoading}
              >
                이전
              </Button>
              <span className="text-sm text-muted-foreground">
                페이지 {page + 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((prev) => prev + 1)}
                disabled={!hasNext || isLoading}
              >
                다음
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Charge History Modal */}
      {showChargeHistory && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4 gap-2">
                <h3 className="text-xl font-bold text-foreground">충전 내역</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowChargeHistory(false)}
                >
                  닫기
                </Button>
              </div>

              {isPaymentLoading && (
                <p className="text-sm text-muted-foreground mb-4">
                  충전 내역을 불러오는 중입니다...
                </p>
              )}
              {paymentError && (
                <p className="text-sm text-red-600 mb-4">{paymentError}</p>
              )}

              {payments.length === 0 && !isPaymentLoading ? (
                <p className="text-sm text-muted-foreground">
                  표시할 충전 내역이 없습니다.
                </p>
              ) : (
                <div className="space-y-3">
                  {payments.map((pay) => (
                    <div
                      key={pay.paymentKey || pay.orderId || pay.memberId}
                      className="flex items-center justify-between p-4 rounded-lg border border-border"
                    >
                      <div className="space-y-1">
                        <p className="font-bold text-foreground">
                          {pay.method ? `충전 (${pay.method})` : "충전"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(
                            pay.approvedAt ||
                              pay.requestedAt ||
                              new Date().toISOString()
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold border ${getPaymentStatusBadge(
                            pay.status
                          )}`}
                        >
                          {pay.status}
                        </span>
                        <p className="font-bold text-lg text-primary">
                          +₩{(pay.amount || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-center gap-4 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setPaymentPage((prev) => Math.max(prev - 1, 0))
                      }
                      disabled={!hasPaymentPrev || isPaymentLoading}
                    >
                      이전
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      페이지 {paymentPage + 1}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPaymentPage((prev) => prev + 1)}
                      disabled={!hasPaymentNext || isPaymentLoading}
                    >
                      다음
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
