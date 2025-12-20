"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface WalletConsentModalProps {
  open: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function WalletConsentModal({
  open,
  loading = false,
  onConfirm,
  onCancel,
}: WalletConsentModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <div className="p-6 space-y-4">
          <h3 className="text-xl font-bold text-foreground">지갑 생성 동의</h3>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              지갑은 정산금을 수령하고 충전/환불 내역을 관리하기 위해
              사용됩니다.
            </p>
            <ul className="list-disc pl-4 space-y-1">
              <li>지갑 생성 시 서비스 이용약관과 정산 정책에 동의합니다.</li>
              <li>정산/충전 내역은 관련 법령에 따라 일정 기간 보관됩니다.</li>
              <li>
                지갑 삭제는 지원하지 않으며, 문의를 통해 비활성화 요청이
                가능합니다.
              </li>
            </ul>
          </div>
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onCancel}
              disabled={loading}
            >
              취소
            </Button>
            <Button
              className="flex-1 bg-primary hover:bg-primary/90"
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? "지갑 생성 중..." : "동의하고 지갑 생성"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
