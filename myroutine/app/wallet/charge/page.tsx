"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { paymentApi } from "@/lib/api/payment"
import Link from "next/link"

const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || ""

export default function WalletChargePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [amount, setAmount] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<
    "idle" | "processing" | "success" | "failure"
  >("idle")
  const [message, setMessage] = useState<string | null>(null)

  const loadTossPayments = async () => {
    if (typeof window === "undefined")
      throw new Error("브라우저 환경이 아닙니다.")
    if (!TOSS_CLIENT_KEY)
      throw new Error("NEXT_PUBLIC_TOSS_CLIENT_KEY가 없습니다.")

    if ((window as any).TossPayments) {
      return (window as any).TossPayments(TOSS_CLIENT_KEY)
    }

    await new Promise<void>((resolve, reject) => {
      const existing = document.querySelector(
        'script[src="https://js.tosspayments.com/v1"]'
      )
      if (existing) {
        existing.addEventListener("load", () => resolve())
        existing.addEventListener("error", () =>
          reject(new Error("TossPayments 스크립트 로드 실패"))
        )
        return
      }
      const script = document.createElement("script")
      script.src = "https://js.tosspayments.com/v1"
      script.async = true
      script.onload = () => resolve()
      script.onerror = () =>
        reject(new Error("TossPayments 스크립트 로드 실패"))
      document.body.appendChild(script)
    })

    if (!(window as any).TossPayments) {
      throw new Error("TossPayments 객체를 불러오지 못했습니다.")
    }
    return (window as any).TossPayments(TOSS_CLIENT_KEY)
  }

  useEffect(() => {
    const result = searchParams?.get("payment")
    if (!result) return

    const paymentKey = searchParams.get("paymentKey") || ""
    const orderId = searchParams.get("orderId") || ""
    const amountParam = searchParams.get("amount")
    const amountValue = amountParam ? Number(amountParam) : undefined
    const code = searchParams.get("code") || ""
    const failMessage = searchParams.get("message") || ""
    const rawPayload = JSON.stringify(
      Object.fromEntries(searchParams.entries())
    )

    const handleResult = async () => {
      setIsProcessing(true)
      setStatus("processing")
      try {
        if (result === "success") {
          if (!paymentKey || !orderId || !amountValue) {
            throw new Error("결제 확인 정보가 부족합니다.")
          }
          await paymentApi.confirmPayment({
            paymentKey,
            orderId,
            amount: amountValue,
          })
          setStatus("success")
          setMessage(null)
          router.push("/dashboard?tab=info")
        } else {
          await paymentApi.failurePayment({
            paymentKey,
            orderId,
            code: code || "UNKNOWN",
            message: failMessage || "결제 실패",
            amount: amountValue,
            rawPayload,
          })
          setStatus("failure")
          console.warn(
            "결제 실패:",
            failMessage || "결제 실패",
            "orderId=",
            orderId,
            "paymentKey=",
            paymentKey,
            "amount=",
            amountParam || ""
          )
          setMessage(null)
        }
      } catch (err: any) {
        setStatus("failure")
        setMessage(err?.message || "결제 결과 처리 실패")
      } finally {
        setIsProcessing(false)
      }
    }

    handleResult()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const handleCharge = async () => {
    if (!amount) return
    const parsedAmount = Number.parseInt(amount)
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) return

    setIsProcessing(true)
    setError(null)
    setStatus("processing")
    setMessage("결제창을 여는 중입니다...")

    try {
      const toss = await loadTossPayments()
      let orderId = `wallet-charge-${Date.now()}`
      const payment = await paymentApi.requestPayment({
        amount: parsedAmount,
      })
      orderId = payment?.orderId || orderId

      const successParams = new URLSearchParams({
        payment: "success",
        orderId,
        amount: String(parsedAmount),
      })
      const failParams = new URLSearchParams({
        payment: "failure",
        orderId,
        amount: String(parsedAmount),
      })

      await toss.requestPayment("CARD", {
        amount: parsedAmount,
        orderId,
        orderName: "예치금 충전",
        successUrl: `${
          window.location.origin
        }/wallet/charge?${successParams.toString()}`,
        failUrl: `${
          window.location.origin
        }/wallet/charge?${failParams.toString()}`,
      })
    } catch (err: any) {
      setStatus("failure")
      setError(err?.message || "충전 중 오류가 발생했습니다.")
      setMessage(err?.message || "충전 중 오류가 발생했습니다.")
      setIsProcessing(false)
    }
  }

  return (
    <main className="flex-1">
      <div className="container mx-auto px-4 py-10 max-w-2xl space-y-6">
        <Card className="p-6 md:p-8 space-y-4">
          <h1 className="text-3xl font-bold text-foreground">예치금 충전</h1>
          <p className="text-sm text-muted-foreground">
            금액을 입력하고 결제를 진행하세요.
          </p>

          {message && (
            <div
              className={`text-sm font-medium ${
                status === "success"
                  ? "text-green-600"
                  : status === "failure"
                  ? "text-red-600"
                  : "text-blue-600"
              }`}
            >
              {status === "processing" ? "결제 확인 중..." : message}
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-foreground mb-2">
                충전 금액
              </label>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="충전할 금액을 입력하세요"
                className="h-10"
              />
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">
                자주 사용하는 금액
              </p>
              <div className="grid grid-cols-4 gap-2">
                {[10000, 30000, 50000, 100000].map((preset) => (
                  <Button
                    key={preset}
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(preset.toString())}
                    className="text-xs"
                  >
                    {preset / 10000}만
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Link href="/dashboard?tab=info" className="flex-1">
                <Button variant="outline" className="w-full">
                  대시보드로
                </Button>
              </Link>
              <Button
                onClick={handleCharge}
                disabled={!amount || isProcessing}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {isProcessing ? "진행 중..." : "결제하기"}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </main>
  )
}
