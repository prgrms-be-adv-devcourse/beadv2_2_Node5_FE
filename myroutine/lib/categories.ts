export const CATEGORY_OPTIONS = [
  { id: "FOOD_BEVERAGE", label: "식음료" },
  { id: "FASHION_BEAUTY", label: "패션 · 뷰티" },
  { id: "HOME_APPLIANCES", label: "생활 · 가전" },
  { id: "ELECTRONICS_DIGITAL", label: "전자 · 디지털" },
  { id: "HOBBY_LEISURE", label: "취미 · 레저" },
  { id: "HEALTH_FITNESS", label: "건강 · 피트니스" },
  { id: "SERVICE_SUBSCRIPTION", label: "서비스 · 구독권" },
]

export const getCategoryLabel = (id?: string | null) =>
  CATEGORY_OPTIONS.find((c) => c.id === id)?.label || "기타"
