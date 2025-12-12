"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { CATEGORY_OPTIONS } from "@/lib/categories"

interface SidebarProps {
  selectedCategory: string | null
  onCategoryChange: (category: string | null) => void
  priceRange: [number, number]
  onPriceChange: (range: [number, number]) => void
  defaultPriceBounds: [number, number]
}

export default function Sidebar({
  selectedCategory,
  onCategoryChange,
  priceRange,
  onPriceChange,
  defaultPriceBounds,
}: SidebarProps) {
  const [minInput, setMinInput] = useState(priceRange[0].toString())
  const [maxInput, setMaxInput] = useState(priceRange[1].toString())

  useEffect(() => {
    setMinInput(priceRange[0].toString())
    setMaxInput(priceRange[1].toString())
  }, [priceRange])

  const applyMinInput = (value: string) => {
    const parsed = Number(value.replace(/,/g, ""))
    if (Number.isFinite(parsed)) {
      const nextMin = Math.max(0, parsed)
      onPriceChange([nextMin, Math.max(nextMin, priceRange[1])])
    }
  }

  const applyMaxInput = (value: string) => {
    const parsed = Number(value.replace(/,/g, ""))
    if (Number.isFinite(parsed)) {
      const nextMax = Math.max(0, parsed)
      onPriceChange([Math.min(priceRange[0], nextMax), nextMax])
    }
  }

  return (
    <div className="space-y-6 sticky top-20">
      <Card className="p-6 space-y-3">
        {/* Category Filter */}
        <div>
          <h3 className="font-bold text-lg text-foreground mb-3">카테고리</h3>
          <div className="space-y-2.5">
            <div className="flex items-center">
              <Checkbox
                id="all-categories"
                checked={selectedCategory === null}
                onCheckedChange={() => onCategoryChange(null)}
              />
              <Label htmlFor="all-categories" className="ml-2 cursor-pointer text-foreground">
                전체
              </Label>
            </div>
            {CATEGORY_OPTIONS.map((cat) => (
              <div key={cat.id} className="flex items-center">
                <Checkbox
                  id={cat.id}
                  checked={selectedCategory === cat.id}
                  onCheckedChange={() => onCategoryChange(selectedCategory === cat.id ? null : cat.id)}
                />
                <Label htmlFor={cat.id} className="ml-2 cursor-pointer text-foreground">
                  {cat.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        <div className="h-px bg-border" />

        {/* Price Filter */}
        <div>
          <h3 className="font-bold text-lg text-foreground mb-3">가격 범위</h3>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <Label htmlFor="min-price" className="text-xs text-muted-foreground">
                  최소 금액
                </Label>
                <Input
                  id="min-price"
                  inputMode="numeric"
                  value={minInput}
                  onChange={(e) => setMinInput(e.target.value)}
                  onBlur={() => applyMinInput(minInput)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      applyMinInput(minInput)
                    }
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="max-price" className="text-xs text-muted-foreground">
                  최대 금액
                </Label>
                <Input
                  id="max-price"
                  inputMode="numeric"
                  value={maxInput}
                  onChange={(e) => setMaxInput(e.target.value)}
                  onBlur={() => applyMaxInput(maxInput)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      applyMaxInput(maxInput)
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Clear Filters */}
      <Button
        variant="outline"
        className="w-full bg-transparent"
        onClick={() => {
          onCategoryChange(null)
          onPriceChange(defaultPriceBounds)
        }}
      >
        필터 초기화
      </Button>
    </div>
  )
}
