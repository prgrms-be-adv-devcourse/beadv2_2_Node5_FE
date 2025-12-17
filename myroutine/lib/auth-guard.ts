export const requireClientLogin = (
  router: { push: (href: string) => void },
  redirectPath?: string
) => {
  if (typeof window === "undefined") return false
  const hasToken = !!localStorage.getItem("accessToken")
  if (!hasToken) {
    const redirect = encodeURIComponent(
      redirectPath ?? `${window.location.pathname}${window.location.search}`
    )
    router.push(`/login?redirect=${redirect}`)
    return false
  }
  return true
}
