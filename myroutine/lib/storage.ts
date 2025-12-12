export const storage = {
  setAccessToken: (token: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", token)
    }
  },
  getAccessToken: () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("accessToken")
    }
    return null
  },
  clearAccessToken: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken")
    }
  },
  setUser: (user: any) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(user))
    }
  },
  getUser: () => {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("user")
      return user ? JSON.parse(user) : null
    }
    return null
  },
  clearUser: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("user")
    }
  },
}
