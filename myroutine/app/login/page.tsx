"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)

  const handleOAuthLogin = (provider: string) => {
    setIsLoading(true)
    try {
      const redirectUri = `${window.location.origin}/auth/callback`
      const state = encodeURIComponent(provider) // provider를 state로 전달해 콜백에서 복원

      if (provider === "kakao") {
        const NEXT_PUBLIC_KAKAO_CLIENT_ID =
          process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID

        const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${NEXT_PUBLIC_KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(
          redirectUri
        )}&response_type=code&state=${state}&prompt=login`

        window.location.href = kakaoAuthUrl
      } else if (provider === "google") {
        const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
        const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(
          redirectUri
        )}&response_type=code&scope=email profile&state=${state}`

        window.location.href = googleAuthUrl
      } else if (provider === "naver") {
        const NAVER_CLIENT_ID = process.env.NEXT_PUBLIC_NAVER_CLIENT_ID
        const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${NAVER_CLIENT_ID}&redirect_uri=${encodeURIComponent(
          redirectUri
        )}&state=${state}&auth_type=reauthenticate`

        window.location.href = naverAuthUrl
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="p-8">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 mb-8 justify-center"
          >
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">
                M
              </span>
            </div>
            <span className="font-bold text-xl text-foreground">MyRoutine</span>
          </Link>

          {/* Title */}
          <h1 className="text-2xl font-bold text-foreground mb-2 text-center">
            시작하기
          </h1>
          <p className="text-muted-foreground text-center mb-8">
            로그인하거나 계정을 만드세요
          </p>

          {/* OAuth Login */}
          <div className="space-y-3">
            <Button
              onClick={() => handleOAuthLogin("kakao")}
              disabled={isLoading}
              className="w-full h-12 bg-yellow-400 hover:bg-yellow-500 text-black font-bold"
            >
              {isLoading ? "처리 중..." : "카카오로 시작"}
            </Button>
            <Button
              onClick={() => handleOAuthLogin("google")}
              disabled={isLoading}
              variant="outline"
              className="w-full h-12 font-bold"
            >
              {isLoading ? "처리 중..." : "Google로 시작"}
            </Button>
            <Button
              onClick={() => handleOAuthLogin("naver")}
              disabled={isLoading}
              variant="outline"
              className="w-full h-12 font-bold border-emerald-500 text-emerald-700 hover:bg-emerald-50"
            >
              {isLoading ? "처리 중..." : "네이버로 시작"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
