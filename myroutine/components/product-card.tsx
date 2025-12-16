"use client"

import { Card } from "@/components/ui/card"
import Link from "next/link"

interface ProductCardProps {
  product: {
    id: string
    name: string
    category: string
    price: number
    image: string
    status: string
  }
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/product/${product.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
        {/* Image */}
        <div className="relative w-full h-64 bg-muted overflow-hidden flex items-center justify-center">
          <img
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Content */}
        <div className="flex-1 p-4 flex flex-col">
          <span className="text-xs font-semibold text-primary uppercase mb-2">
            {product.category}
          </span>
          <h3 className="font-bold text-foreground mb-2 line-clamp-2">
            {product.name}
          </h3>
          <p className="text-lg font-bold text-primary mt-auto">
            ₩{product.price.toLocaleString()}
          </p>
        </div>
      </Card>
    </Link>
  )
}
