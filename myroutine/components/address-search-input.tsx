"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type AddressSearchInputProps = {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
}

export default function AddressSearchInput({
  id,
  value,
  onChange,
  placeholder = "주소를 검색하세요",
  required = false,
  disabled = false,
  readOnly = false,
}: AddressSearchInputProps) {
  const openPostcode = () => {
    if (disabled) return
    if (typeof window === "undefined") return
    const daumPostcode = (window as any).daum?.Postcode
    if (!daumPostcode) {
      alert("주소 검색을 불러오는 중입니다. 잠시 후 다시 시도해주세요.")
      return
    }

    new daumPostcode({
      oncomplete: (data: any) => {
        const baseAddress = data.address || ""
        let extra = ""
        if (data.addressType === "R") {
          if (data.bname) extra += data.bname
          if (data.buildingName) {
            extra += extra ? `, ${data.buildingName}` : data.buildingName
          }
        }
        const nextAddress = extra ? `${baseAddress} (${extra})` : baseAddress
        onChange(nextAddress)
      },
    }).open()
  }

  return (
    <div className="flex gap-2">
      <Input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 flex-1"
        required={required}
        disabled={disabled}
        readOnly={readOnly}
      />
      <Button
        type="button"
        onClick={openPostcode}
        variant="outline"
        className="h-10 shrink-0"
        disabled={disabled}
      >
        주소 검색
      </Button>
    </div>
  )
}
