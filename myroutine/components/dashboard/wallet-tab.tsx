"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowDown, ArrowUp, Plus, ChevronDown, ChevronUp } from "lucide-react"
import { paymentApi, type PaymentInfo, PaymentStatus } from "@/lib/api/payment"
import {
  walletApi,
  type WalletDepositInfo,
  type WalletWithdrawInfo,
} from "@/lib/api/wallet"
import { WalletConsentModal } from "./wallet-consent-modal"

interface Transaction {
  id: string
  type: "deposit" | "withdraw"
  amount: number
  description: string
  date?: string
  status?: string
}

type TransactionFilter = "all" | "use" | "charge"

const PAGE_SIZE = 10
const PAYMENT_PAGE_SIZE = 10

export default function WalletTab() {
  const router = useRouter()
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isWalletLoading, setIsWalletLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [walletError, setWalletError] = useState<string | null>(null)
  const [filter, setFilter] = useState<TransactionFilter>("all")
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [showChargeHistory, setShowChargeHistory] = useState(false)
  const [showWalletConsent, setShowWalletConsent] = useState(false)
  const [payments, setPayments] = useState<PaymentInfo[]>([])
  const [paymentPage, setPaymentPage] = useState(0)
  const [paymentTotal, setPaymentTotal] = useState(0)
  const [isPaymentLoading, setIsPaymentLoading] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)
  const [cancelingKey, setCancelingKey] = useState<string | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<PaymentInfo | null>(
    null
  )
  const [selectedPaymentError, setSelectedPaymentError] = useState<
    string | null
  >(null)
  const [walletNotFound, setWalletNotFound] = useState(false)
  const [isCreatingWallet, setIsCreatingWallet] = useState(false)

  const mergeTransactions = (
    deposits: Array<WalletDepositInfo & { createdAt?: string }>,
    withdraws: Array<WalletWithdrawInfo & { createdAt?: string }>
  ): Transaction[] => {
    const depositTransactions: Transaction[] = deposits.map((item) => ({
      id: `deposit-${item.id}`,
      type: "deposit",
      amount: item.amount,
      description: item.settlementId ? "정산" : "입금",
      date: item.createdAt,
    }))

    const withdrawTransactions: Transaction[] = withdraws.map((item) => ({
      id: `withdraw-${item.id}`,
      type: "withdraw",
      amount: item.amount,
      description: "결제",
      date: item.createdAt,
      status: item.state,
    }))

    return [...depositTransactions, ...withdrawTransactions].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0
      const dateB = b.date ? new Date(b.date).getTime() : 0
      return dateB - dateA
    })
  }

  const formatDate = (date?: string) => {
    if (!date) return "-"
    const parsed = new Date(date)
    if (Number.isNaN(parsed.getTime())) return date
    return parsed.toISOString().slice(0, 10)
  }

  const getPaymentStatusBadge = (status?: string) => {
    const normalized = status?.toLowerCase() || ""
    if (normalized.includes("confirm") || normalized.includes("success"))
      return "bg-green-100 text-green-700 border-green-200"
    if (normalized.includes("paid"))
      return "bg-green-100 text-green-700 border-green-200"
    if (normalized.includes("refund"))
      return "bg-amber-100 text-amber-700 border-amber-200"
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
      setWalletNotFound(false)
      try {
        const wallet = await walletApi.getWallet()
        if (typeof wallet?.balance === "number") {
          setBalance(wallet.balance)
        }
      } catch (err: any) {
        const isNotFoundError =
          err?.code === "WALLET_001" || err?.status === 404

        if (isNotFoundError) {
          setWalletNotFound(true)
          setWalletError(null)
        } else {
          setWalletError(err?.message || "잔액을 불러오지 못했어요.")
        }
        setBalance(0)
      } finally {
        setIsWalletLoading(false)
      }
    }

    fetchWallet()
  }, [])

  useEffect(() => {
    const fetchTransactions = async (selectedFilter: TransactionFilter) => {
      if (walletNotFound) {
        setTransactions([])
        setTotalCount(0)
        return
      }
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

        if (selectedFilter === "all") {
          if (mergedTransactions.length <= start && start > 0) {
            setPage(0)
            return
          }
          setTransactions(mergedTransactions.slice(start, end))
        } else {
          setTransactions(mergedTransactions)
        }
      } catch (err: any) {
        setError(err?.message || "거래 내역을 불러오지 못했어요.")
        setTransactions([])
        setTotalCount(0)
        if (page > 0) {
          setPage(0)
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchTransactions(filter)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, page, walletNotFound])

  const hasNext = (page + 1) * PAGE_SIZE < totalCount
  const hasPrev = page > 0
  const hasPaymentNext = (paymentPage + 1) * PAYMENT_PAGE_SIZE < paymentTotal
  const hasPaymentPrev = paymentPage > 0

  const handleCreateWallet = async () => {
    setIsCreatingWallet(true)
    setWalletError(null)
    try {
      const newWallet = await walletApi.createWallet()
      setBalance(newWallet?.balance ?? 0)
      setWalletNotFound(false)
    } catch (err: any) {
      setWalletError(
        err?.message || "지갑을 생성하지 못했어요. 잠시 후 다시 시도해주세요."
      )
    } finally {
      setIsCreatingWallet(false)
    }
  }

  const handleCharge = async () => {
    if (isWalletLoading) return
    if (walletError) {
      setWalletError(
        walletError ||
          "지갑 정보를 불러오지 못해 충전을 진행할 수 없습니다."
      )
      return
    }
    if (!walletNotFound) {
      router.push("/wallet/charge")
      return
    }

    setShowWalletConsent(true)
  }

  const handleConsentConfirm = async () => {
    setShowWalletConsent(false)
    await handleCreateWallet()
    if (!walletNotFound) router.push("/wallet/charge")
  }

  const handleConsentCancel = () => {
    setShowWalletConsent(false)
  }

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

  const refreshPayments = async (pageToLoad = paymentPage) => {
    setIsPaymentLoading(true)
    setPaymentError(null)
    try {
      const res = await paymentApi.getPayments(
        pageToLoad,
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

  const handleCancelPayment = async (pay: PaymentInfo) => {
    if (!pay.paymentKey || !pay.orderId || !pay.amount) {
      setSelectedPaymentError("취소할 결제 정보를 확인할 수 없습니다.")
      return
    }
    setSelectedPaymentError(null)
    setCancelingKey(pay.paymentKey)
    try {
      await paymentApi.cancelPayment({
        paymentKey: pay.paymentKey,
        orderId: pay.orderId,
        amount: String(pay.amount),
      })
      await refreshPayments()
      // 최신 데이터에서 다시 선택
      const updated = payments.find((p) => p.paymentKey === pay.paymentKey)
      setSelectedPayment(updated || null)
    } catch (err: any) {
      setSelectedPaymentError(err?.message || "환불 요청에 실패했습니다.")
    } finally {
      setCancelingKey(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* Balance Card */}
      <Card className="p-8 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20">
        <p className="text-muted-foreground mb-2">현재 잔액</p>
        <p className="text-5xl font-bold text-primary mb-6">
          ₩{balance.toLocaleString()}
        </p>
        {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
        {walletError && (
          <p className="text-sm text-red-600 mb-2">{walletError}</p>
        )}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-2"
            onClick={handleCharge}
            disabled={isWalletLoading || isCreatingWallet || !!walletError}
          >
            {!isCreatingWallet && <Plus className="w-5 h-5" />}
            {isCreatingWallet ? "지갑 생성 중..." : "충전하기"}
          </Button>
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

      {/* Settlement History */}
      <Card className="p-6 md:p-8">
        <h3 className="text-2xl font-bold text-foreground mb-6">예치금 내역</h3>
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
            정산
          </Button>
        </div>
        {isLoading && (
          <p className="text-sm text-muted-foreground mb-4">
            예치금 내역을 불러오는 중입니다...
          </p>
        )}
        {transactions.length === 0 && !isLoading ? (
          <p className="text-sm text-muted-foreground">
            표시할 예치금 내역이 없습니다.
          </p>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => {
              const isRefunded =
                tx.status?.toLowerCase().includes("refund") ?? false
              return (
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
                      <p
                        className={`font-bold text-foreground ${
                          isRefunded ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {tx.description}
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
                    <div className="flex items-center gap-2">
                      <p
                        className={`font-bold text-lg ${
                          isRefunded
                            ? "text-muted-foreground line-through"
                            : tx.type === "deposit"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {tx.type === "deposit" ? "+" : "-"}₩
                        {tx.amount.toLocaleString()}
                      </p>
                      {isRefunded && (
                        <span className="text-sm font-semibold text-green-600">
                          +₩{tx.amount.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
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
                  {payments.map((pay) => {
                    const isSelected =
                      selectedPayment?.paymentKey === pay.paymentKey &&
                      selectedPayment?.orderId === pay.orderId
                    return (
                      <div
                        key={pay.paymentKey || pay.orderId || pay.memberId}
                        className="border border-border rounded-lg"
                      >
                        <button
                          className={`w-full text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 ${
                            isSelected
                              ? "bg-muted/40 border-b border-border"
                              : "hover:border-primary/60 hover:bg-muted/30"
                          }`}
                          onClick={() => {
                            setSelectedPayment(isSelected ? null : pay)
                            setSelectedPaymentError(null)
                          }}
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
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <span>{isSelected ? "접기" : "더보기"}</span>
                              {isSelected ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </div>
                          </div>
                        </button>
                        {isSelected && (
                          <div className="p-4 border-t border-border bg-muted/30 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-muted-foreground">금액</p>
                                <p className="font-semibold text-primary">
                                  ₩{(pay.amount || 0).toLocaleString()}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">
                                  요청 시각
                                </p>
                                <p className="font-semibold text-foreground">
                                  {formatDate(
                                    pay.requestedAt || new Date().toISOString()
                                  )}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">
                                  승인 시각
                                </p>
                                <p className="font-semibold text-foreground">
                                  {pay.approvedAt
                                    ? formatDate(pay.approvedAt)
                                    : "-"}
                                </p>
                              </div>
                              {pay.failReason && (
                                <div className="sm:col-span-2">
                                  <p className="text-muted-foreground">
                                    실패 사유
                                  </p>
                                  <p className="font-semibold text-red-600">
                                    {pay.failReason}
                                  </p>
                                </div>
                              )}
                            </div>
                            {pay.status === PaymentStatus.CONFIRMED && (
                              <div className="flex flex-col gap-2">
                                {selectedPaymentError && (
                                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                                    {selectedPaymentError}
                                  </p>
                                )}
                                <Button
                                  variant="outline"
                                  onClick={() => handleCancelPayment(pay)}
                                  disabled={cancelingKey === pay.paymentKey}
                                  className="self-start"
                                >
                                  {cancelingKey === pay.paymentKey
                                    ? "환불 요청 중..."
                                    : "환불 요청"}
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
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

      <WalletConsentModal
        open={showWalletConsent}
        loading={isCreatingWallet}
        onConfirm={handleConsentConfirm}
        onCancel={handleConsentCancel}
      />
    </div>
  )
}
