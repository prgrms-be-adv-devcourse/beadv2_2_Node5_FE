const S3_BASE_URL =
  (process.env.NEXT_PUBLIC_S3_BASE_URL || "").replace(/\/+$/, "") || ""

const isAbsoluteUrl = (url?: string) => !!url && /^https?:\/\//i.test(url)

/**
 * Normalize image URLs so the client fetches directly from S3.
 * - Absolute URLs are returned as-is.
 * - Relative keys are prefixed with NEXT_PUBLIC_S3_BASE_URL when provided.
 */
export const getImageUrl = (url?: string) => {
  if (!url) return undefined
  if (isAbsoluteUrl(url)) return url
  if (!S3_BASE_URL) return url
  return `${S3_BASE_URL}/${url.replace(/^\/+/, "")}`
}
