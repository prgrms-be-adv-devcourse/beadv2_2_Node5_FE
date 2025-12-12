"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mail, MessageSquare, Phone, MapPin } from "lucide-react"

export default function ContactPage() {
  const [form, setForm] = useState({
    category: "",
    title: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    // TODO: 실제 문의 API 연동
    setTimeout(() => {
      alert("문의가 접수되었습니다. 빠르게 답변드릴게요!")
      setIsSubmitting(false)
      setForm({ category: "", title: "", message: "" })
    }, 400)
  }

  const infoItems = [
    { icon: <Mail className="w-4 h-4" />, label: "이메일", value: "support@myroutine.com" },
    { icon: <Phone className="w-4 h-4" />, label: "전화", value: "02-1234-5678 (평일 10-18시)" },
    { icon: <MapPin className="w-4 h-4" />, label: "주소", value: "서울특별시 강남구 테헤란로" },
  ]

  return (
    <main className="flex-1">
      <div className="container mx-auto px-4 py-10">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="space-y-3 text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-4 py-1 text-sm font-semibold">
              <MessageSquare className="w-4 h-4" />
              문의하기
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              무엇을 도와드릴까요?
            </h1>
            <p className="text-muted-foreground">
              서비스 이용 중 궁금한 점이나 제안이 있다면 언제든 알려주세요.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {infoItems.map((item) => (
              <Card key={item.label} className="p-4">
                <div className="flex items-center gap-2 text-primary mb-2">
                  {item.icon}
                  <span className="text-sm font-semibold">{item.label}</span>
                </div>
                <p className="text-foreground font-semibold text-sm">{item.value}</p>
              </Card>
            ))}
          </div>

          <Card className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">문의 카테고리</label>
                  <select
                    value={form.category}
                    onChange={(e) => handleChange("category", e.target.value)}
                    className="w-full h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
                    required
                  >
                    <option value="" disabled>
                      카테고리를 선택하세요
                    </option>
                    <option value="product">상품 문의</option>
                    <option value="subscription">구독/배송</option>
                    <option value="payment">결제/환불</option>
                    <option value="account">계정/로그인</option>
                    <option value="etc">기타</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">제목</label>
                  <Input
                    value={form.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    placeholder="문의 제목을 입력하세요"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground mb-2">내용</label>
                <textarea
                  value={form.message}
                  onChange={(e) => handleChange("message", e.target.value)}
                  placeholder="자세한 내용을 남겨주세요"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground min-h-[140px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  required
                />
              </div>

              <Button type="submit" className="w-full h-12" disabled={isSubmitting}>
                {isSubmitting ? "전송 중..." : "문의하기"}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </main>
  )
}
