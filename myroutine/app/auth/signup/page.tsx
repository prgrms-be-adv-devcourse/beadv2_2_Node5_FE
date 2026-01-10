"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import AddressSearchInput from "@/components/address-search-input"
import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { authApi, persistAuthPayload } from "@/lib/api/auth"

type SignupStep = "email-verify" | "profile"

export default function SignupPage() {
  const router = useRouter()
  const [step, setStep] = useState<SignupStep>("email-verify")
  const [isLoading, setIsLoading] = useState(false)

  const [temporaryToken, setTemporaryToken] = useState<string | null>(null)

  // Email verification state
  const [email, setEmail] = useState("")
  const [verificationCode, setVerificationCode] = useState("")
  const [codeRequested, setCodeRequested] = useState(false)
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [verificationError, setVerificationError] = useState("")

  // Profile state
  const [name, setName] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [address, setAddress] = useState("")
  const [addressDetail, setAddressDetail] = useState("")
  const [profileError, setProfileError] = useState("")

  useEffect(() => {
    const tempToken = sessionStorage.getItem("temporaryToken")

    if (!tempToken) {
      router.push("/login")
      return
    }

    setTemporaryToken(tempToken)
  }, [router])

  const handleSendVerificationCode = async () => {
    if (!email) {
      setEmailError("이메일을 입력하세요")
      return
    }

    setIsLoading(true)
    setEmailError("")
    try {
      await authApi.sendEmailVerification(email, temporaryToken || undefined)
      alert("인증 코드가 이메일로 전송되었습니다!")
      setCodeRequested(true)
    } catch (error: any) {
      setEmailError(error.message || "인증 코드 발송에 실패했습니다.")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyEmail = async () => {
    if (!verificationCode) {
      setVerificationError("인증 코드를 입력하세요")
      return
    }

    setIsLoading(true)
    setVerificationError("")
    try {
      await authApi.verifyEmail(email, verificationCode)
      setIsEmailVerified(true)
      setCodeRequested(false)
    } catch (error: any) {
      setVerificationError(error.message || "인증에 실패했습니다.")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !phoneNumber || !address) {
      setProfileError("모든 필드를 입력하세요")
      return
    }

    if (!temporaryToken) {
      setProfileError("OAuth 정보가 없습니다")
      return
    }

    setIsLoading(true)
    setProfileError("")
    try {
      const fullAddress = addressDetail.trim()
        ? `${address} ${addressDetail.trim()}`
        : address
      const response = await authApi.oauthRegister({
        temporaryToken,
        email,
        name,
        phoneNumber,
        address: fullAddress,
      })

      // <CHANGE> 토큰 저장 후 대시보드로 이동
      if (!response.accessToken) {
        throw new Error("accessToken이 응답에 없습니다.")
      }

      persistAuthPayload({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        memberInfo: response.memberInfo,
      })

      // sessionStorage 정리
      sessionStorage.removeItem("temporaryToken")

      router.push("/")
    } catch (error: any) {
      setProfileError(error.message || "회원가입에 실패했습니다.")
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!temporaryToken) {
    return null
  }

  return (
    <main className="flex-1 flex items-start md:items-center justify-center p-4 pt-10 md:pt-4">
      <Card className="w-full max-w-md">
        <div className="p-6 md:p-8">
          <Link
            href="/"
            className="flex items-center gap-2 mb-6 justify-center"
          >
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">
                M
              </span>
            </div>
            <span className="font-bold text-xl text-foreground">MyRoutine</span>
          </Link>

          <h1 className="text-2xl font-bold text-foreground mb-2 text-center">
            회원가입
          </h1>
          <p className="text-muted-foreground text-center mb-6">
            구독을 시작하기 위해 계정을 완성하세요
          </p>

          {/* Email Verification Step */}
          {step === "email-verify" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                연결할 이메일을 입력하세요
              </p>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-bold text-foreground mb-2"
                >
                  이메일
                </label>
                <div className="flex gap-2">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setEmailError("")
                      setVerificationCode("")
                      setVerificationError("")
                      setIsEmailVerified(false)
                      setCodeRequested(false)
                    }}
                    placeholder="your@email.com"
                    className="h-10 flex-1"
                    disabled={isEmailVerified}
                  />
                  <Button
                    type="button"
                    onClick={handleSendVerificationCode}
                    disabled={isLoading || !email || isEmailVerified}
                    variant="outline"
                    className="h-10 px-4 font-bold bg-transparent"
                  >
                    인증
                  </Button>
                </div>
                {emailError && (
                  <p className="text-sm text-red-600 mt-1">{emailError}</p>
                )}
              </div>

              {email && codeRequested && !isEmailVerified && (
                <div>
                  <label
                    htmlFor="verification"
                    className="block text-sm font-bold text-foreground mb-2"
                  >
                    인증 코드
                  </label>
                  <div className="flex gap-2">
                    <Input
                      id="verification"
                      type="text"
                      value={verificationCode}
                      onChange={(e) => {
                        setVerificationCode(e.target.value)
                        setVerificationError("")
                      }}
                      placeholder="123456"
                      className="h-10 flex-1"
                    />
                    <Button
                      type="button"
                      onClick={handleVerifyEmail}
                      disabled={isLoading || !verificationCode}
                      className="h-10 px-4 bg-primary hover:bg-primary/90 font-bold"
                    >
                      확인
                    </Button>
                  </div>
                  {verificationError && (
                    <p className="text-sm text-red-600 mt-1">
                      {verificationError}
                    </p>
                  )}
                </div>
              )}

              {isEmailVerified && (
                <div>
                  <div className="flex items-center gap-2 text-green-600 text-sm font-bold mb-4">
                    <CheckCircle2 className="w-4 h-4" />
                    이메일이 인증되었습니다
                  </div>
                  <Button
                    type="button"
                    onClick={() => setStep("profile")}
                    className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                  >
                    다음
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Profile Step */}
          {step === "profile" && (
            <form onSubmit={handleCompleteProfile} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                연결된 이메일: <span className="font-bold">{email}</span>
              </div>

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-bold text-foreground mb-2"
                >
                  이름
                </label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setProfileError("")
                  }}
                  placeholder="홍길동"
                  className="h-10"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-bold text-foreground mb-2"
                >
                  휴대폰 번호
                </label>
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value)
                    setProfileError("")
                  }}
                  placeholder="010-1234-5678"
                  className="h-10"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-bold text-foreground mb-2"
                >
                  배송지 주소
                </label>
                <AddressSearchInput
                  id="address"
                  value={address}
                  onChange={(value) => {
                    setAddress(value)
                    setProfileError("")
                  }}
                  placeholder="주소를 검색하세요"
                  required
                  readOnly
                />
                <Input
                  id="addressDetail"
                  type="text"
                  value={addressDetail}
                  onChange={(e) => {
                    setAddressDetail(e.target.value)
                    setProfileError("")
                  }}
                  placeholder="상세 주소를 입력하세요"
                  className="h-10 mt-2"
                />
              </div>

              {profileError && (
                <p className="text-sm text-red-600">{profileError}</p>
              )}

              <Button
                type="submit"
                disabled={isLoading || !name || !phoneNumber || !address}
                className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
              >
                {isLoading ? "가입 중..." : "회원가입 완료"}
              </Button>

              <Button
                type="button"
                onClick={() => setStep("email-verify")}
                variant="outline"
                className="w-full h-12 font-bold"
              >
                이전
              </Button>
            </form>
          )}
        </div>
      </Card>
    </main>
  )
}
